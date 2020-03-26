import { patch } from '../patch.js'
import { isPortal } from '../helpers/patch/is.js'
import * as api from '../helpers/patch/domApi.js'
import { commonHooksConfig } from '../helpers/component.js'
import {
  removeChild,
  insertBefore,
} from '../helpers/patch/util.js'

class PortalComponent {
  constructor(vnode) {
    this.vnode = vnode
    this.container = null
    this.proxyEventCb = null
    this.rootVnode = undefined
  }

  // The `portal` components do not need to merge with `defaultProps`.
  render() {
    const oldContainer = this.container
    const updateVnode = this.vnode.children[0]
    const oldElm = this.rootVnode && this.rootVnode.elm

    this.container = this.vnode.tag.container
    this.rootVnode = patch(this.rootVnode, updateVnode)
    this.rootVnode.parent = this.vnode.parent

    if (!this.container) {
      throw new Error('Target container is not a DOM element.')
    }

    if (this.container !== oldContainer) {
      if (this.rootVnode.elm) {
        insertBefore(this.container, this.rootVnode.elm, null)
      }
      if (oldElm && oldContainer) {
        if (api.contains(oldContainer, oldElm)) {
          removeChild(oldContainer, oldElm)
        }
      }
    } else {
      if (this.rootVnode.elm !== oldElm) {
        if (this.rootVnode.elm) {
          insertBefore(this.container, this.rootVnode.elm, oldElm)
        }
        if (oldElm) {
          removeChild(this.container, oldElm)
        }
      }
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
