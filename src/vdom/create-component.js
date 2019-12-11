import patch from './patch.js'
import { isDef, isArray } from './is.js'

const RE_RENDER_LIMIT = 25
export const Target = {
  component: undefined,
}

function mergeProps({data, children}) {
  const res = { children }
  for (const key in data) {
    if (key !== 'hook') {
      res[key] = data[key]
    }
  }
  return res
}

function enqueueTask(callback) {
  const channel = new MessageChannel()
  channel.port1.onmessage = callback
  channel.port2.postMessage(undefined)
}

function depsEqual(a, b) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

function updateEffect(effects) {
  for (const key in effects) {
    const { create, destroy } = effects[key]
    if (typeof destroy === 'function') {
      destroy()
    }
    effects[key].destroy = create()
  }
}

export class Component {
  constructor(vnode) {
    this.cursor = 0
    this.preProps = {}
    this.vnode = vnode
    this.Ctor = vnode.tag
    this.numberOfReRenders = 0 // 重复渲染计数
    this.updateVnode = undefined // 新的 vnode
    this.oldRootVnode = undefined
    this.state = Object.create(null)
    this.effects = Object.create(null)
  }

  // 添加不重复的 state
  setState(partialState) {
    const key = this.cursor++
    if (this.state[key]) {
      return [this.state[key], key]
    }
    this.state[key] = partialState
    return [partialState, key]
  }

  useEffect(create, deps) {
    let destroy = undefined
    const key = this.cursor++
    const prevEffect = this.effects[key]

    if (prevEffect) {
      destroy = prevEffect.destroy
      if (isArray(prevEffect.deps) && isArray(deps)) {
        // 如果依赖不等
        if (!depsEqual(prevEffect.deps, deps)) {
          this.effects[key] = { deps, create, destroy }
        }
        return
      }
    }
    this.effects[key] = { deps, create, destroy }
  }

  useReducer(payload, key, reducer) {
    const newValue = reducer(this.state[key], payload)
    this.state[key] = newValue
    this.update()
  }

  syncPatch() {
    this.oldRootVnode = patch(this.oldRootVnode, this.updateVnode)
    this.vnode.elm = this.oldRootVnode.elm
    this.updateVnode = undefined
    enqueueTask(() => {
      updateEffect(this.effects)
    })
  }

  patch() {
    if (!this.updateVnode) {
      // 异步的 patch 减少对 dom 的操作
      enqueueTask(() => {
        if (isDef(this.updateVnode)) {
          this.oldRootVnode = patch(this.oldRootVnode, this.updateVnode)
          this.vnode.elm = this.oldRootVnode.elm
          this.updateVnode = undefined
          updateEffect(this.effects)
        }
      })
    }
  }

  createVnodeByCtor(isSync) {
    this.numberOfReRenders++
    this.inspectReRender()
    try {
      if (!isSync) {
        this.patch()
      }
      Target.component = this
      this.props = mergeProps(this.vnode)
      this.updateVnode = this.Ctor(this.props)
      if (isSync) {
        this.syncPatch()
      }
    } finally {
      this.cursor = 0
      this.updateQueue = 0
      this.numberOfReRenders = 0
      Target.component = undefined
    }
  }

  inspectReRender() {
    if (this.numberOfReRenders > RE_RENDER_LIMIT) {
      throw new Error('Too many re-renders. Oops limits the number of renders to prevent an infinite loop.')
    }
  }

  init() {
    this.createVnodeByCtor(true)
  }

  update() {
    this.createVnodeByCtor(false)
  }

  destroy(vnode) {
    for (const key in this.effects) {
      const { destroy } = this.effects[key]
      if (typeof destroy === 'function') {
        destroy()
      }
    }
  }
}