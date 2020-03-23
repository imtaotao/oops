import { h } from '../vdom/h.js'
import { PORTAL_TYPE } from './symbols.js'

// portal 组件现在是事件冒泡还是原生事件自带的，与 react 行为不一致
// 现在冒泡的顺序是根据真实 dom tree 来走的，如果想要根据 virtual dom tree 走，后续得实现自定义冒泡系统
export function createPortal(children, containerInfo, key = null) {
  const tag = {
    $$typeof: PORTAL_TYPE,
    containerInfo,
    key: key == null ? null : '' + key,
  }
  return h(tag, {}, children)
}
