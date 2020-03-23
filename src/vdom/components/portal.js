import { patch } from '../patch.js'
import { isPortal } from '../helpers/patch/is.js'
import { appendChild } from '../helpers/patch/util.js'
import { commonHooksConfig } from '../helpers/component.js'

// children 在 h 函数被包装成一个数组，所以取第一个
function abtainPortalInfo(vnode) {
  return [vnode.tag.containerInfo, vnode.children[0]]
}

class PortalComponent {
  constructor(vnode) {
    this.vnode = vnode
    this.rootVnode = undefined
  }

  render() {
    const [container, updateVnode] = abtainPortalInfo(this.vnode)
    this.rootVnode = patch(this.rootVnode, updateVnode)
    if (!container) {
      throw new Error('Target container is not a DOM element.')
    }
    if (this.rootVnode.elm) {
      appendChild(container, this.rootVnode.elm)
    }
  }

  init() {
    this.render()
  }

  update() {
    this.render()
  }
}

export const portalVNodeHooks = commonHooksConfig({
  init(vnode) {
    if (isPortal(vnode)) {
      vnode.component = new PortalComponent(vnode)
      vnode.component.init()
    }
  },
})
