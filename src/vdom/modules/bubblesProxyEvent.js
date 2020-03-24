import { isPortal } from '../helpers/patch/is.js'

const eventMap = 'click'.split(',')
const proxyAttrs = 'target,nativeEvent,isCustomized'.split(',')

function buildProxyProperties(event, backup) {
  const properties = {}
  for (let i = 0; i < proxyAttrs.length; i++) {
    const key = proxyAttrs[i]
    properties[key] = {
      get() {
        return backup.hasOwnProperty(key)
          ? backup[key]
          : event[key]
      },
      set() {
        throw new Error(`The '${key}' attributes are read-only.`)
      },
    }
  }
  return properties
}

function dispatchEvent(elm, event) {
  const proxyEvent = new Event(event.type)
  Object.defineProperties(
    proxyEvent,
    buildProxyProperties(event, {
      nativeEvent: event,
      isCustomized: true,
    }),
  )
  elm._isFragmentNode
    ? elm.dispatchEvent(proxyEvent, true)
    : elm.dispatchEvent(proxyEvent)
}

function removeProxyEventListener(container, proxyEventCb) {
  if (container && proxyEventCb) {
    for(let i = 0; i < eventMap.length; i++) {
      container.removeEventListener(eventMap[i], proxyEventCb)
    }
  }
}

// 将事件代理到 container 上的原因是因为需要一个根节点
// 而 protal 节点的 children 可能是一个 fragment
// 如果 container 是 vdom tree 中的一个节点时，还没想好怎么处理，不过这种场景应该不会发生
function addProxyEventListener(container, vnode) {
  if (!container) return null

  function proxyEventCb(event) {
    // 不需要阻止原有原生的冒泡，react 中也没有阻止
    const parentElm = vnode.parent && vnode.parent.elm
    parentElm && dispatchEvent(parentElm, event)
  }

  for(let i = 0; i < eventMap.length; i++) {
    container.addEventListener(eventMap[i], proxyEventCb)
  }
  return proxyEventCb
}

function updateEventListener(oldVnode, vnode) {
  if (isPortal(oldVnode) || isPortal(vnode)) {
    const component = vnode.component || oldVnode.component
    const oldContainer = oldVnode.tag.container
    const newContainer = vnode.tag.container

    // 如果不是同一个 container 则需要把原有的事件代理卸载
    // 并在新的 container 上添加事件代理
    if (oldContainer !== newContainer) {
      component && removeProxyEventListener(oldContainer, component.proxyEventCb)
      component.proxyEventCb = addProxyEventListener(newContainer, vnode)
    }
  }
}

function removeEventListener(vnode) {
  if (isPortal(vnode)) {
    if (vnode.component) {
      const { container, proxyEventCb } = vnode.component
      removeProxyEventListener(container, proxyEventCb)
    }
  }
}

export const bubblesProxyEventModule = {
  create: updateEventListener,
  update: updateEventListener,
  destroy: removeEventListener,
}
