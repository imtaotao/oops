import useReducer from './use-reducer.js'

export default function useState(initialState) {
  const update = (oldValue, newValue) => {
    return typeof newValue === 'function'
      ? newValue(oldValue)
      : newValue
  }
  return useReducer(update, initialState)
}