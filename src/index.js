import { h } from './vdom/h.js'
import { jsx } from './jsx/index.js'
import { memo} from './api/memo.js'
import { render } from './api/render.js'
import { createContext } from './api/context.js'
import { FRAGMENTS_TYPE as Fragment } from './api/symbols.js'
import {
  useRef,
  useMemo,
  useState,
  useEffect,
  useContext,
  useReducer,
  useCallback,
  useLayoutEffect,
  useImperativeHandle,
} from './hooks.js'

const oops = {
  h,
  jsx,
  memo,
  render,
  Fragment,
  useRef,
  useMemo,
  useState,
  useEffect,
  useContext,
  useReducer,
  useCallback,
  createContext,
  useLayoutEffect,
  useImperativeHandle,
}

export {
  h,
  jsx,
  memo,
  render,
  Fragment,
  useRef,
  useMemo,
  useState,
  useEffect,
  useContext,
  useReducer,
  useCallback,
  createContext,
  useLayoutEffect,
  useImperativeHandle,
  oops as default,
}
