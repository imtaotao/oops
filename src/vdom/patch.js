import * as api from './dom-api.js'
import createVnode from './vnode.js'
import attributesModule from './modules/attributes.js'
import {
  isDef,
  isArray,
  isVnode,
  isPrimitive,
  sameVnode,
  emptyNode,
  isUndef,
} from './is.js'

const modules = [
  attributesModule,
]
const hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post']
const cbs = {}

// 存放 hooks
for (let i = 0; i < hooks.length; i++) {
  cbs[hooks[i]] = []
  for (let j = 0; j < modules.length; j++) {
    const m = typeof modules[j] === 'function'
      ? modules[j](patch)
      : modules
    if (isDef(m[hooks[i]])) {
      cbs[hooks[i]].push(m[hooks[i]])
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

    // 调用模块 create 钩子
    for (let i = 0; i < cbs.create.length; i++) {
      cbs.create[i](emptyNode, vnode)
    }

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

function removeVnodes(parentElm, vnodes, startIdx, endIdx) {

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
        removeVnodes(parent, [oldVnode, 0, 0])
      }
    }
  }

  for (let i = 0; i < insertedVnodeQueue.length; i++) {
    insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i])
  }
  for (let i = 0; i < cbs.post.length; ++i) {
    // done
    cbs.post[i]()
  }
  return vnode
}