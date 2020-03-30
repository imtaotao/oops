import { createVnode } from '../../h.js'
import { 
  MEMO_TYPE,
  LAZY_TYPE,
  PORTAL_TYPE,
  CONTEXT_TYPE,
  PROVIDER_TYPE,
  FRAGMENTS_TYPE,
  SUSPENSES_TYPE,
  FORWARD_REF_TYPE,
} from '../../../api/symbols.js'

export const emptyNode = createVnode('', {}, [], undefined, undefined)

export function isVnode(vnode) {
  return vnode.tag !== undefined
}

export function isCommonVnode(tag) {
  return typeof tag === 'string' || tag === FRAGMENTS_TYPE
}

export function isComponent(vnode) {
  return typeof vnode.tag === 'function'
}

export function isMemo(vnode) {
  return (
    typeof vnode.tag === 'object' &&
    vnode.tag.$$typeof === MEMO_TYPE
  )
}

export function isLazy(vnode) {
  return (
    typeof vnode.tag === 'object' &&
    vnode.tag.$$typeof === LAZY_TYPE
  )
}

export function isSuspense(vnode) {
  return vnode.tag === SUSPENSES_TYPE
}

export function isPortal(vnode) {
  return (
    typeof vnode.tag === 'object' &&
    vnode.tag.$$typeof === PORTAL_TYPE
  )
}

export function isConsumer(vnode) {
  return (
    typeof vnode.tag === 'object' &&
    vnode.tag.$$typeof === CONTEXT_TYPE
  )
}

export function isProvider(vnode) {
  return (
    typeof vnode.tag === 'object' &&
    vnode.tag.$$typeof === PROVIDER_TYPE
  )
}

export function isFragment(vnode) {
  return vnode.tag === FRAGMENTS_TYPE
}

export function isForwardRef(vnode) {
  return (
    typeof vnode.tag === 'object' &&
    vnode.tag.$$typeof === FORWARD_REF_TYPE
  )
}

export function sameVnode(a, b) {
  if (a.key === b.key) {
    const ta = typeof a.tag
    const tb = typeof b.tag
    // 1) ordinary node
    // 2) text node
    // 3) ordinary component node
    // 4) symbol component node
    return (
      (ta === 'string' || ta === 'undefined' || ta === 'function' || ta === 'symbol') ||
      (tb === 'string' || tb === 'undefined' || tb === 'function' || tb === 'symbol') 
    )
      ? a.tag === b.tag
      // Internal component
      : a.tag.$$typeof === b.tag.$$typeof
  }
  return false
}

// https://zh-hans.reactjs.org/docs/jsx-in-depth.html#booleans-null-and-undefined-are-ignored
export function isFilterVnode(vnode) {
  return (
    vnode === null ||
    typeof vnode === 'boolean' ||
    typeof vnode === 'undefined'
  )
}

export function isPrimitiveVnode(vnode) {
  return (
    typeof vnode === 'string' ||
    typeof vnode === 'number' ||
    typeof vnode === 'symbol'
  )
}
