import {
  isDef,
  isArray,
} from '../../shared.js'

// key 和 ref 被内部占用，如果使用需要给出错误警告
function defineSpecialPropsWarningGetter(props, key) {
  Object.defineProperty(props, key, {
    get() {
      console.error(
        `Warning: '${key}' is not a prop. Trying to access it will result ` +
          'in `undefined` being returned. If you need to access the same ' +
          'value within the child component, you should pass it as a different ' +
          'prop. (https://fb.me/react-special-props)',
      )
    },
    configurable: true,
  })
}

export function resolveDefaultProps(vnode, baseProps) {
  const tag = vnode.isMemoCloned
    ? vnode.originTag
    : vnode.tag

  if (tag && tag.defaultProps) {
    const props = Object.assign({}, baseProps)
    const defaultProps = tag.defaultProps
    for (let propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName]
      }
    }
    return props
  }
  return baseProps
}

export function mergeProps({data, children}) {
  const props =  {}
  if (children.length > 0) {
    props.children = children
    if (props.children.length === 1) {
      props.children = props.children[0]
    }
  }

  for (const propName in data) {
    if (propName === 'key' || propName === 'ref') {
      defineSpecialPropsWarningGetter(props, propName)
    } else if (propName !== 'hook') {
      props[propName] = data[propName]
    }
  }
  return props
}

export function nextFrame(callback) {
  setTimeout(() => requestAnimationFrame(callback))
}

export function enqueueTask(callback) {
  const channel = new MessageChannel()
  channel.port1.onmessage = callback
  channel.port2.postMessage(undefined)
}

export function equalDeps(a, b) {
  if (isArray(a) && isArray(b)) {
    if (a.length === 0 && b.length === 0) return true
    if (a.length !== b.length) return false
    return !b.some((v, i) => v !== a[i])
  }
  return false
}

export function callEffectCallback([create, destroy, effect]) {
  if (typeof destroy === 'function') destroy(false)
  const cleanup = create()
  if (isDef(cleanup) && typeof cleanup !== 'function') {
    throw new Error('An effect function must not return anything besides a function, which is used for clean-up.')
  }
  effect.destroy = cleanup
}

export function obtainUpdateList(effects) {
  const effectQueue = []
  for (const key in effects) {
    const { deps, prevDeps, create, destroy } = effects[key]
    // 依赖对比要以同步的方式进行
    if (!equalDeps(deps, prevDeps)) {
      effectQueue.push([create, destroy, effects[key]])
    }
  }
  return () => {
    if (effectQueue.length > 0) {
      for (let i = 0; i < effectQueue.length; i++) {
        callEffectCallback(effectQueue[i])
      }
    }
  }
}

// effect 需要在浏览器绘制时的下一帧触发
// layoutEffect 在 dom 更新后同步执行
export function updateEffect(flag, effects) {
  flag === 'effects'
    ? nextFrame(obtainUpdateList(effects))
    : obtainUpdateList(effects)()
  
}

export function cleanEffectDestroy(flag, effects) {
  const actuator = () => {
    for (const key in effects) {
      const { destroy } = effects[key]
      if (typeof destroy === 'function') destroy(true)
    }
  }
  flag === 'effects'
    ? nextFrame(actuator)
    : actuator()
}

// 加入父级 provider 更新副本
export function addToProviderUpdateDuplicate(consumer) {
  const deps = consumer.providerDependencies
  if (deps && deps.length > 0) {
    for (let i = 0; i < deps.length; i++) {
      // 只有在更新中的 provider.updateDuplicate 才是数组，未更新时为 null
      if (isArray(deps[i].updateDuplicate)) {
        deps[i].updateDuplicate.push(consumer)
      }
    }
  }
}

function callLifetimeMethod(vnode, method) {
  return function() {
    const component = vnode.component
    if (component && typeof component[method] === 'function') {
      component[method].apply(component, arguments)
    }
  }
}

// 通用的 component vnode hooks
export function commonHooksConfig(config) {
  const basicHooks = {
    initBefore(vnode) {
      callLifetimeMethod(vnode, 'initBefore')(vnode)
    },

    update(oldVnode, vnode) {
      // 更新 vnode 和 component 的状态
      vnode.component = oldVnode.component
      vnode.component.vnode = vnode
      callLifetimeMethod(vnode, 'update')(oldVnode, vnode)
    },

    postpatch(oldVnode, vnode) {
      callLifetimeMethod(vnode, 'postpatch')(oldVnode, vnode)
    },
  
    remove(vnode, rm) {
      callLifetimeMethod(vnode, 'remove')(vnode, rm)
    },
  
    destroy(vnode) {
      callLifetimeMethod(vnode, 'destroy')(vnode)
    },
  }

  return config
    ? Object.assign(basicHooks, config)
    : basicHooks
}
