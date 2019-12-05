import jsx from './jsx/index.js'
import patch, { h } from './vdom/index.js'

const oops = {
  h,
  jsx,
  patch,
}

export {
  h,
  jsx,
  patch,
  oops as default,
}
