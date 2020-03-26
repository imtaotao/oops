import { h } from '../vdom/h.js'
import { PORTAL_TYPE } from './symbols.js'

export function createPortal(children, container, key = null) {
  const tag = {
    container,
    $$typeof: PORTAL_TYPE,
  }
  return h(
    tag,
    {
      key: key == null
        ? null
        : '' + key
    },
    children,
  )
}
