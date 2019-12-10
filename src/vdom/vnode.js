export default function vnode(tag, data, children, text, elm) {
  return {
    tag,
    elm,
    data,
    text,
    children,
    parent: undefined, // 当前组件的父组件
    componentInstance: undefined, // 组件实例
    key: data === undefined ? undefined : data.key,
  }
}