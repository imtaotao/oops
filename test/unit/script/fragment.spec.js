import { asyncRender, toRender } from '../util.js'
import { h, jsx, Fragment } from '../../../src/index.js'
import { FRAGMENTS_TYPE } from '../../../src/api/nodeSymbols.js'

function div(children = []) {
  children = children.map(
    c => (typeof c === 'string' ? { text: c } : c),
  )
  return { type: 'div', children, prop: undefined }
}

function span() {
  return { type: 'span', children: [], prop: undefined }
}

function text(t) {
  return { text: t }
}

function getChildren(vnode) {
  const gc = vn => {
    return typeof vn.tag === 'function'
      ? gc(vn.componentInstance.oldRootVnode)
      : vn.children
  }
  const children = gc(vnode)

  return children.map(function check(child) {
    if (child.tag === FRAGMENTS_TYPE) {
      return child.children.map(check)
    }
    if (typeof child.tag === 'function') {
      return check(child.componentInstance.oldRootVnode)
    }
    if (child.tag === 'div'){
      return div()
    }
    if (child.tag === 'span') {
      return span()
    }
    if (child.tag === undefined) {
      return text(child.text)
    }
  }).flat(Infinity)
}

describe('Fragment', () => {
  it('a fragment with one child', async done => {
    let e = await asyncRender(
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
    let e = await asyncRender(
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
    let e = await asyncRender(
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
    let e = await asyncRender(<Fragment />)
    let parent = e.parentNode
    expect(Array.from(parent.childNodes)).toEqual([])
    done()
  })

  it('should render a single child', () => {
    const element = (
      <>
        <span>foo</span>
      </>
    )
    expect(getChildren(toRender(element))).toEqual([span()])
  })
  
  it('should render zero children', () => {
    const element = <Fragment />
    expect(getChildren(toRender(element))).toEqual([])
  })

  it('should render multiple children', () => {
    const element = (
      <>
        hello <span>world</span>
      </>
    )
    expect(getChildren(toRender(element))).toEqual([text('hello '), span()])
  })

  it('should render an iterable', () => {
    const element = (
      <>{new Set([<span key="a">hi</span>, <span key="b">bye</span>])}</>
    )
    expect(getChildren(toRender(element))).toEqual([span(), span()])
  })

  it('should preserve state of children with 1 level nesting', () => {
    const ops = []

    function Stateful() {
      ops.push('Update Stateful')
      return <div>Hello</div>
    }

    function Foo({condition}) {
      return condition ? (
        <Stateful key="a" />
      ) : (
        <>
          <Stateful key="a" />
          <div key="b">World</div>
        </>
      );
    }

    const node1 = toRender(<Foo condition={false} />)

    expect(ops).toEqual(['Update Stateful'])
    expect(getChildren(node1)).toEqual([div(), div()])

    const node2 = toRender(<Foo condition={true} />)

    expect(ops).toEqual(['Update Stateful', 'Update Stateful'])
    expect(getChildren(node2)).toEqual([text('Hello')])
  })

  it('should preserve state between top-level fragments', function() {
    const ops = []

    function Stateful() {
      ops.push('Update Stateful')
      return <div>Hello</div>
    }

    function Foo({condition}) {
      return condition ? (
        <>
          <Stateful />
        </>
      ) : (
        <>
          <Stateful />
        </>
      )
    }

    const node1 = toRender(<Foo condition={false} />)

    expect(ops).toEqual(['Update Stateful'])
    expect(getChildren(node1)).toEqual([div()])

    const node2 = toRender(<Foo condition={true} />)

    expect(ops).toEqual(['Update Stateful', 'Update Stateful'])
    expect(getChildren(node2)).toEqual([div()])
  })

  it('should preserve state of children nested at same level', function() {
    const ops = []

    function Stateful() {
      ops.push('Update Stateful')
      return <div>Hello</div>
    }

    function Foo({condition}) {
      return condition ? (
        <>
          <>
            <>
              <Stateful key="a" />
            </>
          </>
        </>
      ) : (
        <>
          <>
            <>
              <div />
              <Stateful key="a" />
            </>
          </>
        </>
      )
    }

    const node1 = toRender(<Foo condition={false} />)

    expect(ops).toEqual(['Update Stateful'])
    expect(getChildren(node1)).toEqual([div(), div()])

    const node2 = toRender(<Foo condition={true} />)

    expect(ops).toEqual(['Update Stateful', 'Update Stateful'])
    expect(getChildren(node2)).toEqual([div()])
  })

  it('should not preserve state in non-top-level fragment nesting', function() {
    const ops = []

    function Stateful() {
      ops.push('Update Stateful')
      return <div>Hello</div>
    }


    function Foo({condition}) {
      return condition ? (
        <>
          <>
            <Stateful key="a" />
          </>
        </>
      ) : (
        <>
          <Stateful key="a" />
        </>
      )
    }

    const node1 = toRender(<Foo condition={false} />)

    expect(ops).toEqual(['Update Stateful'])
    expect(getChildren(node1)).toEqual([div()])

    const node2 = toRender(<Foo condition={true} />)

    expect(ops).toEqual(['Update Stateful', 'Update Stateful'])
    expect(getChildren(node2)).toEqual([div()])
  })

  it('should not preserve state of children if nested 2 levels without siblings', function() {
    const ops = []

    function Stateful() {
      ops.push('Update Stateful')
      return <div>Hello</div>
    }

    function Foo({condition}) {
      return condition ? (
        <Stateful key="a" />
      ) : (
        <>
          <>
            <Stateful key="a" />
          </>
        </>
      )
    }
    const node1 = toRender(<Foo condition={false} />)

    expect(ops).toEqual(['Update Stateful'])
    expect(getChildren(node1)).toEqual([div()])

    const node2 = toRender(<Foo condition={true} />)

    expect(ops).toEqual(['Update Stateful', 'Update Stateful'])
    expect(getChildren(node2)).toEqual([text('Hello')])
  })

  it('should not preserve state of children if nested 2 levels with siblings', function() {
    const ops = []

    function Stateful() {
      ops.push('Update Stateful')
      return <div>Hello</div>
    }

    function Foo({condition}) {
      return condition ? (
        <Stateful key="a" />
      ) : (
        <>
          <>
            <Stateful key="a" />
          </>
          <div />
        </>
      )
    }

    const node1 = toRender(<Foo condition={false} />)

    expect(ops).toEqual(['Update Stateful'])
    expect(getChildren(node1)).toEqual([div(), div()])

    const node2 = toRender(<Foo condition={true} />)

    expect(ops).toEqual(['Update Stateful', 'Update Stateful'])
    expect(getChildren(node2)).toEqual([text('Hello')])
  })

  it('should preserve state between array nested in fragment and fragment', function() {
    const ops = []

    function Stateful() {
      ops.push('Update Stateful')
      return <div>Hello</div>
    }

    function Foo({condition}) {
      return condition ? (
        <>
          <Stateful key="a" />
        </>
      ) : (
        <>{[<Stateful key="a" />]}</>
      )
    }

    const node1 = toRender(<Foo condition={false} />)

    expect(ops).toEqual(['Update Stateful'])
    expect(getChildren(node1)).toEqual([div()])

    const node2 = toRender(<Foo condition={true} />)

    expect(ops).toEqual(['Update Stateful', 'Update Stateful'])
    expect(getChildren(node2)).toEqual([div()])
  })

  it('should preserve state between top level fragment and array', function() {
    const ops = []

    function Stateful() {
      ops.push('Update Stateful')
      return <div>Hello</div>
    }

    function Foo({condition}) {
      return condition ? (
        [<Stateful key="a" />]
      ) : (
        <>
          <Stateful key="a" />
        </>
      )
    }

    const node1 = toRender(<Foo condition={false} />)

    expect(ops).toEqual(['Update Stateful'])
    expect(getChildren(node1)).toEqual([div()])

    const node2 = toRender(<Foo condition={true} />)

    expect(ops).toEqual(['Update Stateful', 'Update Stateful'])
    expect(getChildren(node2)).toEqual([div()])
  })
})