import vnode from '../h/vnode.js'
import { FRAGMENTS_TYPE } from '../../api/nodeSymbols.js'

export const emptyNode = vnode('', {}, [], undefined, undefined)

export function isVnode(vnode) {
  return vnode.tag !== undefined
}

export function isComponent(vnode) {
  return typeof vnode.tag === 'function'
}

export function sameVnode(a, b) {
  return a.key === b.key && a.tag === b.tag
}

export function isFragment(vnode) {
  return vnode && vnode.tag === FRAGMENTS_TYPE
}

export function isComponentAndChildIsFragment(vnode) {
  return (
    isComponent(vnode) &&
    isFragment(vnode.componentInstance.oldRootVnode)
  )
}

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