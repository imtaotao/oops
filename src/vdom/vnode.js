export default function vnode(tag, data, children, text, elm) {
  return {
    tag,
    elm,
    data,
    text,
    children,
    componentInstance: undefined, // 组件实例
    key: data === undefined ? undefined : data.key,
  }
}