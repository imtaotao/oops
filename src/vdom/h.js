import vnode from './vnode.js'
import { isDef, isPrimitive, isUndef } from './is.js'
import createComponentInstanceForVnode from './create-component.js'

const HOOK = 'hook'
const CLASS = 'class'
const STYLE = 'style'
const ATTRS = 'attrs'
const DATASET = 'dataset'
const EVENT = 'on'
const EVENT_PRE = 'on'
const DATASET_PRE = 'data-'

const STYLE_DELAYED = 'delayed'
const STYLE_REMOVE = 'remove'

function cached(fn) {
  const cache = Object.create(null)
  return function wraper(str) {
    const hit = cache[str]
    return hit || (cached[str] = fn(str))
  }
}

const parseClassText = cached(klass => {
  const res = {}
  if (klass.indexOf(' ') > -1) {
    const list = klass.split(' ')
    for (let i = 0; i < list.length; ++i) {
      if (list[i]) {
        res[list[i]] = true
      }
    }
  } else {
    res[klass] = true
  }
  return res
})

const parseStyleText = cached(cssText => {
  const res = {}
  const listDelimiter = /;(?![^(]*\))/g
  const propertyDelimiter = /:(.+)/
  const items = cssText.split(listDelimiter)

  for (let i = 0; i < items.length; i++) {
    if (items[i]) {
      const tmp = items[i].split(propertyDelimiter)
      if (tmp.length > 1) {
        const name = tmp[0].trim()
        const value = tmp[1].trim()
        if ((name === STYLE_DELAYED || name === STYLE_REMOVE) &&
            typeof value === 'string') {
          res[name] = new Function('return ' + value)()
        } else {
          res[name] = value
        }
      }
    }
  }
  return res
})

function separateProps(props) {
  const data = {}
  if (props) {
    for (const key in props) {
      const value = props[key]
      if (key === CLASS) {
        data.class = typeof value === 'string'
          ? parseClassText(value)
          :value
      } else if (key === STYLE) {
        data.style = typeof value === 'string'
          ? parseStyleText(value)
          : value
      } else if (key === HOOK) {
        data.hook = value
      } else if (key === EVENT || key === DATASET || key === ATTRS) {
        if (typeof value === 'object') {
          data[key] = value
        }
      } else if (key.startsWith(EVENT_PRE)) {
        if (isUndef(data.on)) data.on = {}
        // 同一个事件只有一个回调
        data.on[key.slice(2)] = value
      } else if (key.startsWith(DATASET_PRE)) {
        if (isUndef(data.dataset)) data.dataset = {}
        data.dataset[key.slice(5)] = value
      } else {
        if (isUndef(data.attrs)) data.attrs = {}
        data.attrs[key] = value
      }
    }
  }
  return data
}

function addNS(data, children, tag) {
  data.ns ='http://www.w3.org/2000/svg'
  if (tag !== 'foreignObject' && isDef(children)) {
    for (let i = 0; i < children.length; i++) {
      const childData = children[i].data
      if (isDef(childData)) {
        addNS(childData, children[i].children, children[i].tag)
      }
    }
  }
}

export default function h(tag, props, ...children) {
  let data
  // 如果组件
  if (typeof tag === 'function') {
    data = props || {}
    ;(data.hook || (data.hook = {})).init = createComponentInstanceForVnode
  } else {
    data = separateProps(props)
  }

  if (children.length > 0) {
    for (let i = 0; i < children.length; i++) {
      if (isPrimitive(children[i])) {
        children[i] = vnode(undefined, undefined, undefined, children[i], undefined)
      }
    }
  }
  if (tag === 'svg') {
    addNS(data, children, tag)
  }
  return vnode(tag, data, children, undefined, undefined)
}