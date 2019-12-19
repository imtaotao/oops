import classModule from './class.js'
import attributesModule from './attributes.js'
import eventListenersModule from './eventlisteners.js'

const cbs = {}
const hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post']
const modules = [
  classModule,
  attributesModule,
  eventListenersModule,
]

for (let i = 0; i < hooks.length; i++) {
  cbs[hooks[i]] = []
  for (let j = 0; j < modules.length; j++) {
    if (modules[j][hooks[i]] !== undefined) {
      cbs[hooks[i]].push(modules[j][hooks[i]])
    }
  }
}

export default cbs
