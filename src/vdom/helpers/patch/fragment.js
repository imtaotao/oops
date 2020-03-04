import * as api from './domApi.js'
import { isArray } from '../../../shared.js'
import { FRAGMENTS_TYPE } from '../../../api/symbols.js'

function firstElm(elms) {
  const elm = elms[0]
  return isArray(elm) ? firstElm(elm) : elm
}

function lastElm(elms) {
  const elm = elms[elms.length - 1]
  return isArray(elm) ? lastElm(elm) : elm
}

export class FragmentNode {
  constructor() {
    this._children = []
    this._parentNode = null
    this._isFragmentNode = true
  }

  get first() {
    return firstElm(this._children)
  }

  get last() {
    return lastElm(this._children)
  }

  get nodes() {
    return this._children.flat(Infinity)
  }

  get tagName() {
    return FRAGMENTS_TYPE
  }

  get nextSibling() {
    const nodes = this.nodes
    return api.nextSibling(nodes[nodes.length - 1])
  }
  
  appendChild(child) {
    // 不用添加到真实 dom 环境
    // 整个 fragment 会作为一个整体添加
    child && this._children.push(child)
  }

  removeChild(child) {
    const index = this._children.indexOf(child)
    if (index > -1) {
      this._children.splice(index, 1)
    }

    // 删除的逻辑和添加的逻辑不一样，立即从真实 dom 环境中删除
    if (this._parentNode) {
      if (child._isFragmentNode) {
        const nodes = child.nodes
        for (let i = 0; i < nodes.length; i++) {
          api.removeChild(this._parentNode, nodes[i])
        }
      } else {
        api.removeChild(this._parentNode, child)
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
    if (this._parentNode) {
      if (referenceNode && referenceNode._isFragmentNode) {
        referenceNode = referenceNode.first
      }
  
      if (newNode._isFragmentNode) {
        const nodes = newNode.nodes
        for (let i = 0; i < nodes.length; i++) {
          api.insertBefore(this._parentNode, nodes[i], referenceNode)
        }
      } else {
        api.insertBefore(this._parentNode, newNode)
      }
    }
  }

  // 把 fragment 当成子元素来操作
  appendToParent(parentNode) {
    // 第一次 append 的时候，parentNode 肯定是真实 dom，因为在 render 的时候，传入的是真实 dom
    if (parentNode._isFragmentNode) {
      this._parentNode = parentNode._parentNode
      parentNode.appendChild(this)
    } else {
      this._parentNode = parentNode
      // 未完待续。。。
    }
  }

  removeToParent() {
    const nodes = this.nodes
    for (let i = 0; i < nodes.length; i++) {
      api.removeChild(this._parentNode, nodes[i])
    }
    this._children = []
    this._parentNode = null
  }

  insertToParent(parentNode, referenceNode) {
    if (parentNode._isFragmentNode) {
      this._parentNode = parentNode._parentNode
      parentNode.insertBefore(this, referenceNode)
    } else {
      this._parentNode = parentNode

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