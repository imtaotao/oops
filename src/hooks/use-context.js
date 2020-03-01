import { readContext } from '../api/context.js'
import { resolveTargetComponent } from './share.js'

export default function useContext(contextValue, observedBits) {
  const component = resolveTargetComponent()
  return readContext(component, contextValue, observedBits)
}