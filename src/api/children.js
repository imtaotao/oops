import { cloneVnode } from '../vdom/h.js'
import { isValidElement } from './isValidElement.js'
import {
  isArray,
  getIteratorFn,
} from '../shared.js'

const SEPARATOR = '.'
const SUBSEPARATOR = ':'
const POOL_SIZE = 10 // 最多缓存 10 个 context
const traverseContextPool = [] // 缓存 context，避免重复初始化

function escape(key) {
  const escapeRegex = /[=:]/g
  const escaperLookup = {
    '=': '=0',
    ':': '=2',
  }
  const escapedString = ('' + key).replace(
    escapeRegex,
    match => escaperLookup[match],
  )
  return '$' + escapedString
}

const userProvidedKeyEscapeRegex = /\/+/g
function escapeUserProvidedKey(text) {
  return ('' + text).replace(userProvidedKeyEscapeRegex, '$&/')
}

function cloneAndReplaceKey(oldElm, newKey) {
  const cloned = cloneVnode(oldElm)
  cloned.key = newKey
  return cloned
}

function getComponentKey(component, index) {
  return (
    typeof component === 'object' &&
    component !== null &&
    component.key != null
  )
    ? escape(component.key)
    : index.toString(36)
}

function getPooledTraverseContext(mapResult, keyPrefix, mapFunction, mapContext) {
  if (traverseContextPool.length) {
    const traverseContext = traverseContextPool.pop()
    traverseContext.count = 0
    traverseContext.fn = mapFunction
    traverseContext.result = mapResult
    traverseContext.context = mapContext
    traverseContext.keyPrefix = keyPrefix
    return traverseContext
  } else {
    return {
      count: 0,
      fn: mapFunction,
      result: mapResult,
      context: mapContext,
      keyPrefix: keyPrefix,
    }
  }
}

function releaseTraverseContext(traverseContext) {
  traverseContext.result = null
  traverseContext.keyPrefix = null
  traverseContext.fn = null
  traverseContext.context = null
  traverseContext.count = 0
  if (traverseContextPool.length < POOL_SIZE) {
    traverseContextPool.push(traverseContext)
  }
}

// foreach callback
function forEachSingleChild(bookKeeping, child, name) {
  const { fn, context } = bookKeeping
  fn.call(context, child, bookKeeping.count++)
}

// map callback
function mapSingleChildIntoContext(bookKeeping, child, childKey) {
  const { fn, result, keyPrefix, context } = bookKeeping
  let mappedChild = fn.call(context, child, bookKeeping.count++)

  if (isArray(mappedChild)) {
    mapIntoWithKeyPrefixInternal(mappedChild, result, childKey, c => c)
  } else if (mappedChild != null) {
    if (isValidElement(mappedChild)) {
      mappedChild = cloneAndReplaceKey(
        mappedChild,
        // 保留新旧 vnode 的 key
        keyPrefix +
          (mappedChild.key && (!child || child.key !== mappedChild.key)
            ? escapeUserProvidedKey(mappedChild.key) + '/'
            : '') +
          childKey,
      )
    }
    result.push(mappedChild)
  }
}

function traverseAllChildrenImpl(children, nameSoFar, callback, traverseContext) {
  // 对于不符合的类型，不需要遍历，只有一个 child
  const type = typeof children
  if (type === 'undefined' || type === 'boolean') {
    children = null
  }

  let invokeCallback = false

  if (children === null) {
    invokeCallback = true
  } else {
    switch (type) {
      case 'string':
      case 'number':
        invokeCallback = true
        break
      case 'object':
        if (isValidElement(children)) {
          invokeCallback = true
        }
    }
  }

  if (invokeCallback) {
    callback(
      traverseContext,
      children,
      nameSoFar === '' ? SEPARATOR + getComponentKey(children, 0) : nameSoFar,
    )
    return 1
  }

  let child
  let nextName
  let subtreeCount = 0 // 所有 child 计数
  const nextNamePrefix = nameSoFar === ''
    ? SEPARATOR
    : nameSoFar + SUBSEPARATOR

  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      child = children[i]
      nextName = nextNamePrefix + getComponentKey(child, i)
      subtreeCount += traverseAllChildrenImpl(
        child,
        nextName,
        callback,
        traverseContext,
      )
    }
  } else {
    const iteratorFn = getIteratorFn(children)
    if (typeof iteratorFn === 'function') {
      // 如果 children 有 iterate 接口，也可以遍历
      const iterator = iteratorFn.call(children)

      let step
      let ii = 0
      while (!(step = iterator.next()).done) {
        child = step.value
        nextName = nextNamePrefix + getComponentKey(child, ii++)
        subtreeCount += traverseAllChildrenImpl(
          child,
          nextName,
          callback,
          traverseContext,
        )
      }
    } else if (type === 'object') {
      throw new Error('If you meant to render a collection of children, use an array instead.')
    }
  }

  return subtreeCount
}

function traverseAllChildren(children, callback, traverseContext) {
  if (children == null) return 0
  return traverseAllChildrenImpl(children, '', callback, traverseContext)
}

// map 和 toArray 需要对 key 做处理
function mapIntoWithKeyPrefixInternal(children, array, prefix, fn, context) {
  let escapedPrefix = ''
  if (prefix != null) {
    escapedPrefix = escapeUserProvidedKey(prefix) + '/'
  }
  const traverseContext = getPooledTraverseContext(
    array,
    escapedPrefix,
    fn,
    context,
  )
  traverseAllChildren(children, mapSingleChildIntoContext, traverseContext)
  releaseTraverseContext(traverseContext)
}

// APIs
function forEachChildren(children, fn, context) {
  if (children == null) return children
  const traverseContext = getPooledTraverseContext(
    null,
    null,
    fn,
    context,
  )
  traverseAllChildren(children, forEachSingleChild, traverseContext)
  releaseTraverseContext(traverseContext)
}

function mapChildren(children, fn, context) {
  if (children == null)  return children
  const result = []
  mapIntoWithKeyPrefixInternal(children, result, null, fn, context)
  return result
}

function countChildren(children) {
  return traverseAllChildren(children, () => null, null)
}

function toArray(children) {
  const result = []
  mapIntoWithKeyPrefixInternal(children, result, null, child => child)
  return result
}

function onlyChild(children) {
  if (!isValidElement(children)) {
    throw new Error('Oops.Children.only expected to receive a single React element child.')
  }
  return children
}

export {
  toArray,
  onlyChild as only,
  mapChildren as map,
  countChildren as count,
  forEachChildren as forEach,
}
