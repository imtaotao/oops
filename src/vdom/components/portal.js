import { patch } from '../patch.js'
import { isPortal } from '../helpers/patch/is.js'
import { appendChild } from '../helpers/patch/util.js'
import { commonHooksConfig } from '../helpers/component.js'

class PortalComponent {
  constructor(vnode) {
    this.vnode = vnode
    this.rootVnode = undefined
  }

  render() {
    // children 在 h 函数被包装成一个数组，所以取第一个
    const updateVnode = this.vnode.children[0]
    const container = this.vnode.tag.containerInfo

    this.rootVnode = patch(this.rootVnode, updateVnode)
    if (!container) {
      throw new Error('Target container is not a DOM element.')
    }
    // 此处不用给 this.vnode.elm 赋值
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
