import * as api from './dom-api.js'
import createVnode from './vnode.js'
import attributesModule from './modules/attributes.js'
import eventListenersModule from './modules/eventlisteners.js'
import {
  isDef,
  isUndef,
  isArray,
  isVnode,
  isPrimitive,
  sameVnode,
  emptyNode,
} from './is.js'

const cbs = {}
const modules = [
  attributesModule,
  eventListenersModule,
]
const hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post']

// 存放 hooks
for (let i = 0; i < hooks.length; i++) {
  cbs[hooks[i]] = []
  for (let j = 0; j < modules.length; j++) {
    if (isDef(modules[j][hooks[i]])) {
      cbs[hooks[i]].push(modules[j][hooks[i]])
    }
  }
}

function emptyNodeAt(elm) {
  return createVnode(api.tagName(elm).toLowerCase(), {}, [], undefined, elm)
}

function createRmCb(childElm, listeners) {
  return function remove() {
    if (--listeners === 0) {
      const parent = api.parentNode(childElm)
      api.removeChild(parent, childElm)
    }
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
      : tag === ''
        // <>
        //  <div></div>
        //  <div></div>
        // </>
        ? api.createDocumentFragment()
        : api.createElement(tag)

    if (isArray(children)) {
      for (let i = 0; i < children.length; i++) {
        const chVNode = children[i]
        if (chVNode != null) {
          api.appendChild(elm, createElm(chVNode, insertedVnodeQueue))
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

}

function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; startIdx++) {
    let i, rm, listeners
    let ch = vnodes[startIdx]

    if (ch != null) {
      if (isDef(ch.sel)) {
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
        api.removeChild(parentElm, ch.elm)
      }
    }
  }
}

// diff -> patch
function patchVnode(oldVnode, vnode, insertedVnodeQueue) {

}

export default function patch(oldVnode, vnode) {
  if (isArray(vnode)) {
    throw new SyntaxError('Aadjacent JSX elements must be wrapped in an enclosing tag. Did you want a JSX fragment <>...</>?')
  }

  const insertedVnodeQueue = []
  for (let i = 0; i < cbs.pre.length; i++) {
    cbs.pre[i]()
  }

  if (isUndef(oldVnode)) {
    createElm(vnode, insertedVnodeQueue)
  } else {
    // 如果 oldVnode 是一个真实的 dom
    if (!isVnode(oldVnode)) {
      oldVnode = emptyNodeAt(oldVnode)
    }

    // 如果是 jsx`aaa` 这种语法
    if (isPrimitive(vnode)) {
      vnode = createVnode(undefined, undefined, undefined, vnode, undefined)
    }

    // 如果是同一个 vnode，则需要 diff -> patch
    if (sameVnode(oldVnode, vnode)) {

    } else {
      // 创建元素
      const parent = api.parentNode(oldVnode.elm)
      createElm(vnode, insertedVnodeQueue)

      // 如果 parent 在，代表在视图中，就可以插入到视图中去
      if (parent !== null) {
        api.insertBefore(parent, vnode.elm, api.nextSibling(oldVnode.elm))
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