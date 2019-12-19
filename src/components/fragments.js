import patch from '../vdom/patch.js'

export const FRAGMENTS_TYPE = Symbol('fragments')

// Fragments 作为内置组件，没有 hooks 的能力，只负责渲染
export default class Fragments {
  constructor(vnode) {
    this.vnode = vnode
    this.vnode.elm = []
    this.oldRootVnodes = []
  }

  init() {
    this.render()
  }

  update() {
    // 已经在 prepatch 后面调用 `vnode.elm = oldVnode.elm`
    // 所有新的 vnode.elm 也是一个 array
    this.render()
  }

  // 需要重构
  render() {
    const children = this.vnode.children
    for (let i = 0; i < children.length; i++) {
      this.oldRootVnodes[i] = patch(this.oldRootVnodes[i], children[i])
      // childVnode.elm 收集到当前 vnode.elm 中去
      this.vnode.elm[i] = this.oldRootVnodes[i].elm
    }
  }

  destroy(vnode) {
    // 什么都不做
  }
}