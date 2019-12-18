import h from './vdom/h.js'
import jsx from './jsx/index.js'
import memo from './api/memo.js'
import render from './api/render.js'
import useState from './hooks/use-state.js'
import useEffect from './hooks/use-effect.js'
import useContext from './hooks/use-context.js'
import useReducer from './hooks/use-reducer.js'
import createContext from './api/create-context.js'
import { FRAGMENTS_TYPE as Fragment } from './components/fragments.js'

const oops = {
  h,
  jsx,
  memo,
  render,
  Fragment,
  useState,
  useEffect,
  useContext,
  useReducer,
  createContext,
}

export {
  h,
  jsx,
  memo,
  render,
  Fragment,
  useState,
  useEffect,
  useContext,
  useReducer,
  createContext,
  oops as default,
}
