const xChar = 120
const colonChar = 58
const xlinkNS = 'http://www.w3.org/1999/xlink'
const xmlNS = 'http://www.w3.org/XML/1998/namespace'

function updateAttrs(oldVnode, vnode) {
  const elm = vnode.elm
  if (elm) {
    let attrs = vnode.data.attrs
    let oldAttrs = oldVnode.data.attrs
    
    // Handle ref, assign new elm every time
    if (attrs && attrs.hasOwnProperty('ref')) {
      const ref = attrs.ref
      if (typeof ref === 'function') {
        ref(elm)
      } else if (typeof ref === 'object') {
        if (ref) {
          if (!ref.hasOwnProperty('current')) {
            throw new Error(
              'Unexpected ref object provided for button. ' +
                'Use either a ref-setter function or createRef().'
            )
          } else if (ref.current !== elm) {
            ref.current = elm
          }
        }
      }
    }

    if (!oldAttrs && !attrs) return
    if (oldAttrs === attrs) return

    oldAttrs = oldAttrs || {}
    attrs = attrs || {}

    // Update modified attributes, and add new attributes
    for (const key in attrs) {
      if (key === 'ref' || key === 'key') continue
      const cur = attrs[key]
      const old = oldAttrs[key]
      if (old !== cur) {
        if (cur === true) {
          elm.setAttribute(key, '')
        } else if (cur === false) {
          elm.removeAttribute(key)
        } else {
          if (key.charCodeAt(0) !== xChar) {
            elm.setAttribute(key, cur)
          } else if (key.charCodeAt(3) === colonChar) {
            // Assume xml namespace
            elm.setAttributeNS(xmlNS, key, cur)
          } else if (key.charCodeAt(5) === colonChar) {
            // Assume xlink namespace
            elm.setAttributeNS(xlinkNS, key, cur)
          } else {
            elm.setAttribute(key, cur)
          }
        }
      }
    }

    // Remove attributes that need to be removed
    for (const key in oldAttrs) {
      if (key === 'ref' || key === 'key') continue
      if (!(key in attrs)) {
        elm.removeAttribute(key)
      }
    }
  }
}

export const attributesModule = {
  create: updateAttrs,
  update: updateAttrs,
}
