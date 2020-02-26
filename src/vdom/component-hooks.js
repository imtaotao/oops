import { isComponent, isUndef } from './is.js'
import { Component } from './create-component.js'

function createComponentInstanceForVnode(vnode, parentElm) {
  if (isUndef(vnode.componentInstance)) {
    vnode.componentInstance = new Component(vnode, parentElm)
    vnode.componentInstance.init()
  }
}

const componentVNodeHooks = {
  init(vnode, parentElm) {
    if (isComponent(vnode)) {
      createComponentInstanceForVnode(vnode, parentElm)
    }
  },

  prepatch(oldVnode, vnode) {
    const component = vnode.componentInstance = oldVnode.componentInstance
    // 换成新的 vnode，这样就会有新的 props
    component.vnode = vnode
  },

  update(oldVnode, vnode) {
    const component = vnode.componentInstance
    component.update(oldVnode, vnode)
  },

  destroy(vnode) {
    vnode.componentInstance.destroy(vnode)
  }
}

export default componentVNodeHooks

