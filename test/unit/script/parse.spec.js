import { createVNode } from '../../../src/jsx/index.js'

const h = (tag, props, ...children) => ({ tag, props, children })
const html = (statics, ...fields) => createVNode(h, statics, fields)

describe('JSX', () => {
  it('empty', () => {
    expect(html``).toEqual(undefined)
  })

  it('single named elements', () => {
		expect(html`<div />`).toEqual({ tag: 'div', props: null, children: [] })
		expect(html`<div/>`).toEqual({ tag: 'div', props: null, children: [] })
		expect(html`<span />`).toEqual({ tag: 'span', props: null, children: [] })
  })
  
  it('single dynamic tag name', () => {
		expect(html`<${'foo'} />`).toEqual({ tag: 'foo', props: null, children: [] })
		function Foo () {}
		expect(html`<${Foo} />`).toEqual({ tag: Foo, props: null, children: [] })
  })
  
  it('single boolean prop', () => {
		expect(html`<a disabled />`).toEqual({ tag: 'a', props: { disabled: true }, children: [] })
  })
  
  it('two boolean props', () => {
		expect(html`<a invisible disabled />`).toEqual({ tag: 'a', props: { invisible: true, disabled: true }, children: [] })
  })
  
  it('single prop with empty value', () => {
		expect(html`<a href="" />`).toEqual({ tag: 'a', props: { href: '' }, children: [] })
  })
  
  it('two props with empty values', () => {
		expect(html`<a href="" foo="" />`).toEqual({ tag: 'a', props: { href: '', foo: '' }, children: [] })
  })
  
  it('single prop with empty name', () => {
		expect(html`<a ""="foo" />`).toEqual({ tag: 'a', props: { '': 'foo' }, children: [] })
  })
  
  it('single prop with static value', () => {
		expect(html`<a href="/hello" />`).toEqual({ tag: 'a', props: { href: '/hello' }, children: [] })
  })
  
  it('single prop with static value followed by a single boolean prop', () => {
		expect(html`<a href="/hello" b />`).toEqual({ tag: 'a', props: { href: '/hello', b: true }, children: [] })
	})

	it('two props with static values', () => {
		expect(html`<a href="/hello" target="_blank" />`).toEqual({ tag: 'a', props: { href: '/hello', target: '_blank' }, children: [] })
	})

	it('single prop with dynamic value', () => {
		expect(html`<a href=${'foo'} />`).toEqual({ tag: 'a', props: { href: 'foo' }, children: [] })
	})

	it('slash in the middle of tag name or property name self-closes the element', () => {
		expect(html`<ab/ba prop=value>`).toEqual({ tag: 'ab', props: null, children: [] })
		expect(html`<abba pr/op=value>`).toEqual({ tag: 'abba', props: { pr: true }, children: [] })
	})

	it('slash in a property value does not self-closes the element, unless followed by >', () => {
		expect(html`<abba prop=val/ue><//>`).toEqual({ tag: 'abba', props: { prop: 'val/ue' }, children: [] })
		expect(html`<abba prop=value/>`).toEqual({ tag: 'abba', props: { prop: 'value' }, children: [] })
		expect(html`<abba prop=value/ ><//>`).toEqual({ tag: 'abba', props: { prop: 'value/' }, children: [] })
	})

	it('two props with dynamic values', () => {
		function onClick(e) { }
		expect(html`<a href=${'foo'} onClick=${onClick} />`).toEqual({ tag: 'a', props: { href: 'foo', onClick }, children: [] })
	})

	it('prop with multiple static and dynamic values get concatenated as strings', () => {
		expect(html`<a href="before${'foo'}after" />`).toEqual({ tag: 'a', props: { href: 'beforefooafter' }, children: [] })
		expect(html`<a href=${1}${1} />`).toEqual({ tag: 'a', props: { href: '11' }, children: [] })
		expect(html`<a href=${1}between${1} />`).toEqual({ tag: 'a', props: { href: '1between1' }, children: [] })
		expect(html`<a href=/before/${'foo'}/after />`).toEqual({ tag: 'a', props: { href: '/before/foo/after' }, children: [] })
		expect(html`<a href=/before/${'foo'}/>`).toEqual({ tag: 'a', props: { href: '/before/foo' }, children: [] })
	})

	it('spread props', () => {
		expect(html`<a ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { foo: 'bar' }, children: [] })
		expect(html`<a b ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] })
		expect(html`<a b c ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: true, c: true, foo: 'bar' }, children: [] })
		expect(html`<a ...${{ foo: 'bar' }} b />`).toEqual({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] })
		expect(html`<a b="1" ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: '1', foo: 'bar' }, children: [] })
		expect(html`<a x="1"><b y="2" ...${{ c: 'bar' }}/></a>`).toEqual(h('a', { x: '1' }, h('b', { y: '2', c: 'bar' }) ))
		expect(html`<a b=${2} ...${{ c: 3 }}>d: ${4}</a>`).toEqual(h('a',{ b: 2, c: 3 }, 'd: ', 4))
		expect(html`<a ...${{ c: 'bar' }}><b ...${{ d: 'baz' }}/></a>`).toEqual(h('a', { c: 'bar' }, h('b', { d: 'baz' }) ))
  })

	it('multiple spread props in one element', () => {
		expect(html`<a ...${{ foo: 'bar' }} ...${{ quux: 'baz' }} />`).toEqual({ tag: 'a', props: { foo: 'bar', quux: 'baz' }, children: [] })
	})
  
	it('mixed spread + static props', () => {
		expect(html`<a b ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] })
		expect(html`<a b c ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: true, c: true, foo: 'bar' }, children: [] })
		expect(html`<a ...${{ foo: 'bar' }} b />`).toEqual({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] })
		expect(html`<a ...${{ foo: 'bar' }} b c />`).toEqual({ tag: 'a', props: { b: true, c: true, foo: 'bar' }, children: [] })
	})

	it('closing tag', () => {
		expect(html`<a></a>`).toEqual({ tag: 'a', props: null, children: [] })
		expect(html`<a b></a>`).toEqual({ tag: 'a', props: { b: true }, children: [] })
	})

	it('auto-closing tag', () => {
		expect(html`<a><//>`).toEqual({ tag: 'a', props: null, children: [] })
	})

	it('non-element roots', () => {
		expect(html`foo`).toEqual('foo')
		expect(html`${1}`).toEqual(1)
		expect(html`foo${1}`).toEqual(['foo', 1])
		expect(html`foo${1}bar`).toEqual(['foo', 1, 'bar'])
	})

	it('text child', () => {
		expect(html`<a>foo</a>`).toEqual({ tag: 'a', props: null, children: ['foo'] })
		expect(html`<a>foo bar</a>`).toEqual({ tag: 'a', props: null, children: ['foo bar'] })
		expect(html`<a>foo "<b /></a>`).toEqual({ tag: 'a', props: null, children: ['foo "', { tag: 'b', props: null, children: [] }] })
	})

	it('dynamic child', () => {
		expect(html`<a>${'foo'}</a>`).toEqual({ tag: 'a', props: null, children: ['foo'] })
	})

	it('mixed text + dynamic children', () => {
		expect(html`<a>${'foo'}bar</a>`).toEqual({ tag: 'a', props: null, children: ['foo', 'bar'] })
		expect(html`<a>before${'foo'}after</a>`).toEqual({ tag: 'a', props: null, children: ['before', 'foo', 'after'] })
		expect(html`<a>foo${null}</a>`).toEqual({ tag: 'a', props: null, children: ['foo', null] })
	})

	it('element child', () => {
		expect(html`<a><b /></a>`).toEqual(h('a', null, h('b', null)))
	})

	it('multiple element children', () => {
		expect(html`<a><b /><c /></a>`).toEqual(h('a', null, h('b', null), h('c', null)))
		expect(html`<a x><b y /><c z /></a>`).toEqual(h('a', { x: true }, h('b', { y: true }), h('c', { z: true })))
		expect(html`<a x=1><b y=2 /><c z=3 /></a>`).toEqual(h('a', { x: '1' }, h('b', { y: '2' }), h('c', { z: '3' })))
		expect(html`<a x=${1}><b y=${2} /><c z=${3} /></a>`).toEqual(h('a', { x: 1 }, h('b', { y: 2 }), h('c', { z: 3 })))
	})

	it('mixed typed children', () => {
		expect(html`<a>foo<b /></a>`).toEqual(h('a', null, 'foo', h('b', null)))
		expect(html`<a><b />bar</a>`).toEqual(h('a', null, h('b', null), 'bar'))
		expect(html`<a>before<b />after</a>`).toEqual(h('a', null, 'before', h('b', null), 'after'))
		expect(html`<a>before<b x=1 />after</a>`).toEqual(h('a', null, 'before', h('b', { x: '1' }), 'after'))
		expect(html`
			<a>
				before
				${'foo'}
				<b />
				${'bar'}
				after
			</a>
		`).toEqual(h('a', null, 'before', 'foo', h('b', null), 'bar', 'after'))
	})

	it('hyphens (-) are allowed in attribute names', () => {
		expect(html`<a b-c></a>`).toEqual(h('a', { 'b-c': true }))
	})
	
	it('NUL characters are allowed in attribute values', () => {
		expect(html`<a b="\0"></a>`).toEqual(h('a', { b: '\0' }))
		expect(html`<a b="\0" c=${'foo'}></a>`).toEqual(h('a', { b: '\0', c: 'foo' }))
	})
	
	it('NUL characters are allowed in text', () => {
		expect(html`<a>\0</a>`).toEqual(h('a', null, '\0'))
		expect(html`<a>\0${'foo'}</a>`).toEqual(h('a', null, '\0', 'foo'))
	})
	
	it('cache key should be unique', () => {
		html`<a b="${'foo'}" />`
		expect(html`<a b="\0" />`).toEqual(h('a', { b: '\0' }))
		expect(html`<a>${''}9aaaaaaaaa${''}</a>`).not.toEqual(html`<a>${''}0${''}aaaaaaaaa${''}</a>`)
		expect(html`<a>${''}0${''}aaaaaaaa${''}</a>`).not.toEqual(html`<a>${''}.8aaaaaaaa${''}</a>`)
	})

	it('do not mutate spread variables', () => {
		const obj = {}
		html`<a ...${obj} b="1" />`
		expect(obj).toEqual({})
	})

	it('ignore HTML comments', () => {
		expect(html`<a><!-- Hello, world! --></a>`).toEqual(h('a', null))
		expect(html`<a><!-- Hello,\nworld! --></a>`).toEqual(h('a', null))
		expect(html`<a><!-- ${'Hello, world!'} --></a>`).toEqual(h('a', null))
		expect(html`<a><!--> Hello, world <!--></a>`).toEqual(h('a', null))
	})
})