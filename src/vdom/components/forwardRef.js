import { Component } from './component.js'
import { isForwardRef } from '../helpers/patch/is.js'
import { commonHooksConfig } from '../helpers/component.js'

function abtainRefObject(vnode) {
  return vnode.data.hasOwnProperty('ref')
    ? vnode.data.ref
    : null
}

// In fact, the original component supports ref,
// but in order to be consistent with react,
// a forwardRef component has been added.
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
