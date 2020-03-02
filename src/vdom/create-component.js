import patch from './patch.js'
import { FRAGMENTS_TYPE } from '../api/types.js'
import { isDef, isArray, isUndef } from './is.js'

const RE_RENDER_LIMIT = 25

// 由于组件总是在最后 return vnode，所以不需要一个队列保存父子组件的关系
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

// 对比依赖
function equalDeps(a, b) {
  if (isArray(a) && isArray(b)) {
    if (a.length === 0 && b.length === 0) return true
    if (a.length !== b.length) return false
    return !b.some((v, i) => v !== a[i])
  }
  return false
}

function callEffectCallback(create, destroy, effect) {
  if (typeof destroy === 'function') destroy()
  const cleanup = create()
  if (isDef(cleanup) && typeof cleanup !== 'function') {
    throw new Error('An effect function must not return anything besides a function, which is used for clean-up.')
  }
  effect.destroy = cleanup
}

function updateEffect(effects) {
  for (const key in effects) {
    const { deps, prevDeps, create, destroy } = effects[key]
    // 如果依赖不相等才调用
    if (!equalDeps(deps, prevDeps)) {
      callEffectCallback(create, destroy, effects[key])
    }
  }
}

export class Component {
  constructor(vnode, parentElm) {
    this.cursor = 0
    this.preProps = {}
    this.vnode = vnode
    this.Ctor = vnode.tag
    this.dependencies = null // context 依赖
    this.parentElm = parentElm // 父级 dom 元素
    this.numberOfReRenders = 0 // 重复渲染计数
    this.updateVnode = undefined // 新的 vnode
    this.oldRootVnode = undefined
    this.state = Object.create(null)
    this.memos = Object.create(null)
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
    let prevDeps = undefined
    const key = this.cursor++
    const prevEffect = this.effects[key]

    if (prevEffect) {
      destroy = prevEffect.destroy
      prevDeps = prevEffect.deps
    }
    this.effects[key] = { deps, prevDeps, create, destroy }
  }

  useReducer(payload, key, reducer) {
    const newValue = reducer(this.state[key], payload)
    this.state[key] = newValue
    this.forceUpdate()
  }

  useMemo(create, deps) {
    const key = this.cursor++
    const memoized = this.memos[key] || (this.memos[key] = [])

    if (equalDeps(memoized[1], deps)) {
      return memoized[0]
    } else {
      memoized[1] = deps
      return (memoized[0] = create()) 
    }
  }

  syncPatch() {
    // 如果为 null，则 vnode.elm 为 undefined，需要在 patch 的时候处理
    if (this.updateVnode !== null) {
      this.oldRootVnode = patch(this.oldRootVnode, this.updateVnode, this.parentElm)
      this.vnode.elm = this.oldRootVnode.elm
      this.updateVnode = undefined
      enqueueTask(() => {
        updateEffect(this.effects)
      })
    }
  }

  patch() {
    if (!this.updateVnode) {
      // 异步的 patch 减少对 dom 的操作
      enqueueTask(() => {
        if (this.updateVnode !== null) {
          this.oldRootVnode = patch(this.oldRootVnode, this.updateVnode, this.parentElm)
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
      this.updateVnode = this.Ctor.call(this, this.props)
      if (isUndef(this.updateVnode)) {
        throw new Error(
          'Nothing was returned from render.' +
          'This usually means a return statement is missing.' +
          'Or, to render nothing, return null.'
        )
      }
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

  forceUpdate() {
    this.createVnodeByCtor(false)
  }

  // 更新当前组件节点，同步更新
  update(oldVnode, vnode, parentElm) {
    this.vnode = vnode
    this.parentElm = parentElm
    this.createVnodeByCtor(false)
  }

  remove(vnode, rm) {
    // 删除
    rm()
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