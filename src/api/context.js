import {
  CONTEXT_TYPE,
  PROVIDER_TYPE,
} from './symbols.js'

export const MAX_SIGNED_31_BIT_INT = 1073741823

class ContextStack {
  constructor(context, defaultValue) {
    const baseProvider = {
      value: defaultValue,
      provider: {
        consumerQueue: []
      },
    }
    this.context = context
    this.stack = [baseProvider]
  }

  push(value, provider) {
    const { stack, context } = this
    const item = { value, provider }
    stack.push(item)
    context._currentValue = value
  }

  pop() {
    const { stack, context } = this
    stack.pop()
    const lastItme = stack[stack.length - 1]
    context._currentValue = lastItme
      ? lastItme.value
      : null
  }

  reset() {
    const { stack, context } = this
    this.stack = [stack[0]]
    context._currentValue = stack[0].value
  }

  getCurrentProvider() {
    const stack = this.stack
    const lastItme = stack[stack.length - 1]
    return lastItme.provider
  }
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
          `31-bit integer. Instead received: ${changedBits}`
      )
    }
    return changedBits | 0
  }
}

// Read `context`, this method used for `Consumer` and `useContext`
export function readContext(consumer, context, observedBits) {
  const currentProvider = context._contextStack.getCurrentProvider()
  const queue = currentProvider.consumerQueue
  const item = {
    consumer,
    observedBits: typeof observedBits !== 'number' || observedBits === MAX_SIGNED_31_BIT_INT
      ? MAX_SIGNED_31_BIT_INT
      : observedBits,
  }

  if (queue.every(item => item.consumer !== consumer)) {
    queue.push(item)
  }
  if (consumer.providerDependencies.indexOf(currentProvider) < 0) {
    consumer.providerDependencies.push(currentProvider)
  }
  return context._currentValue
}

export function removedInDeps(consumer) {
  const queue = consumer.providerDependencies
  if (queue.length > 0) {
    for (let i = 0; i < queue.length; i++) {
      const providerDep = queue[i]
      const index = providerDep.consumerQueue.findIndex(item => item.consumer === consumer)
      if (index > -1) {
        queue.splice(index, 1)
      }
    }
  }
}

// defaultValue: T,
// calculateChangedBits: ?(a: T, b: T) => number,
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
    _calculateChangedBits: calculateChangedBits,
    Provider: null,
    Consumer: null,
  }

  context.Provider = {
    $$typeof: PROVIDER_TYPE,
    _context: context,
  }

  const Consumer = {
    $$typeof: CONTEXT_TYPE,
    _context: context,
    _calculateChangedBits: context._calculateChangedBits,
  }

  // 代理
  Object.defineProperties(Consumer, {
    Provider: {
      get() {
        console.error(
          'Rendering <Context.Consumer.Provider> is not supported and will be removed in ' +
            'a future major release. Did you mean to render <Context.Provider> instead?'
        )
        return context.Provider
      },
      set(_Provider) {
        context.Provider = _Provider
      },
    },

    _currentValue: {
      get() {
        return context._currentValue
      },
      set(_currentValue) {
        context._currentValue = _currentValue
      },
    },

    Consumer: {
      get() {
        console.error(
          'Rendering <Context.Consumer.Consumer> is not supported and will be removed in ' +
            'a future major release. Did you mean to render <Context.Consumer> instead?'
        )
        return context.Consumer
      },
    },
  })

  context.Consumer = Consumer
  context._contextStack = new ContextStack(context, defaultValue)
  return context
}
