import vnode from './vnode.js'
import { FRAGMENTS_TYPE } from '../components/fragments.js'

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

export function isPrimitive(v) {
  return typeof v === 'string' || typeof v === 'number'
}

export function isComponent(vnode) {
  return typeof vnode.tag === 'function'
}

export function isInterComponent(vnode) {
  return vnode.tag === FRAGMENTS_TYPE
}

export function sameVnode(a, b) {
  return a.key === b.key && a.tag === b.tag
}