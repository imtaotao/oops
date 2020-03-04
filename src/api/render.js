import { isArray } from '../shared.js'
import { patch } from '../vdom/patch.js'
import { h, createVnode } from '../vdom/h.js'
import { formatVnode } from '../vdom/helpers/h.js'
import { FRAGMENTS_TYPE } from './nodeSymbols.js'
import { appendChild } from '../vdom/helpers/patch/util.js'
import { isVnode, isPrimitiveVnode } from '../vdom/helpers/patch/is.js'

export function render(vnode, app, callback) {
  if (!app) {
    throw new Error('Target container is not a DOM element.')
  } else {
    if (typeof vnode === 'function') {
      vnode = h(vnode, undefined)
    } else if (isArray(vnode)) {
      vnode = formatVnode(FRAGMENTS_TYPE, {}, vnode)
    } else if (isPrimitiveVnode(vnode)) {
      vnode = createVnode(undefined, undefined, undefined, vnode, undefined)
    }

    if (isVnode(vnode)) {
      vnode = patch(undefined, vnode, app)
      const elm = vnode.elm || null
      elm && appendChild(app, elm)

      if (typeof callback === 'function') {
        callback(elm)
      }
      return vnode
    } else {
      if (typeof callback === 'function') {
        callback(null)
      }
      return null
    }
  }
}