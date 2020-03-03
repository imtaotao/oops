/*!
 * oops.js v0.0.1
 * (c) 2019-2020 Imtaotao
 * Released under the MIT License.
 */
const isArray = Array.isArray;
function isDef(v) {
  return v !== undefined
}
function isUndef(v) {
  return v === undefined
}

function updateClass(oldVnode, vnode) {
  const elm = vnode.elm;
  if (elm) {
    let oldClass = oldVnode.data.class;
    let klass = vnode.data.class;
    if (!oldClass && !klass) return
    if (oldClass === klass) return
    oldClass = oldClass || {};
    klass = klass || {};
    for (const name in oldClass) {
      if (!klass[name]) {
        vnode.elm.classList.remove(name);
      }
    }
    for (const name in klass) {
      const cur = klass[name];
      if (cur !== oldClass[name]) {
        vnode.elm.classList[cur ? 'add' : 'remove'](name);
      }
    }
  }
}
const classModule = {
  create: updateClass,
  update: updateClass,
};

function updateProps(oldVnode, vnode) {
  const elm = vnode.elm;
  if (elm) {
    let key, cur, old;
    let props = vnode.data.props;
    let oldProps = oldVnode.data.props;
    if (!oldProps && !props) return
    if (oldProps === props) return
    props = props || {};
    oldProps = oldProps || {};
    for (key in oldProps) {
      if (!props[key]) {
        delete elm[key];
      }
    }
    for (key in props) {
      cur = props[key];
      old = oldProps[key];
      if (old !== cur && (key !== 'value' || elm[key] !== cur)) {
        elm[key] = cur;
      }
    }
  }
}
const propsModule = {
  create: updateProps,
  update: updateProps,
};

const raf = (typeof window !== 'undefined' && (window.requestAnimationFrame).bind(window)) || setTimeout;
const nextFrame = function(fn) {
  raf(function() {
    raf(fn);
  });
};
var reflowForced = false;
function setNextFrame(obj, prop, val) {
  nextFrame(function() {
    obj[prop] = val;
  });
}
function updateStyle(oldVnode, vnode) {
  let cur, name, elm = vnode.elm,
      oldStyle = oldVnode.data.style,
      style = vnode.data.style;
  if (!oldStyle && !style) return
  if (oldStyle === style) return
  oldStyle = oldStyle || {};
  style = style || {};
  const oldHasDel = 'delayed' in oldStyle;
  for (name in oldStyle) {
    if (!style[name]) {
      if (name[0] === '-' && name[1] === '-') {
        elm.style.removeProperty(name);
      } else {
        elm.style[name] = '';
      }
    }
  }
  for (name in style) {
    cur = style[name];
    if (name === 'delayed' && style.delayed) {
      for (let name2 in style.delayed) {
        cur = style.delayed[name2];
        if (!oldHasDel || cur !== oldStyle.delayed[name2]) {
          setNextFrame(elm.style, name2, cur);
        }
      }
    } else if (name !== 'remove' && cur !== oldStyle[name]) {
      if (name[0] === '-' && name[1] === '-') {
        elm.style.setProperty(name, cur);
      } else {
        elm.style[name] = cur;
      }
    }
  }
}
function applyDestroyStyle(vnode) {
  let style, name, elm = vnode.elm, s = vnode.data.style;
  if (!s || !(style = s.destroy)) return
  for (name in style) {
    elm.style[name] = style[name];
  }
}
function applyRemoveStyle(vnode, rm) {
  const s = vnode.data.style;
  if (!s || !s.remove) {
    rm();
    return
  }
  if(!reflowForced) {
    getComputedStyle(document.body).transform;
    reflowForced = true;
  }
  let name, elm = vnode.elm, i = 0, compStyle,
      style = s.remove, amount = 0, applied = [];
  for (name in style) {
    applied.push(name);
    elm.style[name] = style[name];
  }
  compStyle = getComputedStyle(elm);
  const props = compStyle['transition-property'].split(', ');
  for (; i < props.length; ++i) {
    if(applied.indexOf(props[i]) !== -1) amount++;
  }
  elm.addEventListener('transitionend', function (ev) {
    if (ev.target === elm) --amount;
    if (amount === 0) rm();
  });
}
function forceReflow() {
  reflowForced = false;
}
const styleModule = {
  pre: forceReflow,
  create: updateStyle,
  update: updateStyle,
  destroy: applyDestroyStyle,
  remove: applyRemoveStyle,
};

const xChar = 120;
const colonChar = 58;
const xlinkNS = 'http://www.w3.org/1999/xlink';
const xmlNS = 'http://www.w3.org/XML/1998/namespace';
function updateAttrs(oldVnode, vnode) {
  const elm = vnode.elm;
  if (elm) {
    let attrs = vnode.data.attrs;
    let oldAttrs = oldVnode.data.attrs;
    if (!oldAttrs && !attrs) return
    if (oldAttrs === attrs) return
    oldAttrs = oldAttrs || {};
    attrs = attrs || {};
    for (const key in attrs) {
      const cur = attrs[key];
      const old = oldAttrs[key];
      if (old !== cur) {
        if (cur === true) {
          elm.setAttribute(key, '');
        } else if (cur === false) {
          elm.removeAttribute(key);
        } else {
          if (key.charCodeAt(0) !== xChar) {
            elm.setAttribute(key, cur);
          } else if (key.charCodeAt(3) === colonChar) {
            elm.setAttributeNS(xmlNS, key, cur);
          } else if (key.charCodeAt(5) === colonChar) {
            elm.setAttributeNS(xlinkNS, key, cur);
          } else {
            elm.setAttribute(key, cur);
          }
        }
      }
    }
    for (const key in oldAttrs) {
      if (!(key in attrs)) {
        elm.removeAttribute(key);
      }
    }
  }
}
const attributesModule = {
  create: updateAttrs,
  update: updateAttrs,
};

function invokeHandler(handler, vnode, event) {
  if (typeof handler === 'function') {
    handler.call(vnode, event, vnode);
  } else if (typeof handler === 'object') {
    if (typeof handler[0] === 'function') {
      if (handler.length === 2) {
        handler[0].call(vnode, handler[1], event, vnode);
      } else {
        const args = handler.slice(1);
        args.push(event);
        args.push(vnode);
        handler[0].apply(vnode, args);
      }
    } else {
      for (var i = 0; i < handler.length; i++) {
        invokeHandler(handler[i], vnode, event);
      }
    }
  }
}
function handleEvent(event, vnode) {
  const name = event.type;
  const on = vnode.data.on;
  if (on && on[name]) {
    invokeHandler(on[name], vnode, event);
  }
}
function createListener() {
  return function handler(event) {
    handleEvent(event, handler.vnode);
  }
}
function updateEventListeners(oldVnode, vnode) {
  const oldElm = oldVnode.elm;
  const oldOn = oldVnode.data.on;
  const oldListener = oldVnode.listener;
  const elm = vnode && vnode.elm;
  const on = vnode && vnode.data.on;
  if (oldOn === on) return
  if (oldElm && oldOn && oldListener) {
    if (!on) {
      for (const name in oldOn) {
        oldElm.removeEventListener(name, oldListener, false);
      }
    } else {
      for (const name in oldOn) {
        if (!on[name]) {
          oldElm.removeEventListener(name, oldListener, false);
        }
      }
    }
  }
  if (on) {
    const listener = vnode.listener = oldVnode.listener || createListener();
    listener.vnode = vnode;
    if (elm && !oldOn) {
      for (const name in on) {
        elm.addEventListener(name, listener, false);
      }
    } else {
      for (const name in on) {
        if (!oldOn[name]) {
          elm.addEventListener(name, listener, false);
        }
      }
    }
  }
}
const eventListenersModule = {
  create: updateEventListeners,
  update: updateEventListeners,
  destroy: updateEventListeners,
};

const cbs = {};
const hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];
const modules = [
  classModule,
  propsModule,
  styleModule,
  attributesModule,
  eventListenersModule,
];
for (let i = 0; i < hooks.length; i++) {
  cbs[hooks[i]] = [];
  for (let j = 0; j < modules.length; j++) {
    if (modules[j][hooks[i]] !== undefined) {
      cbs[hooks[i]].push(modules[j][hooks[i]]);
    }
  }
}

function createElement(tagName) {
  return document.createElement(tagName)
}
function createElementNS(namespaceURI, qualifiedName) {
  return document.createElementNS(namespaceURI, qualifiedName)
}
function createTextNode(text) {
  return document.createTextNode(text)
}
function insertBefore(parentNode, newNode, referenceNode) {
  parentNode.insertBefore(newNode, referenceNode);
}
function removeChild(node, child) {
  node.removeChild(child);
}
function appendChild(node, child) {
  node.appendChild(child);
}
function parentNode(node) {
  return node.parentNode
}
function nextSibling(node) {
  return node.nextSibling
}
function tagName(elm) {
  return elm.tagName
}
function setTextContent(node, text) {
  node.textContent = text;
}

const CONTEXT_TYPE = Symbol.for('oops.context');
const PROVIDER_TYPE = Symbol.for('oops.provider');
const FRAGMENTS_TYPE = Symbol.for('oops.fragments');

const emptyNode = createVnode('', {}, [], undefined, undefined);
function isVnode(vnode) {
  return vnode.tag !== undefined
}
function isComponent(vnode) {
  return typeof vnode.tag === 'function'
}
function sameVnode(a, b) {
  return a.key === b.key && a.tag === b.tag
}
function isFragment(vnode) {
  return vnode && vnode.tag === FRAGMENTS_TYPE
}
function isComponentAndChildIsFragment(vnode) {
  return (
    isComponent(vnode) &&
    isFragment(vnode.componentInstance.oldRootVnode)
  )
}
function isFilterVnode(vnode) {
  return (
    vnode === null ||
    typeof vnode === 'boolean' ||
    typeof vnode === 'undefined'
  )
}
function isPrimitiveVnode(vnode) {
  return (
    typeof vnode === 'string' ||
    typeof vnode === 'number' ||
    typeof vnode === 'symbol'
  )
}

function createKeyToOldIdx(children, beginIdx, endIdx) {
  let map = {}, key, ch;
  for (let i = beginIdx; i <= endIdx; ++i) {
    ch = children[i];
    if (ch != null) {
      key = ch.key;
      if (key !== undefined) map[key] = i;
    }
  }
  return map
}
function emptyNodeAt(elm) {
  const tagName$1 = tagName(elm);
  return createVnode(tagName$1 && tagName$1.toLowerCase(), {}, [], undefined, elm)
}
function findLastElm(elms) {
  const elm = elms[elms.length - 1];
  return isArray(elm)
    ? findLastElm(elm)
    : elm
}
function findFirstElm(elms) {
  const elm = elms[0];
  return isArray(elm)
    ? findFirstElm(elm)
    : elm
}
function nextSibling$1(elm) {
  return (
    nextSibling(isArray(elm) ? findLastElm(elm) : elm)
  )
}
function realVnode(vnode) {
  return isComponentAndChildIsFragment(vnode)
    ? vnode.componentInstance.oldRootVnode
    : vnode
}
function vnodeElm(vnode) {
  vnode = realVnode(vnode);
  return isFragment(vnode)
    ? vnode.children.map(vnodeElm)
    : vnode.elm
}
function createRmCb(childVnode, listeners) {
  const childElm = vnodeElm(childVnode);
  return function remove() {
    if (--listeners === 0) {
      const parent = isArray(childElm)? null : parentNode(childElm);
      removeChild$1(parent, childElm);
    }
  }
}
function appendChild$1(parentElm, child) {
  if (isArray(child)) {
    for (let i = 0; i < child.length; i++) {
      appendChild$1(parentElm, child[i]);
    }
  } else {
    child && appendChild(parentElm, child);
  }
}
function removeChild$1(parentElm, child) {
  if (isArray(child)) {
    for (let i = 0; i < child.length; i++) {
      removeChild$1(parentElm, child[i]);
    }
  } else {
    if (child) {
      if (!parentElm) {
        parentElm = parentNode(child);
      }
      removeChild(parentElm, child);
    }
  }
}
function insertChild(parentElm, child, before) {
  if (isArray(child)) {
    let len = 0;
    child = child.flat(Infinity);
    while(len++ > child.length - 1) {
      insertChild(parentElm, child[len], before);
    }
  } else {
    if (child) {
      if (isArray(before)) {
        before = findFirstElm(before);
      }
      insertBefore(parentElm, child, before);
    }
  }
}
function createElm(vnode, insertedVnodeQueue, parentElm) {
  if (createComponent(vnode, parentElm)) {
    return vnodeElm(vnode)
  }
  const { tag, data, children } = vnode;
  if (isDef(tag)) {
    let elm;
    if (isFragment(vnode)) {
      elm = parentElm;
    } else {
      elm = vnode.elm = isDef(data) && isDef(data.ns)
        ? createElementNS(data.ns, tag)
        : createElement(tag);
    }
    if (isArray(children)) {
      for (let i = 0; i < children.length; i++) {
        const chVNode = children[i];
        if (chVNode != null) {
          appendChild$1(elm, createElm(chVNode, insertedVnodeQueue, elm));
        }
      }
    } else if (isPrimitiveVnode(vnode.text)) {
      appendChild(elm, createTextNode(vnode.text));
    }
    invokeCreateHooks(vnode, insertedVnodeQueue);
  } else {
    vnode.elm = createTextNode(vnode.text);
  }
  return vnodeElm(vnode)
}
function createComponent(vnode, parentElm) {
  let i = vnode.data;
  if (isDef(i)) {
    if (isDef(i = i.hook) && isDef(i = i.init)) {
      i(vnode, parentElm);
    }
    return isDef(vnode.componentInstance)
  }
  return false
}
function invokeCreateHooks(vnode, insertedVnodeQueue) {
  let i;
  for (i = 0; i < cbs.create.length; i++) {
    cbs.create[i](emptyNode, vnode);
  }
  i = vnode.data.hook;
  if (isDef(i)) {
    if (isDef(i.create)) i.create(emptyNode, vnode);
    if (isDef(i.insert)) insertedVnodeQueue.push(vnode);
  }
}
function invokeDestroyHook(vnode) {
  let i, j;
  let data = vnode.data;
  if (isDef(data)) {
    if (isDef(i = data.hook) && isDef(i = i.destroy)) {
      i(vnode);
    }
    for (i = 0; i < cbs.destroy.length; i++) {
      cbs.destroy[i](vnode);
    }
    if (isDef(vnode.children)) {
      for (j = 0; j < vnode.children.length; j++) {
        i = vnode.children[j];
        if (i != null && typeof i !== 'string') {
          invokeDestroyHook(i);
        }
      }
    }
  }
}

function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = vnodes[startIdx];
    if (ch != null) {
      insertChild(parentElm, createElm(ch, insertedVnodeQueue, parentElm), before);
    }
  }
}
function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; startIdx++) {
    let i, rm, listeners;
    let ch = vnodes[startIdx];
    if (ch != null) {
      if (isDef(ch.tag)) {
        invokeDestroyHook(ch);
        listeners = cbs.remove.length + 1;
        rm = createRmCb(ch, listeners);
        for (i = 0; i < cbs.remove.length; ++i) {
          cbs.remove[i](ch, rm);
        }
        if (isDef(i = ch.data) && isDef(i = i.hook) && isDef(i = i.remove)) {
          i(ch, rm);
        } else {
          rm();
        }
      } else {
        removeChild$1(parentElm, ch.elm);
      }
    }
  }
}
function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
  let oldStartIdx = 0, newStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;
  let oldStartVnode = oldCh[0];
  let oldEndVnode = oldCh[oldEndIdx];
  let newEndIdx = newCh.length - 1;
  let newStartVnode = newCh[0];
  let newEndVnode = newCh[newEndIdx];
  let oldKeyToIdx;
  let idxInOld;
  let elmToMove;
  let before;
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (oldStartVnode == null) {
      oldStartVnode = oldCh[++oldStartIdx];
    } else if (oldEndVnode == null) {
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (newStartVnode == null) {
      newStartVnode = newCh[++newStartIdx];
    } else if (newEndVnode == null) {
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue, parentElm);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, parentElm);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue, parentElm);
      insertChild(parentElm, vnodeElm(oldStartVnode), nextSibling$1(vnodeElm(oldEndVnode)));
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue, parentElm);
      insertChild(parentElm, vnodeElm(oldEndVnode), vnodeElm(oldStartVnode));
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      if (oldKeyToIdx === undefined) {
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
      }
      idxInOld = oldKeyToIdx[newStartVnode.key];
      if (isUndef(idxInOld)) {
        insertChild(parentElm, createElm(newStartVnode, insertedVnodeQueue, parentElm), vnodeElm(oldStartVnode));
        newStartVnode = newCh[++newStartIdx];
      } else {
        elmToMove = oldCh[idxInOld];
        if (elmToMove.tag !== newStartVnode.tag) {
          insertChild(parentElm, createElm(newStartVnode, insertedVnodeQueue, parentElm), vnodeElm(oldStartVnode));
        } else {
          patchVnode(elmToMove, newStartVnode, insertedVnodeQueue, parentElm);
          oldCh[idxInOld] = undefined;
          insertChild(parentElm, vnodeElm(elmToMove), vnodeElm(oldStartVnode));
        }
        newStartVnode = newCh[++newStartIdx];
      }
    }
  }
  if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
    if (oldStartIdx > oldEndIdx) {
      before = newCh[newEndIdx+1] == null ? null : vnodeElm(newCh[newEndIdx+1]);
      addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
    } else {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }
  }
}
function patchVnode(oldVnode, vnode, insertedVnodeQueue, parentElm) {
  let i, hook;
  if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
    i(oldVnode, vnode);
  }
  if (oldVnode === vnode) return
  let ch = vnode.children;
  let oldCh = oldVnode.children;
  let elm = vnode.elm = oldVnode.elm;
  if (isDef(vnode.data)) {
    for (i = 0; i < cbs.update.length; ++i) {
      cbs.update[i](oldVnode, vnode, parentElm);
    }
    i = vnode.data.hook;
    if (isDef(i) && isDef(i = i.update)) {
      i(oldVnode, vnode, parentElm);
    }
  }
  if ((isComponent(oldVnode) || isComponent(vnode))) ; else if (isUndef(vnode.text)) {
    if (isFragment(vnode)) {
      elm = parentElm;
    }
    if (isDef(oldCh) && isDef(ch)) {
      if (oldCh !== ch) {
        updateChildren(elm, oldCh, ch, insertedVnodeQueue);
      }
    } else if (isDef(ch)) {
      if (isDef(oldVnode.text)) {
        setTextContent(elm, '');
      }
      addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
    } else if (isDef(oldCh)) {
      removeVnodes(elm, oldCh, 0, oldCh.length - 1);
    } else if (isDef(oldVnode.text)) {
      setTextContent(elm, '');
    }
  } else if (oldVnode.text !== vnode.text) {
    if (isDef(oldCh)) {
      removeVnodes(elm, oldCh, 0, oldCh.length - 1);
    }
    setTextContent(elm, vnode.text);
  }
  if (isDef(hook) && isDef(i = hook.postpatch)) {
    i(oldVnode, vnode);
  }
}
function patch(oldVnode, vnode, parentElm) {
  if (isArray(vnode)) {
    throw new SyntaxError('Aadjacent JSX elements must be wrapped in an enclosing tag. Did you want a JSX fragment <>...</>?')
  }
  const insertedVnodeQueue = [];
  for (let i = 0; i < cbs.pre.length; i++) {
    cbs.pre[i]();
  }
  if (isUndef(oldVnode)) {
    createElm(vnode, insertedVnodeQueue, parentElm);
  } else {
    if (!isVnode(oldVnode)) {
      oldVnode = emptyNodeAt(oldVnode);
    }
    if (sameVnode(oldVnode, vnode)) {
      patchVnode(oldVnode, vnode, insertedVnodeQueue, parentElm);
    } else {
      createElm(vnode, insertedVnodeQueue, parentElm);
      if (parentElm !== null) {
        insertChild(parentElm, vnodeElm(vnode), nextSibling$1(vnodeElm(oldVnode)));
        removeVnodes(parentElm, [oldVnode], 0, 0);
      }
    }
  }
  for (let i = 0; i < insertedVnodeQueue.length; i++) {
    insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
  }
  for (let i = 0; i < cbs.post.length; ++i) {
    cbs.post[i]();
  }
  return vnode
}

function mergeProps({data, children}) {
  const res = { children };
  for (const key in data) {
    if (key !== 'hook') {
      res[key] = data[key];
    }
  }
  return res
}
function enqueueTask(callback) {
  const channel = new MessageChannel();
  channel.port1.onmessage = callback;
  channel.port2.postMessage(undefined);
}
function equalDeps(a, b) {
  if (isArray(a) && isArray(b)) {
    if (a.length === 0 && b.length === 0) return true
    if (a.length !== b.length) return false
    return !b.some((v, i) => v !== a[i])
  }
  return false
}
function callEffectCallback(create, destroy, effect) {
  if (typeof destroy === 'function') destroy();
  const cleanup = create();
  if (isDef(cleanup) && typeof cleanup !== 'function') {
    throw new Error('An effect function must not return anything besides a function, which is used for clean-up.')
  }
  effect.destroy = cleanup;
}
function updateEffect(effects) {
  for (const key in effects) {
    const { deps, prevDeps, create, destroy } = effects[key];
    if (!equalDeps(deps, prevDeps)) {
      callEffectCallback(create, destroy, effects[key]);
    }
  }
}

const RE_RENDER_LIMIT = 25;
const Target = {
  component: undefined,
};
class Component {
  constructor(vnode, parentElm) {
    this.cursor = 0;
    this.preProps = {};
    this.vnode = vnode;
    this.Ctor = vnode.tag;
    this.dependencies = null;
    this.parentElm = parentElm;
    this.numberOfReRenders = 0;
    this.updateVnode = undefined;
    this.oldRootVnode = undefined;
    this.state = Object.create(null);
    this.memos = Object.create(null);
    this.effects = Object.create(null);
  }
  setState(partialState) {
    const key = this.cursor++;
    if (this.state[key]) {
      return [this.state[key], key]
    }
    this.state[key] = partialState;
    return [partialState, key]
  }
  useEffect(create, deps) {
    let destroy = undefined;
    let prevDeps = undefined;
    const key = this.cursor++;
    const prevEffect = this.effects[key];
    if (prevEffect) {
      destroy = prevEffect.destroy;
      prevDeps = prevEffect.deps;
    }
    this.effects[key] = { deps, prevDeps, create, destroy };
  }
  useReducer(payload, key, reducer) {
    const newValue = reducer(this.state[key], payload);
    this.state[key] = newValue;
    this.forceUpdate();
  }
  useMemo(create, deps) {
    const key = this.cursor++;
    const memoized = this.memos[key] || (this.memos[key] = []);
    if (equalDeps(memoized[1], deps)) {
      return memoized[0]
    } else {
      memoized[1] = deps;
      return (memoized[0] = create())
    }
  }
  syncPatch() {
    if (this.updateVnode !== null) {
      this.oldRootVnode = patch(this.oldRootVnode, this.updateVnode, this.parentElm);
      this.vnode.elm = this.oldRootVnode.elm;
      this.updateVnode = undefined;
      enqueueTask(() => {
        updateEffect(this.effects);
      });
    }
  }
  patch() {
    if (!this.updateVnode) {
      enqueueTask(() => {
        if (this.updateVnode !== null) {
          this.oldRootVnode = patch(this.oldRootVnode, this.updateVnode, this.parentElm);
          this.vnode.elm = this.oldRootVnode.elm;
          this.updateVnode = undefined;
          updateEffect(this.effects);
        }
      });
    }
  }
  createVnodeByCtor(isSync) {
    this.numberOfReRenders++;
    this.inspectReRender();
    try {
      if (!isSync) {
        this.patch();
      }
      Target.component = this;
      this.props = mergeProps(this.vnode);
      this.updateVnode = this.Ctor.call(this, this.props);
      if (isUndef(this.updateVnode)) {
        throw new Error(
          'Nothing was returned from render.' +
          'This usually means a return statement is missing.' +
          'Or, to render nothing, return null.'
        )
      }
      if (isArray(this.updateVnode)) {
        this.updateVnode = formatVnode(FRAGMENTS_TYPE, {}, this.updateVnode);
      } else if (isPrimitiveVnode(this.updateVnode)) {
        this.updateVnode = createVnode(undefined, undefined, undefined, vnode, undefined);
      }
      if (isSync) {
        this.syncPatch();
      }
    } finally {
      this.cursor = 0;
      this.updateQueue = 0;
      this.numberOfReRenders = 0;
      Target.component = undefined;
    }
  }
  inspectReRender() {
    if (this.numberOfReRenders > RE_RENDER_LIMIT) {
      throw new Error('Too many re-renders. Oops limits the number of renders to prevent an infinite loop.')
    }
  }
  init() {
    this.createVnodeByCtor(true);
  }
  forceUpdate() {
    this.createVnodeByCtor(false);
  }
  update(oldVnode, vnode, parentElm) {
    this.vnode = vnode;
    this.parentElm = parentElm;
    this.createVnodeByCtor(false);
  }
  postpatch(oldVnode, vnode) {
    if(typeof this.Ctor._componentDidUpdate === 'function') {
      this.Ctor._componentDidUpdate(oldVnode, vnode);
    }
  }
  remove(vnode, rm) {
    rm();
  }
  destroy(vnode) {
    for (const key in this.effects) {
      const { destroy } = this.effects[key];
      if (typeof destroy === 'function') {
        destroy();
      }
    }
  }
}

function createComponentInstanceForVnode(vnode, parentElm) {
  if (isUndef(vnode.componentInstance)) {
    vnode.componentInstance = new Component(vnode, parentElm);
    vnode.componentInstance.init();
  }
}
const componentVNodeHooks = {
  init(vnode, parentElm) {
    if (isComponent(vnode)) {
      createComponentInstanceForVnode(vnode, parentElm);
    }
  },
  prepatch(oldVnode, vnode) {
    const component = vnode.componentInstance = oldVnode.componentInstance;
    component.vnode = vnode;
  },
  update(oldVnode, vnode, parentElm) {
    const component = vnode.componentInstance;
    component.update(oldVnode, vnode, parentElm);
  },
  postpatch(oldVnode, vnode) {
    const component = vnode.componentInstance;
    component.postpatch(oldVnode, vnode);
  },
  remove(vnode, rm) {
    const component = vnode.componentInstance;
    component.remove(vnode, rm);
  },
  destroy(vnode) {
    vnode.componentInstance.destroy(vnode);
  }
};

function cached(fn) {
  const cache = Object.create(null);
  return function wraper(str) {
    const hit = cache[str];
    return hit || (cached[str] = fn(str))
  }
}
const parseClassText = cached(klass => {
  const res = {};
  if (klass.indexOf(' ') > -1) {
    const list = klass.split(' ');
    for (let i = 0; i < list.length; ++i) {
      if (list[i]) {
        res[list[i]] = true;
      }
    }
  } else {
    res[klass] = true;
  }
  return res
});
const parseStyleText = cached(cssText => {
  const res = {};
  const listDelimiter = /;(?![^(]*\))/g;
  const propertyDelimiter = /:(.+)/;
  const items = cssText.split(listDelimiter);
  for (let i = 0; i < items.length; i++) {
    if (items[i]) {
      const tmp = items[i].split(propertyDelimiter);
      if (tmp.length > 1) {
        const name = tmp[0].trim();
        const value = tmp[1].trim();
        if ((name === 'delayed' || name === 'remove') &&
            typeof value === 'string') {
          res[name] = new Function('return ' + value)();
        } else {
          res[name] = value;
        }
      }
    }
  }
  return res
});
function addNS(data, children, tag) {
  data.ns ='http://www.w3.org/2000/svg';
  if (tag !== 'foreignObject' && isDef(children)) {
    for (let i = 0; i < children.length; i++) {
      const childData = children[i].data;
      if (isDef(childData)) {
        addNS(childData, children[i].children, children[i].tag);
      }
    }
  }
}
function isProps(key) {
  return (
    key === 'href' ||
    key === 'value' ||
    key === 'checked' ||
    key === 'disabled'
  )
}
function dealWithDataValue(data, key, value) {
  const assert = name => isUndef(data[name]) && (data[name] = {});
  switch(key) {
    case 'class':
      data.class =
        typeof value === 'string'
          ? parseClassText(value)
          : value;
      break
    case 'style':
      data.style =
        typeof value === 'string'
          ? parseStyleText(value)
          : value;
      break
    case 'hook':
      data.hook = value;
      break
    case 'props':
      assert('props');
      data.props[value[0]] = value[1];
      break
    case 'event':
      assert('on');
      data.on[value[0].slice(2).toLocaleLowerCase()] = value[1];
      break
    case 'singleDataset':
      assert('dataset');
      data.dataset[value[0].slice(5)] = value[1];
      break
    case 'singleAttr':
      assert('attrs');
      data.attrs[value[0]] = value[1];
      break
    case 'on':
    case 'attrs':
    case 'dataset':
      if (typeof value === 'object') {
        data[key] = value;
      }
      break
  }
}
function separateProps(props) {
  const data = {};
  if (props) {
    for (let key in props) {
      let value = props[key];
      if (
        key === 'on' ||
        key === 'attrs' ||
        key === 'class' ||
        key === 'style' ||
        key === 'dataset'
      ) ; else if (key === 'className') {
        key = 'class';
      } else if (isProps(key)) {
        value = [key, value];
        key = 'props';
      } else if (key.startsWith('on')) {
        value = [key, value];
        key = 'event';
      } else if (key.startsWith('data-')) {
        value = [key, value];
        key = 'singleDataset';
      } else {
        value = [key, value];
        key = 'singleAttr';
      }
      dealWithDataValue(data, key, value);
    }
  }
  return data
}
function flatten(array, result = []) {
  for (const value of array) {
    if(
      value !== null &&
      typeof value === 'object' &&
      typeof value[Symbol.iterator] === 'function'
    ) {
      flatten(value, result);
    } else {
      result.push(value);
    }
  }
  return result
}
function installHooks(data) {
  const hook = (data || (data = {})).hook || (data.hook = {});
  for (const name in componentVNodeHooks) {
    hook[name] = componentVNodeHooks[name];
  }
  return data
}
function formatVnode(tag, data, children) {
  if (children.length > 0) {
    for (let i = 0; i < children.length; i++) {
      if (isPrimitiveVnode(children[i])) {
        children[i] = createVnode(undefined, undefined, undefined, children[i], undefined);
      } else if (isFilterVnode(children[i])) {
        children.splice(i, 1);
        i--;
      }
    }
  }
  if (tag === 'svg') {
    addNS(data, children, tag);
  }
  return createVnode(tag, data, children, undefined, undefined)
}

function inspectedElemntType(tag, props, children) {
  if (typeof tag === 'object') {
    switch (tag.$$typeof) {
      case PROVIDER_TYPE:
        if (typeof tag !== 'function') {
          const context = tag._context;
          function ContextProvider({ value, children }) {
            context._contextStack.push(value);
            return createVnode(FRAGMENTS_TYPE, {}, children, undefined, undefined)
          }
          ContextProvider.$$typeof = tag.$$typeof;
          ContextProvider._context = tag._context;
          tag = ContextProvider;
        }
        break
    }
  }
  return { tag, props, children }
}
function createVnode(tag, data, children, text, elm) {
  const componentInstance = undefined;
  const key = data ? data.key : undefined;
  return { tag, data, children, key, elm, text, componentInstance }
}
function h(tag, props, ...children) {
  children = flatten(children);
  if (tag === '') tag = FRAGMENTS_TYPE;
  const {
    tag: _tag,
    props: _props,
    children: _children,
  } = inspectedElemntType(tag, props, children);
  const data =
    typeof _tag === 'string' || _tag === FRAGMENTS_TYPE
      ? separateProps(_props)
      : installHooks(_props);
  return formatVnode(_tag, data, _children)
}

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
const isProps$1 = mode => mode >= MODE_PROP_SET;
function build(statics) {
  let propName;
  let quote = '';
  let buffer = '';
  let scope = [];
  let mode = MODE_TEXT;
  scope.parent = null;
  const commit = field => {
    if (mode === MODE_TEXT) {
      if (field || (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g, ''))) {
        scope.push([CHILD_APPEND, field || buffer]);
      }
    } else if (mode === MODE_TAGNAME) {
      if (field || buffer) {
        scope.push([TAG_SET, field || buffer]);
        mode = MODE_WHITESPACE;
      }
    } else if (mode === MODE_WHITESPACE) {
      if (buffer === '...' && field) {
        scope.push([PROPS_ASSIGN, field]);
      } else if (buffer && !field) {
        scope.push([PROP_SET, buffer, true]);
      }
    } else if (isProps$1(mode)) {
      if (buffer || (!field && mode === MODE_PROP_SET)) {
        scope.push([mode, propName, buffer]);
        mode = MODE_PROP_APPEND;
      }
      if (field) {
        scope.push([mode, propName, field]);
        mode = MODE_PROP_APPEND;
      }
    }
    buffer = '';
  };
  for (let i = 0; i < statics.length; i++) {
    if (i > 0) {
      if (mode === MODE_TEXT) {
        commit();
      }
      commit(i);
    }
    for (let j = 0; j < statics[i].length; j++) {
      const char = statics[i][j];
      if (mode === MODE_TEXT) {
        if (char === '<') {
          commit();
          const current = [];
          current.parent = scope;
          scope = current;
          mode = MODE_TAGNAME;
        } else {
          buffer += char;
        }
      } else if (mode === MODE_COMMENT) {
        if (buffer === '--' && char === '>') {
          mode = MODE_TEXT;
          buffer = '';
        } else {
          buffer = char + buffer[0];
        }
      } else if (quote) {
        if (char === quote) {
          quote = '';
        } else {
          buffer += char;
        }
      } else if (char === '"' || char === "'") {
        quote = char;
      } else if (char === '>') {
        commit();
        mode = MODE_TEXT;
      } else if (mode === MODE_SLASH) ; else if (char === '=') {
        mode = MODE_PROP_SET;
        propName = buffer;
        buffer = '';
      }  else if (char === '/' && (!isProps$1(mode) || statics[i][j + 1] === '>')) {
        commit();
        if (mode === MODE_TAGNAME) {
          scope = scope.parent;
        }
        mode = scope;
        scope = scope.parent;
        scope.push([CHILD_RECURSE, mode]);
        mode = MODE_SLASH;
      } else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        commit();
        mode = MODE_WHITESPACE;
      } else {
        buffer += char;
      }
      if (mode === MODE_TAGNAME && buffer === '!--') {
        mode = MODE_COMMENT;
        scope = scope.parent;
      }
    }
  }
  commit();
  return scope
}
function evaluate(h, built, fields, args) {
  for (let i = 0; i < built.length; i++) {
    const [type, name, prop] = built[i];
    const field = prop === undefined ? name :  prop;
    const value = typeof field === 'number' ? fields[field - 1] : field;
    if (type === TAG_SET) {
      args[0] = value;
    } else if (type === PROPS_ASSIGN) {
      args[1] = Object.assign(args[1] || {}, value);
    }	else if (type === PROP_SET) {
      (args[1] = args[1] || {})[name] = value;
    } else if (type === PROP_APPEND) {
      args[1][name] += (value + '');
    }	else if (type === CHILD_RECURSE) {
      args.push(
        h.apply(
          null,
          evaluate(h, value, fields, ['', null]),
        ),
      );
    } else if (type === CHILD_APPEND) {
      args.push(value);
    }
  }
  return args
}

const CACHE = new Map();
const getCache = statics => {
  let tpl = CACHE.get(statics);
  if (!tpl) {
    CACHE.set(statics, tpl = build(statics));
  }
  return tpl
};
function createVNodeTree(h, statics, fields) {
  const result = evaluate(h, getCache(statics), fields, []);
  return result.length > 1 ? result : result[0]
}
function jsx(statics, ...fields) {
  return createVNodeTree(h, statics, fields)
}

function memo(component, areEqual) {
}

function render(vnode, app, callback) {
  if (!app) {
    throw new Error('Target container is not a DOM element.')
  } else {
    if (typeof vnode === 'function') {
      vnode = h(vnode, undefined);
    } else if (isArray(vnode)) {
      vnode = formatVnode(FRAGMENTS_TYPE, {}, vnode);
    } else if (isPrimitiveVnode(vnode)) {
      vnode = createVnode(undefined, undefined, undefined, vnode, undefined);
    }
    if (isVnode(vnode)) {
      vnode = patch(undefined, vnode, app);
      const elm = vnodeElm(vnode) || null;
      if (!isFragment(vnode) && !isComponentAndChildIsFragment(vnode)) {
        elm && appendChild(app, elm);
      }
      if (typeof callback === 'function') {
        callback(elm);
      }
      return vnode
    } else {
      if (typeof callback === 'function') {
        callback(null);
      }
      return null
    }
  }
}

const MAX_SIGNED_31_BIT_INT = 1073741823;
function readContext(currentlyComponent, context, observedBits) {
  let resolvedObservedBits;
  if (
    typeof observedBits !== 'number' ||
    observedBits === MAX_SIGNED_31_BIT_INT
  ) {
    resolvedObservedBits = MAX_SIGNED_31_BIT_INT;
  } else {
    resolvedObservedBits = observedBits;
  }
  const item = {
    component: currentlyComponent,
    observedBits: resolvedObservedBits,
  };
  if (context._dependencies === null) {
    context._dependencies = [item];
  } else {
    context._dependencies.push(item);
  }
  return context._currentValue
}
class ContextStack {
  constructor(context, defaultValue) {
    this.context = context;
    this.valueStack = [defaultValue];
  }
  push(value) {
    this.valueStack.push(value);
    this.context._currentValue = value;
  }
  pop() {
    this.context._currentValue = this.valueStack.shift();
  }
  reset() {
    const defaultValue = this.valueStack[0];
    this.context._currentValue = defaultValue;
    this.valueStack = [defaultValue];
  }
}
function createContext(defaultValue, calculateChangedBits) {
  if (calculateChangedBits === undefined) {
    calculateChangedBits = null;
  } else {
    if (calculateChangedBits !== null && typeof calculateChangedBits !== 'function') {
      throw new Error('createContext: Expected the optional second argument to be a function.')
    }
  }
  const context = {
    $$typeof: CONTEXT_TYPE,
    _dependencies: null,
    _currentValue: defaultValue,
    _calculateChangedBits: calculateChangedBits,
    Provider: null,
    Consumer: null,
  };
  context.Provider = {
    $$typeof: PROVIDER_TYPE,
    _context: context,
  };
  const Consumer = {
    $$typeof: CONTEXT_TYPE,
    _context: context,
    _calculateChangedBits: context._calculateChangedBits,
  };
  Object.defineProperties(Consumer, {
    Provider: {
      get() {
        console.error(
          'Rendering <Context.Consumer.Provider> is not supported and will be removed in ' +
            'a future major release. Did you mean to render <Context.Provider> instead?',
        );
        return context.Provider
      },
      set(_Provider) {
        context.Provider = _Provider;
      },
    },
    _currentValue: {
      get() {
        return context._currentValue
      },
      set(_currentValue) {
        context._currentValue = _currentValue;
      },
    },
    Consumer: {
      get() {
        console.error(
          false,
          'Rendering <Context.Consumer.Consumer> is not supported and will be removed in ' +
            'a future major release. Did you mean to render <Context.Consumer> instead?',
        );
        return context.Consumer
      },
    },
  });
  context.Consumer = Consumer;
  context._contextStack = new ContextStack(context, defaultValue);
  return context
}

function resolveTargetComponent() {
  if (Target.component === undefined) {
    throw new Error('Invalid hook call. Hooks can only be called inside of the body of a function component.')
  }
  return Target.component
}
function useEffect(effect, deps) {
  const component = resolveTargetComponent();
  return component.useEffect(effect, deps)
}
function useMemo(create, deps) {
  const component = resolveTargetComponent();
  return component.useMemo(create, deps)
}
function useCallback(callback, deps) {
  return useMemo(() => callback, deps)
}
function useContext(context, observedBits) {
  const component = resolveTargetComponent();
  return readContext(component, context, observedBits)
}
function useState(initialState) {
  const update = (oldValue, newValue) => {
    return typeof newValue === 'function'
      ? newValue(oldValue)
      : newValue
  };
  return useReducer(update, initialState)
}
function useReducer(reducer, initialArg, init) {
  const component = resolveTargetComponent();
  const [state, key] = component.setState(
    typeof init === 'function'
      ? init(initialArg)
      : initialArg
  );
  return [state, value => component.useReducer(value, key, reducer)]
}

const oops = {
  h,
  jsx,
  memo,
  render,
  Fragment: FRAGMENTS_TYPE,
  useMemo,
  useState,
  useEffect,
  useContext,
  useReducer,
  useCallback,
  createContext,
};

export default oops;
export { FRAGMENTS_TYPE as Fragment, createContext, h, jsx, memo, render, useCallback, useContext, useEffect, useMemo, useReducer, useState };
