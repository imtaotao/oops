export const providerVNodeHooks = {
  init({tag, data}) {
    tag._context._contextStack.push(data.value)
  },

  initBefore(vnode) {
    vnode.tag._context._contextStack.pop()
  },

  update(oldVnode, {tag, data}) {
    tag._context._contextStack.push(data.value)
  },

  postpatch(oldVnode, vnode) {
    vnode.tag._context._contextStack.pop()
  },
}
