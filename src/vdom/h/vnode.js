export default function vnode(tag, data, children, text, elm) {
  const componentInstance = undefined
  const key = data ? data.key : undefined

  return { tag, data, children, key, elm, text, componentInstance }
}