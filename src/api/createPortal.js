import { PORTAL_TYPE } from './symbols.js'

export function createPortal(children, containerInfo, key = null) {
  return {
    $$typeof: PORTAL_TYPE,
    children,
    containerInfo,
    key: key == null ? null : '' + key,
  }
}
