import { cbs } from './modules/index.js'
import * as api from './helpers/patch/domApi.js'
import {
  isDef,
  isUndef,
  isArray,
} from '../shared.js'
import {
  isVnode,
  sameVnode,
  isFragment,
  isComponent,
} from './helpers/patch/is.js'
import {
  vnodeElm,
  createElm,
  createRmCb,
  removeChild,
  insertChild,
  emptyNodeAt,
  nextSibling,
  invokeDestroyHook,
  createKeyToOldIdx,
} from './helpers/patch/util.js'


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
      insertChild(parentElm, vnodeElm(oldStartVnode), nextSibling(vnodeElm(oldEndVnode)))
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
  // 只有是相同新旧节点才能 patchVnode，所以如果 vnode 和 oldVnode 都是 fragment，那 elm 其实都是 undefined，都需要取 parentElm
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
    if (isFragment(vnode)) {
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

export function patch(oldVnode, vnode, parentElm) {
  if (isArray(vnode)) {
    throw new SyntaxError('Aadjacent JSX elements must be wrapped in an enclosing tag. Did you want a JSX fragment <>...</>?')
  }

  const insertedVnodeQueue = []
  for (let i = 0; i < cbs.pre.length; i++) {
    cbs.pre[i]()
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
      createElm(vnode, insertedVnodeQueue, parentElm)

      // 如果 parent 在，代表在视图中，就可以插入到视图中去
      if (parentElm !== null) {
        insertChild(parentElm, vnodeElm(vnode), nextSibling(vnodeElm(oldVnode)))
        // 删除旧的元素
        removeVnodes(parentElm, [oldVnode], 0, 0)
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