import { h } from '../vdom/h.js'
import { PORTAL_TYPE } from './symbols.js'

// portal 组件现在是事件冒泡还是原生事件自带的，与 react 行为不一致
// 在 react 中，fiber 有 return 属性，这样就允许一层层往上触发
// 所以在 oops 中实现，也需要有相同的逻辑
// 在 portal 根节点监听所有的时间，当冒泡到根节点后，根 vnode 一层层往上触发，如果父级的 vnode 绑定的
// 是相同的事件，则可以触发，这样冒泡行为就可以走另外一条 vdom tree 的线路了，现在有两个技术点需要实现
// 1. vnode 需要新增 return 属性，标记父节点
// 2. portal 根节点如果监听所有的事件
export function createPortal(children, container, key = null) {
  const tag = {
    container,
    $$typeof: PORTAL_TYPE,
  }
  const key = key == null ? null : '' + key
  return h(tag, { key }, children)
}
