import vnode from './vnode.js'
import { isDef, isPrimitive } from './is.js'

function addNS(data, children, sel) {
  data.ns ='http://www.w3.org/2000/svg'
  if (sel !== 'foreignObject' && isDef(children)) {
    for (let i = 0; i < children.length; i++) {
      const childData = children[i].data
      if (isDef(childData)) {
        addNS(childData, children[i].children, children[i].sel)
      }
    }
  }
}

export default function h(sel, props, ...children) {
  let data = {}
  if (props !== null) data = props

  if (children.length > 0) {
    for (let i = 0; i < children.length; i++) {
      if (isPrimitive(children[i])) {
        children[i] = vnode(undefined, undefined, undefined, children[i], undefined)
      }
    }
  }

  if (typeof sel === 'string' && sel.startsWith('svg') &&
      (sel.length === 3 || sel[3] === '.' || sel[3] === '#')) {
    addNS(data, children, sel)
  }

  return vnode(sel, data, children, undefined, undefined)
}