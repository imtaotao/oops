import { patch } from '../vdom/patch.js'
import { isVnode } from '../vdom/helpers/patch/is.js'
import {
  appendChild,
  formatPatchRootVnode,
} from '../vdom/helpers/patch/util.js'

export function render(vnode, app, callback) {
  if (app) {
    vnode = formatPatchRootVnode(vnode)
    if (isVnode(vnode)) {
      vnode = patch(undefined, vnode, app)
      const elm = vnode.elm || null
      elm && appendChild(app, elm)

      if (typeof callback === 'function') {
        callback(elm)
      }
      return vnode
    } else {
      throw new Error('The first parameter of the render function should be vnode.')
    }
  } else {
    throw new Error('Target container is not a DOM element.')
  }
}
