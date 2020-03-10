import { h } from '../vdom/h.js'
import { MEMO_TYPE } from './symbols.js'
import { isValidElementType } from '../shared.js'

export const memoCache = new Map()

export function memo(component, compare) {
  if (!isValidElementType) {
    throw new Error(
      'memo: The first argument must be a component. Instead received:' +
        (component === null ? 'null' : typeof component),
    )
  }

  compare = compare === undefined ? null : compare
  const memoWraper = function memoWraper(props) {
    console.log(component)
    return h(component, props, undefined)
  }
  return memoWraper
}