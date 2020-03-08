export const isArray = Array.isArray

export function isDef(v) {
  return v !== undefined
}

export function isUndef(v) {
  return v === undefined
}

export function flat(array, condition = isArray, result = []) {
  for (const item of array) {
    if (condition(item)) {
      flat(item, condition, result)
    } else {
      result.push(item)
    }
  }
  return result
}