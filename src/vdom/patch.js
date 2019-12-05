import vnode from './vnode.js'
import * as htmlDomApi from './dom-api.js'
import {
  isDef,
  isArray,
  isVnode,
  isPrimitive,
  sameVnode,
  emptyNode,
} from './is.js'

const hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post']

export default function init(modules, domApi) {
  const cbs = {}
  const api = isDef(domApi) ? domApi : htmlDomApi

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
    return vnode(api.tagName(elm).toLowerCase(), {}, [], undefined, elm)
  }

  function createRmCb(childElm, listeners) {
    return function remove() {
      if (--listeners === 0) {
        const parent = api.parentNode(childElm)
        api.removeChild(parent, childElm)
      }
    }
  }

  function createElm(vnode, insertedVnodeQueue) {
    const data = vnode.data
    if (isDef(data)) {
      let cb
      if (isDef(cb = data.hook) && isDef(cb = cb.init)) {
        cb(vnode)
        // vnode.data 有可能更改了
        data = vnode.data
      }
    }

    const { tag, children } = vnode
    if (isDef(tag)) {
      const elm = vnode.elm = isDef(data) && isDef(data.ns)
        ? api.createElementNS(data.ns, tag)
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

      const hook = vnode.data.hook
      if (isDef(hook)) {
        if (hook.create) hook.create(emptyNode, vnode)
        if (hook.insert) insertedVnodeQueue.push(vnode)
      }
    } else {
      vnode.elm = api.createTextNode(vnode.text)
    }
    return vnode.elm
  }

  function removeVnodes(parentElm, vnodes, startIdx, endIdx) {

  }

  // diff -> patch
  function patchVnode(oldVnode, vnode, insertedVnodeQueue) {

  }

  return function patch(oldVnode, vnode) {
    const insertedVnodeQueue = []
    for (let i = 0; i < cbs.pre.length; i++) {
      cbs.pre[i]()
    }

    // 如果 oldVnode 是一个真实的 dom
    if (!isVnode(oldVnode)) {
      oldVnode = emptyNodeAt(oldVnode)
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

    for (let i = 0; i < insertedVnodeQueue.length; i++) {
      insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i])
    }
    for (let i = 0; i < cbs.post.length; ++i) {
      // done
      cbs.post[i]()
    }
    return vnode
  }
}