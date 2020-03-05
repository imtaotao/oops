import { isUndef } from '../../shared.js'
import { Component } from '../component.js'

export const providerVNodeHooks = {
  init(vnode) {
    if (isUndef(vnode.component)) {
      vnode.component = new Component(vnode)
      vnode.component.init()
    }
  },

  prepatch(oldVnode, vnode) {
    const component = vnode.component = oldVnode.component
    // 换成新的 vnode，这样就会有新的 props
    component.vnode = vnode
  },

  update(oldVnode, vnode) {
    vnode.component.update(oldVnode, vnode)
  },

  postpatch(oldVnode, vnode) {
    vnode.component.postpatch(oldVnode, vnode)
  },

  remove(vnode, rm) {
    vnode.component.remove(vnode, rm)
  },

  destroy(vnode) {
    vnode.component.destroy(vnode)
  }
}
