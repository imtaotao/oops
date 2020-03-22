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

export function isIterator(obj) {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj[Symbol.iterator] === 'function'
  )
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