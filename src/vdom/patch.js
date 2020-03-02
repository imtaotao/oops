import {
  isDef,
  isUndef,
  isArray,
  isVnode,
  isPrimitive,
  isComponent,
  isComponentAndChildIsFragment ,
  sameVnode,
  emptyNode,
} from './is.js'
import * as api from './dom-api.js'
import createVnode from './vnode.js'
import cbs from './modules/index.js'
import { FRAGMENTS_TYPE } from '../api/types.js'

function createKeyToOldIdx(children, beginIdx, endIdx) {
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

function emptyNodeAt(elm) {
  const tagName = api.tagName(elm)
  return createVnode(tagName && tagName.toLowerCase(), {}, [], undefined, elm)
}

function realVnode(vnode) {
  // 如果组件没有 elm，代表组件返回的是一个 fragment 或者 null
  if (isComponentAndChildIsFragment(vnode)) {
    const componentRootVnode = vnode.componentInstance.oldRootVnode
    // 如果没有 rootVnode，代表返回的是 null
    return componentRootVnode || vnode
  }
  return vnode
}

function vnodeElm(vnode) {
  vnode = realVnode(vnode)
  return vnode.tag === FRAGMENTS_TYPE
    ? vnode.children.map(vnodeElm)
    : vnode.elm
}

function createRmCb(childVnode, listeners) {
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

// child 和 before 如果都是数组的话，肯定是一样的
// 因为如果是数组代表都是 fragment，对他们的 children 肯定进行了 patch
// patch 之后就是一样的
function insertChild(parentElm, child, before) {
  const beforeIsFragment = isArray(before)
  if (isArray(child)) {
    // 依次插入，没得问题
    for (let i = 0; i < child.length; i++) {
      const currentBefore = beforeIsFragment ? before[i] : before
      insertChild(parentElm, child[i], currentBefore)
    }
  } else {
    child && api.insertBefore(parentElm, child, before)
  }
}

function removeChild(parentElm, child) {
  if (isArray(child)) {
    for (let i = 0; i < child.length; i++) {
      removeChild(parentElm, child[i])
    }
  } else {
    if (child) {
      if (!parentElm) {
        parentElm = api.parentNode(child)
      }
      api.removeChild(parentElm, child)
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
    if (tag === FRAGMENTS_TYPE) {
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
    } else if (isPrimitive(vnode.text)) {
      api.appendChild(elm, api.createTextNode(vnode.text))
    }
    invokeCreateHooks(vnode, insertedVnodeQueue)
  } else {
    vnode.elm = api.createTextNode(vnode.text)
  }
  return vnodeElm(vnode)
}

function invokeCreateHooks(vnode, insertedVnodeQueue) {
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

function createComponent(vnode, parentElm) {
  let i = vnode.data
  if (isDef(i)) {
    if (isDef(i = i.hook) && isDef(i = i.init)) {
      i(vnode, parentElm)
    }
    return isDef(vnode.componentInstance)
  }
  return false
}

function invokeDestroyHook(vnode) {
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

function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = vnodes[startIdx]
    if (ch != null) {
      insertChild(parentElm, createElm(ch, insertedVnodeQueue, parentElm), before)
    }
  }
}

function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; startIdx++) {
    let i, rm, listeners
    let ch = vnodes[startIdx] // ch 有可能是组件（包括内置组件）

    if (ch != null) {
      if (isDef(ch.tag)) {
        invokeDestroyHook(ch)
        listeners = cbs.remove.length + 1
        rm = createRmCb(ch, listeners)
        for (i = 0; i < cbs.remove.length; ++i) {
          cbs.remove[i](ch, rm)
        }

        // 调用 remove 钩子
        if (isDef(i = ch.data) && isDef(i = i.hook) && isDef(i = i.remove)) {
          i(ch, rm)
        } else {
          rm()
        }
      } else { // Text node
        removeChild(parentElm, ch.elm)
      }
    }
  }
}

// diff children
export function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
  let oldStartIdx = 0, newStartIdx = 0
  let oldEndIdx = oldCh.length - 1
  let oldStartVnode = oldCh[0]
  let oldEndVnode = oldCh[oldEndIdx]
  let newEndIdx = newCh.length - 1
  let newStartVnode = newCh[0]
  let newEndVnode = newCh[newEndIdx]
  let oldKeyToIdx
  let idxInOld
  let elmToMove
  let before

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (oldStartVnode == null) {
      oldStartVnode = oldCh[++oldStartIdx] // Vnode might have been moved left
    } else if (oldEndVnode == null) {
      oldEndVnode = oldCh[--oldEndIdx]
    } else if (newStartVnode == null) {
      newStartVnode = newCh[++newStartIdx]
    } else if (newEndVnode == null) {
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue, parentElm)
      oldStartVnode = oldCh[++oldStartIdx]
      newStartVnode = newCh[++newStartIdx]
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, parentElm)
      oldEndVnode = oldCh[--oldEndIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
      patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue, parentElm)
      insertChild(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm))
      oldStartVnode = oldCh[++oldStartIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
      patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue, parentElm)
      insertChild(parentElm, vnodeElm(oldEndVnode), vnodeElm(oldStartVnode))
      oldEndVnode = oldCh[--oldEndIdx]
      newStartVnode = newCh[++newStartIdx]
    } else {
      if (oldKeyToIdx === undefined) {
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
      }
      idxInOld = oldKeyToIdx[newStartVnode.key]
      if (isUndef(idxInOld)) { // New element
        insertChild(parentElm, createElm(newStartVnode, insertedVnodeQueue, parentElm), vnodeElm(oldStartVnode))
        newStartVnode = newCh[++newStartIdx]
      } else {
        elmToMove = oldCh[idxInOld]
        if (elmToMove.tag !== newStartVnode.tag) {
          insertChild(parentElm, createElm(newStartVnode, insertedVnodeQueue, parentElm), vnodeElm(oldStartVnode))
        } else {
          patchVnode(elmToMove, newStartVnode, insertedVnodeQueue, parentElm)
          oldCh[idxInOld] = undefined
          insertChild(parentElm, vnodeElm(elmToMove), vnodeElm(oldStartVnode))
        }
        newStartVnode = newCh[++newStartIdx]
      }
    }
  }
  if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
    if (oldStartIdx > oldEndIdx) {
      before = newCh[newEndIdx+1] == null ? null : vnodeElm(newCh[newEndIdx+1])
      addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue)
    } else {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx)
    }
  }
}

// diff -> patch
function patchVnode(oldVnode, vnode, insertedVnodeQueue, parentElm) {
  let i, hook
  // 调用 prepatch 钩子
  if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
    i(oldVnode, vnode)
  }

  if (oldVnode === vnode) return

  // 如果是组件，则不需要对组件的 elm 进行diff，我们会在组件内部调用 update
  // 在 update 钩子里面，自己自己会diff
  let ch = vnode.children
  let oldCh = oldVnode.children
  let elm = vnode.elm = oldVnode.elm

  // 调用 update 钩子
  if (isDef(vnode.data)) {
    for (i = 0; i < cbs.update.length; ++i) {
      cbs.update[i](oldVnode, vnode, parentElm)
    }
    i = vnode.data.hook
    if (isDef(i) && isDef(i = i.update)) {
      i(oldVnode, vnode, parentElm)
    }
  }

  if ((isComponent(oldVnode) || isComponent(vnode))) {
    // 如果是组件或者内置组件，则不用管，diff patch 会在组件内部进行
  } else if (isUndef(vnode.text)) {
    // 如果是 fragment
    if (vnode.tag === FRAGMENTS_TYPE) {
      elm = parentElm
    }
    // 如果新旧节点都有子元素，则 diff children
    if (isDef(oldCh) && isDef(ch)) {
      if (oldCh !== ch) {
        updateChildren(elm, oldCh, ch, insertedVnodeQueue)
      }
    } else if (isDef(ch)) {
      if (isDef(oldVnode.text)) {
        api.setTextContent(elm, '')
      }
      addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue)
    } else if (isDef(oldCh)) {
      removeVnodes(elm, oldCh, 0, oldCh.length - 1)
    } else if (isDef(oldVnode.text)) {
      api.setTextContent(elm, '')
    }
  } else if (oldVnode.text !== vnode.text) {
    // 文本节点
    if (isDef(oldCh)) {
      removeVnodes(elm, oldCh, 0, oldCh.length - 1)
    }
    api.setTextContent(elm, vnode.text)
  }

  // 调用 postpatch 钩子
  if (isDef(hook) && isDef(i = hook.postpatch)) {
    i(oldVnode, vnode)
  }
}

export default function patch(oldVnode, vnode, parentElm) {
  if (isArray(vnode)) {
    throw new SyntaxError('Aadjacent JSX elements must be wrapped in an enclosing tag. Did you want a JSX fragment <>...</>?')
  }

  const insertedVnodeQueue = []
  for (let i = 0; i < cbs.pre.length; i++) {
    cbs.pre[i]()
  }
  
  // 如果是 jsx`aaa` 这种语法
  if (isPrimitive(vnode)) {
    vnode = createVnode(undefined, undefined, undefined, vnode, undefined)
  }

  if (isUndef(oldVnode)) {
    createElm(vnode, insertedVnodeQueue, parentElm)
  } else {
    // 如果 oldVnode 是一个真实的 dom
    if (!isVnode(oldVnode)) {
      oldVnode = emptyNodeAt(oldVnode)
    }

    // 如果是同一个 vnode，则需要 diff -> patch
    if (sameVnode(oldVnode, vnode)) {
      patchVnode(oldVnode, vnode, insertedVnodeQueue, parentElm)
    } else {
      // 创建元素
      parent = api.parentNode(oldVnode.elm)
      createElm(vnode, insertedVnodeQueue, parentElm)

      // 如果 parent 在，代表在视图中，就可以插入到视图中去
      if (parent !== null) {
        insertChild(parent, vnode.elm, api.nextSibling(oldVnode.elm))
        // 删除旧的元素
        removeVnodes(parent, [oldVnode], 0, 0)
      }
    }
  }

  for (let i = 0; i < insertedVnodeQueue.length; i++) {
    insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i])
  }
  for (let i = 0; i < cbs.post.length; ++i) {
    cbs.post[i]() // done
  }
  return vnode
}