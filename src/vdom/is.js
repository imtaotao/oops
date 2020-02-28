import vnode from './vnode.js'

export const isArray = Array.isArray
export const emptyNode = vnode('', {}, [], undefined, undefined)

export function isDef(v) {
  return v !== undefined
}

export function isUndef(v) {
  return v === undefined
}

export function isVnode(vnode) {
  return vnode.tag !== undefined
}

export function isComponent(vnode) {
  return typeof vnode.tag === 'function'
}

export function sameVnode(a, b) {
  return a.key === b.key && a.tag === b.tag
}

export function isPrimitive(v) {
  return (
    typeof v === 'string' ||
    typeof v === 'number' ||
    typeof v === 'boolean' ||
    typeof v === 'symbol'
  )
}