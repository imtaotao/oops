import { isArray } from '../shared.js'
import {
  isVnode,
  isCommonVnode,
} from './helpers/patch/is.js'
import {
  formatVnode,
  installHooks,
  separateProps,
} from './helpers/h.js'

// 需要记录 parent 的原因是因为在 portal 组件中冒泡时需要
export function injectParentVnode(vnode, children) {
  if (isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      // text 节点不需要 parent，因为暂时没有对 text 节点有额外的操作
      if (children[i] && isVnode(children[i])) {
        children[i].parent = vnode
      }
    }
  }
}

export function createVnode(tag, data, children, text, elm) {
  const vnode = {
    tag,
    data,
    elm,
    text,
    children,
    parent: undefined,
    component: undefined,
    key: data ? data.key : undefined,
  }
  injectParentVnode(vnode, children)
  return vnode
}

export function cloneVnode(vnode) {
  const cloned = createVnode(
    vnode.tag,
    vnode.data,
    vnode.children && vnode.children.slice(),
    vnode.text,
    vnode.elm,
  )
  cloned.key = vnode.key
  cloned.isClone = true
  cloned.component = vnode.component
  injectParentVnode(cloned, cloned.children)
  return cloned
}

export function h(tag, props, ...children) {
  // 组件不支持 ref
  if (typeof tag === 'function' && props && props.hasOwnProperty('ref')) {
    throw new Error(
      'Function components cannot be given refs. ' +
        'Attempts to access this ref will fail. Did you mean to use Oops.forwardRef()?'
    )
  }

  if (props && props.hasOwnProperty('children')) {
    if (children.length === 0) {
      if (props.children) {
        children = isArray(props.children)
          ? props.children
          : [props.children]
      }
    }
    delete props.children
  }

  return formatVnode(
    tag,
    isCommonVnode(tag)
      ? separateProps(props)
      : installHooks(tag, props),
    children,
    false,
  )
}
