import { asyncRender } from '../util.js'
import { jsx } from '../../../src/index.js'

describe('Fragment', () => {
  it('a fragment with one child', async done => {
    const e = await asyncRender(jsx`
      <>
        <div>text1</div>
      </>
    `)
    const parent = e.parentNode
    expect(parent.childNodes[0].tagName).toBe('DIV')
    done()
  })
})