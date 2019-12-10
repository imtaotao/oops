import h from './vdom/h.js'
import jsx from './jsx/index.js'
import patch from './vdom/patch.js'
import useState from './hooks/use-state.js'
import useEffect from './hooks/use-effect.js'
import useReducer from './hooks/use-reducer.js'

const oops = {
  h,
  jsx,
  patch,
  useState,
  useEffect,
  useReducer,
}

export {
  h,
  jsx,
  patch,
  useState,
  useEffect,
  useReducer,
  oops as default,
}
