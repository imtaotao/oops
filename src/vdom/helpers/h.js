import { createVnode } from '../h.js'
import { FRAGMENTS_TYPE } from '../../api/symbols.js'
import { memoVNodeHooks } from '../components/memo.js'
import { portalVNodeHooks } from '../components/portal.js'
import { forwardRefHooks } from '../components/forwardRef.js'
import { componentVNodeHooks } from '../components/component.js'
import { providerVNodeHooks } from '../components/contextProvider.js'
import { consumerVNodeHooks } from '../components/contextConsumer.js'
import {
  isDef,
  isUndef,
  hasIterator,
  isInternalComponent,
} from '../../shared.js'
import {
  isMemo,
  isPortal,
  isConsumer,
  isProvider,
  isComponent,
  isForwardRef,
  isFilterVnode,
  isCommonVnode,
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
        // Not modify
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

  if (isComponent(simulateVnode)) {
    vnodeHooks = componentVNodeHooks
  } else if (isProvider(simulateVnode)) {
    vnodeHooks = providerVNodeHooks
  } else if (isConsumer(simulateVnode)) {
    vnodeHooks = consumerVNodeHooks
  } else if (isMemo(simulateVnode)) {
    vnodeHooks = memoVNodeHooks
  } else if (isForwardRef(simulateVnode)) {
    vnodeHooks = forwardRefHooks
  } else if (isPortal(simulateVnode)) {
    vnodeHooks = portalVNodeHooks
  }

  if (vnodeHooks) {
    for (const name in vnodeHooks) {
      hook[name] = vnodeHooks[name]
    }
  }
  return data
}

export function createFragmentVnode(children) {
  return formatVnode(FRAGMENTS_TYPE, {}, children, true)
}

export function formatVnode(tag, data, children, checkKey) {
  // The `Component` need abtain origin `children` data
  if (!isComponent({ tag }) && !isInternalComponent(tag)) {
    if (children.length > 0) {
      let didWarned = false
      children = children.slice()

      for (let i = 0; i < children.length; i++) {
        if (checkKey && !didWarned) {
          if (!data.hasOwnProperty('key')) {
            console.warn(
              'Warning: Each child in a list should have a unique "key" prop. ' + 
                'See https://fb.me/react-warning-keys for more information.'
            )
            didWarned = true
          }
        }

        if (hasIterator(children[i])) {
          children[i] = createFragmentVnode(Array.from(children[i]))
        } else if (isPrimitiveVnode(children[i])) {
          children[i] = createVnode(undefined, undefined, undefined, children[i], undefined)
        } else if (isCommonVnode(tag)) {
          if (isFilterVnode(children[i])) {
            // Filter out `null`, `undefined`, `true`, `false`.
            // Keep same with React
            children.splice(i, 1)
            i--
          }
        }
      }
    }
  }

  if (tag === 'svg') {
    addNS(data, children, tag)
  }
  return createVnode(tag, data, children, undefined, undefined)
}
