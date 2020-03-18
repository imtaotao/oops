import { flat } from '../shared.js'
import { FRAGMENTS_TYPE } from '../api/symbols.js'
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

export function createFragmentVnode(children) {
  return formatVnode(FRAGMENTS_TYPE, {}, children)
}

export function h(tag, props, ...children) {
  // 组件不支持 ref
  if (typeof tag === 'function' && props && 'ref' in props) {
    throw new Error(
      'Function components cannot be given refs. ' +
        'Attempts to access this ref will fail. Did you mean to use Oops.forwardRef()?'
    )
  }

  // 平铺数组，这将导致数组中的子数组中的元素 key 值是在同一层级的
  children = flat(children, v => (
    v !== null &&
    typeof v === 'object' &&
    typeof v[Symbol.iterator] === 'function'
  ))

  let data
  if (typeof tag === 'string' || tag === FRAGMENTS_TYPE) {
    data = separateProps(props)
  } else {
    data = installHooks(tag, props)
  }
  return formatVnode(tag, data, children)
}
