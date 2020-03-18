import { patch } from '../patch.js'
import { isArray } from '../../shared.js'
import { isConsumer } from '../helpers/patch/is.js'
import { commonHooksConfig } from '../helpers/component.js'
import { formatPatchRootVnode } from '../helpers/patch/util.js'
import { readContext, removedInDeps } from '../../api/context.js'

class ConsumerComponent {
  constructor(vnode) {
    this.vnode = vnode
    this.destroyed = false
    this.rootVnode = undefined
    this.providerDependencies = []
    this.context = vnode.tag._context
  }

  rewardRender() {
    const render = this.vnode.children[0]
    if (typeof render !== 'function') {
      throw new Error(
        'A context consumer was rendered with multiple children, or a child ' +
          "that isn't a function. A context consumer expects a single child " +
            'that is a function. If you did pass a function, make sure there ' +
              'is no trailing or leading whitespace around it.'
      )
    }
    return render
  }

  render() {
    const value = readContext(this, this.context)
    const updateVnode = formatPatchRootVnode(this.rewardRender()(value))
    if (updateVnode) {
      this.rootVnode = patch(this.rootVnode, updateVnode)
      this.vnode.elm = this.rootVnode.elm
    }
  }

  forceUpdate() {
    this.render()
  }

  update(oldVnode, vnode) {
    const providerDeps = this.providerDependencies
    for (let i = 0; i < providerDeps.length; i++) {
      if (isArray(providerDeps[i].updateDuplicate)) {
        providerDeps[i].updateDuplicate.push(this)
      }
    }
    this.render()
  }

  destroy(vnode) {
    this.destroyed = true
    removedInDeps(vnode.component)
  }
}

export const consumerVNodeHooks = commonHooksConfig({
  init(vnode) {
    if (isConsumer(vnode)) {
      vnode.component = new ConsumerComponent(vnode)
      vnode.component.render()
    }
  }
})
