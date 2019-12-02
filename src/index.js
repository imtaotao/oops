const MODE_SLASH = 0;
const MODE_TEXT = 1;
const MODE_WHITESPACE = 2;
const MODE_TAGNAME = 3;
const MODE_COMMENT = 4;
const MODE_PROP_SET = 5;
const MODE_PROP_APPEND = 6;

const TAG_SET = 1;
const CHILD_APPEND = 0;
const CHILD_RECURSE = 2;
const PROPS_ASSIGN = 3;
const PROP_SET = MODE_PROP_SET;
const PROP_APPEND = MODE_PROP_APPEND;

// Turn a result of a build(...) call into a tree that is more
// convenient to analyze and transform (e.g. Babel plugins).
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
export const treeify = (built, fields) => {
	const _treeify = built => {
		let tag = '';
		let currentProps = null;
		const props = [];
		const children = [];

		for (let i = 1; i < built.length; i++) {
			const field = built[i++];
			const value = typeof field === 'number' ? fields[field - 1] : field;

			if (built[i] === TAG_SET) {
				tag = value;
			}
			else if (built[i] === PROPS_ASSIGN) {
				props.push(value);
				currentProps = null;
			}
			else if (built[i] === PROP_SET) {
				if (!currentProps) {
					currentProps = Object.create(null);
					props.push(currentProps);
				}
				currentProps[built[++i]] = [value];
			}
			else if (built[i] === PROP_APPEND) {
				currentProps[built[++i]].push(value);
			}
			else if (built[i] === CHILD_RECURSE) {
				children.push(_treeify(value));
			}
			else if (built[i] === CHILD_APPEND) {
				children.push(value);
			}
		}

		return { tag, props, children };
	};
  const { children } = _treeify(built);
	return children.length > 1 ? children : children[0];
};

export const build = function(statics) {
	let mode = MODE_TEXT;
	let buffer = '';
	let quote = '';
	let current = [0];
	let char, propName;

	const commit = field => {
		if (mode === MODE_TEXT && (field || (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g,'')))) {
      current.push(field || buffer, CHILD_APPEND);
		}
		else if (mode === MODE_TAGNAME && (field || buffer)) {
      current.push(field || buffer, TAG_SET);
			mode = MODE_WHITESPACE;
		}
		else if (mode === MODE_WHITESPACE && buffer === '...' && field) {
			current.push(field, PROPS_ASSIGN);
		}
		else if (mode === MODE_WHITESPACE && buffer && !field) {
      current.push(true, PROP_SET, buffer);
		}
		else if (mode >= MODE_PROP_SET) {
			if (buffer || (!field && mode === MODE_PROP_SET)) {
        current.push(buffer, mode, propName);
        mode = MODE_PROP_APPEND;
      }
      if (field) {
        current.push(field, mode, propName);
        mode = MODE_PROP_APPEND;
      }
		}

		buffer = '';
	};

	for (let i=0; i<statics.length; i++) {
		if (i) {
      mode === MODE_TEXT
        ? commit()
        : commit(i)
		}

		for (let j=0; j<statics[i].length;j++) {
      char = statics[i][j];

			if (mode === MODE_TEXT) {
				if (char === '<') {
					// commit buffer
					commit();
          current = [current];
					mode = MODE_TAGNAME;
				} else {
					buffer += char;
				}
      }
      // 过滤注释节点
			else if (mode === MODE_COMMENT) {
				// 忽略所有内容，直到最后三个字符为“-”，“-”和“>”
				if (buffer === '--' && char === '>') {
					mode = MODE_TEXT;
					buffer = '';
				}	else {
          buffer = char + buffer[0];
				}
			}
			else if (quote) {
        char === quote
          ? quote = ''
          : buffer += char
			}
			else if (char === '"' || char === "'") {
				quote = char;
			}
			else if (char === '>') {
				commit();
				mode = MODE_TEXT;
			}
			else if (!mode) {
				// Ignore everything until the tag ends
			}
			else if (char === '=') {
				mode = MODE_PROP_SET;
				propName = buffer;
				buffer = '';
      }
      // 单标签的时候，而且没有在属性里面的时候
			else if (char === '/' && (mode < MODE_PROP_SET || statics[i][j+1] === '>')) {
				commit();
				if (mode === MODE_TAGNAME) {
					current = current[0];
				}
				mode = current;
				(current = current[0]).push(mode, CHILD_RECURSE);
				mode = MODE_SLASH;
			}
			else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
				// <a disabled>
				commit();
				mode = MODE_WHITESPACE;
			}
			else {
				buffer += char;
			}

			if (mode === MODE_TAGNAME && buffer === '!--') {
				mode = MODE_COMMENT;
				current = current[0];
			}
		}
	}
	commit();

	return current;
};

export function jsx (statics, ...fileds) {
  const built = build(statics)
  return treeify(built, fileds)
}