import { patch } from '../patch.js'
import { cloneVnode } from '../h.js'
import { isMemo } from '../helpers/patch/is.js'
import { mergeProps } from '../helpers/component.js'
import { FRAGMENTS_TYPE } from '../../api/symbols.js'
import { separateProps, installHooks } from '../helpers/h.js'

function defaultCompare(oldProps, newProps) {
  const oks = Object.keys(oldProps)
  const nks = Object.keys(newProps)

  if (oks.length !== nks.length) return false
  for (let i = 0; i < oks.length; i++) {
    const key = oks[i]
    if (!(key in newProps)) return false
    if (oldProps[key] !== newProps[key]) return false
  }
  return true
}

class MemoComponent {
  constructor(vnode) {
    this.vnode = vnode
    this.prevProps = {}
    this.memoInfo = null
    this.rootVnode = undefined
  }

  createVnodeAndPatch() {
    const { tag } = this.memoInfo
    const updateVnode = cloneVnode(this.vnode)
    updateVnode.tag = tag
    updateVnode.component = undefined
    updateVnode.data.hook = undefined
    const props = updateVnode.data

    if (typeof tag === 'string' || tag === FRAGMENTS_TYPE) {
      updateVnode.data = separateProps(props)
    } else {
      updateVnode.data = installHooks(tag, props)
    }

    this.rootVnode = patch(this.rootVnode, updateVnode)
    this.vnode.elm = this.rootVnode.elm
  }

  init() {
    const { tag, compare } = this.vnode.tag
    this.memoInfo = { tag, compare }
    this.prevProps = mergeProps(this.vnode, false)
    this.createVnodeAndPatch()
  }

  update(oldVnode, vnode) {
    let { tag, compare } = vnode.tag
    if (compare === null) {
      compare = defaultCompare
    }

    if (typeof compare !== 'function') {
      throw new TypeError('compare is not a function.')
    }

    // children 不应该作为对比的 props 传入
    const newProps = mergeProps(vnode, false)
    // 如果不等才需要更新
    if (!compare(this.prevProps, newProps)) {
      this.memoInfo = { tag, compare }
      this.vnode = vnode
      this.createVnodeAndPatch()
      this.prevProps = newProps
    }
  }
}

export const memoVNodeHooks = {
  init(vnode) {
    if (isMemo(vnode)) {
      vnode.component = new MemoComponent(vnode)
      vnode.component.init()
    }
  },

  prepatch(oldVnode, vnode) {
    const component = vnode.component = oldVnode.component
    component.vnode = vnode
  },

  update(oldVnode, vnode) {
    vnode.component.update(oldVnode, vnode)
  },
}