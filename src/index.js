import h from './vdom/h.js'
import jsx from './jsx/index.js'
import memo from './api/memo.js'
import render from './api/render.js'
import useMemo from './hooks/use-memo.js'
import useState from './hooks/use-state.js'
import useEffect from './hooks/use-effect.js'
import useContext from './hooks/use-context.js'
import useReducer from './hooks/use-reducer.js'
import useCallback from './hooks/use-callback.js'
import { createContext } from './api/context.js'
import { FRAGMENTS_TYPE as Fragment } from './api/types.js'

const oops = {
  h,
  jsx,
  memo,
  render,
  Fragment,
  useMemo,
  useState,
  useEffect,
  useContext,
  useReducer,
  useCallback,
  createContext,
}

export {
  h,
  jsx,
  memo,
  render,
  Fragment,
  useMemo,
  useState,
  useEffect,
  useContext,
  useReducer,
  useCallback,
  createContext,
  oops as default,
}
