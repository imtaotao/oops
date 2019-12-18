import patch from '../vdom/patch.js'

export const FRAGMENTS_TYPE = Symbol('fragments')

// Fragments 作为内置组件，没有 hooks 的能力，只负责渲染
export default class Fragments {
  constructor(vnode) {
    this.vnode = vnode
    // 存放多个 element
    this.oldRootVnodes = this.vnode.children.map(() => undefined)
    this.vnode.elm = this.oldRootVnodes.slice()
  }

  init() {
    this.render()
  }

  update() {
    this.render()
  }

  render() {
    const children = this.vnode.children
    for (let i = 0; i < children.length; i++) {
      this.oldRootVnodes[i] = patch(this.oldRootVnodes[i], children[i])
      this.vnode.elm[i] = this.oldRootVnodes[i].elm
    }
  }
}