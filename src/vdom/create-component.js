class Component {
  constructor(vnode, patch) {
    this.vnode = vnode
    this.patch = patch
  }

  render(parent) {
    
  }
}

const createComponentInstanceForVnode = patch => {
  return function (vnode) {
    vnode.componentInstance = new Component(vnode, patch)
  }
}

export default patch => ({
  create: createComponentInstanceForVnode(patch),
})