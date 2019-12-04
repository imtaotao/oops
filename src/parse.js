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
const PROP_ASSIGN = 3
const PROP_SET = MODE_PROP_SET
const PROP_APPEND = MODE_PROP_APPEND
const isProps = mode => mode >= MODE_PROP_SET

function build (statics) {
  let str = ''
  let propName
  let quote = ''
  let buffer = ''
  let scope = []
  let mode = MODE_TEXT
  scope.parent = null

  // field 判断是否是通过模板插入的值
  const commit = field => {
    // 生成一个字符节点
    if (mode === MODE_TEXT && (field || buffer.trim())) {
      scope.push([CHILD_APPEND, field || buffer])
    } else if (mode === MODE_TAGNAME && (field || buffer)) {
      // 过滤 <>
      scope.push([TAG_SET, field || buffer])
      // 处理 <a/>
      mode = MODE_WHITESPACE
    } else if (mode === MODE_WHITESPACE) {
      if (buffer === '...' && field) {
        // <a ...${{a: 1}}/>
        scope.push([PROP_ASSIGN, field])
      } else if (buffer && !field) {
        // <a p${x}=1 /> 过滤掉这种
        scope.push([PROPS_SET, buffer, true])
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
      str+=char
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
        if (buffer === '--' || char === '>') {
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
      } else if (char === '=') {
        // 处理属性
        mode = MODE_PROP_SET
        propName = buffer
				buffer = ''
      } else if (mode === MODE_SLASH) {
				// 如果为 MODE_SLASH，不需要做其他事情，过滤掉就好
			} else if (char === '/' && (!isProps(mode) || statics[i][j + 1] === '>')) {
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

// For example:
// 	treeify(
//		build'<div href="1${a}" ...${b}><${x} /></div>`,
//		[X, Y, Z]
//	)
// returns:
// 	{
// 		tag: 'div',
//		props: [ { href: ["1", X] },	Y ],
// 		children: [ { tag: Z, props: [], children: [] } ]
// 	}
export function treeify (built, fields) {
  const _treeify = built => {
    let tag = ''
		let currentProps = null
		const props = []
    const children = []

    for (let i = 0; i < built.length; i++) {
      const [mode, name, prop] = built[i]
      // 当是 number 时，就是 field 注入的
      const field = prop === undefined ? name :  prop
      const value = typeof field === 'number' ? fields[field - 1] : field

      if (mode === TAG_SET) {
        tag = value
      } else if (mode === PROP_ASSIGN) {
        props.push(value)
        // 中间隔一个 assign 就新建一个数组
				currentProps = null
      } else if (mode === PROP_SET) {
        if (!currentProps) {
          currentProps = Object.create(null)
          props.push(currentProps)
        }
        currentProps[name] = [value]
      } else if (mode === PROP_APPEND) {
        currentProps[name].push(value)
      } else if (mode === CHILD_RECURSE) {
        children.push(_treeify(value))
      } else if (mode === CHILD_APPEND) {
        children.push(value)
      }
    }
    return { tag, props, children }
  }

  const { children } = _treeify(built)
  return children.length > 1 ? children : children[0]
}

export default function jsx (statics, ...fields) {
  const built = build(statics)
  return treeify(built, fields)
}