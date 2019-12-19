function updateClass(oldVnode, vnode) {
  const elm = vnode.elm
  if (elm) {
    let oldClass = oldVnode.data.class
    let klass = vnode.data.class

    if (!oldClass && !klass) return
    if (oldClass === klass) return
    oldClass = oldClass || {}
    klass = klass || {}

    for (const name in oldClass) {
      if (!klass[name]) {
        vnode.elm.classList.remove(name)
      }
    }
    for (const name in klass) {
      const cur = klass[name]
      if (cur !== oldClass[name]) {
        vnode.elm.classList[cur ? 'add' : 'remove'](name)
      }
    }
  }
}

export default { create: updateClass, update: updateClass }
