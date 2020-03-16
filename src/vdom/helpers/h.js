import { createVnode } from '../h.js'
import { isDef, isUndef } from '../../shared.js'
import { memoVNodeHooks } from '../components/memo.js'
import { componentVNodeHooks } from '../components/ordinary.js'
import { providerVNodeHooks } from '../components/contextProvider.js'
import { consumerVNodeHooks } from '../components/contextConsumer.js'
import {
  isMemo,
  isConsumer,
  isProvider,
  isComponent,
  isFilterVnode,
  isPrimitiveVnode,
} from './patch/is.js'

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

function isProps(key) {
  return (
    key === 'href' ||
    key === 'value' ||
    key === 'checked' ||
    key === 'disabled'
  )
}

function dealWithDataValue(data, key, value) {
  const assert = name => isUndef(data[name]) && (data[name] = {})

  switch(key) {
    case 'class':
      data.class =
        typeof value === 'string'
          ? parseClassText(value)
          : value
      break
    case 'style':
      data.style =
        typeof value === 'string'
          ? parseStyleText(value)
          : value
      break
    case 'hook':
      data.hook = value
      break
    case 'props':
      assert('props')
      data.props[value[0]] = value[1]
      break
    case 'event':
      assert('on')
      data.on[value[0].slice(2).toLocaleLowerCase()] = value[1]
      break
    case 'singleDataset':
      assert('dataset')
      data.dataset[value[0].slice(5)] = value[1]
      break
    case 'singleAttr':
      assert('attrs')
      data.attrs[value[0]] = value[1]
      break
    case 'on':
    case 'attrs':
    case 'dataset':
      if (typeof value === 'object') {
        data[key] = value
      }
      break
  }
}

export function separateProps(props) {
  const data = {}
  if (props) {
    for (let key in props) {
      let value = props[key]
      if (
        key === 'on' ||
        key === 'attrs' ||
        key === 'class' ||
        key === 'style' ||
        key === 'dataset'
      ) {
        // 不用改
      } else if (key === 'className') {
        key = 'class'
      } else if (isProps(key)) {
        value = [key, value]
        key = 'props'
      } else if (key.startsWith('on')) {
        value = [key, value]
        key = 'event'
      } else if (key.startsWith('data-')) {
        value = [key, value]
        key = 'singleDataset'
      } else {
        value = [key, value]
        key = 'singleAttr'
      }
      dealWithDataValue(data, key, value)
    }
  }
  return data
}

export function installHooks(tag, data) {
  let vnodeHooks
  const simulateVnode = { tag }
  const hook = (data || (data = {})).hook || (data.hook = {})

  if (isProvider(simulateVnode)) {
    vnodeHooks = providerVNodeHooks
  } else if (isConsumer(simulateVnode))  {
    vnodeHooks = consumerVNodeHooks
  } else if (isComponent(simulateVnode)) {
    vnodeHooks = componentVNodeHooks
  } else if (isMemo(simulateVnode)) {
    vnodeHooks = memoVNodeHooks
  }

  if (vnodeHooks) {
    for (const name in vnodeHooks) {
      hook[name] = vnodeHooks[name]
    }
  }
  return data
}

export function formatVnode(tag, data, children) {
  if (children.length > 0) {
    for (let i = 0; i < children.length; i++) {
      if (isPrimitiveVnode(children[i])) {
        children[i] = createVnode(undefined, undefined, undefined, children[i], undefined)
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
  return createVnode(tag, data, children, undefined, undefined)
}