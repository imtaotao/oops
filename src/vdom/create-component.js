import patch from './patch.js'

export const Target = {
  component: null,
}

function mergeProps(props, children) {
  const res = { children }
  for (const key in props) {
    if (key !== 'hook') {
      res[key] = props[key]
    }
  }
  return res
}

export class Component {
  constructor(vnode) {
    this.cursor = 0
    this.preProps = {}
    this.vnode = vnode
    this.Ctor = vnode.tag
    this.oldRootVnode = undefined
    this.state = Object.create(null)
    this.effects = []
  }

  // 添加不重复的 state
  setState(partialState) {
    const key = this.cursor + 1
    if (this.state[key]) {
      return [this.state[key], key]
    }
    this.state[key] = partialState
    return [partialState, key]
  }

  useState() {

  }

  useReducer(payload, key, reducer) {
    const newValue = reducer(this.state[key], payload)
    this.state[key] = newValue
    this.render()
  }

  render() {
    // 组件 vnode 的 elm 改成组件 jsx 生成的 vnode 的节点
    Target.component = this
    this.props = mergeProps(this.vnode.data, this.vnode.children)
    this.oldRootVnode = patch(this.oldRootVnode, this.Ctor(this.props))
    this.vnode.elm = this.oldRootVnode.elm
    Target.component = null
  }

  destroy(vnode) {
    console.log('destroy', vnode)
  }
}