import {
  MEMO_TYPE,
  CONTEXT_TYPE,
  PROVIDER_TYPE,
  FRAGMENTS_TYPE,
} from './api/symbols.js'

export const isArray = Array.isArray

export function isDef(v) {
  return v !== undefined
}

export function isUndef(v) {
  return v === undefined
}

export function flat(array, condition = isArray, result = []) {
  for (const item of array) {
    if (condition(item)) {
      flat(item, condition, result)
    } else {
      result.push(item)
    }
  }
  return result
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
        type.$$typeof === MEMO_TYPE))
  )
}