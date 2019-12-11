import h from '../vdom/h.js'
import patch from '../vdom/patch.js'
import * as api from '../vdom/dom-api.js'

export default function render(fn, app) {
  if (app && typeof fn === 'function') {
    const elm = patch(undefined, h(fn, undefined, undefined, undefined, undefined)).elm
    api.appendChild(app, elm)
  }
}