export default function jsx (statics, ...fileds) {
  const built = build(statics)
  return built
}

const TEXT = 'text'
const TAGNAME = 'tagname'
const PROPS = 'props'
const PROPS_APPEND = 'props_append'
const COMMENT = 'comment'
const SLASH = 'slash'
const PROP_SET = 'prop_set'
const WHITESPACE = 'whitespace'

function build (statics) {
  let str = ''
  let propName
  let quote = ''
  let buffer = ''
  let mode = TEXT
  let scope = []
  scope.parent = null

  // filed 判断是否是通过模板插入的值
  const commit = filed => {
    // 生成一个字符节点
    if (mode === TEXT) {
      // 过滤空行
      if (filed || buffer.trim()) {
        scope.push(['child_append', filed || buffer])
      }
    } else if (mode === TAGNAME) {
      // 过滤 <>
      if (filed || buffer) {
        scope.push(['tag_set', filed || buffer])
        // 处理 <a/>
        mode = WHITESPACE
      }
    } else if (mode === PROPS) {
      scope.push(['prop_set', propName, filed || buffer])
      mode = PROPS_APPEND
    } else if (mode === WHITESPACE) {
      if (buffer && !filed) {
        // <a p${x}=1 /> 过滤掉这种
        scope.push(['prop_set', buffer, true])
      }
    }
    buffer = ''
  }

  for (let i = 0; i < statics.length; i++) {
    if (i > 0) {
      commit(i)
    }

    for (let j = 0; j < statics[i].length; j++) {
      const char = statics[i][j]
      str += char
      if (mode === TEXT) {
        // 进入到子节点
        if (char === '<') {
          commit()
          const current = []
          current.parent = scope
          scope = current
          mode = TAGNAME
        } else {
          buffer += char
        }
      } else if (mode === COMMENT) {
        // 过滤注释
        if (buffer === '--' || char === '>') {
          mode = TEXT
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
        mode = TEXT
      } else if (char === '=') {
        // 处理属性
        mode = PROPS
        propName = buffer
				buffer = ''
      } else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        // <a disabled>
        commit()
        mode = WHITESPACE
      } else if (char === '/') {
        commit()
        if (mode === TAGNAME) {
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
        scope.push(['child_recurse', mode])
        mode = SLASH
      } else {
        buffer += char
      }

      // 处理注释内容
      if (mode === TAGNAME && buffer === '!--') {
        mode = COMMENT
        scope = scope.parent
      }
    }
  }

  commit()
  return scope
}