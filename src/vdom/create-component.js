import * as api from './dom-api.js'
import patch from './patch.js'
import { isComponent, isUndef } from './is.js'

export let TargetComponent = null

function createProps(props, children) {
  const res = { children }
  for (const key in props) {
    if (key !== 'hook') {
      res[key] = props[key]
    }
  }
  return res
}

class Component {
  constructor(vnode) {
    this.vnode = vnode
    this.ctor = vnode.tag
  }

  render() {
    TargetComponent = this
    // 组件 vnode 的 elm 改成组件 jsx 生成的 vnode 的节点
    const props = createProps(this.vnode.data, this.vnode.children)
    this.vnode.elm = patch(undefined, this.ctor(props)).elm
    TargetComponent = null
  }

  destroyed() {
    console.log('destroy')
  }
}

export default function createComponentInstanceForVnode(vnode) {
  if (isComponent(vnode)) {
    if (isUndef(vnode.componentInstance)) {
      vnode.componentInstance = new Component(vnode)
      vnode.componentInstance.render()
    }
  }
}