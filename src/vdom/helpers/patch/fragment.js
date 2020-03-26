import * as api from './domApi.js'
import { FRAGMENTS_TYPE } from '../../../api/symbols.js'

const classList = [
  'add',
  'remove',
]

const style = [
  'setProperty',
  'removeProperty',
]

const namespaces = [
  'setAttribute',
  'setAttributeNS',
  'removeAttribute',
  'addEventListener',
  'removeEventListener',
]

const empty = () => {
  console.warn('Waring: Cannot operate on fragment element.')
}

const installMethods = (obj, methods) => {
  methods.forEach(name => obj[name] = empty)
}

// Create `FragmentNode` participate in the entire diff patch process
export class FragmentNode {
  constructor() {
    this._children = []
    this.parentNode = null
    this._isFragmentNode = true
    
    // 下面是兼容的方法
    this.style = {}
    this.classList = {}
    installMethods(this, namespaces)
    installMethods(this.style, style)
    installMethods(this.classList, classList)
  }

  get tagName() {
    return FRAGMENTS_TYPE
  }

  get first() {
    return this.nodes[0]
  }

  get last() {
    const nodes = this.nodes
    return nodes[nodes.length - 1]
  }

  get nextSibling() {
    const last = this.last
    return last
      ? api.nextSibling(last)
      : null
  }

  // All real dom
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
    // No need to add to the real dom environment
    // The entire fragment will be added as a whole
    if (child) {
      if (child._isFragmentNode) {
        child.parentNode = this
      }
      this._children.push(child)
    }

    // And the new element added in the diff process uses `insertBefore`,
    // So we don't need to deal with this situation here, but to ensure the integrity of the logic, we still add
    if (this.parentNode) {
      if (child._isFragmentNode) {
        // If `this.parentNode` is a fragment, it will keep going up to find the real dom element
        child.appendSelfInParent(this.parentNode)
      } else {
        api.appendChild(this.realParentNode(), child)
      }
    }
  }

  removeChild(child) {
    const index = this._children.indexOf(child)
    if (index > -1) {
      this._children.splice(index, 1)
    }

    // The deleted logic is not the same as the added logic, it is immediately removed from the real dom environment
    if (this.parentNode) {
      if (child._isFragmentNode) {
        child.removeSelfInParent(this.parentNode)
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

    // Insert into real dom environment
    if (this.parentNode) {
      if (newNode._isFragmentNode) {
        newNode.insertBeforeSelfInParent(this.parentNode, referenceNode)
      } else {
        if (referenceNode && referenceNode._isFragmentNode) {
          referenceNode = referenceNode.first
        }
        api.insertBefore(this.realParentNode(), newNode, referenceNode)
      }
    }
  }

  // Operate the `fragment` as a child element
  appendSelfInParent(parentNode) {
    // When the first append, the `parentNode` must be the real dom
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

  removeSelfInParent(parentNode) {
    const nodes = this.nodes
    for (let i = 0; i < nodes.length; i++) {
      parentNode._isFragmentNode
        ? parentNode.removeChild(nodes[i])
        : api.removeChild(parentNode, nodes[i])
    }
    this.parentNode = null
  }

  insertBeforeSelfInParent(parentNode, referenceNode) {
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

  dispatchEvent(event, isBubbles) {
    if (isBubbles) {
      this.realParentNode().dispatchEvent(event)
    } else {
      const nodes = this.nodes
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].dispatchEvent(event)
      }
    }
  }
}
