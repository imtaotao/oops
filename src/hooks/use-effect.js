import { resolveTargetComponent } from './share.js'

// effect: () => (() => void) | void
// deps: Array<any> | void | null
export default function useEffect(effect, deps) {
  const component = resolveTargetComponent()
  return component.useEffect(effect, deps)
}