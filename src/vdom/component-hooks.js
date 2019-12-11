import { isComponent, isUndef } from './is.js'
import { Component } from './create-component.js'

function createComponentInstanceForVnode(vnode) {
  if (isComponent(vnode)) {
    if (isUndef(vnode.componentInstance)) {
      vnode.componentInstance = new Component(vnode)
      vnode.componentInstance.init()
    }
  }
}

const componentVNodeHooks = {
  init(vnode) {
    createComponentInstanceForVnode(vnode)
  },

  prepatch(oldVnode, vnode) {
    const component = vnode.componentInstance = oldVnode.componentInstance
    // 换成新的 vnode，这样就会有新的 props
    component.vnode = vnode
    component.init()
  },

  destroy(vnode) {
    vnode.componentInstance.destroy(vnode)
  }
}

export default componentVNodeHooks

