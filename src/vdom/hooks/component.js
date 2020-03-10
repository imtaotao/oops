import { isUndef } from '../../shared.js'
import { Component } from '../component.js'
import { isComponent } from '../helpers/patch/is.js'

export const componentVNodeHooks = {
  init(vnode) {
    if (isUndef(vnode.component)) {
      if (isComponent(vnode)) {
        vnode.component = new Component(vnode)
        vnode.component.init()
      }
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
