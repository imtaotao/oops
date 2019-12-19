import { resolveTargetComponent } from './share.js'

// create: () => T,
// deps: Array<any> | void | null
export default function useMemo(create, deps) {
  const component = resolveTargetComponent()
  return component.useMemo(create, deps)
}