import { patch } from '../patch.js'
import { readContext } from '../../api/context.js'
import { formatPatchRootVnode } from '../helpers/patch/util.js'

class ConsumerComponent {
  constructor(vnode) {
    this.vnode = vnode
    this.rootVnode = undefined
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
    console.log(this.context)
    const updateVnode = formatPatchRootVnode(this.rewardRender()(value))
    if (updateVnode) {
      this.rootVnode = patch(this.rootVnode, updateVnode)
      this.vnode.elm = this.rootVnode.elm
    }
  }
}


export const consumerVNodeHooks = {
  init(vnode) {
    vnode.component = new ConsumerComponent(vnode)
    vnode.component.render()
  },

  prepatch(oldVnode, vnode) {
    const component = vnode.component = oldVnode.component
    component.vnode = vnode
  },

  update(oldVnode, vnode) {
    vnode.component.render()
  },
}
