import * as api from './domApi.js'
import { FRAGMENTS_TYPE } from '../../../api/symbols.js'

// 创建 FragmentNode 参与整个 diff patch 的过程，在真实的 dom 节点变化中承上启下
export class FragmentNode {
  constructor() {
    this._children = []
    this.parentNode = null
    this._isFragmentNode = true
  }

  get first() {
    return this.nodes[0]
  }

  get last() {
    const nodes = this.nodes
    return nodes[nodes.length - 1]
  }

  get tagName() {
    return FRAGMENTS_TYPE
  }

  get nextSibling() {
    const last = this.last
    return last
      ? api.nextSibling(last)
      : null
  }

  // 全部是真实 dom
  get nodes() {
    const ls = []
    for (let i = 0; i < this._children.length; i++) {
      const node = this._children[i]
      if (node._isFragmentNode) {
        ls.push.apply(ls, node.nodes)
      } else {
        ls.push(node)
      }
    }
    return ls
  }

  realParentNode() {
    return this.parentNode._isFragmentNode
      ? this.parentNode.realParentNode()
      : this.parentNode
  }

  appendChild(child) {
    // 不用添加到真实 dom 环境
    // 整个 fragment 会作为一个整体添加
    if (child) {
      if (child._isFragmentNode) {
        child.parentNode = this
      }
      this._children.push(child)
    }
  }

  removeChild(child) {
    const index = this._children.indexOf(child)
    if (index > -1) {
      this._children.splice(index, 1)
    }

    // 删除的逻辑和添加的逻辑不一样，立即从真实 dom 环境中删除
    if (this.parentNode) {
      if (child._isFragmentNode) {
        child.removeInParent(this.parentNode)
      } else {
        api.removeChild(this.realParentNode(), child)
      }
    }
  }

  insertBefore(newNode, referenceNode) {
    const referenceIndex = this._children.indexOf(referenceNode)
    if (referenceIndex > -1) {
      this._children.splice(referenceIndex, 0, newNode)
    } else {
      this._children.push(newNode)
    }

    // 插入到真实 dom 环境
    if (this.parentNode) {
      if (newNode._isFragmentNode) {
        newNode.insertBeforeInParent(this.parentNode, referenceNode)
      } else {
        if (referenceNode && referenceNode._isFragmentNode) {
          referenceNode = referenceNode.first
        }
        api.insertBefore(this.realParentNode(), newNode, referenceNode)
      }
    }
  }

  // 把 fragment 当成子元素来操作
  appendInParent(parentNode) {
    // 第一次 append 的时候，parentNode 肯定是真实 dom，因为在 render 的时候，传入的是真实 dom
    this.parentNode = parentNode

    if (parentNode._isFragmentNode) {
      parentNode.appendChild(this)
    } else {
      const nodes = this.nodes
      for (let i = 0; i < nodes.length; i++) {
        api.appendChild(parentNode, nodes[i])
      }
    }
  }

  removeInParent(parentNode) {
    const nodes = this.nodes
    for (let i = 0; i < nodes.length; i++) {
      parentNode._isFragmentNode
        ? parentNode.removeChild(nodes[i])
        : api.removeChild(parentNode, nodes[i])
    }
    this.parentNode = null
  }

  insertBeforeInParent(parentNode, referenceNode) {
    this.parentNode = parentNode
    if (parentNode._isFragmentNode) {
      parentNode.insertBefore(this, referenceNode)
    } else {
      if (referenceNode && referenceNode._isFragmentNode) {
        referenceNode = referenceNode.first
      }
      const nodes = this.nodes
      for (let i = 0; i < nodes.length; i++) {
        api.insertBefore(parentNode, nodes[i], referenceNode)
      }
    }
  }
}
