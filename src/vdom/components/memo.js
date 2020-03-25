import { patch } from '../patch.js'
import { cloneVnode } from '../h.js'
import {
  isMemo,
  isCommonVnode,
} from '../helpers/patch/is.js'
import {
  installHooks,
  separateProps,
} from '../helpers/h.js'
import {
  mergeProps,
  commonHooksConfig,
} from '../helpers/component.js'

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

  transferAndRender() {
    const { tag } = this.memoInfo
    const originTag = this.vnode.tag
    const updateVnode = cloneVnode(this.vnode)

    updateVnode.tag = tag
    updateVnode.originTag = originTag
    updateVnode.isMemoCloned = true
    updateVnode.component = undefined
    updateVnode.data.hook = undefined

    updateVnode.data = isCommonVnode(tag)
      ? separateProps(updateVnode.data)
      : installHooks(tag, updateVnode.data)

    this.rootVnode = patch(this.rootVnode, updateVnode)
    this.rootVnode.parent = this.vnode.parent
    this.vnode.elm = this.rootVnode.elm
  }

  init() {
    const { tag, compare } = this.vnode.tag
    this.memoInfo = { tag, compare }
    this.prevProps = mergeProps(this.vnode)
    this.transferAndRender()
  }

  update(oldVnode, vnode) {
    let { tag, compare } = vnode.tag
    if (compare === null) {
      compare = defaultCompare
    }

    if (typeof compare !== 'function') {
      throw new TypeError('compare is not a function.')
    }

    // 如果不等才需要更新
    const newProps = mergeProps(vnode)
    if (!compare(this.prevProps, newProps)) {
      this.memoInfo = { tag, compare }
      this.vnode = vnode
      this.transferAndRender()
      this.prevProps = newProps
    }
  }
}

export const memoVNodeHooks = commonHooksConfig({
  init(vnode) {
    if (isMemo(vnode)) {
      vnode.component = new MemoComponent(vnode)
      vnode.component.init()
    }
  }
})
