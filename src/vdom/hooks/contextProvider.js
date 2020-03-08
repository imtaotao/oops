const push = ({tag, data}) => {
  tag._context._contextStack.push(data.value)
}

const pop = vnode => {
  vnode.tag._context._contextStack.pop()
}

export const providerVNodeHooks = {
  init(vnode) {
    push(vnode)
  },

  initBefore(vnode) {
    pop(vnode)
  },

  update(oldVnode, vnode) {
    push(vnode)
  },
  
  postpatch(oldVnode, vnode) {
    pop(vnode)
  },
}
