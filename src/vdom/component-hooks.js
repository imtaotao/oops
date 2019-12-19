import { isComponent, isUndef } from './is.js'
import { Component } from './create-component.js'
import Fragments, { FRAGMENTS_TYPE } from '../components/fragments.js'

function createComponentInstanceForVnode(vnode) {
  if (isUndef(vnode.componentInstance)) {
    vnode.componentInstance = new Component(vnode)
    vnode.componentInstance.init()
  }
}

function createFragmentsComponent(vnode) {
  vnode.componentInstance = new Fragments(vnode)
  vnode.componentInstance.init()
}

const componentVNodeHooks = {
  init(vnode) {
    if (vnode.tag === FRAGMENTS_TYPE) {
      createFragmentsComponent(vnode)
    } else if (isComponent(vnode)) {
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

  // postpatch(oldVnode, vnode) {},

  destroy(vnode) {
    vnode.componentInstance.destroy(vnode)
  }
}

export default componentVNodeHooks

