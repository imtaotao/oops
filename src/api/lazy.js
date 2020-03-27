import { LAZY_TYPE } from './symbols.js'

// The `ctor` function should return a theable.
export function lazy(ctor) {
  return {
    $$typeof: LAZY_TYPE,
    _ctor: ctor,
    _status: -1,
    _result: null,
    set defaultProps(v) {
      console.warn(
        'Oops.lazy(...): It is not supported to assign `defaultProps` to ' +
          'a lazy component import. Either specify them where the component ' +
          'is defined, or create a wrapping component around it.',
      )
    },
  }
}