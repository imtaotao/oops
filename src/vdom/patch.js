import * as api from './dom-api.js'
import createVnode from './vnode.js'
import cbs from './modules/index.js'
import {
  isDef,
  isUndef,
  isArray,
  isVnode,
  isPrimitive,
  sameVnode,
  emptyNode,
} from './is.js'

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
  return createVnode(api.tagName(elm).toLowerCase(), {}, [], undefined, elm)
}

function createRmCb(childElm, listeners) {
  return function remove() {
    if (--listeners === 0) {
      const parent = api.parentNode(childElm)
      removeChild(parent, childElm)
    }
  }
}

// 对 array 会做处理
export function appendChild(parentElm, child) {
  if (isArray(child)) {
    for (let i = 0; i < child.length; i++) {
      appendChild(parentElm, child[i])
    }
  } else {
    api.appendChild(parentElm, child)
  }
}

function insertChild(parentElm, child, before) {
  if (isArray(child)) {
    for (let i = 0; i < child.length; i++) {
      // 依次插入，没得问题
      insertChild(parentElm, child[i], before)
    }
  } else {
    api.insertBefore(parentElm, child, before)
  }
}

function removeChild(parentElm, child) {
  if (isArray(child)) {
    for (let i = 0; i < child.length; i++) {
      removeChild(api.parentNode(child[i]), child[i])
    }
  } else {
    api.removeChild(parentElm, child)
  }
}

export function createElm(vnode, insertedVnodeQueue) {
  // 如果是一个组件则没必要往下走
  if (createComponent(vnode, insertedVnodeQueue)) {
    return vnode.elm
  }
  
  const { tag, data, children } = vnode
  if (isDef(tag)) {
    const elm = vnode.elm = isDef(data) && isDef(data.ns)
      ? api.createElementNS(data.ns, tag)
      : api.createElement(tag)

    if (isArray(children)) {
      for (let i = 0; i < children.length; i++) {
        const chVNode = children[i]
        if (chVNode != null) {
          appendChild(elm, createElm(chVNode, insertedVnodeQueue))
        }
      }
    } else if (isPrimitive(vnode.text)) {
      api.appendChild(elm, api.createTextNode(vnode.text))
    }
    invokeCreateHooks(vnode, insertedVnodeQueue)
  } else {
    vnode.elm = api.createTextNode(vnode.text)
  }
  return vnode.elm
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

function createComponent(vnode, insertedVnodeQueue) {
  let i = vnode.data
  if (isDef(i)) {
    if (isDef(i = i.hook) && isDef(i = i.init)) {
      i(vnode)
    }
    if (isDef(vnode.componentInstance)) {
      return true
    }
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
      insertChild(parentElm, createElm(ch, insertedVnodeQueue), before)
    }
  }
}

function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; startIdx++) {
    let i, rm, listeners
    let ch = vnodes[startIdx]

    if (ch != null) {
      if (isDef(ch.tag)) {
        invokeDestroyHook(ch)
        listeners = cbs.remove.length + 1
        rm = createRmCb(ch.elm, listeners)
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
function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
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
      patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue)
      oldStartVnode = oldCh[++oldStartIdx]
      newStartVnode = newCh[++newStartIdx]
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue)
      oldEndVnode = oldCh[--oldEndIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
      patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue)
      insertChild(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm))
      oldStartVnode = oldCh[++oldStartIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
      patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue)
      insertChild(parentElm, oldEndVnode.elm, oldStartVnode.elm)
      oldEndVnode = oldCh[--oldEndIdx]
      newStartVnode = newCh[++newStartIdx]
    } else {
      if (oldKeyToIdx === undefined) {
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
      }
      idxInOld = oldKeyToIdx[newStartVnode.key]
      if (isUndef(idxInOld)) { // New element
        insertChild(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm)
        newStartVnode = newCh[++newStartIdx]
      } else {
        elmToMove = oldCh[idxInOld]
        if (elmToMove.tag !== newStartVnode.tag) {
          insertChild(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm)
        } else {
          patchVnode(elmToMove, newStartVnode, insertedVnodeQueue)
          oldCh[idxInOld] = undefined
          insertChild(parentElm, elmToMove.elm, oldStartVnode.elm)
        }
        newStartVnode = newCh[++newStartIdx]
      }
    }
  }
  if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
    if (oldStartIdx > oldEndIdx) {
      before = newCh[newEndIdx+1] == null ? null : newCh[newEndIdx+1].elm
      addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue)
    } else {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx)
    }
  }
}

// diff -> patch
function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
  let i, hook
  // 调用 prepatch 钩子
  if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
    i(oldVnode, vnode)
  }

  if (oldVnode === vnode) return

  let ch = vnode.children
  let oldCh = oldVnode.children
  const elm = vnode.elm = oldVnode.elm

  // 调用 update 钩子
  if (isDef(vnode.data)) {
    for (i = 0; i < cbs.update.length; ++i) {
      cbs.update[i](oldVnode, vnode)
    }
    i = vnode.data.hook
    if (isDef(i) && isDef(i = i.update)) {
      i(oldVnode, vnode)
    }
  }

  if (isUndef(vnode.text)) {
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

export default function patch(oldVnode, vnode) {
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
    createElm(vnode, insertedVnodeQueue)
  } else {
    // 如果 oldVnode 是一个真实的 dom
    if (!isVnode(oldVnode)) {
      oldVnode = emptyNodeAt(oldVnode)
    }

    // 如果是同一个 vnode，则需要 diff -> patch
    if (sameVnode(oldVnode, vnode)) {
      patchVnode(oldVnode, vnode, insertedVnodeQueue)
    } else {
      // 创建元素
      const parent = api.parentNode(oldVnode.elm)
      createElm(vnode, insertedVnodeQueue)

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