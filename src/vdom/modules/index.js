import { classModule } from './class.js'
import { propsModule } from './props.js'
import { styleModule } from './style.js'
import { datasetModule } from './dataset.js'
import { attributesModule } from './attributes.js'
import { eventListenersModule } from './eventlisteners.js'
import { bubblesProxyEventModule } from './eventBubblesProxy.js'

export const cbs = {}
const hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post']
const modules = [
  classModule,
  propsModule,
  styleModule,
  datasetModule,
  attributesModule,
  eventListenersModule,
  bubblesProxyEventModule,
]

for (let i = 0; i < hooks.length; i++) {
  cbs[hooks[i]] = []
  for (let j = 0; j < modules.length; j++) {
    if (modules[j][hooks[i]] !== undefined) {
      cbs[hooks[i]].push(modules[j][hooks[i]])
    }
  }
}
