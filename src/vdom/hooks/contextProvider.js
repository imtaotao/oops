import { isProvider } from '../helpers/patch/is.js'

class ProviderComponent {
  constructor(vnode) {
    this.vnode = vnode
    this.customerQueue = []
  }
}

export const providerVNodeHooks = {
  init(vnode) {
    if (isProvider(vnode)) {
      const { tag, data } = vnode
      vnode.component = new ProviderComponent(vnode)
      tag._context._contextStack.push(data.value, vnode.component)
    }
  },

  initBefore(vnode) {
    vnode.tag._context._contextStack.pop()
  },

  prepatch(oldVnode, vnode) {
    const component = vnode.component = oldVnode.component
    component.vnode = vnode
  },

  update(oldVnode, vnode) {
    const { tag, data, component } = vnode
    tag._context._contextStack.push(data.value, component)
  },

  postpatch(oldVnode, vnode) {
    vnode.tag._context._contextStack.pop()
  },
}
