// defaultValue: T,
// calculateChangedBits: ?(a: T, b: T) => number,
export const CONTEXT_TYPE = Symbol('context')
export const PROVIDER_TYPE = Symbol('provider')

export default function createContext(defaultValue, calculateChangedBits) {
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
    _currentValue2: defaultValue,
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