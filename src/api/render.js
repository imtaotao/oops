import h from '../vdom/h/index.js'
import { isArray } from '../shared.js'
import createVnode from '../vdom/h/vnode.js'
import { formatVnode } from '../vdom/helpers/h.js'
import { FRAGMENTS_TYPE } from './nodeSymbols.js'
import { appendChild } from '../vdom/patch/domApi.js'
import patch, { vnodeElm } from '../vdom/patch/index.js'
import {
  isVnode,
  isFragment,
  isPrimitiveVnode,
  isComponentAndChildIsFragment,
} from '../vdom/patch/is.js'


export default function render(vnode, app, callback) {
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
      const elm = vnodeElm(vnode) || null
      if (!isFragment(vnode) && !isComponentAndChildIsFragment(vnode)) {
        elm && appendChild(app, elm)
      }

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