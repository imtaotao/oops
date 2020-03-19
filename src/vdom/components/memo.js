import { patch } from '../patch.js'
import { cloneVnode } from '../h.js'
import { isArray } from '../../shared.js'
import { mergeProps } from '../helpers/component.js'
import { commonHooksConfig } from '../helpers/component.js'
import { isMemo, isCommonVnode, isFilterVnode } from '../helpers/patch/is.js'
import { separateProps, installHooks, inspectChildren } from '../helpers/h.js'

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

// 对普通节点的 children 做处理
function dealwithChildren({tag, data, children}) {
  // 由于 memo 组件创建的时候，不会过滤，但是会对 primitive 的值进行包装
  // 所以这里只需要过滤就好
  children = !isArray(children)
    ? children
    : children.filter(child => !isFilterVnode(child))

  if (!children || children.length === 0) {
    if (data.attrs) {
      if (data.attrs.hasOwnProperty('children')) {
        children = data.attrs.children
        if (!isArray(children)) {
          children = [children]
        }
        // 用户自己传入的 children 没有过滤，也没有包装，所以需要走这里检查一遍
        inspectChildren(tag, children)
      }
    }
  }

  delete data.attrs.children
  return children
}

class MemoComponent {
  constructor(vnode) {
    this.vnode = vnode
    this.prevProps = {}
    this.memoInfo = null
    this.rootVnode = undefined
  }

  replaceAndRender() {
    const { tag } = this.memoInfo
    const updateVnode = cloneVnode(this.vnode)
    updateVnode.tag = tag
    updateVnode.component = undefined
    updateVnode.data.hook = undefined

    if (isCommonVnode(tag)) {
      updateVnode.data = separateProps(updateVnode.data)
      updateVnode.children = dealwithChildren(updateVnode)
    } else {
      updateVnode.data = installHooks(tag, updateVnode.data)
    }

    this.rootVnode = patch(this.rootVnode, updateVnode)
    this.vnode.elm = this.rootVnode.elm
  }

  init() {
    const { tag, compare } = this.vnode.tag
    this.memoInfo = { tag, compare }
    this.prevProps = mergeProps(this.vnode, false)
    this.replaceAndRender()
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
      this.replaceAndRender()
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
