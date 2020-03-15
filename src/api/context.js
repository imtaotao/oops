// context 的问题
// 1. 取值范围
//    在 <Context.Provider> 下的组件中的子组件，用到 context 的值是 provider 中 value 提供的值，但 provider 可能嵌套
//    所以，要有一个队列保存每一个 provider 的值，每个 provider 的 vnode 创建完成后都要返回到上一个 provider 的值，
//    vnode 中用到的 context.currentValue 都是在 init 生命周期中调用 component 函数得到的，所以在每个组件 init 生命周期后要 pop 当前 provider 的值
// 
// 2. 更新模式
//    当 <Context.Provider> 更新后，只有 provider 下用到的组件（Consumer 和 useContext）需要更新，其他用到的地方不用更新，
//    其实按照道理来说，只要父组件更新，子组件也要跟新，但是子组件可以被 memo 方法阻断更新，这将导致 Consumer 不会被更新，
//    所以得对所有的 Consumer 进行订阅，这样就需要对每个 provider 创建一个依赖列表，记录所有子节点中的 Consumer，然后进行更新
//    这样带来的问题是，如果没有被 memo 方法阻断子组件的更新将会导致 Consumer 被更新两次，为了保证 Consumer 组件只被更新一次，可能需要做成异步批量更新
//    异步更新可能会导致与 react 的行为不一致
// 
// 3. react 的做法
//    provider 更新时，知道更新的是哪个 context，然后从 provider 节点往下找，每个 fiber 节点有个 context 依赖列表，
//    如果在这个列表中找到了当前更新的 context，则当前 fiber 节点是需要更新的。这样就是 只有 provider 下的 Consumer 更新，即使被阻断更新了，react 也会
//    重新给被阻断的 fiber 节点一个过期时间，强制更新。
//    如果使用 snabbdom，可以在阻断更新的地方判断是真正更新还是 context 变化引起的更新，如果是 context 引起的更新，则不判断 memo 导致的阻断。与 react 给
//    fiber 节点一个过期时间跳过阻断是同样的道理。这样就可以解决上述所有的问题


// defaultValue: T,
// calculateChangedBits: ?(a: T, b: T) => number,
import { CONTEXT_TYPE, PROVIDER_TYPE } from './symbols.js'

export const MAX_SIGNED_31_BIT_INT = 1073741823

let isDisallowedContextRead = false

export function enterDisallowedContextRead() {
  isDisallowedContextRead = true
}

export function exitDisallowedContextRead() {
  isDisallowedContextRead = false
}

class ContextStack {
  constructor(context, defaultValue) {
    this.context = context
    this.valueStack = [
      {
        component: {
          customerQueue: [],
        },
        value: defaultValue,
      },
    ]
  }

  push(value, provider) {
    const item = { value, provider }
    this.valueStack.push(item)
    this.context._currentValue = value
  }

  pop() {
    this.valueStack.pop()
    const lastItme = this.valueStack[this.valueStack.length - 1]
    this.context._currentValue = lastItme ? lastItme.value : null
  }

  reset() {
    this.valueStack = this.valueStack[0]
    this.context._currentValue = this.valueStack[0].value
  }

  getCurrentProvider() {
    return this.valueStack[this.valueStack.length - 1].component
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
          '31-bit integer. Instead received: %s',
        changedBits,
      )
    }
    return changedBits | 0
  }
}

// 读取 context，这个方法给 Consumer 和 useContext 使用
export function readContext(currentComponent, context, observedBits) {
  if (isDisallowedContextRead) {
    console.error(
      'Context can only be read while React is rendering. ' +
        'In classes, you can read it in the render method or getDerivedStateFromProps. ' +
        'In function components, you can read it directly in the function body, but not ' +
        'inside Hooks like useReducer() or useMemo().',
    )
  }

  const item = {
    component: currentComponent,
    observedBits: typeof observedBits !== 'number' || observedBits === MAX_SIGNED_31_BIT_INT
      ? MAX_SIGNED_31_BIT_INT
      : observedBits,
  }
  
  const currentProvider = context.getCurrentProvider()
  const queue = currentProvider.customerQueue
  if (queue.every(item => item.component !== currentComponent)) {
    context._dependencies.push(item)
  }

  if (!currentComponent.isConsumer) {
    if (currentComponent.contextDependencies.indexOf(context) < 0) {
      currentComponent.contextDependencies.push(context)
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
            'a future major release. Did you mean to render <Context.Provider> instead?',
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
          false,
          'Rendering <Context.Consumer.Consumer> is not supported and will be removed in ' +
            'a future major release. Did you mean to render <Context.Consumer> instead?',
        )
        return context.Consumer
      },
    },
  })
  context.Consumer = Consumer
  context._contextStack = new ContextStack(context, defaultValue)
  return context
}