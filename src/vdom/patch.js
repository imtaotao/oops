import { cbs } from './modules/index.js'
import * as api from './helpers/patch/domApi.js'
import {
  isDef,
  isUndef,
} from '../shared.js'
import {
  isMemo,
  isConsumer,
  isComponent,
  sameVnode,
} from './helpers/patch/is.js'
import {
  createElm,
  createRmCb,
  removeChild,
  insertBefore,
  parentNode,
  nextSibling,
  invokeDestroyHook,
  createKeyToOldIdx,
} from './helpers/patch/util.js'


function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = vnodes[startIdx]
    if (ch != null) {
      insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before)
    }
  }
}

function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; startIdx++) {
    let i, rm, listeners
    let ch = vnodes[startIdx] // ch 有可能是组件

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
      patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue)
      oldStartVnode = oldCh[++oldStartIdx]
      newStartVnode = newCh[++newStartIdx]
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue)
      oldEndVnode = oldCh[--oldEndIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
      patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue)
      insertBefore(parentElm, oldStartVnode.elm, nextSibling(oldEndVnode.elm))
      oldStartVnode = oldCh[++oldStartIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
      patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue)
      insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)
      oldEndVnode = oldCh[--oldEndIdx]
      newStartVnode = newCh[++newStartIdx]
    } else {
      if (oldKeyToIdx === undefined) {
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
      }
      idxInOld = oldKeyToIdx[newStartVnode.key]
      if (isUndef(idxInOld)) { // New element
        insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm)
        newStartVnode = newCh[++newStartIdx]
      } else {
        elmToMove = oldCh[idxInOld]
        if (elmToMove.tag !== newStartVnode.tag) {
          insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm)
        } else {
          patchVnode(elmToMove, newStartVnode, insertedVnodeQueue)
          oldCh[idxInOld] = undefined
          insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm)
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
  const elm = vnode.elm = oldVnode.elm
  let oldCh = oldVnode.children
  let ch = vnode.children
  if (oldVnode === vnode) return

  // 调用 update 钩子
  if (isDef(vnode.data)) {
    for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode)
    i = vnode.data.hook
    if (isDef(i) && isDef(i = i.update)) i(oldVnode, vnode)
  }

  if (isComponent(vnode) || isMemo(vnode) || isConsumer(vnode)) {
    // 如果是组件，则不需要对组件的 elm 进行diff，组件内部会调用 update 钩子 diff
  } else if (isUndef(vnode.text)) {
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
    if (isDef(oldCh)) {
      removeVnodes(elm, oldCh, 0, oldCh.length - 1)
    }
    api.setTextContent(elm, vnode.text)
  }

  if (isDef(hook) && isDef(i = hook.postpatch)) {
    i(oldVnode, vnode)
  }
}

export function patch(oldVnode, vnode) {
  const insertedVnodeQueue = []
  for (let i = 0; i < cbs.pre.length; i++) cbs.pre[i]()
  
  if (isUndef(oldVnode)) {
    createElm(vnode, insertedVnodeQueue)
  } else {
    if (sameVnode(oldVnode, vnode)) {
      patchVnode(oldVnode, vnode, insertedVnodeQueue)
    } else {
      const elm = oldVnode.elm
      const parent = parentNode(elm)

      createElm(vnode, insertedVnodeQueue)

      // 如果 parent 在，代表在视图中，就可以插入到视图中去，然后删除旧的元素
      if (parent !== null) {
        insertBefore(parent, vnode.elm, nextSibling(elm))
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
