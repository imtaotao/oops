/*!
 * oops.js v0.0.1
 * (c) 2019-2020 Imtaotao
 * Released under the MIT License.
 */
const MEMO_TYPE = Symbol.for('oops.memo');
const PORTAL_TYPE = Symbol.for('oops.portal');
const CONTEXT_TYPE = Symbol.for('oops.context');
const PROVIDER_TYPE = Symbol.for('oops.provider');
const FRAGMENTS_TYPE = Symbol.for('oops.fragments');
const FORWARD_REF_TYPE = Symbol.for('oops.forwardRef');

const isArray = Array.isArray;
function isDef(v) {
  return v !== undefined
}
function isUndef(v) {
  return v === undefined
}
function isVoid(v) {
  return v === undefined || v === null
}
function isValidElementType(type) {
  return (
    typeof type === 'string' ||
    typeof type === 'function' ||
    type === FRAGMENTS_TYPE ||
    (typeof type === 'object' &&
      type !== null &&
      (type.$$typeof === CONTEXT_TYPE ||
        type.$$typeof === PORTAL_TYPE ||
        type.$$typeof === PROVIDER_TYPE ||
        type.$$typeof === FORWARD_REF_TYPE ||
        type.$$typeof === MEMO_TYPE))
  )
}
function isInsertComponent(type) {
  return (
    typeof type === 'object' &&
      type !== null &&
      (type.$$typeof === CONTEXT_TYPE ||
        type.$$typeof === PORTAL_TYPE ||
        type.$$typeof === PROVIDER_TYPE ||
        type.$$typeof === FORWARD_REF_TYPE ||
        type.$$typeof === MEMO_TYPE)
  )
}
const MAYBE_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
const FAUX_ITERATOR_SYMBOL = '@@iterator';
function getIteratorFn(maybeIterable) {
  if (maybeIterable === null || typeof maybeIterable !== 'object') {
    return null
  }
  const maybeIterator =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable[FAUX_ITERATOR_SYMBOL];
  if (typeof maybeIterator === 'function') {
    return maybeIterator
  }
  return null
}
function hasIterator(maybeIterable) {
  return typeof getIteratorFn(maybeIterable) === 'function'
}

const emptyNode = createVnode('', {}, [], undefined, undefined);
function isVnode(vnode) {
  return vnode.tag !== undefined
}
function isCommonVnode(tag) {
  return typeof tag === 'string' || tag === FRAGMENTS_TYPE
}
function isComponent(vnode) {
  return typeof vnode.tag === 'function'
}
function isPortal(vnode) {
  return (
    typeof vnode.tag === 'object' &&
    vnode.tag.$$typeof === PORTAL_TYPE
  )
}
function isConsumer(vnode) {
  return (
    typeof vnode.tag === 'object' &&
    vnode.tag.$$typeof === CONTEXT_TYPE
  )
}
function isProvider(vnode) {
  return (
    typeof vnode.tag === 'object' &&
    vnode.tag.$$typeof === PROVIDER_TYPE
  )
}
function isMemo(vnode) {
  return (
    typeof vnode.tag === 'object' &&
    vnode.tag.$$typeof === MEMO_TYPE
  )
}
function isFragment(vnode) {
  return vnode.tag === FRAGMENTS_TYPE
}
function isForwardRef(vnode) {
  return (
    typeof vnode.tag === 'object' &&
    vnode.tag.$$typeof === FORWARD_REF_TYPE
  )
}
function sameVnode(a, b) {
  if (a.key === b.key) {
    const ta = typeof a.tag;
    const tb = typeof b.tag;
    return (
      (ta === 'string' || ta === 'undefined' || ta === 'function') ||
      (tb === 'string' || tb === 'undefined' || tb === 'function')
    )
      ? a.tag === b.tag
      : a.tag.$$typeof === b.tag.$$typeof
  }
  return false
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
let reflowForced = false;
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

const CAPS_REGEX = /[A-Z]/g;
function updateDataset(oldVnode, vnode) {
  const elm = vnode.elm;
  if (elm) {
    let key;
    let oldDataset = oldVnode.data.dataset;
    let dataset = vnode.data.dataset;
    if (!oldDataset && !dataset) return
    if (oldDataset === dataset) return
    oldDataset = oldDataset || {};
    dataset = dataset || {};
    const d = elm.dataset;
    for (key in oldDataset) {
      if (!dataset[key]) {
        if (d) {
          if (key in d) {
            delete d[key];
          }
        } else {
          elm.removeAttribute('data-' + key.replace(CAPS_REGEX, '-$&').toLowerCase());
        }
      }
    }
    for (key in dataset) {
      if (oldDataset[key] !== dataset[key]) {
        if (d) {
          d[key] = dataset[key];
        } else {
          elm.setAttribute('data-' + key.replace(CAPS_REGEX, '-$&').toLowerCase(), dataset[key]);
        }
      }
    }
  }
}
const datasetModule = {
  create: updateDataset,
  update: updateDataset,
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
    if (attrs && attrs.hasOwnProperty('ref')) {
      const ref = attrs.ref;
      if (typeof ref === 'function') {
        ref(elm);
      } else if (typeof ref === 'object') {
        if (ref) {
          if (!ref.hasOwnProperty('current')) {
            throw new Error(
              'Unexpected ref object provided for button. ' +
                'Use either a ref-setter function or createRef().'
            )
          } else {
            ref.current = elm;
          }
        }
      }
    }
    if (!oldAttrs && !attrs) return
    if (oldAttrs === attrs) return
    oldAttrs = oldAttrs || {};
    attrs = attrs || {};
    for (const key in attrs) {
      if (key === 'ref' || key === 'key') continue
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
      if (key === 'ref' || key === 'key') continue
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
      for (let i = 0; i < handler.length; i++) {
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

const proxyAttrs = (
  'target,nativeEvent,isCustomized'
).split(',');
const eventMap = (
  'blur,cancel,click,close,contextMenu,copy,cut,auxClick,dblClick,' +
  'dragEnd,dragStart,drop,focus,input,invalid,keyDown,keyPress,keyUp,' +
  'mouseDown,mouseUp,paste,pause,play,pointerCancel,pointerDown,pointerUp,' +
  'rateChange,reset,seeked,submit,touchCancel,touchEnd,touchStart,volumeChange,' +
  'drag,dragEnter,dragExit,dragLeave,dragOver,mouseMove,mouseOut,mouseOver,pointerMove,' +
  'pointerOut,pointerOver,scroll,toggle,touchMove,wheel,abort,animationEnd,animationIteration,' +
  'animationStart,canPlay,canPlayThrough,durationChange,emptied,encrypted,ended,error,gotPointerCapture,' +
  'load,loadedData,loadedMetadata,loadStart,lostPointerCapture,playing,progress,seeking,stalled,suspend,' +
  'timeUpdate,transitionEnd,waiting'
)
.split(',')
.map(key => key.toLocaleLowerCase());
function buildProxyProperties(event, backup) {
  const properties = {};
  for (let i = 0; i < proxyAttrs.length; i++) {
    const key = proxyAttrs[i];
    properties[key] = {
      get() {
        return backup.hasOwnProperty(key)
          ? backup[key]
          : event[key]
      },
      set() {
        console.warn(`Waring: The '${key}' attributes are read-only.`);
      },
    };
  }
  return properties
}
function dispatchEvent(elm, event) {
  const proxyEvent = new Event(event.type);
  const proxyProps = buildProxyProperties(event, {
    nativeEvent: event,
    isCustomized: true,
  });
  Object.defineProperties(proxyEvent, proxyProps);
  elm._isFragmentNode
    ? elm.dispatchEvent(proxyEvent, true)
    : elm.dispatchEvent(proxyEvent);
}
function removeProxyEventListener(container, proxyEventCb) {
  if (container && proxyEventCb) {
    for(let i = 0; i < eventMap.length; i++) {
      container.removeEventListener(eventMap[i], proxyEventCb);
    }
  }
}
function addProxyEventListener(container, vnode) {
  if (!container) return null
  function proxyEventCb(event) {
    const parentElm = vnode.parent && vnode.parent.elm;
    if (parentElm) {
      dispatchEvent(parentElm, event);
    }
  }
  for(let i = 0; i < eventMap.length; i++) {
    container.addEventListener(eventMap[i], proxyEventCb);
  }
  return proxyEventCb
}
function updateEventListener(oldVnode, vnode) {
  if (isPortal(oldVnode) || isPortal(vnode)) {
    const component = vnode.component || oldVnode.component;
    const oldContainer = oldVnode.tag.container;
    const newContainer = vnode.tag.container;
    if (oldContainer !== newContainer) {
      component && removeProxyEventListener(oldContainer, component.proxyEventCb);
      component.proxyEventCb = addProxyEventListener(newContainer, vnode);
    }
  }
}
function removeEventListener(vnode) {
  if (isPortal(vnode)) {
    if (vnode.component) {
      const { container, proxyEventCb } = vnode.component;
      removeProxyEventListener(container, proxyEventCb);
    }
  }
}
const bubblesProxyEventModule = {
  create: updateEventListener,
  update: updateEventListener,
  destroy: removeEventListener,
};

const cbs = {};
const hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];
const modules = [
  classModule,
  propsModule,
  styleModule,
  datasetModule,
  attributesModule,
  eventListenersModule,
  bubblesProxyEventModule,
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
  const node = document.createElement(tagName);
  return node
}
function createElementNS(namespaceURI, qualifiedName) {
  return document.createElementNS(namespaceURI, qualifiedName)
}
function createTextNode(text) {
  return document.createTextNode(text)
}
function createComment(text) {
  return document.createComment(text)
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
function contains(node, child) {
  return node.contains(child)
}
function setTextContent(node, text) {
  node.textContent = text;
}

const classList = [
  'add',
  'remove',
];
const style = [
  'setProperty',
  'removeProperty',
];
const namespaces = [
  'setAttribute',
  'setAttributeNS',
  'removeAttribute',
  'addEventListener',
  'removeEventListener',
];
const empty = () => {
  console.warn('Waring: Cannot operate on fragment element.');
};
const installMethods = (obj, methods) => {
  methods.forEach(name => obj[name] = empty);
};
class FragmentNode {
  constructor() {
    this._children = [];
    this.parentNode = null;
    this._isFragmentNode = true;
    this.style = {};
    this.classList = {};
    installMethods(this, namespaces);
    installMethods(this.style, style);
    installMethods(this.classList, classList);
  }
  get tagName() {
    return FRAGMENTS_TYPE
  }
  get first() {
    return this.nodes[0]
  }
  get last() {
    const nodes = this.nodes;
    return nodes[nodes.length - 1]
  }
  get nextSibling() {
    const last = this.last;
    return last ? nextSibling(last) : null
  }
  get nodes() {
    const ls = [];
    for (let i = 0; i < this._children.length; i++) {
      const node = this._children[i];
      if (node._isFragmentNode) {
        ls.push.apply(ls, node.nodes);
      } else {
        ls.push(node);
      }
    }
    return ls
  }
  realParentNode() {
    return this.parentNode._isFragmentNode
      ? this.parentNode.realParentNode()
      : this.parentNode
  }
  appendChild(child) {
    if (child) {
      if (child._isFragmentNode) {
        child.parentNode = this;
      }
      this._children.push(child);
    }
    if (this.parentNode) {
      if (child._isFragmentNode) {
        child.appendSelfInParent(this.parentNode);
      } else {
        appendChild(this.realParentNode(), child);
      }
    }
  }
  removeChild(child) {
    const index = this._children.indexOf(child);
    if (index > -1) {
      this._children.splice(index, 1);
    }
    if (this.parentNode) {
      if (child._isFragmentNode) {
        child.removeSelfInParent(this.parentNode);
      } else {
        removeChild(this.realParentNode(), child);
      }
    }
  }
  insertBefore(newNode, referenceNode) {
    const referenceIndex = this._children.indexOf(referenceNode);
    if (referenceIndex > -1) {
      this._children.splice(referenceIndex, 0, newNode);
    } else {
      this._children.push(newNode);
    }
    if (this.parentNode) {
      if (newNode._isFragmentNode) {
        newNode.insertBeforeSelfInParent(this.parentNode, referenceNode);
      } else {
        if (referenceNode && referenceNode._isFragmentNode) {
          referenceNode = referenceNode.first;
        }
        insertBefore(this.realParentNode(), newNode, referenceNode);
      }
    }
  }
  appendSelfInParent(parentNode) {
    this.parentNode = parentNode;
    if (parentNode._isFragmentNode) {
      parentNode.appendChild(this);
    } else {
      const nodes = this.nodes;
      for (let i = 0; i < nodes.length; i++) {
        appendChild(parentNode, nodes[i]);
      }
    }
  }
  removeSelfInParent(parentNode) {
    const nodes = this.nodes;
    for (let i = 0; i < nodes.length; i++) {
      parentNode._isFragmentNode
        ? parentNode.removeChild(nodes[i])
        : removeChild(parentNode, nodes[i]);
    }
    this.parentNode = null;
  }
  insertBeforeSelfInParent(parentNode, referenceNode) {
    this.parentNode = parentNode;
    if (parentNode._isFragmentNode) {
      parentNode.insertBefore(this, referenceNode);
    } else {
      if (referenceNode && referenceNode._isFragmentNode) {
        referenceNode = referenceNode.first;
      }
      const nodes = this.nodes;
      for (let i = 0; i < nodes.length; i++) {
        insertBefore(parentNode, nodes[i], referenceNode);
      }
    }
  }
  dispatchEvent(event, isBubbles) {
    if (isBubbles) {
      this.realParentNode().dispatchEvent(event);
    } else {
      const nodes = this.nodes;
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].dispatchEvent(event);
      }
    }
  }
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
function createRmCb(childElm, listeners) {
  return function remove() {
    if (--listeners === 0) {
      const parent = parentNode$1(childElm);
      removeChild$1(parent, childElm);
    }
  }
}
function formatRootVnode(vnode) {
  if (isPrimitiveVnode(vnode)) {
    vnode = createVnode(undefined, undefined, undefined, vnode, undefined);
  }
  if (isArray(vnode)) {
    vnode = createFragmentVnode(vnode);
    console.warn('Warning: Aadjacent JSX elements must be wrapped in an enclosing tag. Did you want a JSX fragment <>...</>?');
  }
  return vnode
}
function nextSibling$1(node) {
  return node._isFragmentNode
    ? node.nextSibling
    : nextSibling(node)
}
function parentNode$1(node) {
  return node._isFragmentNode
    ? node.parentNode
    : parentNode(node)
}
function appendChild$1(node, child) {
  if (node._isFragmentNode) {
    node.appendChild(child);
  } else {
    if (child._isFragmentNode) {
      child.appendSelfInParent(node);
    } else {
      appendChild(node, child);
    }
  }
}
function removeChild$1(node, child) {
  if (node._isFragmentNode) {
    node.removeChild(child);
  } else {
    if (child._isFragmentNode) {
      child.removeSelfInParent(node);
    } else {
      removeChild(node, child);
    }
  }
}
function insertBefore$1(parentNode, newNode, referenceNode) {
  if (!parentNode || !newNode) return
  if (parentNode._isFragmentNode) {
    parentNode.insertBefore(newNode, referenceNode);
  } else {
    if (newNode._isFragmentNode) {
      newNode.insertBeforeSelfInParent(parentNode, referenceNode);
    } else {
      if (referenceNode && referenceNode._isFragmentNode) {
        referenceNode = referenceNode.first;
      }
      insertBefore(parentNode, newNode, referenceNode);
    }
  }
}
function createComponent(vnode) {
  let i = vnode.data;
  if (isDef(i)) {
    if (isDef(i = i.hook) && isDef(i = i.init)) {
      i(vnode);
    }
    return isDef(vnode.component) && !isProvider(vnode)
  }
  return false
}
function createElm(vnode, insertedVnodeQueue) {
  if (createComponent(vnode)) {
    if (isPortal(vnode)) {
      vnode.elm = createComment('oops.portal');
      invokeCreateHooks(vnode, insertedVnodeQueue);
    }
    return vnode.elm
  }
  const { tag, data, children } = vnode;
  if (isDef(tag)) {
    let elm;
    if (isFragment(vnode) || isProvider(vnode)) {
      elm = vnode.elm = new FragmentNode();
    } else {
      elm = vnode.elm = isDef(data) && isDef(data.ns)
        ? createElementNS(data.ns, tag)
        : createElement(tag);
    }
    if (isArray(children)) {
      for (let i = 0; i < children.length; i++) {
        const chVNode = children[i];
        if (chVNode != null) {
          appendChild$1(elm, createElm(chVNode, insertedVnodeQueue));
        }
      }
    } else if (isPrimitiveVnode(vnode.text)) {
      appendChild$1(elm, createTextNode(vnode.text));
    }
    invokeCreateHooks(vnode, insertedVnodeQueue);
  } else {
    vnode.elm = createTextNode(vnode.text);
  }
  if (isDef(data)) {
    let i = data.hook;
    if (isDef(i) && isDef(i = i.initBefore)) {
      i(vnode);
    }
  }
  return vnode.elm
}

function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = vnodes[startIdx];
    if (ch != null) {
      insertBefore$1(parentElm, createElm(ch, insertedVnodeQueue), before);
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
        rm = createRmCb(ch.elm, listeners);
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
      patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
      insertBefore$1(parentElm, oldStartVnode.elm, nextSibling$1(oldEndVnode.elm));
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
      insertBefore$1(parentElm, oldEndVnode.elm, oldStartVnode.elm);
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      if (oldKeyToIdx === undefined) {
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
      }
      idxInOld = oldKeyToIdx[newStartVnode.key];
      if (isUndef(idxInOld)) {
        insertBefore$1(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
        newStartVnode = newCh[++newStartIdx];
      } else {
        elmToMove = oldCh[idxInOld];
        if (elmToMove.tag !== newStartVnode.tag) {
          insertBefore$1(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
        } else {
          patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
          oldCh[idxInOld] = undefined;
          insertBefore$1(parentElm, elmToMove.elm, oldStartVnode.elm);
        }
        newStartVnode = newCh[++newStartIdx];
      }
    }
  }
  if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
    if (oldStartIdx > oldEndIdx) {
      before = newCh[newEndIdx+1] == null ? null : newCh[newEndIdx+1].elm;
      addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
    } else {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }
  }
}
function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
  let i, hook;
  if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
    i(oldVnode, vnode);
  }
  const elm = vnode.elm = oldVnode.elm;
  let oldCh = oldVnode.children;
  let ch = vnode.children;
  if (oldVnode === vnode) return
  if (isDef(vnode.data)) {
    for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode);
    i = vnode.data.hook;
    if (isDef(i) && isDef(i = i.update)) i(oldVnode, vnode);
  }
  if (
    isMemo(vnode) ||
    isPortal(vnode) ||
    isConsumer(vnode) ||
    isComponent(vnode) ||
    isForwardRef(vnode)
  ) ; else if (isUndef(vnode.text)) {
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
function patch(oldVnode, vnode) {
  const insertedVnodeQueue = [];
  for (let i = 0; i < cbs.pre.length; i++) cbs.pre[i]();
  if (isUndef(oldVnode)) {
    createElm(vnode, insertedVnodeQueue);
  } else {
    if (sameVnode(oldVnode, vnode)) {
      patchVnode(oldVnode, vnode, insertedVnodeQueue);
    } else {
      const elm = oldVnode.elm;
      const parent = parentNode$1(elm);
      createElm(vnode, insertedVnodeQueue);
      if (parent !== null) {
        insertBefore$1(parent, vnode.elm, nextSibling$1(elm));
        removeVnodes(parent, [oldVnode], 0, 0);
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

function defineSpecialPropsWarningGetter(props, key) {
  Object.defineProperty(props, key, {
    get() {
      console.error(
        `Warning: '${key}' is not a prop. Trying to access it will result ` +
          'in `undefined` being returned. If you need to access the same ' +
          'value within the child component, you should pass it as a different ' +
          'prop. (https://fb.me/react-special-props)',
      );
    },
    configurable: true,
  });
}
function mergeProps({data, children}) {
  const props =  {};
  if (children.length > 0) {
    props.children = children;
    if (props.children.length === 1) {
      props.children = props.children[0];
    }
  }
  for (const key in data) {
    if (key === 'key' || key === 'ref') {
      defineSpecialPropsWarningGetter(props, key);
    } else if (key !== 'hook') {
      props[key] = data[key];
    }
  }
  return props
}
function nextFrame$1(callback) {
  setTimeout(() => requestAnimationFrame(callback));
}
function equalDeps(a, b) {
  if (isArray(a) && isArray(b)) {
    if (a.length === 0 && b.length === 0) return true
    if (a.length !== b.length) return false
    return !b.some((v, i) => v !== a[i])
  }
  return false
}
function callEffectCallback([create, destroy, effect]) {
  if (typeof destroy === 'function') destroy(false);
  const cleanup = create();
  if (isDef(cleanup) && typeof cleanup !== 'function') {
    throw new Error('An effect function must not return anything besides a function, which is used for clean-up.')
  }
  effect.destroy = cleanup;
}
function obtainUpdateList(effects) {
  const effectQueue = [];
  for (const key in effects) {
    const { deps, prevDeps, create, destroy } = effects[key];
    if (!equalDeps(deps, prevDeps)) {
      effectQueue.push([create, destroy, effects[key]]);
    }
  }
  return () => {
    if (effectQueue.length > 0) {
      for (let i = 0; i < effectQueue.length; i++) {
        callEffectCallback(effectQueue[i]);
      }
    }
  }
}
function updateEffect(flag, effects) {
  flag === 'effects'
    ? nextFrame$1(obtainUpdateList(effects))
    : obtainUpdateList(effects)();
}
function cleanEffectDestroy(flag, effects) {
  const actuator = () => {
    for (const key in effects) {
      const { destroy } = effects[key];
      if (typeof destroy === 'function') destroy(true);
    }
  };
  flag === 'effects'
    ? nextFrame$1(actuator)
    : actuator();
}
function addToProviderUpdateDuplicate(consumer) {
  const deps = consumer.providerDependencies;
  if (deps && deps.length > 0) {
    for (let i = 0; i < deps.length; i++) {
      if (isArray(deps[i].updateDuplicate)) {
        deps[i].updateDuplicate.push(consumer);
      }
    }
  }
}
function callLifetimeMethod(vnode, method) {
  return function() {
    const component = vnode.component;
    if (component && typeof component[method] === 'function') {
      component[method].apply(component, arguments);
    }
  }
}
function commonHooksConfig(config) {
  const basicHooks = {
    initBefore(vnode) {
      callLifetimeMethod(vnode, 'initBefore')(vnode);
    },
    update(oldVnode, vnode) {
      vnode.component = oldVnode.component;
      vnode.component.vnode = vnode;
      callLifetimeMethod(vnode, 'update')(oldVnode, vnode);
    },
    postpatch(oldVnode, vnode) {
      callLifetimeMethod(vnode, 'postpatch')(oldVnode, vnode);
    },
    remove(vnode, rm) {
      callLifetimeMethod(vnode, 'remove')(vnode, rm);
    },
    destroy(vnode) {
      callLifetimeMethod(vnode, 'destroy')(vnode);
    },
  };
  return config
    ? Object.assign(basicHooks, config)
    : basicHooks
}

function defaultCompare(oldProps, newProps) {
  const oks = Object.keys(oldProps);
  const nks = Object.keys(newProps);
  if (oks.length !== nks.length) return false
  for (let i = 0; i < oks.length; i++) {
    const key = oks[i];
    if (!(key in newProps)) return false
    if (oldProps[key] !== newProps[key]) return false
  }
  return true
}
class MemoComponent {
  constructor(vnode) {
    this.vnode = vnode;
    this.prevProps = {};
    this.memoInfo = null;
    this.rootVnode = undefined;
  }
  transferAndRender() {
    const { tag } = this.memoInfo;
    const updateVnode = cloneVnode(this.vnode);
    updateVnode.tag = tag;
    updateVnode.component = undefined;
    updateVnode.data.hook = undefined;
    updateVnode.data = isCommonVnode(tag)
      ? separateProps(updateVnode.data)
      : installHooks(tag, updateVnode.data);
    this.rootVnode = patch(this.rootVnode, updateVnode);
    this.rootVnode.parent = this.vnode.parent;
    this.vnode.elm = this.rootVnode.elm;
  }
  init() {
    const { tag, compare } = this.vnode.tag;
    this.memoInfo = { tag, compare };
    this.prevProps = mergeProps(this.vnode);
    this.transferAndRender();
  }
  update(oldVnode, vnode) {
    let { tag, compare } = vnode.tag;
    if (compare === null) {
      compare = defaultCompare;
    }
    if (typeof compare !== 'function') {
      throw new TypeError('compare is not a function.')
    }
    const newProps = mergeProps(vnode);
    if (!compare(this.prevProps, newProps)) {
      this.memoInfo = { tag, compare };
      this.vnode = vnode;
      this.transferAndRender();
      this.prevProps = newProps;
    }
  }
}
const memoVNodeHooks = commonHooksConfig({
  init(vnode) {
    if (isMemo(vnode)) {
      vnode.component = new MemoComponent(vnode);
      vnode.component.init();
    }
  }
});

class PortalComponent {
  constructor(vnode) {
    this.vnode = vnode;
    this.container = null;
    this.proxyEventCb = null;
    this.rootVnode = undefined;
  }
  render() {
    const oldContainer = this.container;
    const updateVnode = this.vnode.children[0];
    const oldElm = this.rootVnode && this.rootVnode.elm;
    this.container = this.vnode.tag.container;
    this.rootVnode = patch(this.rootVnode, updateVnode);
    this.rootVnode.parent = this.vnode.parent;
    if (!this.container) {
      throw new Error('Target container is not a DOM element.')
    }
    if (this.container !== oldContainer) {
      if (this.rootVnode.elm) {
        insertBefore$1(this.container, this.rootVnode.elm, null);
      }
      if (oldElm && oldContainer) {
        if (contains(oldContainer, oldElm)) {
          removeChild$1(oldContainer, oldElm);
        }
      }
    } else {
      if (this.rootVnode.elm !== oldElm) {
        if (this.rootVnode.elm) {
          insertBefore$1(this.container, this.rootVnode.elm, oldElm);
        }
        if (oldElm) {
          removeChild$1(this.container, oldElm);
        }
      }
    }
  }
  init() {
    this.render();
  }
  update() {
    this.render();
  }
}
const portalVNodeHooks = commonHooksConfig({
  init(vnode) {
    if (isPortal(vnode)) {
      vnode.component = new PortalComponent(vnode);
      vnode.component.init();
    }
  },
});

function initRefObject(initialValue) {
  return Object.seal({ current: initialValue })
}
function createRef() {
  return initRefObject(null)
}
function forwardRef(render) {
  if (render != null && render.$$typeof === MEMO_TYPE) {
    throw new Error(
      'forwardRef requires a render function but received a `memo` ' +
        'component. Instead of forwardRef(memo(...)), use ' +
        'memo(forwardRef(...)).'
    )
  } else if (typeof render !== 'function') {
    throw new Error(
      'forwardRef requires a render function but was given ' +
        (render === null ? 'null' : typeof render)
    )
  } else {
    if (render.length !== 0 && render.length !== 2) {
      throw new Error('forwardRef render functions accept exactly two parameters: props and ref. ' +
        (
          render.length === 1
            ? 'Did you forget to use the ref parameter?'
            : 'Any additional parameter will be undefined.'
        )
      )
    }
  }
  return {
    render,
    $$typeof: FORWARD_REF_TYPE,
  }
}

const MAX_SIGNED_31_BIT_INT = 1073741823;
class ContextStack {
  constructor(context, defaultValue) {
    this.context = context;
    this.stack = [
      {
        provider: {
          consumerQueue: [],
        },
        value: defaultValue,
      },
    ];
  }
  push(value, provider) {
    const item = { value, provider };
    this.stack.push(item);
    this.context._currentValue = value;
  }
  pop() {
    this.stack.pop();
    const lastItme = this.stack[this.stack.length - 1];
    this.context._currentValue = lastItme ? lastItme.value : null;
  }
  reset() {
    this.stack = this.stack[0];
    this.context._currentValue = this.stack[0].value;
  }
  getCurrentProvider() {
    return this.stack[this.stack.length - 1].provider
  }
}
function readContext(consumer, context, observedBits) {
  const currentProvider = context._contextStack.getCurrentProvider();
  const queue = currentProvider.consumerQueue;
  const item = {
    consumer,
    observedBits: typeof observedBits !== 'number' || observedBits === MAX_SIGNED_31_BIT_INT
      ? MAX_SIGNED_31_BIT_INT
      : observedBits,
  };
  if (queue.every(item => item.consumer !== consumer)) {
    queue.push(item);
  }
  if (consumer.providerDependencies.indexOf(currentProvider) < 0) {
    consumer.providerDependencies.push(currentProvider);
  }
  return context._currentValue
}
function removedInDeps(consumer) {
  const queue = consumer.providerDependencies;
  if (queue.length > 0) {
    for (let i = 0; i < queue.length; i++) {
      const providerDep = queue[i];
      const index = providerDep.consumerQueue.findIndex(item => item.consumer === consumer);
      if (index > -1) {
        queue.splice(index, 1);
      }
    }
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
            'a future major release. Did you mean to render <Context.Provider> instead?'
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
          'Rendering <Context.Consumer.Consumer> is not supported and will be removed in ' +
            'a future major release. Did you mean to render <Context.Consumer> instead?'
        );
        return context.Consumer
      },
    },
  });
  context.Consumer = Consumer;
  context._contextStack = new ContextStack(context, defaultValue);
  return context
}

const RE_RENDER_LIMIT = 25;
const Target = {
  component: undefined,
};
class Component {
  constructor(vnode, refOrContext) {
    this.cursor = 0;
    this.vnode = vnode;
    this.render = vnode.tag;
    this.destroyed = false;
    this.numberOfReRenders = 0;
    this.rootVnode = undefined;
    this.updateVnode = undefined;
    this.providerDependencies = [];
    this.refOrContext = refOrContext;
    this.refs = Object.create(null);
    this.state = Object.create(null);
    this.memos = Object.create(null);
    this.effects = Object.create(null);
    this.layoutEffects = Object.create(null);
  }
  setState(partialState) {
    const key = this.cursor++;
    if (key in this.state) {
      return [this.state[key], key]
    }
    this.state[key] = partialState;
    return [partialState, key]
  }
  pushEffect(flag, create, deps) {
    let destroy = undefined;
    let prevDeps = undefined;
    const key = this.cursor++;
    const prevEffect = this[flag][key];
    if (prevEffect) {
      destroy = prevEffect.destroy;
      prevDeps = prevEffect.deps;
    }
    this[flag][key] = { deps, prevDeps, create, destroy };
  }
  useReducer(payload, key, reducer) {
    const newValue = reducer(this.state[key], payload);
    if (this.state[key] !== newValue) {
      this.state[key] = newValue;
      this.forceUpdate();
    }
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
  useRef(initialValue) {
    const key = this.cursor++;
    const current = this.refs[key] || (this.refs[key] = initRefObject(initialValue));
    return current
  }
  useImperativeHandle(ref, create, deps) {
    this.pushEffect(
      'layoutEffects',
      () => {
        if (typeof ref === 'function') {
          const refCallback = ref;
          const inst = create();
          refCallback(inst);
          return () => {
            refCallback(null);
          }
        } else if (!isVoid(ref)) {
          const refObject = ref;
          if (!refObject.hasOwnProperty('current')) {
            console.error(
              'Expected useImperativeHandle() first argument to either be a ' +
                'ref callback or React.createRef() object. Instead received: %s.',
              'an object with keys {' + Object.keys(refObject).join(', ') + '}',
            );
          }
          const inst = create();
          refObject.current = inst;
          return () => {
            refObject.current = null;
          }
        }
      },
      !isVoid(deps)
        ? deps.concat([ref])
        : null
      ,
    );
  }
  forceUpdate() {
    if (++this.numberOfReRenders > RE_RENDER_LIMIT) {
      throw new Error(
        'Too many re-renders. ' +
          'oops limits the number of renders to prevent an infinite loop.'
      )
    }
    try {
      Target.component = this;
      this.updateVnode = formatRootVnode(
        this.render(
          mergeProps(this.vnode),
          this.refOrContext,
        )
      );
      if (isUndef(this.updateVnode)) {
        throw new Error(
          'Nothing was returned from render.' +
            'This usually means a return statement is missing.' +
            'Or, to render nothing, return null.'
        )
      }
      if (this.updateVnode !== null) {
        this.rootVnode = patch(this.rootVnode, this.updateVnode);
        this.rootVnode.parent = this.vnode.parent;
        this.vnode.elm = this.rootVnode.elm;
        this.updateVnode = undefined;
      }
    } finally {
      this.cursor = 0;
      this.numberOfReRenders = 0;
      Target.component = undefined;
      updateEffect('effects', this.effects);
      updateEffect('layoutEffects', this.layoutEffects);
    }
  }
  init() {
    this.forceUpdate();
  }
  update(oldVnode, vnode) {
    addToProviderUpdateDuplicate(this);
    this.forceUpdate();
  }
  remove(vnode, remove) {
    remove();
  }
  destroy(vnode) {
    cleanEffectDestroy('effects', this.effects);
    cleanEffectDestroy('layoutEffects', this.layoutEffects);
    this.destroyed = true;
    removedInDeps(this);
  }
}
const componentVNodeHooks = commonHooksConfig({
  init(vnode) {
    if (isComponent(vnode)) {
      vnode.component = new Component(vnode, {});
      vnode.component.init();
    }
  },
});

function abtainRefObject(vnode) {
  return vnode.data.hasOwnProperty('ref')
    ? vnode.data.ref
    : null
}
class ForwardRefComponent extends Component {
  constructor(vnode) {
    super(vnode, abtainRefObject(vnode));
    this.render = vnode.tag.render;
  }
  update(oldVnode, vnode) {
    this.refOrContext = abtainRefObject(vnode);
    this.render = vnode.tag.render;
    super.update(oldVnode, vnode);
  }
}
const forwardRefHooks = commonHooksConfig({
  init(vnode) {
    if (isForwardRef(vnode)) {
      vnode.component = new ForwardRefComponent(vnode);
      vnode.component.init();
    }
  },
});

class ProviderComponent {
  constructor(vnode) {
    this.vnode = vnode;
    this.consumerQueue = [];
    this.updateDuplicate = null;
  }
  initBefore(vnode) {
    vnode.tag._context._contextStack.pop();
  }
  update(oldVnode, vnode) {
    const { tag, data } = vnode;
    tag._context._contextStack.push(data.value, this);
    this.updateDuplicate = [];
  }
  postpatch(oldVnode, vnode) {
    const consumerQueue = this.consumerQueue.slice();
    if (consumerQueue.length !== this.updateDuplicate.length) {
      for (let i = 0; i < consumerQueue.length; i++) {
        const consumer = consumerQueue[i].consumer;
        if (this.updateDuplicate.indexOf(consumer) === -1) {
          if (!consumer.destroyed) {
            consumer.forceUpdate();
          }
        }
      }
    }
    this.updateDuplicate = null;
    vnode.tag._context._contextStack.pop();
  }
}
const providerVNodeHooks = commonHooksConfig({
  init(vnode) {
    if (isProvider(vnode)) {
      const { tag, data } = vnode;
      vnode.component = new ProviderComponent(vnode);
      tag._context._contextStack.push(data.value, vnode.component);
    }
  },
});

class ConsumerComponent {
  constructor(vnode) {
    this.vnode = vnode;
    this.destroyed = false;
    this.rootVnode = undefined;
    this.providerDependencies = [];
    this.context = vnode.tag._context;
  }
  rewardRender() {
    const render = this.vnode.children[0];
    if (typeof render !== 'function') {
      throw new Error(
        'A context consumer was rendered with multiple children, or a child ' +
          "that isn't a function. A context consumer expects a single child " +
          'that is a function. If you did pass a function, make sure there ' +
          'is no trailing or leading whitespace around it.'
      )
    }
    return render
  }
  render() {
    const value = readContext(this, this.context);
    const updateVnode = formatRootVnode(this.rewardRender()(value));
    if (updateVnode) {
      this.rootVnode = patch(this.rootVnode, updateVnode);
      this.rootVnode.parent = this.vnode.parent;
      this.vnode.elm = this.rootVnode.elm;
    }
  }
  forceUpdate() {
    this.render();
  }
  update(oldVnode, vnode) {
    addToProviderUpdateDuplicate(this);
    this.render();
  }
  destroy(vnode) {
    this.destroyed = true;
    removedInDeps(vnode.component);
  }
}
const consumerVNodeHooks = commonHooksConfig({
  init(vnode) {
    if (isConsumer(vnode)) {
      vnode.component = new ConsumerComponent(vnode);
      vnode.component.render();
    }
  },
});

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
function installHooks(tag, data) {
  let vnodeHooks;
  const simulateVnode = { tag };
  const hook = (data || (data = {})).hook || (data.hook = {});
  if (isComponent(simulateVnode)) {
    vnodeHooks = componentVNodeHooks;
  } else if (isProvider(simulateVnode)) {
    vnodeHooks = providerVNodeHooks;
  } else if (isConsumer(simulateVnode)) {
    vnodeHooks = consumerVNodeHooks;
  } else if (isMemo(simulateVnode)) {
    vnodeHooks = memoVNodeHooks;
  } else if (isForwardRef(simulateVnode)) {
    vnodeHooks = forwardRefHooks;
  } else if (isPortal(simulateVnode)) {
    vnodeHooks = portalVNodeHooks;
  }
  if (vnodeHooks) {
    for (const name in vnodeHooks) {
      hook[name] = vnodeHooks[name];
    }
  }
  return data
}
function createFragmentVnode(children) {
  return formatVnode(FRAGMENTS_TYPE, {}, children, true)
}
function formatVnode(tag, data, children, checkKey) {
  if (!isComponent({ tag }) && !isInsertComponent(tag)) {
    if (children.length > 0) {
      let didWarned = false;
      children = children.slice();
      for (let i = 0; i < children.length; i++) {
        if (checkKey && !didWarned) {
          if (!data.hasOwnProperty('key')) {
            console.warn(
              'Warning: Each child in a list should have a unique "key" prop. ' +
                'See https://fb.me/react-warning-keys for more information.'
            );
            didWarned = true;
          }
        }
        if (hasIterator(children[i])) {
          children[i] = createFragmentVnode(Array.from(children[i]));
        } else if (isPrimitiveVnode(children[i])) {
          children[i] = createVnode(undefined, undefined, undefined, children[i], undefined);
        } else if (isCommonVnode(tag)) {
          if (isFilterVnode(children[i])) {
            children.splice(i, 1);
            i--;
          }
        }
      }
    }
  }
  if (tag === 'svg') {
    addNS(data, children, tag);
  }
  return createVnode(tag, data, children, undefined, undefined)
}

function injectParentVnode(vnode, children) {
  if (isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      if (children[i] && isVnode(children[i])) {
        children[i].parent = vnode;
      }
    }
  }
}
function createVnode(tag, data, children, text, elm) {
  const vnode = {
    tag,
    data,
    elm,
    text,
    children,
    parent: undefined,
    component: undefined,
    key: data ? data.key : undefined,
  };
  injectParentVnode(vnode, children);
  return vnode
}
function cloneVnode(vnode) {
  const cloned = createVnode(
    vnode.tag,
    vnode.data,
    vnode.children && vnode.children.slice(),
    vnode.text,
    vnode.elm,
  );
  cloned.key = vnode.key;
  cloned.isClone = true;
  cloned.component = vnode.component;
  injectParentVnode(cloned, cloned.children);
  return cloned
}
function h(tag, props, ...children) {
  if (typeof tag === 'function' && props && props.hasOwnProperty('ref')) {
    throw new Error(
      'Function components cannot be given refs. ' +
        'Attempts to access this ref will fail. Did you mean to use Oops.forwardRef()?'
    )
  }
  if (props && props.hasOwnProperty('children')) {
    if (children.length === 0) {
      if (props.children) {
        children = isArray(props.children)
          ? props.children
          : [props.children];
      }
    }
    delete props.children;
  }
  return formatVnode(
    tag,
    isCommonVnode(tag)
      ? separateProps(props)
      : installHooks(tag, props),
    children,
    false,
  )
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
          evaluate(h, value, fields, [FRAGMENTS_TYPE, null]),
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

function memo(tag, compare) {
  if (!isValidElementType(tag)) {
    throw new Error(
      'memo: The first argument must be a component. Instead received: ' +
        (tag === null ? 'null' : typeof tag)
    )
  }
  return {
    tag,
    $$typeof: MEMO_TYPE,
    compare: compare === undefined ? null : compare
  }
}

function render(vnode, app, callback) {
  if (app) {
    vnode = formatRootVnode(vnode);
    if (isVnode(vnode)) {
      vnode = patch(undefined, vnode);
      const elm = vnode.elm || null;
      elm && appendChild$1(app, elm);
      if (typeof callback === 'function') {
        callback(elm);
      }
      return vnode
    } else {
      throw new Error('The first parameter of the render function should be vnode.')
    }
  } else {
    throw new Error('Target container is not a DOM element.')
  }
}

function createPortal(children, container, key = null) {
  const tag = {
    container,
    $$typeof: PORTAL_TYPE,
  };
  key = key == null ? null : '' + key;
  return h(tag, { key }, children)
}

function isValidElement(object) {
  return (
    typeof object === 'object' &&
    object !== null &&
    isValidElementType(object.tag)
  )
}

const SEPARATOR = '.';
const SUBSEPARATOR = ':';
const POOL_SIZE = 10;
const traverseContextPool = [];
function escape(key) {
  const escapeRegex = /[=:]/g;
  const escaperLookup = {
    '=': '=0',
    ':': '=2',
  };
  const escapedString = ('' + key).replace(
    escapeRegex,
    match => escaperLookup[match],
  );
  return '$' + escapedString
}
const userProvidedKeyEscapeRegex = /\/+/g;
function escapeUserProvidedKey(text) {
  return ('' + text).replace(userProvidedKeyEscapeRegex, '$&/')
}
function cloneAndReplaceKey(oldElm, newKey) {
  const cloned = cloneVnode(oldElm);
  cloned.key = newKey;
  return cloned
}
function getComponentKey(component, index) {
  return (
    typeof component === 'object' &&
    component !== null &&
    component.key != null
  )
    ? escape(component.key)
    : index.toString(36)
}
function getPooledTraverseContext(mapResult, keyPrefix, mapFunction, mapContext) {
  if (traverseContextPool.length) {
    const traverseContext = traverseContextPool.pop();
    traverseContext.count = 0;
    traverseContext.fn = mapFunction;
    traverseContext.result = mapResult;
    traverseContext.context = mapContext;
    traverseContext.keyPrefix = keyPrefix;
    return traverseContext
  } else {
    return {
      count: 0,
      fn: mapFunction,
      result: mapResult,
      context: mapContext,
      keyPrefix: keyPrefix,
    }
  }
}
function releaseTraverseContext(traverseContext) {
  traverseContext.result = null;
  traverseContext.keyPrefix = null;
  traverseContext.fn = null;
  traverseContext.context = null;
  traverseContext.count = 0;
  if (traverseContextPool.length < POOL_SIZE) {
    traverseContextPool.push(traverseContext);
  }
}
function forEachSingleChild(bookKeeping, child, name) {
  const { fn, context } = bookKeeping;
  fn.call(context, child, bookKeeping.count++);
}
function mapSingleChildIntoContext(bookKeeping, child, childKey) {
  const { fn, result, keyPrefix, context } = bookKeeping;
  let mappedChild = fn.call(context, child, bookKeeping.count++);
  if (isArray(mappedChild)) {
    mapIntoWithKeyPrefixInternal(mappedChild, result, childKey, c => c);
  } else if (mappedChild != null) {
    if (isValidElement(mappedChild)) {
      mappedChild = cloneAndReplaceKey(
        mappedChild,
        keyPrefix +
          (mappedChild.key && (!child || child.key !== mappedChild.key)
            ? escapeUserProvidedKey(mappedChild.key) + '/'
            : '') +
          childKey,
      );
    }
    result.push(mappedChild);
  }
}
function traverseAllChildrenImpl(children, nameSoFar, callback, traverseContext) {
  const type = typeof children;
  if (type === 'undefined' || type === 'boolean') {
    children = null;
  }
  let invokeCallback = false;
  if (children === null) {
    invokeCallback = true;
  } else {
    switch (type) {
      case 'string':
      case 'number':
        invokeCallback = true;
        break
      case 'object':
        if (isValidElement(children)) {
          invokeCallback = true;
        }
    }
  }
  if (invokeCallback) {
    callback(
      traverseContext,
      children,
      nameSoFar === '' ? SEPARATOR + getComponentKey(children, 0) : nameSoFar,
    );
    return 1
  }
  let child;
  let nextName;
  let subtreeCount = 0;
  const nextNamePrefix = nameSoFar === ''
    ? SEPARATOR
    : nameSoFar + SUBSEPARATOR;
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      child = children[i];
      nextName = nextNamePrefix + getComponentKey(child, i);
      subtreeCount += traverseAllChildrenImpl(
        child,
        nextName,
        callback,
        traverseContext,
      );
    }
  } else {
    const iteratorFn = getIteratorFn(children);
    if (typeof iteratorFn === 'function') {
      const iterator = iteratorFn.call(children);
      let step;
      let ii = 0;
      while (!(step = iterator.next()).done) {
        child = step.value;
        nextName = nextNamePrefix + getComponentKey(child, ii++);
        subtreeCount += traverseAllChildrenImpl(
          child,
          nextName,
          callback,
          traverseContext,
        );
      }
    } else if (type === 'object') {
      throw new Error('If you meant to render a collection of children, use an array instead.')
    }
  }
  return subtreeCount
}
function traverseAllChildren(children, callback, traverseContext) {
  if (children == null) return 0
  return traverseAllChildrenImpl(children, '', callback, traverseContext)
}
function mapIntoWithKeyPrefixInternal(children, array, prefix, fn, context) {
  let escapedPrefix = '';
  if (prefix != null) {
    escapedPrefix = escapeUserProvidedKey(prefix) + '/';
  }
  const traverseContext = getPooledTraverseContext(
    array,
    escapedPrefix,
    fn,
    context,
  );
  traverseAllChildren(children, mapSingleChildIntoContext, traverseContext);
  releaseTraverseContext(traverseContext);
}
function forEachChildren(children, fn, context) {
  if (children == null) return children
  const traverseContext = getPooledTraverseContext(
    null,
    null,
    fn,
    context,
  );
  traverseAllChildren(children, forEachSingleChild, traverseContext);
  releaseTraverseContext(traverseContext);
}
function mapChildren(children, fn, context) {
  if (children == null)  return children
  const result = [];
  mapIntoWithKeyPrefixInternal(children, result, null, fn, context);
  return result
}
function countChildren(children) {
  return traverseAllChildren(children, () => null, null)
}
function toArray(children) {
  const result = [];
  mapIntoWithKeyPrefixInternal(children, result, null, child => child);
  return result
}
function onlyChild(children) {
  if (!isValidElement(children)) {
    throw new Error('Oops.Children.only expected to receive a single React element child.')
  }
  return children
}

function resolveTargetComponent() {
  if (Target.component === undefined) {
    throw new Error('Invalid hook call. Hooks can only be called inside of the body of a function component.')
  }
  return Target.component
}
function useEffect(create, deps) {
  const component = resolveTargetComponent();
  return component.pushEffect('effects', create, deps)
}
function useLayoutEffect(create, deps) {
  const component = resolveTargetComponent();
  return component.pushEffect('layoutEffects', create, deps)
}
function useMemo(create, deps) {
  const component = resolveTargetComponent();
  return component.useMemo(create, deps)
}
function useCallback(callback, deps) {
  return useMemo(() => callback, deps)
}
function useContext(context, unstable_observedBits) {
  const component = resolveTargetComponent();
  return readContext(component, context, unstable_observedBits)
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
function useRef(initialValue) {
  const component = resolveTargetComponent();
  return component.useRef(initialValue)
}
function useImperativeHandle(ref, create, deps) {
  if (typeof create !== 'function') {
    console.error(
      'Expected useImperativeHandle() second argument to be a function ' +
        'that creates a handle. Instead received: %s.',
      create !== null ? typeof create : 'null',
    );
  }
  const component = resolveTargetComponent();
  return component.useImperativeHandle(ref, create, deps)
}

const Children = {
  map: mapChildren,
  only: onlyChild,
  count: countChildren,
  forEach: forEachChildren,
  toArray,
};
const oops = {
  h,
  jsx,
  memo,
  render,
  Children,
  createRef,
  forwardRef,
  createPortal,
  createContext,
  isValidElement,
  Fragment: FRAGMENTS_TYPE,
  useRef,
  useMemo,
  useState,
  useEffect,
  useContext,
  useReducer,
  useCallback,
  useLayoutEffect,
  useImperativeHandle,
};

export default oops;
export { Children, FRAGMENTS_TYPE as Fragment, createContext, createPortal, createRef, forwardRef, h, isValidElement, jsx, memo, render, useCallback, useContext, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useReducer, useRef, useState };
