import {
  MEMO_TYPE,
  PORTAL_TYPE,
  CONTEXT_TYPE,
  PROVIDER_TYPE,
  FRAGMENTS_TYPE,
  FORWARD_REF_TYPE,
} from './api/symbols.js'

export const isArray = Array.isArray

export function isDef(v) {
  return v !== undefined
}

export function isUndef(v) {
  return v === undefined
}

export function isVoid(v) {
  return v === undefined || v === null
}

export function isValidElementType(type) {
  return (
    typeof type === 'string' ||
    typeof type === 'function' ||
    type === FRAGMENTS_TYPE ||
    (typeof type === 'object' &&
      type !== null &&
      (type.$$typeof === CONTEXT_TYPE ||
        type.$$typeof === PORTAL_TYPE ||
        type.$$typeof === PROVIDER_TYPE ||
        type.$$typeof === FORWARD_REF_TYPE ||
        type.$$typeof === MEMO_TYPE))
  )
}

// `portal component` is not counted in
export function isInsertComponent(type) {
  return (
    typeof type === 'object' &&
      type !== null &&
      (type.$$typeof === CONTEXT_TYPE ||
        type.$$typeof === PORTAL_TYPE ||
        type.$$typeof === PROVIDER_TYPE ||
        type.$$typeof === FORWARD_REF_TYPE ||
        type.$$typeof === MEMO_TYPE)
  )
}

const MAYBE_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator
// from `iterator interface` of simulate
const FAUX_ITERATOR_SYMBOL = '@@iterator'

export function getIteratorFn(maybeIterable) {
  if (maybeIterable === null || typeof maybeIterable !== 'object') {
    return null
  }
  const maybeIterator =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable[FAUX_ITERATOR_SYMBOL]
  if (typeof maybeIterator === 'function') {
    return maybeIterator
  }
  return null
}

export function hasIterator(maybeIterable) {
  return typeof getIteratorFn(maybeIterable) === 'function'
}
