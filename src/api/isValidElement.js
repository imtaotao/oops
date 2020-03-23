import { isValidElementType } from '../shared.js'

export function isValidElement(object) {
  return (
    typeof object === 'object' &&
    object !== null &&
    isValidElementType(object.tag)
  )
}
