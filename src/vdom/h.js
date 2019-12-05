import vnode from './vnode.js'
import { isDef, isPrimitive } from './is.js'

const CLASS = 'class'
const STYLE = 'style'
const EVENT_PRE = 'on'
const DATASET_PRE = 'data-'

function splitClass(klass) {
  const list = klass.split(' ')
  const ret = {}
  for (let i = 0; i < list.length; ++i) {
    if (list[i]) {
      ret[list[i]] = true
    }
  }
  return ret
}

function splitStyle(style) {
  
}

function propsToData(props) {
  const data = {}
  if (props) {
    for (const key in props) {
      const value = props[key]
      if (key === CLASS) {
        if (typeof value === 'string') {
          data.class = splitClass(value)
        }
      } else if (key === STYLE) {
        if (typeof value === 'string') {
          data.style = splitStyle(value)
        } else {
          data.style = value
        }
      } else if (key.startsWith(EVENT_PRE)) {

      } else if (key.startsWith(DATASET_PRE)) {

      } else {

      }
    }
  }
  return data
}

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
  const data = propsToData(props)

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