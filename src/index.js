import { h } from './vdom/h.js'
import { memo} from './api/memo.js'
import { lazy } from './api/lazy.js'
import { jsx } from './jsx/index.js'
import { render } from './api/render.js'
import { createContext } from './api/context.js'
import { createPortal } from './api/createPortal.js'
import { isValidElement } from './api/isValidElement.js'
import { FRAGMENTS_TYPE as Fragment } from './api/symbols.js'
import {
  createRef,
  forwardRef,
} from './api/ref.js'
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

const Oops = {
  h,
  jsx,
  memo,
  lazy,
  render,
  Children,
  createRef,
  forwardRef,
  createPortal,
  createContext,
  createElement: h, // Compatible with react
  isValidElement,
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
  lazy,
  render,
  Children,
  createRef,
  forwardRef,
  createPortal,
  createContext,
  h as createElement,
  isValidElement,
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
  Oops as default,
}
