import { isProvider } from '../helpers/patch/is.js'
import { commonHooksConfig } from '../helpers/component.js'

class ProviderComponent {
  constructor(vnode) {
    this.vnode = vnode
    this.consumerQueue = []
    this.updateDuplicate = null // 用于追踪 consumer 更新情况
  }
  
  initBefore(vnode) {
    vnode.tag._context._contextStack.pop()
  }

  update(oldVnode, vnode) {
    const { tag, data } = vnode
    tag._context._contextStack.push(data.value, this)
    this.updateDuplicate = []
  }

  postpatch(oldVnode, vnode) {
    // 根据副本判断哪些 consumer 被阻断了，在此处强制更新
    // 并且 consumer 有可能在更新的过程中卸载了，导致队列 index 混乱
    const consumerQueue = this.consumerQueue.slice()

    if (consumerQueue.length !== this.updateDuplicate.length) {
      for (let i = 0; i < consumerQueue.length; i++) {
        const consumer = consumerQueue[i].consumer // 还有 observedBits
        if (this.updateDuplicate.indexOf(consumer) === -1) {
          // 同步更新，否则会导致，context 的值获取不到
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
  }
})
