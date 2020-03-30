import { isLazy } from '../helpers/patch/is.js'
import { suspenseLinkedList } from './suspense.js'
import { commonHooksConfig } from '../helpers/component.js'

const Uninitialized = -1
const Pending = 0
const Resolved = 1
const Rejected = 2

function initializeLazyComponentType(lazyComponent) {
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

function readLazyComponentType(lazyComponent) {
  initializeLazyComponentType(lazyComponent)
  if (lazyComponent._status !== Resolved) {
    throw lazyComponent._result
  }
  return lazyComponent._result
}

class LazyComponent {
  constructor(vnode) {
    this.vnode = vnode
    initializeLazyComponentType(vnode.tag)
  }

  init() {
    const isResolved = this.vnode.tag._status === Resolved
    const currentSuspense = suspenseLinkedList.current
    if (currentSuspense !== null) {
      currentSuspense.component.lazyChildsStatus.push(isResolved)
    }
    console.log(currentSuspense)
  }

  update(oldVnode, vnode) {
  
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
