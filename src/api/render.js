import h from '../vdom/h.js'
import patch from '../vdom/patch.js'
import { FRAGMENTS_TYPE } from './types.js'
import { appendChild } from '../vdom/dom-api.js'
import { isVnode, isPrimitive } from '../vdom/is.js'

export default function render(vnode, app, callback) {
  if (!app) {
    throw new Error('Target container is not a DOM element.')
  } else {
    if (typeof vnode === 'function') {
      vnode = h(vnode, undefined)
    }

    if (isVnode(vnode) || isPrimitive(vnode)) {
      const elm = patch(undefined, vnode, app).elm || null
      if (vnode.tag !== FRAGMENTS_TYPE) {
        elm && appendChild(app, elm)
      }

      callback && callback(elm)
      return vnode.componentInstance
        ? vnode.componentInstance
        : vnode
    }

    return null
  }
}