// defaultValue: T,
// calculateChangedBits: ?(a: T, b: T) => number,
export const CONTEXT_TYPE = Symbol('context')
export const PROVIDER_TYPE = Symbol('provider')
export const MAX_SIGNED_31_BIT_INT = 1073741823

let isDisallowedContextRead = false
let lastContextDependency = null
let lastContextWithAllBitsObserved = null

export function enterDisallowedContextRead() {
  isDisallowedContextRead = true
}

export function exitDisallowedContextRead() {
  isDisallowedContextRead = false
}

export function resetContextDependencies() {
  isDisallowedContextRead = false
  lastContextDependency = null
  lastContextWithAllBitsObserved = null
}

export function calculateChangedBits(context, newValue, oldValue) {
  if (Object.is(oldValue, newValue)) {
    // No change
    return 0
  } else {
    const changedBits =
      typeof context._calculateChangedBits === 'function'
        ? context._calculateChangedBits(oldValue, newValue)
        : MAX_SIGNED_31_BIT_INT

    if ((changedBits & MAX_SIGNED_31_BIT_INT) !== changedBits) {
      console.error(
        'calculateChangedBits: Expected the return value to be a ' +
          '31-bit integer. Instead received: %s',
        changedBits,
      )
    }
    return changedBits | 0
  }
}

// 读取 context
export function readContext(currentlyComponent, context, observedBits) {
  if (isDisallowedContextRead) {
    console.error(
      'Context can only be read while React is rendering. ' +
        'In classes, you can read it in the render method or getDerivedStateFromProps. ' +
        'In function components, you can read it directly in the function body, but not ' +
        'inside Hooks like useReducer() or useMemo().',
    )
  }

  if (lastContextWithAllBitsObserved === context) {
    // 不用做什么，我们已经在这种情况下观察到了一切
  } else if (observedBits === false || observedBits === 0) {
    // 不要观察任何更新
  } else {
    let resolvedObservedBits

    if (
      typeof observedBits !== 'number' ||
      observedBits === MAX_SIGNED_31_BIT_INT
    ) {
      // 观察所有的更新
      lastContextWithAllBitsObserved = context
      resolvedObservedBits = MAX_SIGNED_31_BIT_INT
    } else {
      resolvedObservedBits = observedBits
    }

    const contextItem = {
      context: context,
      observedBits: resolvedObservedBits,
      next: null,
    }

    // 创建一个依赖的 list
    if (lastContextDependency === null) {
      lastContextDependency = contextItem
      currentlyComponent.dependencies = {
        context: contextItem,
      }
    } else {
      // 添加新的 context
      lastContextDependency = lastContextDependency.next = contextItem
    }
  }
  return context._currentValue
}

export function createContext(defaultValue, calculateChangedBits) {
  if (calculateChangedBits === undefined) {
    calculateChangedBits = null
  } else {
    if (calculateChangedBits !== null && typeof calculateChangedBits !== 'function') {
      throw new Error('createContext: Expected the optional second argument to be a function.')
    }
  }
  const context = {
    $$typeof: CONTEXT_TYPE,
    _currentValue: defaultValue,
    // _currentValue2: defaultValue, // 暂时只有一个环境
    _calculateChangedBits: calculateChangedBits,
    Provider: null,
    Consumer: null,
  }

  context.Provider = {
    $$typeof: PROVIDER_TYPE,
    _context: context,
  }

  context.Consumer = context
  return context
}