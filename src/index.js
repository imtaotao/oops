import { h } from './vdom/h.js'
import { jsx } from './jsx/index.js'
import { memo} from './api/memo.js'
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

// 兼容 react
const createElement = h

const oops = {
  h,
  jsx,
  memo,
  render,
  Children,
  createRef,
  forwardRef,
  createPortal,
  createContext,
  createElement,
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
  render,
  Children,
  createRef,
  forwardRef,
  createPortal,
  createContext,
  createElement,
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
  oops as default,
}
