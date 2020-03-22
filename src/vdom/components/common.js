import { patch } from '../patch.js'
import { isUndef } from '../../shared.js'
import { isComponent } from '../helpers/patch/is.js'
import { removedInDeps } from '../../api/context.js'
import { formatRootVnode } from '../helpers/patch/util.js'
import { commonHooksConfig } from '../helpers/component.js'
import {
  equalDeps,
  mergeProps,
  updateEffect,
  updateLayoutEffect,
  addToProviderUpdateDuplicate,
} from '../helpers/component.js'

const RE_RENDER_LIMIT = 25

// 由于组件总是在最后 return vnode，所以不需要一个队列保存父子组件的关系
export const Target = {
  component: undefined,
}

export class Component {
  constructor(vnode, refObject) {
    this.cursor = 0
    this.vnode = vnode // 组件标签节点
    this.render = vnode.tag
    this.destroyed = false
    this.refObject = refObject // 组件的 ref
    this.numberOfReRenders = 0 // 重复渲染计数
    this.rootVnode = undefined // 组件返回的根节点
    this.updateVnode = undefined // 新的 vnode
    this.providerDependencies = [] // 依赖的 context
    this.refs = Object.create(null)
    this.state = Object.create(null)
    this.memos = Object.create(null)
    this.effects = Object.create(null)
    this.layoutEffects = Object.create(null)
  }

  // 添加不重复的 state
  setState(partialState) {
    const key = this.cursor++
    if (key in this.state) {
      return [this.state[key], key]
    }
    this.state[key] = partialState
    return [partialState, key]
  }

  pushEffect(flag, create, deps) {
    let destroy = undefined
    let prevDeps = undefined
    const key = this.cursor++
    const prevEffect = this[flag][key]

    if (prevEffect) {
      destroy = prevEffect.destroy
      prevDeps = prevEffect.deps
    }
    this[flag][key] = { deps, prevDeps, create, destroy }
  }

  useReducer(payload, key, reducer) {
    const newValue = reducer(this.state[key], payload)
    // react 此处的处理为新旧俩值全等则不更新，后续此处如何处理，待定...
    if (this.state[key] !== newValue) {
      this.state[key] = newValue
      this.forceUpdate()
    }
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

  useRef(initialValue) {
    const key = this.cursor++
    const current = this.refs[key] || (this.refs[key] = Object.seal({ current: initialValue }))
    return current
  }

  forceUpdate() {
    if (++this.numberOfReRenders > RE_RENDER_LIMIT) {
      throw new Error(
        'Too many re-renders. ' +
          'oops limits the number of renders to prevent an infinite loop.'
      )
    }
    try {
      Target.component = this
      this.updateVnode = formatRootVnode(
        this.render(
          mergeProps(this.vnode),
          this.refObject,
        )
      )

      if (isUndef(this.updateVnode)) {
        throw new Error(
          'Nothing was returned from render.' +
            'This usually means a return statement is missing.' +
            'Or, to render nothing, return null.'
        )
      }

      if (this.updateVnode !== null) {
        this.rootVnode = patch(this.rootVnode, this.updateVnode)
        this.vnode.elm = this.rootVnode.elm
        this.updateVnode = undefined
      }
    } finally {
      this.cursor = 0
      this.numberOfReRenders = 0
      Target.component = undefined
      updateEffect(this.effects)
      updateLayoutEffect(this.layoutEffects)
    }
  }

  // 生命周期方法
  init() {
    this.forceUpdate()
  }

  // 更新当前组件节点，同步更新
  update(oldVnode, vnode) {
    addToProviderUpdateDuplicate(this)
    this.forceUpdate()
  }

  remove(vnode, remove) {
    remove()
  }

  destroy(vnode) {
    this.destroyed = true
    for (const key in this.effects) {
      const { destroy } = this.effects[key]
      if (typeof destroy === 'function') destroy()
    }
    removedInDeps(this)
  }
}

export const componentVNodeHooks = commonHooksConfig({
  init(vnode) {
    if (isComponent(vnode)) {
      vnode.component = new Component(vnode, {})
      vnode.component.init()
    }
  },
})
