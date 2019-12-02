const MODE_SLASH = 0
const MODE_TEXT = 1
const MODE_WHITESPACE = 2
const MODE_TAGNAME = 3
const MODE_COMMENT = 4
// 与 prop 有关的用大数
const MODE_PROP_SET = 5
const MODE_PROP_APPEND = 6

const CHILD_APPEND = 0
const TAG_SET = 1
const CHILD_RECURSE = 2
const PROPS_ASSIGN = 3
const PROP_SET = MODE_PROP_SET
const PROP_APPEND = MODE_PROP_APPEND

export default function jsx (statics, ...fileds) {
  const built = build(statics)
  return built
}

function build (statics) {
  let quote = ''
  let buffer = ''
  let current = [0]
  let char, propName
  let mode = MODE_TEXT

  const set = type => mode = type
  const is = type => mode === type
  const equal = text => char === text

  // commit buffer
  // field 代表当前是第几个 statics，用于插入得到的值
  const commit = field => {
    console.log(char, mode)
  }

  for (let i = 0, len = statics.length; i < len; i++) {
    const temp = statics[i]
    if (i > 0) {
			if (is(MODE_TEXT)) {
				commit()
			}
			commit(i)
		}

    for (let i = 0, len = temp.length; i < len; i++) {
      char = temp[i]

      if (is(MODE_TEXT)) {
        // 代表进入到一个标签里面
        if (equal('<')) {
          commit()
          current = [current]
          set(MODE_TAGNAME)
        }
      } else if (is(MODE_COMMENT)) {
        // 代表进入到一个注释结点，过滤掉所有的注释内容
        if (buffer === '--' && equal('>')) {
          // 清空所有注释内容，知道遇见最后三个字符为 `-->` 时
          set(MODE_TEXT)
          buffer = ''
        } else {
          // 保留 buffer 为两位，因为要判断是否是 `--`
          buffer = chart + buffer[0]
        }
      } else if (quote) {
        // 处理引号的问题
        if (equal(quote)) {
          // 如果是相同的，就不做处理
          // ""a"" --> "a"
          // "'a'" --> "'a'"
          quote = ''
        } else {
          // 直接在这里 +=，不用跑到 else 分支里面了
          buffer += char
        }
      } else if (equal('"') || equal("'")) {
        // 等到下次循环时，处理
        quote = char
      } else if (equal('>')) {
        // 闭合标签时
        commit()
        set(MODE_TEXT)
      } else if (!mode) {
				// 省内任何内容知道遇见标签结束字符
      } else if (equal('=')) {
        // 发现是 `=` 设置 propName，所以 value 里面不能有 `=`
        set(MODE_PROP_SET)
        propName = buffer
        buffer = ''
      } else if (equal('/')) {
        // 如果不是在 setProp 里面或者 `/` 在 propValue 里面，但是是单标签的情况
        // `/` 算作单标签的结束字符而不算 propValue 里面
        // prop=va/l --> prop: 'va/l'
        // prop=va/l/> --> prop: 'va/l'
        // prop=val/> --> prop: 'val'
        if (mode < MODE_PROP_SET || temp[i + 1] === '>') {
          commit()
          // 如果发生是纯的单标签，代表进入一个新的子模块
          // <div/>
          if (is(MODE_TAGNAME)) {
            // 第一个为 parent
            // 类似于: current = current.parent
            current = current[0]
          }

          const parent = current[0]
          parent.push(current, CHILD_RECURSE)
          current = parent
          set(MODE_SLASH)
        }
      } else if (equal(' ') || equal('\t') || equal('\n') || equal('\r')) {
        // <a disabled>
        commit()
        set(MODE_WHITESPACE)
      } else {
        buffer += char
      }
    }
  }

  commit()

  return current
}