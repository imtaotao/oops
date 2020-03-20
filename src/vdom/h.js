import { isArray } from '../shared.js'
import { isCommonVnode } from './helpers/patch/is.js'
import {
  formatVnode,
  installHooks,
  separateProps,
} from './helpers/h.js'

export function createVnode(tag, data, children, text, elm) {
  return {
    tag,
    data,
    elm,
    text,
    children,
    component: undefined,
    key: data ? data.key : undefined,
  }
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
  cloned.component = vnode.component
  cloned.isClone = true
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
  )
}
