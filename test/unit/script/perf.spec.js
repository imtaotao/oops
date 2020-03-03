import { genVNodeTree } from '../../../src/jsx/index.js'

const h = (tag, props, ...children) => ({ tag, props, children })
const html = (statics, ...fields) => genVNodeTree(h, statics, fields)

describe('Jsx performance', () => {
	it('creation', () => {
		const results = []
		const Foo = ({ name }) => html`<div class="foo">${name}</div>`
		let count = 0
		function go(count) {
			const statics = [
				'\n<div id=app'+(++count)+' data-loading="true">\n\t<h1>Hello World</h1>\n\t<ul class="items" id=', '>\n\t',
				'\n\t</ul>\n\t\n\t<', ' name="foo" />\n\t<', ' name="other">content<//>\n\n</div>'
			]
			return html(
				statics,
				`id${count}`,
				html`<li data-id="${'i' + count}">${'some text #' + count}</li>`,
				Foo, Foo
			)
		}
		let now = performance.now()
		const start = now
		while ((now = performance.now()) < start+1000) {
			count++
			if (results.push(String(go(count)))===10) results.length = 0
		}
		const elapsed = now - start
		const hz = count / elapsed * 1000
		console.log(`Creation: ${(hz|0).toLocaleString()}/s, average: ${elapsed/count*1000|0}µs`)
		expect(elapsed).toBeGreaterThan(999)
		expect(hz).toBeGreaterThan(1000)
	})

	it('usage', () => {
		const results = []
		const Foo = ({ name }) => html`<div class="foo">${name}</div>`
		let count = 0
		function go(count) {
			return html`
				<div id="app" data-loading="true">
					<h1>Hello World</h1>
					<ul class="items" id=${`id${count}`}>
						${html`<li data-id="${'i' + count}">${'some text #' + count}</li>`}
					</ul>
					<${Foo} name="foo" />
					<${Foo} name="other">content<//>
				</div>
			`
		}
		let now = performance.now()
		const start = now
		while ((now = performance.now()) < start+1000) {
			count++
			if (results.push(String(go(count)))===10) results.length = 0
		}
		const elapsed = now - start
		const hz = count / elapsed * 1000
		console.log(`Usage: ${(hz|0).toLocaleString()}/s, average: ${elapsed/count*1000|0}µs`)
		expect(elapsed).toBeGreaterThan(999)
		expect(hz).toBeGreaterThan(100000)
	})
})