import {
  MEMO_TYPE,
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
        type.$$typeof === PROVIDER_TYPE ||
        type.$$typeof === FORWARD_REF_TYPE ||
        type.$$typeof === MEMO_TYPE))
  )
}

// portal 组件不算在里面
export function isInsertComponent(type) {
  return (
    typeof type === 'object' &&
      type !== null &&
      (type.$$typeof === CONTEXT_TYPE ||
        type.$$typeof === PROVIDER_TYPE ||
        type.$$typeof === FORWARD_REF_TYPE ||
        type.$$typeof === MEMO_TYPE)
  )
}

const MAYBE_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator
const FAUX_ITERATOR_SYMBOL = '@@iterator' // 模拟的 iterator 接口

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
