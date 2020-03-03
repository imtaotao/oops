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

  const geml = elm =>
    Array.isArray(elm)
      ? geml(elm[0])
      : elm

  return new Promise(resolve => {
    render(vnode, app, elm => resolve(geml(elm)))
  })
}