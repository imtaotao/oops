import { h } from './vdom/h.js'
import { jsx } from './jsx/index.js'
import { memo} from './api/memo.js'
import { render } from './api/render.js'
import { createContext } from './api/context.js'
import { FRAGMENTS_TYPE as Fragment } from './api/nodeSymbols.js'
import {
  useMemo,
  useState,
  useEffect,
  useContext,
  useReducer,
  useCallback,
} from './hooks.js'

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
