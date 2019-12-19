import patch from '../vdom/patch.js'
import * as api from '../vdom/dom-api.js'
import createVnode from '../vdom/vnode.js'

export const FRAGMENTS_TYPE = Symbol('fragments')

// 去掉 hooks，否则会陷入递归之中
function createPureData(data) {
  if (!data) return data
  const res = {}
  for (const key in data) {
    if (key !==  'hook') {
      res[key] = data[key]
    }
  }
  return res
}

function createWraperVnodes(oldVnode, vnode) {
  const tag = {}
  const wrapterVnode = createVnode(tag, createPureData(vnode.data), vnode.children, undefined, undefined)
  const wraperOldVnode = createVnode(tag, createPureData(oldVnode.data), oldVnode.children, undefined, undefined)
  wrapterVnode.key = vnode.key
  wraperOldVnode.key = oldVnode.key
  return [wraperOldVnode, wrapterVnode]
}

// Fragments 作为内置组件，没有 hooks 的能力，只负责渲染
export default class Fragments {
  constructor(vnode) {
    this.vnode = vnode
    this.vnode.elm = []
    this.oldRootVnodes = []
  }

  init() {
    const children = this.vnode.children
    for (let i = 0; i < children.length; i++) {
      this.oldRootVnodes[i] = patch(this.oldRootVnodes[i], children[i])
      this.vnode.elm[i] = this.oldRootVnodes[i].elm
    }
  }

  // vnode === this.vnode
  update(oldVnode, vnode) {
    const [a, b] = createWraperVnodes(oldVnode, vnode)
    console.log(a.children[2].children, b.children[2].children);
    // patch(a, b)
  }

  destroy(vnode) {
    // 什么都不做
  }
}