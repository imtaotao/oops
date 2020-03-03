import { asyncRender as render  } from '../util.js'
import { h, jsx, Fragment } from '../../../src/index.js'

describe('Fragment', () => {
  it('a fragment with one child', async done => {
    let e = await render(
      <>
        <div>text1</div>
      </>
    )
    let parent = e.parentNode
    expect(parent.childNodes[0].tagName).toBe('DIV')
    done()
  })

  it('a fragment with several children', async done => {
    let Header = props => {
      return <p>header</p>
    }
    let Footer = props => {
      return (
        <>
          <h2>footer</h2>
          <h3>about</h3>
        </>
      )
    }
    let e = await render(
      <>
        <div>text1</div>
        <span>text2</span>
        <Header />
        <Footer />
      </>,
    )
    let parent = e.parentNode
    expect(parent.childNodes[0].tagName).toBe('DIV')
    expect(parent.childNodes[1].tagName).toBe('SPAN')
    expect(parent.childNodes[2].tagName).toBe('P')
    expect(parent.childNodes[3].tagName).toBe('H2')
    expect(parent.childNodes[4].tagName).toBe('H3')
    done()
  })

  it('a nested fragment', async done => {
    let e = await render(
      <>
        <>
          <div>text1</div>
        </>
        <span>text2</span>
        <>
          <>
            <>
              {null}
              <p />
            </>
            {false}
          </>
        </>
      </>,
    )
    let parent = e.parentNode
    expect(parent.childNodes[0].tagName).toBe('DIV')
    expect(parent.childNodes[1].tagName).toBe('SPAN')
    expect(parent.childNodes[2].tagName).toBe('P')
    done()
  })

  it('an empty fragment', async done => {
    expect(await render(<Fragment />)).toBe(undefined)
    done()
  })

  
})