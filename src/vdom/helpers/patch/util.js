import * as api from './domApi.js'
import { createVnode } from '../../h.js'
import { cbs } from '../../modules/index.js'
import { FragmentNode } from './fragment.js'
import { isDef, isArray } from '../../../shared.js'
import {
  emptyNode,
  isFragment,
  isPrimitiveVnode,
} from './is.js'

export function createKeyToOldIdx(children, beginIdx, endIdx) {
  let map = {}, key, ch
  for (let i = beginIdx; i <= endIdx; ++i) {
    ch = children[i]
    if (ch != null) {
      key = ch.key
      if (key !== undefined) map[key] = i
    }
  }
  return map
}

export function emptyNodeAt(elm) {
  const tagName = api.tagName(elm)
  return createVnode(tagName && tagName.toLowerCase(), {}, [], undefined, elm)
}

export function lastElm(elms) {
  const elm = elms[elms.length - 1]
  return isArray(elm) ? lastElm(elm) : elm
}

export function firstElm(elms) {
  const elm = elms[0]
  return isArray(elm) ? firstElm(elm) : elm
}

// 如果是 fragment，返回 list 中最后一个的 nextSibling
export function nextSibling(node) {
  return node._isFragmentNode
    ? node.nextSibling
    : api.nextSibling(node)
}

export function createRmCb(childElm, listeners) {
  return function remove() {
    if (--listeners === 0) {
      const parent = isArray(childElm)
        ? api.parentNode(childElm[0])
        : api.parentNode(childElm)
      removeChild(parent, childElm)
    }
  }
}

export function appendChild(parentElm, child) {
  if (isArray(parentElm)) {
    child && parentElm.push(child)
  } else if (isArray(child)) {
    for (let i = 0; i < child.length; i++) {
      appendChild(parentElm, child[i])
    }
  } else {
    child && api.appendChild(parentElm, child)
  }
}

export function removeChild(parentElm, child) {
  if (isArray(child)) {
    for (let i = 0; i < child.length; i++) {
      removeChild(parentElm, child[i])
    }
  } else {
    child && api.removeChild(parentElm, child)
  }
}

export function insertChild(parentElm, child, before) {
  if (isArray(child)) {
    console.log(child)
    // child = child.flat(Infinity)
    for (let i = 0; i < child.length; i++) {
      insertChild(parentElm, child[i], before)
    }
  } else {
    if (child) {
      // 插入到旧 fragment 的最前面
      if (isArray(before)) {
        before = firstElm(before)
      }
      api.insertBefore(parentElm, child, before)
    }
  }
}

export function createElm(vnode, insertedVnodeQueue, parentElm) {
  // 如果是一个组件则没必要往下走
  if (createComponent(vnode, parentElm)) {
    return vnode.elm
  }
  
  const { tag, data, children } = vnode

  if (isDef(tag)) {
    let elm
    if (isFragment(vnode)) {
      // 如果是 fragment，不创建真正的元素，而是用一个数组存放子元素，并存放 parentElm 的引用，以便最终作用到真实节点上
      elm = vnode.elm = new FragmentNode()
    } else {
      elm = vnode.elm = isDef(data) && isDef(data.ns)
        ? api.createElementNS(data.ns, tag)
        : api.createElement(tag)
    }
    if (isArray(children)) {
      for (let i = 0; i < children.length; i++) {
        const chVNode = children[i]
        if (chVNode != null) {
          appendChild(elm, createElm(chVNode, insertedVnodeQueue, elm))
        }
      }
    } else if (isPrimitiveVnode(vnode.text)) {
      api.appendChild(elm, api.createTextNode(vnode.text))
    }
    invokeCreateHooks(vnode, insertedVnodeQueue)
  } else {
    vnode.elm = api.createTextNode(vnode.text)
  }
  return vnode.elm
}

export function createComponent(vnode, parentElm) {
  let i = vnode.data
  if (isDef(i)) {
    if (isDef(i = i.hook) && isDef(i = i.init)) {
      i(vnode, parentElm)
    }
    return isDef(vnode.componentInstance)
  }
  return false
}

export function invokeCreateHooks(vnode, insertedVnodeQueue) {
  let i
  for (i = 0; i < cbs.create.length; i++) {
    cbs.create[i](emptyNode, vnode)
  }
  i = vnode.data.hook
  if (isDef(i)) {
    if (isDef(i.create)) i.create(emptyNode, vnode)
    if (isDef(i.insert)) insertedVnodeQueue.push(vnode)
  }
}

export function invokeDestroyHook(vnode) {
  let i, j
  let data = vnode.data

  if (isDef(data)) {
    if (isDef(i = data.hook) && isDef(i = i.destroy)) {
      i(vnode)
    }

    for (i = 0; i < cbs.destroy.length; i++) {
      cbs.destroy[i](vnode)
    }

    if (isDef(vnode.children)) {
      for (j = 0; j < vnode.children.length; j++) {
        i = vnode.children[j]
        if (i != null && typeof i !== 'string') {
          invokeDestroyHook(i)
        }
      }
    }
  }
}
