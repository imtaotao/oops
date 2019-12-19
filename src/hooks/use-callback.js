import useMemo from './use-memo.js'

// callback: T, deps: Array<any> | void | null
export default function useCallback(callback, deps) {
  return useMemo(() => callback, deps)
}