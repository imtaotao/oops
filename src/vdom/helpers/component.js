import { isDef, isArray } from '../../shared.js'

export function mergeProps({data, children}, needChildren) {
  const res = needChildren ? { children } : {}
  for (const key in data) {
    if (key !== 'hook') {
      res[key] = data[key]
    }
  }
  return res
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

export function callEffectCallback(create, destroy, effect) {
  if (typeof destroy === 'function') destroy()
  const cleanup = create()
  if (isDef(cleanup) && typeof cleanup !== 'function') {
    throw new Error('An effect function must not return anything besides a function, which is used for clean-up.')
  }
  effect.destroy = cleanup
}

export function updateEffect(effects) {
  for (const key in effects) {
    const { deps, prevDeps, create, destroy } = effects[key]
    // 如果依赖不相等才调用
    if (!equalDeps(deps, prevDeps)) {
      callEffectCallback(create, destroy, effects[key])
    }
  }
}

// 通用的 component vnode hooks
export function commonHooksConfig(cfg) {
  const basicHooks = {
    initBefore(vnode) {
      if (typeof vnode.component.initBefore === 'function') {
        vnode.component.initBefore(vnode)
      }
    },

    prepatch(oldVnode, vnode) {
      // 换成新的 vnode，这样就会有新的 props
      const component = vnode.component = oldVnode.component
      component.vnode = vnode
      if (typeof component.prepatch === 'function') {
        component.prepatch(oldVnode, vnode)
      }
    },

    update(oldVnode, vnode) {
      if (typeof vnode.component.update === 'function') {
        vnode.component.update(oldVnode, vnode)
      }
    },

    postpatch(oldVnode, vnode) {
      if (typeof vnode.component.postpatch === 'function') {
        vnode.component.postpatch(oldVnode, vnode)
      }
    },
  
    remove(vnode, rm) {
      if (typeof vnode.component.remove === 'function') {
        vnode.component.remove(vnode, rm)
      }
    },
  
    destroy(vnode) {
      if (typeof vnode.component.destroy === 'function') {
        vnode.component.destroy(vnode)
      }
    },
  }

  return cfg
    ? Object.assign(basicHooks, cfg)
    : basicHooks
}