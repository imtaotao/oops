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
    render(vnode, app, elm => {
      elm = Array.isArray(elm)
        ? elm[0]
        : elm
      resolve(elm)
    })
  })
}