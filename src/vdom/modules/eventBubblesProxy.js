import { isPortal } from '../helpers/patch/is.js'

const proxyAttrs = (
  'target,nativeEvent,isCustomized'
).split(',')

// `packages/react-dom/src/events/DOMEventProperties.js`
// So many events cause a lot of consumption for each switch,
// and a large number of events are created during the event brokering process.
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
  // The `event` native object dispathed that it useless
  // therefore, can't use event pool cache,
  // we need create new `event`.
  const proxyEvent = new Event(event.type)
  const proxyProps = buildProxyProperties(event, {
    nativeEvent: event,
    isCustomized: true,
  })
  Object.defineProperties(proxyEvent, proxyProps)
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

// The reason to proxy events to a container is because a root node is needed,
// but the `children` of `protal` node maybe is a `fragment` node.
// When `container` is node in `vdomTree`, I don't now how to process it,
// but this scenes is should not happen.
function addProxyEventListener(container, vnode) {
  if (!container) return null

  function proxyEventCb(event) {
    // No need prevent origin bubbing behavior，the `React` also not prevent it.
    const parentElm = vnode.parent && vnode.parent.elm
    if (parentElm) {
      dispatchEvent(parentElm, event)
    }
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

    // If not a same `container`, need uninstall origin event proxy,
    // and the add event proxy on new `container`
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
