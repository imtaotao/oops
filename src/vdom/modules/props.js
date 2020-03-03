function updateProps(oldVnode, vnode) {
  const elm = vnode.elm
  if (elm) {
    let key, cur, old
    let props = vnode.data.props
    let oldProps = oldVnode.data.props
  
    if (!oldProps && !props) return
    if (oldProps === props) return
    props = props || {}
    oldProps = oldProps || {}
  
    for (key in oldProps) {
      if (!props[key]) {
        delete elm[key]
      }
    }
    for (key in props) {
      cur = props[key];
      old = oldProps[key]
      if (old !== cur && (key !== 'value' || elm[key] !== cur)) {
        elm[key] = cur
      }
    }
  }
}

export const propsModule = {
  create: updateProps,
  update: updateProps,
}