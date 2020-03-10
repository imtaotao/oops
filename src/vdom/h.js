import { flat } from '../shared.js'
import { FRAGMENTS_TYPE } from '../api/symbols.js'
import { isMemo, isFragment } from './helpers/patch/is.js'
import {
  formatVnode,
  installHooks,
  separateProps,
} from './helpers/h.js'

export function createVnode(tag, data, children, text, elm) {
  const component = undefined
  const key = data ? data.key : undefined
  return { tag, data, children, key, elm, text, component }
}

export function createFragmentVnode(children) {
  return formatVnode(FRAGMENTS_TYPE, {}, children)
}

export function h(tag, props, ...children) {
  if (tag === '') tag = FRAGMENTS_TYPE
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