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
  if (typeof destroy === 'function') destroy()
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

export function updateEffect(effects) {
  // effect 需要在浏览器绘制时的下一帧触发
  nextFrame(obtainUpdateList(effects))
}

export function updateLayoutEffect(effects) {
  // layoutEffect 在 dom 更新后同步执行
  obtainUpdateList(effects)()
}

// 通用的 component vnode hooks
export function commonHooksConfig(config) {
  const basicHooks = {
    initBefore(vnode) {
      const component = vnode.component
      if (component && typeof component.initBefore === 'function') {
        component.initBefore(vnode)
      }
    },

    prepatch(oldVnode, vnode) {
      // 换成新的 vnode，这样就会有新的 props
      const component = vnode.component = oldVnode.component
      if (component) {
        component.vnode = vnode
        if (typeof component.prepatch === 'function') {
          component.prepatch(oldVnode, vnode)
        }
      }
    },

    update(oldVnode, vnode) {
      const component = vnode.component
      if (component && typeof component.update === 'function') {
        component.update(oldVnode, vnode)
      }
    },

    postpatch(oldVnode, vnode) {
      const component = vnode.component
      if (component && typeof component.postpatch === 'function') {
        component.postpatch(oldVnode, vnode)
      }
    },
  
    remove(vnode, rm) {
      const component = vnode.component
      if (component && typeof component.remove === 'function') {
        component.remove(vnode, rm)
      }
    },
  
    destroy(vnode) {
      const component = vnode.component
      if (component && typeof component.destroy === 'function') {
        component.destroy(vnode)
      }
    },
  }

  return config
    ? Object.assign(basicHooks, config)
    : basicHooks
}