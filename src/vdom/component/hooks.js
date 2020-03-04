import { Component } from './create.js'
import { isUndef } from '../../shared.js'
import { isComponent } from '../helpers/patch/is.js'

function createComponentInstanceForVnode(vnode) {
  if (isUndef(vnode.componentInstance)) {
    vnode.componentInstance = new Component(vnode)
    vnode.componentInstance.init()
  }
}

export const componentVNodeHooks = {
  init(vnode) {
    if (isComponent(vnode)) {
      createComponentInstanceForVnode(vnode)
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

  postpatch(oldVnode, vnode) {
    const component = vnode.componentInstance
    component.postpatch(oldVnode, vnode)
  },

  remove(vnode, rm) {
    const component = vnode.componentInstance
    component.remove(vnode, rm)
  },

  destroy(vnode) {
    vnode.componentInstance.destroy(vnode)
  }
}
