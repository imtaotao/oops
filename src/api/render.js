import h from '../vdom/h.js'
import patch from '../vdom/patch.js'
import * as api from '../vdom/dom-api.js'
import { isVnode, isPrimitive } from '../vdom/is.js'

export default function render(vnode, app) {
  if (app) {
    if (typeof vnode === 'function') {
      vnode = h(vnode, undefined, undefined, undefined, undefined)
    }
    if (isVnode(vnode) || isPrimitive(vnode)) {
      const elm = patch(undefined, vnode).elm
      api.appendChild(app, elm)
    }
  }
}