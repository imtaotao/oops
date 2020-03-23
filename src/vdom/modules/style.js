// Bindig `requestAnimationFrame` like this fixes a bug in IE/Edge. See #360 and #409.
const raf = (typeof window !== 'undefined' && (window.requestAnimationFrame).bind(window)) || setTimeout
const nextFrame = function(fn) {
  raf(function() {
    raf(fn)
  })
}
let reflowForced = false

function setNextFrame(obj, prop, val) {
  nextFrame(function() {
    obj[prop] = val
  })
}

function updateStyle(oldVnode, vnode) {
  let cur, name, elm = vnode.elm,
      oldStyle = oldVnode.data.style,
      style = vnode.data.style

  if (!oldStyle && !style) return
  if (oldStyle === style) return
  
  oldStyle = oldStyle || {}
  style = style || {}

  const oldHasDel = 'delayed' in oldStyle

  for (name in oldStyle) {
    if (!style[name]) {
      if (name[0] === '-' && name[1] === '-') {
        elm.style.removeProperty(name)
      } else {
        elm.style[name] = ''
      }
    }
  }
  for (name in style) {
    cur = style[name]
    if (name === 'delayed' && style.delayed) {
      for (let name2 in style.delayed) {
        cur = style.delayed[name2]
        if (!oldHasDel || cur !== oldStyle.delayed[name2]) {
          setNextFrame(elm.style, name2, cur)
        }
      }
    } else if (name !== 'remove' && cur !== oldStyle[name]) {
      if (name[0] === '-' && name[1] === '-') {
        elm.style.setProperty(name, cur)
      } else {
        elm.style[name] = cur
      }
    }
  }
}

function applyDestroyStyle(vnode) {
  let style, name, elm = vnode.elm, s = vnode.data.style
  if (!s || !(style = s.destroy)) return
  for (name in style) {
    elm.style[name] = style[name]
  }
}

function applyRemoveStyle(vnode, rm) {
  const s = vnode.data.style
  if (!s || !s.remove) {
    rm()
    return
  }

  if(!reflowForced) {
    getComputedStyle(document.body).transform
    reflowForced = true
  }

  let name, elm = vnode.elm, i = 0, compStyle,
      style = s.remove, amount = 0, applied = []

  for (name in style) {
    applied.push(name)
    elm.style[name] = style[name]
  }
  
  compStyle = getComputedStyle(elm)

  const props = compStyle['transition-property'].split(', ')
  for (; i < props.length; ++i) {
    if(applied.indexOf(props[i]) !== -1) amount++
  }

  elm.addEventListener('transitionend', function (ev) {
    if (ev.target === elm) --amount
    if (amount === 0) rm()
  })
}

function forceReflow() {
  reflowForced = false
}

export const styleModule = {
  pre: forceReflow,
  create: updateStyle,
  update: updateStyle,
  destroy: applyDestroyStyle,
  remove: applyRemoveStyle,
}
