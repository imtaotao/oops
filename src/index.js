import { h } from './vdom/h.js'
import { jsx } from './jsx/index.js'
import { memo} from './api/memo.js'
import { render } from './api/render.js'
import { createContext } from './api/context.js'
import { createRef, forwardRef } from './api/ref.js'
import { FRAGMENTS_TYPE as Fragment } from './api/symbols.js'
import {
  map,
  only,
  count,
  forEach,
  toArray,
} from './api/children.js'
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

const Children = {
  map,
  only,
  count,
  forEach,
  toArray,
}

const oops = {
  h,
  jsx,
  memo,
  render,
  Children,
  createRef,
  forwardRef,
  createContext,
  Fragment,
  useRef,
  useMemo,
  useState,
  useEffect,
  useContext,
  useReducer,
  useCallback,
  useLayoutEffect,
  useImperativeHandle,
}

export {
  h,
  jsx,
  memo,
  render,
  Children,
  createRef,
  forwardRef,
  createContext,
  Fragment,
  useRef,
  useMemo,
  useState,
  useEffect,
  useContext,
  useReducer,
  useCallback,
  useLayoutEffect,
  useImperativeHandle,
  oops as default,
}
