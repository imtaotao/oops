class Component {
  constructor(vnode, patch) {
    this.vnode = vnode
    this.patch = patch
  }

  render(parent) {
    console.log(parent)
  }
}

const createComponentInstanceForVnode = patch => {
  return function (vnode, parent) {
    vnode.componentInstance = new Component(vnode, patch)
    vnode.componentInstance.render(parent)
  }
}

export default patch => ({
  create: createComponentInstanceForVnode(patch),
})