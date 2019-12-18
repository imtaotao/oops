import h from '../vdom/h.js'
import { isVnode, isPrimitive } from '../vdom/is.js'
import patch, { appendChild } from '../vdom/patch.js'

export default function render(vnode, app) {
  if (app) {
    if (typeof vnode === 'function') {
      vnode = h(vnode, undefined)
    }
    if (isVnode(vnode) || isPrimitive(vnode)) {
      const elm = patch(undefined, vnode).elm
      appendChild(app, elm)
    }
  }
}