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

export function isComponentAndChildIsFragment(vnode) {
  return isComponent(vnode) && vnode.elm === undefined
}

export function isFilterVnode(vnode) {
  return (
    vnode === null ||
    typeof vnode === 'boolean' ||
    typeof vnode === 'undefined'
  )
}

export function isPrimitive(vnode) {
  return (
    typeof vnode === 'string' ||
    typeof vnode === 'number' ||
    typeof vnode === 'symbol'
  )
}