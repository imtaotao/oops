import { isVnode } from '../vdom/is.js'

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

  // field 判断是否是通过模板插入的值
  const commit = field => {
    // 生成一个字符节点
    if (mode === MODE_TEXT) {
      if (field || (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g, ''))) {
        scope.push([CHILD_APPEND, field || buffer])
      }
    } else if (mode === MODE_TAGNAME) {
      // 过滤 <>
      if (field || buffer) {
        scope.push([TAG_SET, field || buffer])
        // 处理 <a/>
        mode = MODE_WHITESPACE
      }
    } else if (mode === MODE_WHITESPACE) {
      if (buffer === '...' && field) {
        // <a ...${{a: 1}}/>
        scope.push([PROPS_ASSIGN, field])
      } else if (buffer && !field) {
        // <a p${x}=1 /> 过滤掉这种
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
        // <a>d${1}</a>，需要当遇见 ${} 时
        // 前面的 text 需要单独作为一个 child 存储起来，而不是丢掉
        commit()
      }
      commit(i)
    }

    for (let j = 0; j < statics[i].length; j++) {
      const char = statics[i][j]

      if (mode === MODE_TEXT) {
        // 进入到子节点
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
        // 过滤注释
        if (buffer === '--' && char === '>') {
          mode = MODE_TEXT
          buffer = ''
        } else {
          buffer = char + buffer[0]
        }
      } else if (quote) {
        // 过滤引号
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
        // 标签的结束
        commit()
        mode = MODE_TEXT
      } else if (mode === MODE_SLASH) {
        // 如果为 MODE_SLASH，不需要做其他事情，过滤掉就好
        // 而且要在 `char === '='` 之前判断，因为需要处理 `<ab/ba prop=value>`
      } else if (char === '=') {
        // 处理属性
        mode = MODE_PROP_SET
        propName = buffer
        buffer = ''
      }  else if (char === '/' && (!isProps(mode) || statics[i][j + 1] === '>')) {
        // `/` 算作标签的结束字符而不算 propValue 里面
        // prop=va/l --> prop: 'va/l'
        // prop=va/l/> --> prop: 'va/l'
        // prop=val/> --> prop: 'val'
        commit()
        if (mode === MODE_TAGNAME) {
          // 只有 `</` 会进入到这里，<a/ 在 commit 中把 mode 设置为 whitespace 了
          // 在这里还要返回上一级是因为，双标签有两个 `<` 字符，代表在结束标签时，又创建了一个无用的 scope
          // `[Array]`，这个是多余的，里面的 Array 才是当前这个标签的 scope
          // `< /a>` 这种情况不考虑了
          scope = scope.parent
        }
        
        // </ 和 <a/ 都会进入到这里，也就是结束标签
        // 遇见结束标签需要返回上一级
        // 一个标签内的所有内容都是同级，不同的内容根据不同的 type 标识
        // 如果是 recures 则就是子标签
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

      // 处理注释内容
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
      // 转为字符串拼接，`<a id=1${2}`
      args[1][name] += (value + '')
    }	else if (type === CHILD_RECURSE) {
      args.push(
        h.apply(
          null,
          // tag 默认为 '', props 默认为 null
          evaluate(h, value, fields, ['', null]),
        ),
      )
    } else if (type === CHILD_APPEND) {
      // value 此时也有可能是 vnode
      // children 不能使用 `<${children[0]}/>` 这种方式，应该使用 `${children[0]}`
      if (Array.isArray(value)) {
        args.push.apply(args, value)
      } else {
        args.push(value)
      }
    }
  }
  return args
}