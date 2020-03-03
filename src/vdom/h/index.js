import vnode from './vnode.js'
import componentVNodeHooks from '../component/registerHooks.js'
import { isDef, isPrimitive, isUndef, isFilterVnode } from '../patch/is.js'
import { FRAGMENTS_TYPE, PROVIDER_TYPE, CONTEXT_TYPE } from '../../api/nodeSymbols.js'

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
        if ((name === 'delayed' || name === 'remove') &&
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

function isProps(key) {
  return (
    key === 'href' ||
    key === 'value' ||
    key === 'checked' ||
    key === 'disabled'
  )
}

function separateProps(props) {
  const data = {}
  if (props) {
    for (const key in props) {
      const value = props[key]
      if (key === 'class' || key === 'className') {
        // 兼容 className
        data.class = typeof value === 'string'
          ? parseClassText(value)
          : value
      } else if (key === 'style') {
        data.style = typeof value === 'string'
          ? parseStyleText(value)
          : value
      } else if (isProps(key)) {
        if (!data.props) {
          data.props = {}
        }
        data.props[key] = value
      } else if (key === 'hook') {
        data.hook = value
      } else if (key === 'on' || key === 'dataset' || key === 'attrs') {
        if (typeof value === 'object') {
          data[key] = value
        }
      } else if (key.startsWith('on')) {
        if (isUndef(data.on)) data.on = {}
        // 同一个事件只有一个回调
        data.on[key.slice(2).toLocaleLowerCase()] = value
      } else if (key.startsWith('data-')) {
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

// 对数组做扁平化处理
function flatten(array, result = []) {
  for (const value of array) {
    if(
      value !== null &&
      typeof value === 'object' &&
      typeof value[Symbol.iterator] === 'function'
    ) {
      flatten(value, result)
    } else {
      result.push(value)
    }
  }
  return result
}

function installHooks(data) {
  const hook = (data || (data = {})).hook || (data.hook = {})
  for (const name in componentVNodeHooks) {
    hook[name] = componentVNodeHooks[name]
  }
  return data
}

function inspectedElemntType(tag, props, children) {
  if (typeof tag === 'object') {
    switch (tag.$$typeof) {
      case PROVIDER_TYPE:
        if (typeof tag !== 'function') {
          const context = tag._context
          function ContextProvider({ value, children }) {
            context._contextStack.push(value)
            return vnode(FRAGMENTS_TYPE, {}, children, undefined, undefined)
          }
          ContextProvider.$$typeof = tag.$$typeof
          ContextProvider._context = tag._context
          tag = ContextProvider
        }
        break
      case CONTEXT_TYPE:
        break
    }
  }
  return { tag, props, children }
}

export function genVnode(tag, data, children) {
  if (children.length > 0) {
    for (let i = 0; i < children.length; i++) {
      if (isPrimitive(children[i])) {
        children[i] = vnode(undefined, undefined, undefined, children[i], undefined)
      } else if (isFilterVnode(children[i])) {
        // 过滤掉 null, undefined, true, false 这几种值，保持与 react 一致
        children.splice(i, 1)
        i--
      }
    }
  }
  if (tag === 'svg') {
    addNS(data, children, tag)
  }
  return vnode(tag, data, children, undefined, undefined)
}

export default function h(tag, props, ...children) {
  // 平铺数组，这将导致数组中的子数组中的元素 key 值是在同一层级的
  // children = children.flat(Infinity)
  children = flatten(children)

  if (tag === '') {
    tag = FRAGMENTS_TYPE
  }

  // 在此针对普通的 node，组件和内置组件做区分
  const res = inspectedElemntType(tag, props, children)

  tag = res.tag
  props = res.props
  children = res.children

  const data = typeof tag === 'string' || tag === FRAGMENTS_TYPE
    ? separateProps(props)
    : installHooks(props)

  return genVnode(tag, data, children)
}