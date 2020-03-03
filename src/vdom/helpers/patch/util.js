import * as api from './domApi.js'
import { createVnode } from '../../h.js'
import { cbs } from '../../modules/index.js'
import { isDef, isArray } from '../../../shared.js'
import {
  emptyNode,
  isFragment,
  isPrimitiveVnode,
  isComponentAndChildIsFragment ,
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
export function nextSibling(elm) {
  return (
    api.nextSibling(isArray(elm) ? lastElm(elm) : elm)
  )
}

// 如果是组件而且组件返回的是一个 fragment，需要找到真正的 vnode
export function realVnode(vnode) {
  return isComponentAndChildIsFragment(vnode)
    ? vnode.componentInstance.oldRootVnode
    : vnode
}

export function vnodeElm(vnode) {
  vnode = realVnode(vnode)
  return isFragment(vnode)
    ? vnode.children.map(vnodeElm)
    : vnode.elm
}

export function createRmCb(childVnode, listeners) {
  const childElm = vnodeElm(childVnode)

  return function remove() {
    if (--listeners === 0) {
      const parent = isArray(childElm)? null : api.parentNode(childElm)
      removeChild(parent, childElm)
    }
  }
}

// 对 array 会做处理，因为组件可能会 return null，所以 child 可能没有
export function appendChild(parentElm, child) {
  if (isArray(child)) {
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
    if (child) {
      parentElm = parentElm || api.parentNode(child)
      api.removeChild(parentElm, child)
    }
  }
}

export function insertChild(parentElm, child, before) {
  if (isArray(child)) {
    let i = 0
    child = child.flat(Infinity)
    while(i++ < child.length - 1) {
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
    return vnodeElm(vnode)
  }
  
  const { tag, data, children } = vnode

  if (isDef(tag)) {
    let elm
    if (isFragment(vnode)) {
      // 如果发生是 fragment，只需要在 patch 的时候，把 parentElm 作为 elm 参与 path
      // 并不需要吧 vnode.elm 设置为 parentElm，意思是如果当前 vnode 为 fragment，他没有 elm
      elm = parentElm
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
  return vnodeElm(vnode)
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
