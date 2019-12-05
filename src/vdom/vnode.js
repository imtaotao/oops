export default function vnode(tag, data, children, text, elm, componentOptions) {
  return {
    tag,
    elm,
    data,
    text,
    children,
    componentOptions, // 组件标签上的属性
    parent: undefined, // 当前组件的父组件
    componentInstance: undefined, // 组件实例
    key: data === undefined ? undefined : data.key,
  }
}