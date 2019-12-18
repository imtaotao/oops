import vnode from './vnode.js'
import { isDef, isPrimitive, isUndef } from './is.js'
import componentVNodeHooks from './component-hooks.js'
import { PROVIDER_TYPE } from '../api/create-context.js'
import { FRAGMENTS_TYPE } from '../components/fragments.js'

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

function separateProps(props) {
  const data = {}
  if (props) {
    for (const key in props) {
      const value = props[key]
      if (key === 'class') {
        data.class = typeof value === 'string'
          ? parseClassText(value)
          : value
      } else if (key === 'style') {
        data.style = typeof value === 'string'
          ? parseStyleText(value)
          : value
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

function installHooks(data) {
  const hook = (data || (data = {})).hook || (data.hook = {})
  for (const name in componentVNodeHooks) {
    hook[name] = componentVNodeHooks[name]
  }
  return data
}

function createContextProvider(tag, props, children) {
  // 不用接受 props，因为已经可以拿到
  const provider = () => {
    if (props && 'value' in props) {
      tag._context._currentValue2 = props.value
    }
    return children[0]
  }
  return provider
}

function createContextConsumer(tag, props, children) {

}

export default function h(tag, props, ...children) {
  let elm, data
  if (typeof tag !== 'string' && tag.$$typeof === PROVIDER_TYPE) {
    if (tag.$$typeof === PROVIDER_TYPE) {
      tag = createContextProvider(tag, props, children)
    } else if (tag.$$typeof === CONTEXT_TYPE) {
      tag = createContextConsumer(tag, props, children)
    }
  }

  // fragments
  if (tag === '') {
    tag = FRAGMENTS_TYPE
  }

  // 对组件进行 hook 安装
  if (typeof tag === 'function') {
    data = installHooks(props)
  } else if (tag === FRAGMENTS_TYPE) {
    data = installHooks(props)
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
  return vnode(tag, data, children, undefined, elm)
}