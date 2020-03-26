// Call event callback
function invokeHandler(handler, vnode, event) {
  if (typeof handler === 'function') {
    handler.call(vnode, event, vnode)
  } else if (typeof handler === 'object') {
    if (typeof handler[0] === 'function') {
      if (handler.length === 2) {
        handler[0].call(vnode, handler[1], event, vnode)
      } else {
        const args = handler.slice(1)
        args.push(event)
        args.push(vnode)
        handler[0].apply(vnode, args)
      }
    } else {
      for (let i = 0; i < handler.length; i++) {
        invokeHandler(handler[i], vnode, event)
      }
    }
  }
}

function handleEvent(event, vnode) {
  const name = event.type
  const on = vnode.data.on

  if (on && on[name]) {
    invokeHandler(on[name], vnode, event)
  }
}

function createListener() {
  // Wraper function
  return function handler(event) {
    handleEvent(event, handler.vnode)
  }
}

function updateEventListeners(oldVnode, vnode) {
  const oldElm = oldVnode.elm
  const oldOn = oldVnode.data.on
  const oldListener = oldVnode.listener
  const elm = vnode && vnode.elm
  const on = vnode && vnode.data.on

  if (oldOn === on) return

  // Delete events that are no longer used
  if (oldElm && oldOn && oldListener) {
    // If there are no new elements, delete all events
    if (!on) {
      for (const name in oldOn) {
        oldElm.removeEventListener(name, oldListener, false)
      }
    } else {
      for (const name in oldOn) {
        if (!on[name]) {
          oldElm.removeEventListener(name, oldListener, false)
        }
      }
    }
  }

  // Add new event
  if (on) {
    const listener = vnode.listener = oldVnode.listener || createListener()
    listener.vnode = vnode

    if (elm && !oldOn) {
      // All events are added
      for (const name in on) {
        elm.addEventListener(name, listener, false)
      }
    } else {
      for (const name in on) {
        if (!oldOn[name]) {
          elm.addEventListener(name, listener, false)
        }
      }
    }
  }
}

export const eventListenersModule = {
  create: updateEventListeners,
  update: updateEventListeners,
  destroy: updateEventListeners,
}
