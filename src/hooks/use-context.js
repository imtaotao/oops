import { readContext } from '../api/context.js'
import { resolveTargetComponent } from './share.js'

export default function useContext(context, observedBits) {
  const component = resolveTargetComponent()
  return readContext(component, context, observedBits)
}