import { readContext } from './api/context.js'
import { Target } from './vdom/components/component.js'

function resolveTargetComponent() {
  if (Target.component === undefined) {
    throw new Error(
      'Invalid hook call. ' + 
      'Hooks can only be called inside of the body of a function component.'
    )
  }
  return Target.component
}

// create: () => (() => void) | void
// deps: Array<any> | void | null
export function useEffect(create, deps) {
  const component = resolveTargetComponent()
  return component.pushEffect('effects', create, deps)
}

// create: () => (() => void) | void,
// deps: Array<any> | void | null,
export function useLayoutEffect(create, deps) {
  const component = resolveTargetComponent()
  return component.pushEffect('layoutEffects', create, deps)
}

// create: () => T,
// deps: Array<any> | void | null
export function useMemo(create, deps) {
  const component = resolveTargetComponent()
  return component.useMemo(create, deps)
}

// callback: T
// deps: Array<any> | void | null
export function useCallback(callback, deps) {
  return useMemo(() => callback, deps)
}

// Context: Context<T>,
// unstable_observedBits: number | boolean | void,
export function useContext(context, unstable_observedBits) {
  const component = resolveTargetComponent()
  return readContext(component, context, unstable_observedBits)
}

export function useState(initialState) {
  const update = (oldValue, newValue) => {
    return typeof newValue === 'function'
      ? newValue(oldValue)
      : newValue
  }
  return useReducer(update, initialState)
}

export function useReducer(reducer, initialArg, init) {
  const component = resolveTargetComponent()
  const [state, key] = component.setState(
    typeof init === 'function'
      ? init(initialArg)
      : initialArg
  )
  return [state, value => component.useReducer(value, key, reducer)]
}

// initialValue: any
export function useRef(initialValue) {
  const component = resolveTargetComponent()
  return component.useRef(initialValue)
}

// ref: {current: T | null} | ((inst: T | null) => any) | null | void,
// create: () => T,
// deps: Array<any> | void | null,
export function useImperativeHandle(ref, create, deps) {
  if (typeof create !== 'function') {
    console.error(
      'Expected useImperativeHandle() second argument to be a function ' +
        'that creates a handle. Instead received: %s.',
      create !== null ? typeof create : 'null',
    )
  }
  const component = resolveTargetComponent()
  return component.useImperativeHandle(ref, create, deps)
}
