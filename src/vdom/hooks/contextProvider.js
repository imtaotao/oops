import {} from '../helpers/patch/is.js'

function providerChildrenComponent(vnode, deps) {

}

export const providerVNodeHooks = {
  init({tag, data}) {
    tag._context._contextStack.push(data.value)
  },

  initBefore(vnode) {
    vnode.tag._context._contextStack.pop()
  },

  update(oldVnode, vnode) {
    const context = vnode.tag._context
    const deps = context._dependencies

    context._contextStack.push(vnode.data.value)

    console.log(vnode, deps)
  },

  postpatch(oldVnode, vnode) {
    vnode.tag._context._contextStack.pop()
  },
}
