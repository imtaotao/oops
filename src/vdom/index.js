export { default as h } from './h.js'
import init from './patch.js'
import attributesModule from './modules/attributes.js'
import componentVNodeModule from './create-component.js'

export default init([
  attributesModule,
  componentVNodeModule,
])