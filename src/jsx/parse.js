import { FRAGMENTS_TYPE } from '../api/symbols.js'

const MODE_SLASH = 0
const MODE_TEXT = 1
const MODE_WHITESPACE = 2
const MODE_TAGNAME = 3
const MODE_COMMENT = 4
const MODE_PROP_SET = 5
const MODE_PROP_APPEND = 6

const TAG_SET = 1
const CHILD_APPEND = 0
const CHILD_RECURSE = 2
const PROPS_ASSIGN = 3
const PROP_SET = MODE_PROP_SET
const PROP_APPEND = MODE_PROP_APPEND
const isProps = mode => mode >= MODE_PROP_SET

export function build(statics) {
  let propName
  let quote = ''
  let buffer = ''
  let scope = []
  let mode = MODE_TEXT
  scope.parent = null

  // The `field` to determine whether the value is inserted through the template.
  const commit = field => {
    // Generate a character node
    if (mode === MODE_TEXT) {
      if (field || (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g, ''))) {
        scope.push([CHILD_APPEND, field || buffer])
      }
    } else if (mode === MODE_TAGNAME) {
      // Filter out <>
      if (field || buffer) {
        scope.push([TAG_SET, field || buffer])
        // Deal with <a/>
        mode = MODE_WHITESPACE
      }
    } else if (mode === MODE_WHITESPACE) {
      if (buffer === '...' && field) {
        // <a ...${{a: 1}}/>
        scope.push([PROPS_ASSIGN, field])
      } else if (buffer && !field) {
        // <a p${x}=1 /> Filter out this
        scope.push([PROP_SET, buffer, true])
      }
    } else if (isProps(mode)) {
      // `<a href="" />` `<a href="a${1}" />` `<a href="a${1}b" />`
      if (buffer || (!field && mode === MODE_PROP_SET)) {
        scope.push([mode, propName, buffer])
        mode = MODE_PROP_APPEND
      }

      if (field) {
        scope.push([mode, propName, field])
        mode = MODE_PROP_APPEND
      }
    }
    buffer = ''
  }

  for (let i = 0; i < statics.length; i++) {
    if (i > 0) {
      if (mode === MODE_TEXT) {
        // <a>d${1}</a>，when meeting ${}
        // The previous `text` needs to be stored separately as a child, not lost.
        commit()
      }
      commit(i)
    }

    for (let j = 0; j < statics[i].length; j++) {
      const char = statics[i][j]

      if (mode === MODE_TEXT) {
        // Into child nodes
        if (char === '<') {
          commit()
          const current = []
          current.parent = scope
          scope = current
          mode = MODE_TAGNAME
        } else {
          buffer += char
        }
      } else if (mode === MODE_COMMENT) {
        // Filter out comments
        if (buffer === '--' && char === '>') {
          mode = MODE_TEXT
          buffer = ''
        } else {
          buffer = char + buffer[0]
        }
      } else if (quote) {
        // Filter out quotes
        // ""a"" --> "a"
        // "'a'" --> "'a'"
        if (char === quote) {
          quote = ''
        } else {
          buffer += char
        }
      } else if (char === '"' || char === "'") {
        quote = char
      } else if (char === '>') {
        // End of tag
        commit()
        mode = MODE_TEXT
      } else if (mode === MODE_SLASH) {
        // If it is `MODE_SLASH`, there is no need to do anything else,just filter it out,
        // and have to judge before `char === '='`,
        // because need to deal with `<ab / ba prop = value>`.
      } else if (char === '=') {
        // 处理属性
        mode = MODE_PROP_SET
        propName = buffer
        buffer = ''
      }  else if (char === '/' && (!isProps(mode) || statics[i][j + 1] === '>')) {
        // `/` is counted as the end character of the tag and not in propValue
        // prop=va/l --> prop: 'va/l'
        // prop=va/l/> --> prop: 'va/l'
        // prop=val/> --> prop: 'val'
        commit()
        if (mode === MODE_TAGNAME) {
          // 1) Only `</` will enter here, `<a/` set mode to whitespace in the `commit` phase
          // 2) Here we want to return to the previous level because the double tag has two `<` characters,
          // which means that at the end of the tag, a useless `scope` is created.
          // 3) `[Array]` is redundant, the Array inside is the scope of the current tag.
          // 4) `< /a>` This situation is not considered.
          scope = scope.parent
        }
        
        // 1) Both `</` and `<a/` will into here, which is the end tag.
        // 2) Meet the end tag and return to the previous level.
        // 3) All content in a tag is the same level, different content is identified according to different `type`.
        // 4) If it is `recures` then it is a subtag.
        mode = scope
        scope = scope.parent
        scope.push([CHILD_RECURSE, mode])
        mode = MODE_SLASH
      } else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        // <a disabled>
        commit()
        mode = MODE_WHITESPACE
      } else {
        buffer += char
      }

      // Deal with comment content
      if (mode === MODE_TAGNAME && buffer === '!--') {
        mode = MODE_COMMENT
        scope = scope.parent
      }
    }
  }

  commit()
  return scope
}

export function evaluate(h, built, fields, args) {
  for (let i = 0; i < built.length; i++) {
    const [type, name, prop] = built[i]
    const field = prop === undefined ? name :  prop
    const value = typeof field === 'number' ? fields[field - 1] : field
  
    if (type === TAG_SET) {
      args[0] = value
    } else if (type === PROPS_ASSIGN) {
      args[1] = Object.assign(args[1] || {}, value)
    }	else if (type === PROP_SET) {
      (args[1] = args[1] || {})[name] = value
    } else if (type === PROP_APPEND) {
      // Into string concatenation, `<a id=1${2}`
      args[1][name] += (value + '')
    }	else if (type === CHILD_RECURSE) {
      args.push(
        h.apply(
          null,
          // Tag defaults to `fragment`, props defaults to `null`
          evaluate(h, value, fields, [FRAGMENTS_TYPE, null]),
        ),
      )
    } else if (type === CHILD_APPEND) {
      // Value may also be vnode at this time.
      // Children cannot use `<$ {children [0]} />` this way, they should use `$ {children [0]}`
      args.push(value)
    }
  }
  return args
}
