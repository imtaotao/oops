import { patch } from '../patch.js'
import { initRefObject } from '../../api/ref.js'
import { isComponent } from '../helpers/patch/is.js'
import { removedInDeps } from '../../api/context.js'
import { formatRootVnode } from '../helpers/patch/util.js'
import { commonHooksConfig } from '../helpers/component.js'
import {
  isVoid,
  isUndef,
} from '../../shared.js'
import {
  equalDeps,
  mergeProps,
  updateEffect,
  cleanEffectDestroy,
  resolveDefaultProps,
  addToProviderUpdateDuplicate,
} from '../helpers/component.js'

const RE_RENDER_LIMIT = 25

// Because the component always returns the vnode at the end,
// there is no need for a queue to hold the relationship between the parent and child components.
export const Target = {
  component: undefined,
}

export class Component {
  constructor(vnode, refOrContext) {
    this.cursor = 0
    this.vnode = vnode // Component tag node
    this.render = vnode.tag
    this.destroyed = false
    this.numberOfReRenders = 0 // Repeat render count
    this.rootVnode = undefined // The root node returned by the component
    this.updateVnode = undefined // New nodes for each render
    this.providerDependencies = [] // Dependent `context`
    this.refOrContext = refOrContext // The `context` or `ref` of the component
    this.refs = Object.create(null)
    this.state = Object.create(null)
    this.memos = Object.create(null)
    this.effects = Object.create(null)
    this.layoutEffects = Object.create(null)
  }

  // adding unrepeat state
  setState(partialState) {
    const key = this.cursor++
    if (key in this.state) {
      return [this.state[key], key]
    }
    this.state[key] = partialState
    return [partialState, key]
  }

  pushEffect(flag, create, deps) {
    let destroy = undefined
    let prevDeps = undefined
    const key = this.cursor++
    const prevEffect = this[flag][key]

    if (prevEffect) {
      destroy = prevEffect.destroy
      prevDeps = prevEffect.deps
    }
    this[flag][key] = { deps, prevDeps, create, destroy }
  }

  useReducer(payload, key, reducer) {
    const newValue = reducer(this.state[key], payload)
    // Not be updated that if the oldValue no equal newValue in `React`,
    // How to deal with it here, to be determined ...
    if (this.state[key] !== newValue) {
      this.state[key] = newValue
      this.forceUpdate()
    }
  }

  useMemo(create, deps) {
    const key = this.cursor++
    const memoized = this.memos[key] || (this.memos[key] = [])

    if (equalDeps(memoized[1], deps)) {
      return memoized[0]
    } else {
      memoized[1] = deps
      return (memoized[0] = create()) 
    }
  }

  useRef(initialValue) {
    const key = this.cursor++
    const current = this.refs[key] || (this.refs[key] = initRefObject(initialValue))
    return current
  }

  useImperativeHandle(ref, create, deps) {
    // After the dom is rendered, assign a value to the current. 
    // Use layoutEffects because this is used in react.
    this.pushEffect(
      'layoutEffects',
      () => {
        if (typeof ref === 'function') {
          const refCallback = ref
          const inst = create()
          refCallback(inst)
          return () => {
            refCallback(null)
          }
        } else if (!isVoid(ref)) {
          const refObject = ref
          if (!refObject.hasOwnProperty('current')) {
            console.error(
              'Expected useImperativeHandle() first argument to either be a ' +
                'ref callback or React.createRef() object. Instead received: %s.',
              'an object with keys {' + Object.keys(refObject).join(', ') + '}',
            )
          }
          const inst = create()
          refObject.current = inst
          return () => {
            refObject.current = null
          }
        }
      },
      !isVoid(deps)
        ? deps.concat([ref])
        : null
      ,
    )
  }

  forceUpdate() {
    if (++this.numberOfReRenders > RE_RENDER_LIMIT) {
      throw new Error(
        'Too many re-renders. ' +
          'Oops limits the number of renders to prevent an infinite loop.'
      )
    }
    try {
      Target.component = this
      const baseProps = mergeProps(this.vnode)
      const resolvedProps = resolveDefaultProps(this.vnode, baseProps)
      const currentVnode = this.render(resolvedProps, this.refOrContext)
      this.updateVnode = formatRootVnode(currentVnode)

      if (isUndef(this.updateVnode)) {
        throw new Error(
          'Nothing was returned from render.' +
            'This usually means a return statement is missing.' +
            'Or, to render nothing, return null.'
        )
      }

      if (this.updateVnode !== null) {
        this.rootVnode = patch(this.rootVnode, this.updateVnode)
        this.rootVnode.parent = this.vnode.parent
        this.vnode.elm = this.rootVnode.elm
        this.updateVnode = undefined
      }
    } finally {
      this.cursor = 0
      this.numberOfReRenders = 0
      Target.component = undefined
      updateEffect('effects', this.effects)
      updateEffect('layoutEffects', this.layoutEffects)
    }
  }

  init() {
    this.forceUpdate()
  }

  // Update current components synchronously
  update(oldVnode, vnode) {
    addToProviderUpdateDuplicate(this)
    this.forceUpdate()
  }

  remove(vnode, remove) {
    remove()
  }

  destroy(vnode) {
    // When the component is destroyed, clear the `destroy` effect
    cleanEffectDestroy('effects', this.effects)
    cleanEffectDestroy('layoutEffects', this.layoutEffects)
    this.destroyed = true
    removedInDeps(this)
  }
}

export const componentVNodeHooks = commonHooksConfig({
  init(vnode) {
    if (isComponent(vnode)) {
      // We use the new version of the context behavior of `react`,
      // so this time the context is set to {}
      vnode.component = new Component(vnode, {})
      vnode.component.init()
    }
  },
})
