import { isSuspense } from '../helpers/patch/is.js'
import { commonHooksConfig } from '../helpers/component.js'

export const suspenseLinkedList = {
  current: null,

  push(vnode) {
    const parent = this.current
    this.current = { vnode, parent }
    parent.child = this.current
  },

  pop() {
    if (this.current !== null) {
      this.current = this.current.parent
      if (this.current !== null) {
        this.current.child = null
      }
    }
  },
}

class SuspenseComponent {
  constructor(vnode) {
    this.vnode = vnode
  }

  init() {
    
  }

  update(oldVnode, vnode) {
  
  }
}

export const suspenseVNodeHooks = commonHooksConfig({
  init(vnode) {
    if (isSuspense(vnode)) {
      vnode.component = new SuspenseComponent(vnode)
      vnode.component.init()
    }
  }
})
