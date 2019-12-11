import { Target } from '../vdom/create-component.js'

export function resolveTargetComponent() {
  if (Target.component === undefined) {
    throw new Error('Invalid hook call. Hooks can only be called inside of the body of a function component.')
  }
  return Target.component
}