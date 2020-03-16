const xChar = 120
const colonChar = 58
const xlinkNS = 'http://www.w3.org/1999/xlink'
const xmlNS = 'http://www.w3.org/XML/1998/namespace'

function updateAttrs(oldVnode, vnode) {
  const elm = vnode.elm
  if (elm) {
    let attrs = vnode.data.attrs
    let oldAttrs = oldVnode.data.attrs
    
    // 处理 ref，每次都赋值新的 elm 就好
    if (attrs && 'ref' in attrs) {
      const ref = attrs.ref
      if (typeof ref === 'function') {
        ref(elm)
      } else if (typeof ref === 'object') {
        if (ref && 'current' in ref) {
          ref.current = elm
        }
      }
    }

    if (!oldAttrs && !attrs) return
    if (oldAttrs === attrs) return

    oldAttrs = oldAttrs || {}
    attrs = attrs || {}

    // 更新有修改的 attributes，和增加新的 attributes
    for (const key in attrs) {
      if (key === 'ref') continue
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

    // 移除需要移除的属性
    for (const key in oldAttrs) {
      if (key === 'ref') continue
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