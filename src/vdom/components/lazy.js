import { patch } from '../patch.js'
import { isLazy } from '../helpers/patch/is.js'
import { suspenseLinkedList } from './suspense.js'
import { commonHooksConfig } from '../helpers/component.js'
import {
  h,
  createCommentVnode,
} from '../h.js'

const Uninitialized = -1
const Pending = 0
const Resolved = 1
const Rejected = 2

function initializeLazyComponentType(lazyComponent, updateCallback) {
  if (lazyComponent._status === Uninitialized) {
    lazyComponent._status = Pending
    const ctor = lazyComponent._ctor
    const thenable = ctor()
    lazyComponent._result = thenable

    // lazy(() => import('./MyComponent')), should get a module
    thenable.then(
      moduleObject => {
        if (lazyComponent._status === Pending) {
          const defaultExport = moduleObject.default
          if (defaultExport === undefined) {
            throw new Error(
              'lazy: Expected the result of a dynamic import() call. ' +
                `Instead received: ${moduleObject}\n\nYour code should look like: \n  ` +
                "const MyComponent = lazy(() => import('./MyComponent'))",
            )
          }
          lazyComponent._status = Resolved
          lazyComponent._result = defaultExport
          updateCallback()
        }
      },
      error => {
        if (lazyComponent._status === Pending) {
          lazyComponent._status = Rejected
          lazyComponent._result = error
        }
      }
    )
  }
}

class LazyComponent {
  constructor(vnode) {
    this.vnode = vnode
    this.parentSuspense = null
    this.rootVnode = undefined

    initializeLazyComponentType(vnode.tag, () => {
      // Parent suspense forceUpdate
      if (this.parentSuspense) {
        this.parentSuspense.component.forceUpdate()
      }
    })
  }

  render() {
    const lazyComponentCtor = this.vnode.tag
    const isResolved = lazyComponentCtor._status === Resolved

    // If the lazy component aleard resolved, we need render component content
    if (isResolved) {
      this.rootVnode = patch(
        this.rootVnode,
        h(lazyComponentCtor._result, {}, []),
      )
    } else {
      const currentSuspense = suspenseLinkedList.current
      if (currentSuspense !== null) {
        // 给当前 suspense 注入当前的 laze 组件的状态
        currentSuspense.component.lazyChildsStatus.push(isResolved)
        this.parentSuspense = currentSuspense
      }

      // else, used comment node instead it.
      this.rootVnode = patch(
        this.rootVnode,
        createCommentVnode('Oops.lazy', this.vnode.key)
      )
    }
    this.vnode.elm = this.rootVnode.elm
    this.rootVnode.parent = this.vnode.parent
  }

  init() {
    this.render()
  }

  update(oldVnode, vnode) {
    this.render()
  }
}

export const lazyVNodeHooks = commonHooksConfig({
  init(vnode) {
    if (isLazy(vnode)) {
      vnode.component = new LazyComponent(vnode)
      vnode.component.init()
    }
  }
})
