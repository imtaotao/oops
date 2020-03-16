import { isProvider } from '../helpers/patch/is.js'

class ProviderComponent {
  constructor(vnode) {
    this.vnode = vnode
    this.consumerQueue = []
    this.updateDuplicate = null
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
    // copy 出来一份副本用于追踪 consumer 的情况
    component.updateDuplicate = []
  },

  postpatch(oldVnode, vnode) {
    const { tag, component } = vnode

    // 根据副本判断哪些 consumer 被阻断了，在此处强制更新
    let { consumerQueue, updateDuplicate } = component

    // consumer 有可能在更新的过程中卸载了，导致队列 index 混乱
    consumerQueue = consumerQueue.slice()

    if (consumerQueue.length !== updateDuplicate.length) {
      for (let i = 0; i < consumerQueue.length; i++) {
        const consumer = consumerQueue[i].consumer // 还有 observedBits
        if (updateDuplicate.indexOf(consumer) === -1) {
          // 同步更新，否则会导致，context 的值获取不到
          if (!consumer.destroyed) {
            consumer.forceUpdate(true)
          }
        }
      }
    }

    component.updateDuplicate = null
    tag._context._contextStack.pop()
  },
}
