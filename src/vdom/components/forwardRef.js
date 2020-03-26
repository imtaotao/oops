import { Component } from './component.js'
import { isForwardRef } from '../helpers/patch/is.js'
import { commonHooksConfig } from '../helpers/component.js'

function abtainRefObject(vnode) {
  return vnode.data.hasOwnProperty('ref')
    ? vnode.data.ref
    : null
}

// 其实原有的 component 就支持 ref，但是为了与 react 一致，添加了 forwardRef 组件
class ForwardRefComponent extends Component {
  constructor(vnode) {
    super(vnode, abtainRefObject(vnode))
    this.render = vnode.tag.render
  }

  update(oldVnode, vnode) {
    this.refOrContext = abtainRefObject(vnode)
    this.render = vnode.tag.render
    super.update(oldVnode, vnode)
  }
}

export const forwardRefHooks = commonHooksConfig({
  init(vnode) {
    if (isForwardRef(vnode)) {
      vnode.component = new ForwardRefComponent(vnode)
      vnode.component.init()
    }
  },
})
