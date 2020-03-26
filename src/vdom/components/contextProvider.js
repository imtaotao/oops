import { isProvider } from '../helpers/patch/is.js'
import { commonHooksConfig } from '../helpers/component.js'

class ProviderComponent {
  constructor(vnode) {
    this.vnode = vnode
    this.consumerQueue = []
    // Used to track consumer updates
    this.updateDuplicate = null
  }
  
  initBefore(vnode) {
    vnode.tag._context._contextStack.pop()
  }

  update(oldVnode, vnode) {
    const { tag, data } = vnode
    tag._context._contextStack.push(data.value, this)
    // Need to compare the old and new values, not done yet ...
    this.updateDuplicate = []
  }

  postpatch(oldVnode, vnode) {
    // Determine which consumers are blocked based on the copy, and force updates here.
    // And the consumer maybe uninstalled during the update process, causing queue index confusion.
    const consumerQueue = this.consumerQueue.slice()

    if (consumerQueue.length !== this.updateDuplicate.length) {
      for (let i = 0; i < consumerQueue.length; i++) {
        const consumer = consumerQueue[i].consumer // And `observedBits`
        if (this.updateDuplicate.indexOf(consumer) === -1) {
          if (!consumer.destroyed) {
            consumer.forceUpdate()
          }
        }
      }
    }
    this.updateDuplicate = null
    vnode.tag._context._contextStack.pop()
  }
}

export const providerVNodeHooks = commonHooksConfig({
  init(vnode) {
    if (isProvider(vnode)) {
      const { tag, data } = vnode
      vnode.component = new ProviderComponent(vnode)
      tag._context._contextStack.push(data.value, vnode.component)
    }
  },
})
