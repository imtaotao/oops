
class Component {
  constructor(ctor, props, vnode) {
    this.ctor = ctor
    this.vnode = vnode
    this.props = props
  }

  render() {
    return this.ctor(this.props)
  }
}

export function createComponentInstanceForVnode(vnode) {
  const Ctor = vnode.tag
  const props = vnode.data.attrs || {}
  return new Component(Ctor, props, vnode)
}

export function componentInit(vnode) {
  vnode.componentInstance = createComponentInstanceForVnode(vnode)
}

export default {}