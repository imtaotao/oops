class ConsumerComponent {
  constructor(vnode) {
    this.vnode = vnode
  }

  getRender() {
    const render = vnode.children[0]
    if (typeof render !== 'function') {
      throw new Error(
        'A context consumer was rendered with multiple children, or a child ' +
        "that isn't a function. A context consumer expects a single child " +
        'that is a function. If you did pass a function, make sure there ' +
        'is no trailing or leading whitespace around it.'
      )
    }
    return render
  }

  init() {
    
  }
}

export const consumerVNodeHooks = {
  init(vnode) {
    vnode.component = new ConsumerComponent(vnode)
    vnode.component.init()
  },

  prepatch(oldVnode, vnode) {
    const component = vnode.component = oldVnode.component
    component.vnode = vnode
  },

  update(oldVnode, vnode) {
  },
}
