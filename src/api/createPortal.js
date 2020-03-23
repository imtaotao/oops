import { h } from '../vdom/h.js'
import { PORTAL_TYPE } from './symbols.js'

export function createPortal(children, containerInfo, key = null) {
  const tag = {
    $$typeof: PORTAL_TYPE,
    containerInfo,
    key: key == null ? null : '' + key,
  }
  return h(tag, {}, children)
}
