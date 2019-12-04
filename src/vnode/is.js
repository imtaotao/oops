import vnode from './vnode.js'

export const array = Array.isArray;
export const emptyNode = vnode('', {}, [], undefined, undefined)

export function isDef (s) { return s !== undefined }
export function isUndef (s) { return s === undefined }
export function isVnode (vnode) { return vnode.sel !== undefined }
export function primitive (s) { return typeof s === 'string' || typeof s === 'number' }

export function sameVnode (vnode1, vnode2) {
  return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel
}
