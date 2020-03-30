import { patch } from '../patch.js'
import { isSuspense } from '../helpers/patch/is.js'
import { formatRootVnode } from '../helpers/patch/util.js'
import { commonHooksConfig } from '../helpers/component.js'

export const suspenseLinkedList = {
  current: null,

  push(component) {
    const parent = this.current
    this.current = { component, parent }
    if (parent !== null) {
      parent.child = this.current
    }
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
    this.rootVnode = undefined
    this.lazyChildsStatus = []
  }

  render() {
    let { children } = this.vnode
    if (children.length === 1) {
      children = children[0]
    }

    const updateVnode = formatRootVnode(children)
    this.rootVnode = patch(this.rootVnode, updateVnode)
    this.rootVnode.parent = this.vnode.parent
    this.vnode.elm = this.rootVnode.elm
  }

  init() {
    suspenseLinkedList.push(this)
    this.render()
  }

  initBefore() {
    suspenseLinkedList.pop()
  }

  update(oldVnode, vnode) {
    suspenseLinkedList.push(vnode)
  }

  postpatch(oldVnode, vnode) {
    suspenseLinkedList.pop()
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
