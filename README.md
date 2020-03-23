<h1 align="center">
  oops(hooks library)
</h1>

**oops** has built-in jsx parsing function, but you can also compile jsx with babel.

<p align="center">
  <img src="./docs/img/demo.png" width="572" alt="oops demo" />
</p>


## Hooks
The `observedBits` function of `context` is not implemented yet.

### Basic Hooks
+ [x] `useState`
+ [x] `useEffect`
+ [x] `useContext`

### Additional Hooks
+ [x] `useReducer`
+ [x] `useCallback`
+ [x] `useMemo`
+ [x] `useRef`
+ [x] `useLayoutEffect`
+ [x] `useImperativeHandle`
+ [ ] `useTransition`
+ [ ] `useDeferredValue`

## API
+ [x] `h`
+ [x] `jsx`
+ [x] `memo`
+ [x] `render`
+ [x] `createContext`
+ [x] `createRef`
+ [x] `forwardRef`
+ [x] `isValidElement`
+ [ ] `createPortal`
+ [ ] `lazy`
+ `Children`
  + [x] `map`
  + [x] `forEach`
  + [x] `count`
  + [x] `toArray`
  + [x] `only`

## Built-in components
+ [x] `<Fragment/>`
+ [ ] `<Suspense/>`
+ [x] `<Context.Provider/>`
+ [x] `<Context.Consumer/>`

## Notice
  1. Beacase the `React` event system is customized, so, the dom created by the `createPortal` methods allow event propation to parent node in vitualDOM tree. But `oops` uses native event system. our event propation behaviors exist in real dom tree that result we can't achieve the same behavior with the `React`.