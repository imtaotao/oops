import { resolveTargetComponent } from './share.js'

export default function useReducer(reducer, initialArg, init) {
  const component = resolveTargetComponent()
  const [state, key] = component.setState(
    typeof init === 'function'
      ? init(initialArg)
      : initialArg
  )
    
  return [state, value => component.useReducer(value, key, reducer)]
}