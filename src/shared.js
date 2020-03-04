export const isArray = Array.isArray

export function isDef(v) {
  return v !== undefined
}

export function isUndef(v) {
  return v === undefined
}

export function flatMap(array, callback, result = []) {
  for (let i = 0; i < array.length; i++) {
    const item = array[i]
    if (isArray(item)) {
      flatMap(item, callback, result)
    } else {
      result.push(callback(item, i, array))
    }
  }
  return result
}