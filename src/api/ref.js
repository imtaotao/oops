import {
  MEMO_TYPE,
  FORWARD_REF_TYPE,
} from './symbols.js'

export function createRef() {
  return Object.seal({ current: null })
}

export function forwardRef(render) {
  if (render != null && render.$$typeof === MEMO_TYPE) {
    throw new Error(
      'forwardRef requires a render function but received a `memo` ' +
        'component. Instead of forwardRef(memo(...)), use ' +
        'memo(forwardRef(...)).'
    )
  } else if (typeof render !== 'function') {
    throw new Error(
      'forwardRef requires a render function but was given ' +
        (render === null ? 'null' : typeof render)
    )
  } else {
    // Do not warn for 0 arguments because it could be due to usage of the 'arguments' object
    if (render.length === 0 || render.length === 2) {
      throw new Error('forwardRef render functions accept exactly two parameters: props and ref. ' +
        (
          render.length === 1
            ? 'Did you forget to use the ref parameter?'
            : 'Any additional parameter will be undefined.'
        )
      )
    }
  }

  return {
    render,
    $$typeof: FORWARD_REF_TYPE,
  }
}