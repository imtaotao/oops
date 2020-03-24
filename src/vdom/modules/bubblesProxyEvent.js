import { isPortal } from '../helpers/patch/is.js'

const proxyAttrs = (
  'target,nativeEvent,isCustomized'
).split(',')

// packages/react-dom/src/events/DOMEventProperties.js
// 这么多事件导致每次切换都带来大量的消耗，而且事件代理的过程中会创建大量的 event
const eventMap = (
  'blur,cancel,click,close,contextMenu,copy,cut,auxClick,dblClick,' + 
  'dragEnd,dragStart,drop,focus,input,invalid,keyDown,keyPress,keyUp,' +
  'mouseDown,mouseUp,paste,pause,play,pointerCancel,pointerDown,pointerUp,' +
  'rateChange,reset,seeked,submit,touchCancel,touchEnd,touchStart,volumeChange,' +
  'drag,dragEnter,dragExit,dragLeave,dragOver,mouseMove,mouseOut,mouseOver,pointerMove,' +
  'pointerOut,pointerOver,scroll,toggle,touchMove,wheel,abort,animationEnd,animationIteration,' +
  'animationStart,canPlay,canPlayThrough,durationChange,emptied,encrypted,ended,error,gotPointerCapture,' + 
  'load,loadedData,loadedMetadata,loadStart,lostPointerCapture,playing,progress,seeking,stalled,suspend,' +
  'timeUpdate,transitionEnd,waiting'
)
.split(',')
.map(key => key.toLocaleLowerCase())

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
        console.warn(`Waring: The '${key}' attributes are read-only.`)
      },
    }
  }
  return properties
}

function dispatchEvent(elm, event) {
  // event 原生对象一旦被 dispatch 后就没法用了
  // 所以没法使用事件池缓存，必须创建新的
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
