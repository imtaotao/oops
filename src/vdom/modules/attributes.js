const xChar = 120
const colonChar = 58
const xlinkNS = 'http://www.w3.org/1999/xlink'
const xmlNS = 'http://www.w3.org/XML/1998/namespace'

function updateAttrs(oldVnode, vnode) {
  const elm = vnode.elm
  let attrs = vnode.data.attrs
  let oldAttrs = oldVnode.data.attrs

  if (!oldAttrs && !attrs) return
  if (oldAttrs === attrs) return

  oldAttrs = oldAttrs || {}
  attrs = attrs || {}

  // 更新有修改的 attributes，和增加新的 attributes
  for (const key in attrs) {
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
  for (key in oldAttrs) {
    if (!(key in attrs)) {
      elm.removeAttribute(key)
    }
  }
}

export default {
  create: updateAttrs,
  update: updateAttrs,
}