import vnode from './vnode.js'

export const isArray = Array.isArray
export const emptyNode = vnode('', {}, [], undefined, undefined)

export function isDef(s) {
  return s !== undefined
}

export function isUndef(s) {
  return s === undefined
}

export function isVnode(vnode) {
  return vnode.tag !== undefined
}

export function isPrimitive(s) {
  return typeof s === 'string' || typeof s === 'number'
}

export function isReactivated(vnode) {
  return vnode.componentInstance !== undefined
} 

export function isComponent(vnode) {
  return typeof vnode.tag === 'function'
}

export function sameVnode(vnode1, vnode2) {
  return vnode1.key === vnode2.key && vnode1.tag === vnode2.tag
}