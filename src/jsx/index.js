import h from '../vdom/h.js'
import { build, evaluate } from './parse.js'

const CACHE = new Map()
const getCache = statics => {
  let tpl = CACHE.get(statics)
  if (!tpl) {
    CACHE.set(statics, tpl = build(statics))
  }
  return tpl
}

export function genVNodeTree(h, statics, fields) {
  const result = evaluate(h, getCache(statics), fields, [])
  return result.length > 1 ? result : result[0]
}

export default function jsx(statics, ...fields) {
  return genVNodeTree(h, statics, fields)
}