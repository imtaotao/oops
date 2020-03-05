export const isArray = Array.isArray

export function isDef(v) {
  return v !== undefined
}

export function isUndef(v) {
  return v === undefined
}

export function flatMap(
  array,
  callback,
  condition = isArray,
  result = [],
) {
  for (const [i, item] of array.entries()) {
    if (condition(item)) {
      flatMap(item, callback, condition, result)
    } else {
      result.push(callback(item, i, array))
    }
  }
  return result
}