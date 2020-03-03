import { render } from '../../src/index.js'

export function componentThrowErr (cm) {
  return () => {
    try {
      cm.$mount()
    } catch (err) {
      throw new Error('rethrow')
    }
  }
}

export function asyncRender(vnode, app) {
  if (!app) {
    app = document.createElement('div')
  }
  return new Promise(resolve => {
    render(vnode, app, elm => resolve({ parentNode: app }))
  })
}

export function toRender(vnode, callbck, app) {
  if (!app) {
    app = document.createElement('div')
  }
  return render(vnode, app, callbck)
}