import { MEMO_TYPE } from './symbols.js'
import { isValidElementType } from '../shared.js'

export function memo(tag, compare) {
  if (!isValidElementType) {
    throw new Error(
      'memo: The first argument must be a component. Instead received:' +
        (tag === null ? 'null' : typeof tag),
    )
  }
  return {
    tag,
    $$typeof: MEMO_TYPE,
    compare: compare === undefined ? null : compare
  }
}