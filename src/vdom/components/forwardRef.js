import { isForwardRef } from '../helpers/patch/is.js'
import { commonHooksConfig } from '../helpers/component.js'

class ForwardRefComponent {
  constructor(vnode) {
    this.vnode = vnode
  }

  init() {
    console.log(this)
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
