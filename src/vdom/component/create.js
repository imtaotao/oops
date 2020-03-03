import { patch } from '../patch.js'
import { createVnode } from '../h.js'
import { formatVnode } from '../helpers/h.js'
import { isUndef, isArray } from '../../shared.js'
import { isPrimitiveVnode } from '../helpers/patch/is.js'
import { FRAGMENTS_TYPE } from '../../api/nodeSymbols.js'
import {
  equalDeps,
  mergeProps,
  enqueueTask,
  updateEffect,
} from '../helpers/component.js'

const RE_RENDER_LIMIT = 25

// 由于组件总是在最后 return vnode，所以不需要一个队列保存父子组件的关系
export const Target = {
  component: undefined,
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
      // 如果是 return 的一个数组，用 fragment 包裹起来
      if (isArray(this.updateVnode)) {
        this.updateVnode = formatVnode(FRAGMENTS_TYPE, {}, this.updateVnode)
      } else if (isPrimitiveVnode(this.updateVnode)) {
        // 如果 return 一个 string 或者 number
        this.updateVnode = createVnode(undefined, undefined, undefined, vnode, undefined)
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

  // 已更新
  postpatch(oldVnode, vnode) {
    // 专门补写个测试用例的，测试的时候需要
    if(typeof this.Ctor._componentDidUpdate === 'function') {
      this.Ctor._componentDidUpdate(oldVnode, vnode)
    }
  }

  remove(vnode, rm) {
    // 删除，可以在这里做动画的处理
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