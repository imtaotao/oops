/*!
 * oops.js v0.0.1
 * (c) 2019-2020 Imtaotao
 * Released under the MIT License.
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
    return;
  }

  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

var isArray = Array.isArray;
function isDef(v) {
  return v !== undefined;
}
function isUndef(v) {
  return v === undefined;
}
function flatMap(array, callback) {
  var condition = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : isArray;
  var result = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = array.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _step$value = _slicedToArray(_step.value, 2),
          i = _step$value[0],
          item = _step$value[1];

      if (condition(item)) {
        flatMap(item, callback, condition, result);
      } else {
        result.push(callback(item, i, array));
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return result;
}

function updateClass(oldVnode, vnode) {
  var elm = vnode.elm;

  if (elm) {
    var oldClass = oldVnode.data["class"];
    var klass = vnode.data["class"];
    if (!oldClass && !klass) return;
    if (oldClass === klass) return;
    oldClass = oldClass || {};
    klass = klass || {};

    for (var name in oldClass) {
      if (!klass[name]) {
        vnode.elm.classList.remove(name);
      }
    }

    for (var _name in klass) {
      var cur = klass[_name];

      if (cur !== oldClass[_name]) {
        vnode.elm.classList[cur ? 'add' : 'remove'](_name);
      }
    }
  }
}

var classModule = {
  create: updateClass,
  update: updateClass
};

function updateProps(oldVnode, vnode) {
  var elm = vnode.elm;

  if (elm) {
    var key, cur, old;
    var props = vnode.data.props;
    var oldProps = oldVnode.data.props;
    if (!oldProps && !props) return;
    if (oldProps === props) return;
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

var propsModule = {
  create: updateProps,
  update: updateProps
};

var raf = typeof window !== 'undefined' && window.requestAnimationFrame.bind(window) || setTimeout;

var nextFrame = function nextFrame(fn) {
  raf(function () {
    raf(fn);
  });
};

var reflowForced = false;

function setNextFrame(obj, prop, val) {
  nextFrame(function () {
    obj[prop] = val;
  });
}

function updateStyle(oldVnode, vnode) {
  var cur,
      name,
      elm = vnode.elm,
      oldStyle = oldVnode.data.style,
      style = vnode.data.style;
  if (!oldStyle && !style) return;
  if (oldStyle === style) return;
  oldStyle = oldStyle || {};
  style = style || {};
  var oldHasDel = 'delayed' in oldStyle;

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
      for (var name2 in style.delayed) {
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
  var style,
      name,
      elm = vnode.elm,
      s = vnode.data.style;
  if (!s || !(style = s.destroy)) return;

  for (name in style) {
    elm.style[name] = style[name];
  }
}

function applyRemoveStyle(vnode, rm) {
  var s = vnode.data.style;

  if (!s || !s.remove) {
    rm();
    return;
  }

  if (!reflowForced) {
    getComputedStyle(document.body).transform;
    reflowForced = true;
  }

  var name,
      elm = vnode.elm,
      i = 0,
      compStyle,
      style = s.remove,
      amount = 0,
      applied = [];

  for (name in style) {
    applied.push(name);
    elm.style[name] = style[name];
  }

  compStyle = getComputedStyle(elm);
  var props = compStyle['transition-property'].split(', ');

  for (; i < props.length; ++i) {
    if (applied.indexOf(props[i]) !== -1) amount++;
  }

  elm.addEventListener('transitionend', function (ev) {
    if (ev.target === elm) --amount;
    if (amount === 0) rm();
  });
}

function forceReflow() {
  reflowForced = false;
}

var styleModule = {
  pre: forceReflow,
  create: updateStyle,
  update: updateStyle,
  destroy: applyDestroyStyle,
  remove: applyRemoveStyle
};

var CAPS_REGEX = /[A-Z]/g;

function updateDataset(oldVnode, vnode) {
  var elm = vnode.elm;

  if (elm) {
    var key;
    var oldDataset = oldVnode.data.dataset;
    var dataset = vnode.data.dataset;
    if (!oldDataset && !dataset) return;
    if (oldDataset === dataset) return;
    oldDataset = oldDataset || {};
    dataset = dataset || {};
    var d = elm.dataset;

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

var datasetModule = {
  create: updateDataset,
  update: updateDataset
};

var xChar = 120;
var colonChar = 58;
var xlinkNS = 'http://www.w3.org/1999/xlink';
var xmlNS = 'http://www.w3.org/XML/1998/namespace';

function updateAttrs(oldVnode, vnode) {
  var elm = vnode.elm;

  if (elm) {
    var attrs = vnode.data.attrs;
    var oldAttrs = oldVnode.data.attrs;
    if (!oldAttrs && !attrs) return;
    if (oldAttrs === attrs) return;
    oldAttrs = oldAttrs || {};
    attrs = attrs || {};

    for (var key in attrs) {
      var cur = attrs[key];
      var old = oldAttrs[key];

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

    for (var _key in oldAttrs) {
      if (!(_key in attrs)) {
        elm.removeAttribute(_key);
      }
    }
  }
}

var attributesModule = {
  create: updateAttrs,
  update: updateAttrs
};

function invokeHandler(handler, vnode, event) {
  if (typeof handler === 'function') {
    handler.call(vnode, event, vnode);
  } else if (_typeof(handler) === 'object') {
    if (typeof handler[0] === 'function') {
      if (handler.length === 2) {
        handler[0].call(vnode, handler[1], event, vnode);
      } else {
        var args = handler.slice(1);
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
  var name = event.type;
  var on = vnode.data.on;

  if (on && on[name]) {
    invokeHandler(on[name], vnode, event);
  }
}

function createListener() {
  return function handler(event) {
    handleEvent(event, handler.vnode);
  };
}

function updateEventListeners(oldVnode, vnode) {
  var oldElm = oldVnode.elm;
  var oldOn = oldVnode.data.on;
  var oldListener = oldVnode.listener;
  var elm = vnode && vnode.elm;
  var on = vnode && vnode.data.on;
  if (oldOn === on) return;

  if (oldElm && oldOn && oldListener) {
    if (!on) {
      for (var name in oldOn) {
        oldElm.removeEventListener(name, oldListener, false);
      }
    } else {
      for (var _name in oldOn) {
        if (!on[_name]) {
          oldElm.removeEventListener(_name, oldListener, false);
        }
      }
    }
  }

  if (on) {
    var listener = vnode.listener = oldVnode.listener || createListener();
    listener.vnode = vnode;

    if (elm && !oldOn) {
      for (var _name2 in on) {
        elm.addEventListener(_name2, listener, false);
      }
    } else {
      for (var _name3 in on) {
        if (!oldOn[_name3]) {
          elm.addEventListener(_name3, listener, false);
        }
      }
    }
  }
}

var eventListenersModule = {
  create: updateEventListeners,
  update: updateEventListeners,
  destroy: updateEventListeners
};

var cbs = {};
var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];
var modules = [classModule, propsModule, styleModule, datasetModule, attributesModule, eventListenersModule];

for (var i = 0; i < hooks.length; i++) {
  cbs[hooks[i]] = [];

  for (var j = 0; j < modules.length; j++) {
    if (modules[j][hooks[i]] !== undefined) {
      cbs[hooks[i]].push(modules[j][hooks[i]]);
    }
  }
}

function createElement(tagName) {
  var node = document.createElement(tagName);
  return node;
}
function createElementNS(namespaceURI, qualifiedName) {
  return document.createElementNS(namespaceURI, qualifiedName);
}
function createTextNode(text) {
  return document.createTextNode(text);
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
  return node.parentNode;
}
function nextSibling(node) {
  return node.nextSibling;
}
function setTextContent(node, text) {
  node.textContent = text;
}

var CONTEXT_TYPE = Symbol["for"]('oops.context');
var PROVIDER_TYPE = Symbol["for"]('oops.provider');
var FRAGMENTS_TYPE = Symbol["for"]('oops.fragments');

var emptyNode = createVnode('', {}, [], undefined, undefined);
function isVnode(vnode) {
  return vnode.tag !== undefined;
}
function isComponent(vnode) {
  return typeof vnode.tag === 'function';
}
function sameVnode(a, b) {
  return a.key === b.key && a.tag === b.tag;
}
function isFragment(vnode) {
  return vnode && vnode.tag === FRAGMENTS_TYPE;
}
function isFilterVnode(vnode) {
  return vnode === null || typeof vnode === 'boolean' || typeof vnode === 'undefined';
}
function isPrimitiveVnode(vnode) {
  return typeof vnode === 'string' || typeof vnode === 'number' || _typeof(vnode) === 'symbol';
}

var classList = ['add', 'remove'];
var style = ['setProperty', 'removeProperty'];
var namespaces = ['setAttribute', 'setAttributeNS', 'removeAttribute', 'addEventListener', 'removeEventListener'];

var empty = function empty(key) {
  if (key === 'key') return;
  console.error('Cannot operate on fragment element.');
};

var installMethods = function installMethods(obj, methods) {
  methods.forEach(function (name) {
    return obj[name] = empty;
  });
};

var FragmentNode =
/*#__PURE__*/
function () {
  function FragmentNode() {
    _classCallCheck(this, FragmentNode);

    this._children = [];
    this.parentNode = null;
    this._isFragmentNode = true;
    this.style = {};
    this.classList = {};
    installMethods(this, namespaces);
    installMethods(this.style, style);
    installMethods(this.classList, classList);
  }

  _createClass(FragmentNode, [{
    key: "realParentNode",
    value: function realParentNode() {
      return this.parentNode._isFragmentNode ? this.parentNode.realParentNode() : this.parentNode;
    }
  }, {
    key: "appendChild",
    value: function appendChild(child) {
      if (child) {
        if (child._isFragmentNode) {
          child.parentNode = this;
        }

        this._children.push(child);
      }
    }
  }, {
    key: "removeChild",
    value: function removeChild$1(child) {
      var index = this._children.indexOf(child);

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
  }, {
    key: "insertBefore",
    value: function insertBefore$1(newNode, referenceNode) {
      var referenceIndex = this._children.indexOf(referenceNode);

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
  }, {
    key: "appendSelfInParent",
    value: function appendSelfInParent(parentNode) {
      this.parentNode = parentNode;

      if (parentNode._isFragmentNode) {
        parentNode.appendChild(this);
      } else {
        var nodes = this.nodes;

        for (var i = 0; i < nodes.length; i++) {
          appendChild(parentNode, nodes[i]);
        }
      }
    }
  }, {
    key: "removeSelfInParent",
    value: function removeSelfInParent(parentNode) {
      var nodes = this.nodes;

      for (var i = 0; i < nodes.length; i++) {
        parentNode._isFragmentNode ? parentNode.removeChild(nodes[i]) : removeChild(parentNode, nodes[i]);
      }

      this.parentNode = null;
    }
  }, {
    key: "insertBeforeSelfInParent",
    value: function insertBeforeSelfInParent(parentNode, referenceNode) {
      this.parentNode = parentNode;

      if (parentNode._isFragmentNode) {
        parentNode.insertBefore(this, referenceNode);
      } else {
        if (referenceNode && referenceNode._isFragmentNode) {
          referenceNode = referenceNode.first;
        }

        var nodes = this.nodes;

        for (var i = 0; i < nodes.length; i++) {
          insertBefore(parentNode, nodes[i], referenceNode);
        }
      }
    }
  }, {
    key: "first",
    get: function get() {
      return this.nodes[0];
    }
  }, {
    key: "last",
    get: function get() {
      var nodes = this.nodes;
      return nodes[nodes.length - 1];
    }
  }, {
    key: "tagName",
    get: function get() {
      return FRAGMENTS_TYPE;
    }
  }, {
    key: "nextSibling",
    get: function get() {
      var last = this.last;
      return last ? nextSibling(last) : null;
    }
  }, {
    key: "nodes",
    get: function get() {
      var ls = [];

      for (var i = 0; i < this._children.length; i++) {
        var node = this._children[i];

        if (node._isFragmentNode) {
          ls.push.apply(ls, node.nodes);
        } else {
          ls.push(node);
        }
      }

      return ls;
    }
  }]);

  return FragmentNode;
}();

function createKeyToOldIdx(children, beginIdx, endIdx) {
  var map = {},
      key,
      ch;

  for (var i = beginIdx; i <= endIdx; ++i) {
    ch = children[i];

    if (ch != null) {
      key = ch.key;
      if (key !== undefined) map[key] = i;
    }
  }

  return map;
}
function invokeCreateHooks(vnode, insertedVnodeQueue) {
  var i;

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
  var i, j;
  var data = vnode.data;

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
      var parent = parentNode$1(childElm);
      removeChild$1(parent, childElm);
    }
  };
}
function formatPatchRootVnode(vnode) {
  if (isPrimitiveVnode(vnode)) {
    vnode = createVnode(undefined, undefined, undefined, vnode, undefined);
  }

  if (isArray(vnode)) {
    vnode = createFragmentVnode(vnode);
    console.error('Aadjacent JSX elements must be wrapped in an enclosing tag. Did you want a JSX fragment <>...</>?');
  }

  return vnode;
}
function nextSibling$1(node) {
  return node._isFragmentNode ? node.nextSibling : nextSibling(node);
}
function parentNode$1(node) {
  return node._isFragmentNode ? node.parentNode : parentNode(node);
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
  var i = vnode.data;

  if (isDef(i)) {
    if (isDef(i = i.hook) && isDef(i = i.init)) {
      i(vnode);
    }

    return isDef(vnode.component);
  }

  return false;
}
function createElm(vnode, insertedVnodeQueue) {
  if (createComponent(vnode)) {
    return vnode.elm;
  }

  var tag = vnode.tag,
      data = vnode.data,
      children = vnode.children;

  if (isDef(tag)) {
    var elm;

    if (isFragment(vnode)) {
      elm = vnode.elm = new FragmentNode();
    } else {
      elm = vnode.elm = isDef(data) && isDef(data.ns) ? createElementNS(data.ns, tag) : createElement(tag);
    }

    if (isArray(children)) {
      for (var i = 0; i < children.length; i++) {
        var chVNode = children[i];

        if (chVNode != null) {
          appendChild$1(elm, createElm(chVNode, insertedVnodeQueue));
        }
      }
    } else if (isPrimitiveVnode(vnode.text)) {
      appendChild(elm, createTextNode(vnode.text));
    }

    invokeCreateHooks(vnode, insertedVnodeQueue);
  } else {
    vnode.elm = createTextNode(vnode.text);
  }

  return vnode.elm;
}

function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
  for (; startIdx <= endIdx; ++startIdx) {
    var ch = vnodes[startIdx];

    if (ch != null) {
      insertBefore$1(parentElm, createElm(ch, insertedVnodeQueue), before);
    }
  }
}

function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; startIdx++) {
    var i = void 0,
        rm = void 0,
        listeners = void 0;
    var ch = vnodes[startIdx];

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
  var oldStartIdx = 0,
      newStartIdx = 0;
  var oldEndIdx = oldCh.length - 1;
  var oldStartVnode = oldCh[0];
  var oldEndVnode = oldCh[oldEndIdx];
  var newEndIdx = newCh.length - 1;
  var newStartVnode = newCh[0];
  var newEndVnode = newCh[newEndIdx];
  var oldKeyToIdx;
  var idxInOld;
  var elmToMove;
  var before;

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
      before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
      addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
    } else {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }
  }
}

function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
  var i, hook;

  if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
    i(oldVnode, vnode);
  }

  var elm = vnode.elm = oldVnode.elm;
  var oldCh = oldVnode.children;
  var ch = vnode.children;
  if (oldVnode === vnode) return;

  if (isDef(vnode.data)) {
    for (i = 0; i < cbs.update.length; ++i) {
      cbs.update[i](oldVnode, vnode);
    }

    i = vnode.data.hook;
    if (isDef(i) && isDef(i = i.update)) i(oldVnode, vnode);
  }

  if (isComponent(oldVnode) || isComponent(vnode)) ; else if (isUndef(vnode.text)) {
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
  var insertedVnodeQueue = [];

  for (var i = 0; i < cbs.pre.length; i++) {
    cbs.pre[i]();
  }

  if (isUndef(oldVnode)) {
    createElm(vnode, insertedVnodeQueue);
  } else {
    if (sameVnode(oldVnode, vnode)) {
      patchVnode(oldVnode, vnode, insertedVnodeQueue);
    } else {
      var elm = oldVnode.elm;
      var parent = parentNode$1(elm);
      createElm(vnode, insertedVnodeQueue);

      if (parent !== null) {
        insertBefore$1(parent, vnode.elm, nextSibling$1(elm));
        removeVnodes(parent, [oldVnode], 0, 0);
      }
    }
  }

  for (var _i = 0; _i < insertedVnodeQueue.length; _i++) {
    insertedVnodeQueue[_i].data.hook.insert(insertedVnodeQueue[_i]);
  }

  for (var _i2 = 0; _i2 < cbs.post.length; ++_i2) {
    cbs.post[_i2]();
  }

  return vnode;
}

function mergeProps(_ref) {
  var data = _ref.data,
      children = _ref.children;
  var res = {
    children: children
  };

  for (var key in data) {
    if (key !== 'hook') {
      res[key] = data[key];
    }
  }

  return res;
}
function enqueueTask(callback) {
  var channel = new MessageChannel();
  channel.port1.onmessage = callback;
  channel.port2.postMessage(undefined);
}
function equalDeps(a, b) {
  if (isArray(a) && isArray(b)) {
    if (a.length === 0 && b.length === 0) return true;
    if (a.length !== b.length) return false;
    return !b.some(function (v, i) {
      return v !== a[i];
    });
  }

  return false;
}
function callEffectCallback(create, destroy, effect) {
  if (typeof destroy === 'function') destroy();
  var cleanup = create();

  if (isDef(cleanup) && typeof cleanup !== 'function') {
    throw new Error('An effect function must not return anything besides a function, which is used for clean-up.');
  }

  effect.destroy = cleanup;
}
function updateEffect(effects) {
  for (var key in effects) {
    var _effects$key = effects[key],
        deps = _effects$key.deps,
        prevDeps = _effects$key.prevDeps,
        create = _effects$key.create,
        destroy = _effects$key.destroy;

    if (!equalDeps(deps, prevDeps)) {
      callEffectCallback(create, destroy, effects[key]);
    }
  }
}

var RE_RENDER_LIMIT = 25;
var Target = {
  component: undefined
};
var Component =
/*#__PURE__*/
function () {
  function Component(vnode) {
    _classCallCheck(this, Component);

    this.cursor = 0;
    this.preProps = {};
    this.vnode = vnode;
    this.Ctor = vnode.tag;
    this.dependencies = null;
    this.numberOfReRenders = 0;
    this.updateVnode = undefined;
    this.rootVnode = undefined;
    this.state = Object.create(null);
    this.memos = Object.create(null);
    this.effects = Object.create(null);
  }

  _createClass(Component, [{
    key: "setState",
    value: function setState(partialState) {
      var key = this.cursor++;

      if (this.state[key]) {
        return [this.state[key], key];
      }

      this.state[key] = partialState;
      return [partialState, key];
    }
  }, {
    key: "useEffect",
    value: function useEffect(create, deps) {
      var destroy = undefined;
      var prevDeps = undefined;
      var key = this.cursor++;
      var prevEffect = this.effects[key];

      if (prevEffect) {
        destroy = prevEffect.destroy;
        prevDeps = prevEffect.deps;
      }

      this.effects[key] = {
        deps: deps,
        prevDeps: prevDeps,
        create: create,
        destroy: destroy
      };
    }
  }, {
    key: "useReducer",
    value: function useReducer(payload, key, reducer) {
      var newValue = reducer(this.state[key], payload);
      this.state[key] = newValue;
      this.forceUpdate();
    }
  }, {
    key: "useMemo",
    value: function useMemo(create, deps) {
      var key = this.cursor++;
      var memoized = this.memos[key] || (this.memos[key] = []);

      if (equalDeps(memoized[1], deps)) {
        return memoized[0];
      } else {
        memoized[1] = deps;
        return memoized[0] = create();
      }
    }
  }, {
    key: "createVnodeByCtor",
    value: function createVnodeByCtor(isSync) {
      this.numberOfReRenders++;
      this.inspectReRender();

      try {
        if (!isSync) {
          this.patch();
        }

        Target.component = this;
        this.props = mergeProps(this.vnode);
        this.updateVnode = formatPatchRootVnode(this.Ctor(this.props));

        if (isUndef(this.updateVnode)) {
          throw new Error('Nothing was returned from render.' + 'This usually means a return statement is missing.' + 'Or, to render nothing, return null.');
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
  }, {
    key: "syncPatch",
    value: function syncPatch() {
      var _this = this;

      if (this.updateVnode !== null) {
        this.rootVnode = patch(this.rootVnode, this.updateVnode);
        this.vnode.elm = this.rootVnode.elm;
        this.updateVnode = undefined;
        enqueueTask(function () {
          updateEffect(_this.effects);
        });
      }
    }
  }, {
    key: "patch",
    value: function patch$1() {
      var _this2 = this;

      if (!this.updateVnode) {
        enqueueTask(function () {
          if (_this2.updateVnode !== null) {
            _this2.rootVnode = patch(_this2.rootVnode, _this2.updateVnode);
            _this2.vnode.elm = _this2.rootVnode.elm;
            _this2.updateVnode = undefined;
            updateEffect(_this2.effects);
          }
        });
      }
    }
  }, {
    key: "inspectReRender",
    value: function inspectReRender() {
      if (this.numberOfReRenders > RE_RENDER_LIMIT) {
        throw new Error('Too many re-renders. Oops limits the number of renders to prevent an infinite loop.');
      }
    }
  }, {
    key: "forceUpdate",
    value: function forceUpdate() {
      this.createVnodeByCtor(false);
    }
  }, {
    key: "init",
    value: function init() {
      this.createVnodeByCtor(true);
    }
  }, {
    key: "update",
    value: function update(oldVnode, vnode) {
      this.vnode = vnode;
      this.createVnodeByCtor(false);
    }
  }, {
    key: "postpatch",
    value: function postpatch(oldVnode, vnode) {}
  }, {
    key: "remove",
    value: function remove(vnode, rm) {
      rm();
    }
  }, {
    key: "destroy",
    value: function destroy(vnode) {
      for (var key in this.effects) {
        var destroy = this.effects[key].destroy;

        if (typeof destroy === 'function') {
          destroy();
        }
      }
    }
  }]);

  return Component;
}();

function createComponentInstanceForVnode(vnode) {
  if (isUndef(vnode.component)) {
    vnode.component = new Component(vnode);
    vnode.component.init();
  }
}

var componentVNodeHooks = {
  init: function init(vnode) {
    if (isComponent(vnode)) {
      createComponentInstanceForVnode(vnode);
    }
  },
  prepatch: function prepatch(oldVnode, vnode) {
    var component = vnode.component = oldVnode.component;
    component.vnode = vnode;
  },
  update: function update(oldVnode, vnode) {
    vnode.component.update(oldVnode, vnode);
  },
  postpatch: function postpatch(oldVnode, vnode) {
    vnode.component.postpatch(oldVnode, vnode);
  },
  remove: function remove(vnode, rm) {
    vnode.component.remove(vnode, rm);
  },
  destroy: function destroy(vnode) {
    vnode.component.destroy(vnode);
  }
};

function cached(fn) {
  var cache = Object.create(null);
  return function wraper(str) {
    var hit = cache[str];
    return hit || (cached[str] = fn(str));
  };
}

var parseClassText = cached(function (klass) {
  var res = {};

  if (klass.indexOf(' ') > -1) {
    var list = klass.split(' ');

    for (var i = 0; i < list.length; ++i) {
      if (list[i]) {
        res[list[i]] = true;
      }
    }
  } else {
    res[klass] = true;
  }

  return res;
});
var parseStyleText = cached(function (cssText) {
  var res = {};
  var listDelimiter = /;(?![^(]*\))/g;
  var propertyDelimiter = /:(.+)/;
  var items = cssText.split(listDelimiter);

  for (var i = 0; i < items.length; i++) {
    if (items[i]) {
      var tmp = items[i].split(propertyDelimiter);

      if (tmp.length > 1) {
        var name = tmp[0].trim();
        var value = tmp[1].trim();

        if ((name === 'delayed' || name === 'remove') && typeof value === 'string') {
          res[name] = new Function('return ' + value)();
        } else {
          res[name] = value;
        }
      }
    }
  }

  return res;
});

function addNS(data, children, tag) {
  data.ns = 'http://www.w3.org/2000/svg';

  if (tag !== 'foreignObject' && isDef(children)) {
    for (var i = 0; i < children.length; i++) {
      var childData = children[i].data;

      if (isDef(childData)) {
        addNS(childData, children[i].children, children[i].tag);
      }
    }
  }
}

function isProps(key) {
  return key === 'href' || key === 'value' || key === 'checked' || key === 'disabled';
}

function dealWithDataValue(data, key, value) {
  var assert = function assert(name) {
    return isUndef(data[name]) && (data[name] = {});
  };

  switch (key) {
    case 'class':
      data["class"] = typeof value === 'string' ? parseClassText(value) : value;
      break;

    case 'style':
      data.style = typeof value === 'string' ? parseStyleText(value) : value;
      break;

    case 'hook':
      data.hook = value;
      break;

    case 'props':
      assert('props');
      data.props[value[0]] = value[1];
      break;

    case 'event':
      assert('on');
      data.on[value[0].slice(2).toLocaleLowerCase()] = value[1];
      break;

    case 'singleDataset':
      assert('dataset');
      data.dataset[value[0].slice(5)] = value[1];
      break;

    case 'singleAttr':
      assert('attrs');
      data.attrs[value[0]] = value[1];
      break;

    case 'on':
    case 'attrs':
    case 'dataset':
      if (_typeof(value) === 'object') {
        data[key] = value;
      }

      break;
  }
}

function separateProps(props) {
  var data = {};

  if (props) {
    for (var key in props) {
      var value = props[key];

      if (key === 'on' || key === 'attrs' || key === 'class' || key === 'style' || key === 'dataset') ; else if (key === 'className') {
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

  return data;
}
function installHooks(data) {
  var hook = (data || (data = {})).hook || (data.hook = {});

  for (var name in componentVNodeHooks) {
    hook[name] = componentVNodeHooks[name];
  }

  return data;
}
function formatVnode(tag, data, children) {
  if (children.length > 0) {
    for (var i = 0; i < children.length; i++) {
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

  return createVnode(tag, data, children, undefined, undefined);
}

function inspectedElemntType(tag, props, children) {
  if (_typeof(tag) === 'object') {
    switch (tag.$$typeof) {
      case PROVIDER_TYPE:
        if (typeof tag !== 'function') {
          var ContextProvider = function ContextProvider(_ref) {
            var value = _ref.value,
                children = _ref.children;

            context._contextStack.push(value);

            return createVnode(FRAGMENTS_TYPE, {}, children, undefined, undefined);
          };

          var context = tag._context;
          ContextProvider.$$typeof = tag.$$typeof;
          ContextProvider._context = tag._context;
          tag = ContextProvider;
        }

        break;
    }
  }

  return {
    tag: tag,
    props: props,
    children: children
  };
}

function createVnode(tag, data, children, text, elm) {
  var component = undefined;
  var key = data ? data.key : undefined;
  return {
    tag: tag,
    data: data,
    children: children,
    key: key,
    elm: elm,
    text: text,
    component: component
  };
}
function createFragmentVnode(children) {
  return formatVnode(FRAGMENTS_TYPE, {}, children);
}
function h(tag, props) {
  for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }

  if (tag === '') tag = FRAGMENTS_TYPE;
  children = flatMap(children, function (v) {
    return v;
  }, function (v) {
    return v !== null && _typeof(v) === 'object' && typeof v[Symbol.iterator] === 'function';
  });

  var _inspectedElemntType = inspectedElemntType(tag, props, children),
      _tag = _inspectedElemntType.tag,
      _props = _inspectedElemntType.props,
      _children = _inspectedElemntType.children;

  var data = typeof _tag === 'string' || _tag === FRAGMENTS_TYPE ? separateProps(_props) : installHooks(_props);
  return formatVnode(_tag, data, _children);
}

var MODE_SLASH = 0;
var MODE_TEXT = 1;
var MODE_WHITESPACE = 2;
var MODE_TAGNAME = 3;
var MODE_COMMENT = 4;
var MODE_PROP_SET = 5;
var MODE_PROP_APPEND = 6;
var TAG_SET = 1;
var CHILD_APPEND = 0;
var CHILD_RECURSE = 2;
var PROPS_ASSIGN = 3;
var PROP_SET = MODE_PROP_SET;
var PROP_APPEND = MODE_PROP_APPEND;

var isProps$1 = function isProps(mode) {
  return mode >= MODE_PROP_SET;
};

function build(statics) {
  var propName;
  var quote = '';
  var buffer = '';
  var scope = [];
  var mode = MODE_TEXT;
  scope.parent = null;

  var commit = function commit(field) {
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
      if (buffer || !field && mode === MODE_PROP_SET) {
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

  for (var i = 0; i < statics.length; i++) {
    if (i > 0) {
      if (mode === MODE_TEXT) {
        commit();
      }

      commit(i);
    }

    for (var j = 0; j < statics[i].length; j++) {
      var _char = statics[i][j];

      if (mode === MODE_TEXT) {
        if (_char === '<') {
          commit();
          var current = [];
          current.parent = scope;
          scope = current;
          mode = MODE_TAGNAME;
        } else {
          buffer += _char;
        }
      } else if (mode === MODE_COMMENT) {
        if (buffer === '--' && _char === '>') {
          mode = MODE_TEXT;
          buffer = '';
        } else {
          buffer = _char + buffer[0];
        }
      } else if (quote) {
        if (_char === quote) {
          quote = '';
        } else {
          buffer += _char;
        }
      } else if (_char === '"' || _char === "'") {
        quote = _char;
      } else if (_char === '>') {
        commit();
        mode = MODE_TEXT;
      } else if (mode === MODE_SLASH) ; else if (_char === '=') {
        mode = MODE_PROP_SET;
        propName = buffer;
        buffer = '';
      } else if (_char === '/' && (!isProps$1(mode) || statics[i][j + 1] === '>')) {
        commit();

        if (mode === MODE_TAGNAME) {
          scope = scope.parent;
        }

        mode = scope;
        scope = scope.parent;
        scope.push([CHILD_RECURSE, mode]);
        mode = MODE_SLASH;
      } else if (_char === ' ' || _char === '\t' || _char === '\n' || _char === '\r') {
        commit();
        mode = MODE_WHITESPACE;
      } else {
        buffer += _char;
      }

      if (mode === MODE_TAGNAME && buffer === '!--') {
        mode = MODE_COMMENT;
        scope = scope.parent;
      }
    }
  }

  commit();
  return scope;
}
function evaluate(h, built, fields, args) {
  for (var i = 0; i < built.length; i++) {
    var _built$i = _slicedToArray(built[i], 3),
        type = _built$i[0],
        name = _built$i[1],
        prop = _built$i[2];

    var field = prop === undefined ? name : prop;
    var value = typeof field === 'number' ? fields[field - 1] : field;

    if (type === TAG_SET) {
      args[0] = value;
    } else if (type === PROPS_ASSIGN) {
      args[1] = Object.assign(args[1] || {}, value);
    } else if (type === PROP_SET) {
      (args[1] = args[1] || {})[name] = value;
    } else if (type === PROP_APPEND) {
      args[1][name] += value + '';
    } else if (type === CHILD_RECURSE) {
      args.push(h.apply(null, evaluate(h, value, fields, ['', null])));
    } else if (type === CHILD_APPEND) {
      args.push(value);
    }
  }

  return args;
}

var CACHE = new Map();

var getCache = function getCache(statics) {
  var tpl = CACHE.get(statics);

  if (!tpl) {
    CACHE.set(statics, tpl = build(statics));
  }

  return tpl;
};

function createVNodeTree(h, statics, fields) {
  var result = evaluate(h, getCache(statics), fields, []);
  return result.length > 1 ? result : result[0];
}
function jsx(statics) {
  for (var _len = arguments.length, fields = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    fields[_key - 1] = arguments[_key];
  }

  return createVNodeTree(h, statics, fields);
}

function memo(component, areEqual) {}

function render(vnode, app, callback) {
  if (app) {
    vnode = formatPatchRootVnode(vnode);

    if (isVnode(vnode)) {
      vnode = patch(undefined, vnode);
      var elm = vnode.elm || null;
      elm && appendChild$1(app, elm);

      if (typeof callback === 'function') {
        callback(elm);
      }

      return vnode;
    } else {
      throw new Error('The first parameter of the render function should be vnode.');
    }
  } else {
    throw new Error('Target container is not a DOM element.');
  }
}

var MAX_SIGNED_31_BIT_INT = 1073741823;
function readContext(currentlyComponent, context, observedBits) {

  var resolvedObservedBits;

  if (typeof observedBits !== 'number' || observedBits === MAX_SIGNED_31_BIT_INT) {
    resolvedObservedBits = MAX_SIGNED_31_BIT_INT;
  } else {
    resolvedObservedBits = observedBits;
  }

  var item = {
    component: currentlyComponent,
    observedBits: resolvedObservedBits
  };

  if (context._dependencies === null) {
    context._dependencies = [item];
  } else {
    context._dependencies.push(item);
  }

  return context._currentValue;
}

var ContextStack =
/*#__PURE__*/
function () {
  function ContextStack(context, defaultValue) {
    _classCallCheck(this, ContextStack);

    this.context = context;
    this.valueStack = [defaultValue];
  }

  _createClass(ContextStack, [{
    key: "push",
    value: function push(value) {
      this.valueStack.push(value);
      this.context._currentValue = value;
    }
  }, {
    key: "pop",
    value: function pop() {
      this.context._currentValue = this.valueStack.shift();
    }
  }, {
    key: "reset",
    value: function reset() {
      var defaultValue = this.valueStack[0];
      this.context._currentValue = defaultValue;
      this.valueStack = [defaultValue];
    }
  }]);

  return ContextStack;
}();

function createContext(defaultValue, calculateChangedBits) {
  if (calculateChangedBits === undefined) {
    calculateChangedBits = null;
  } else {
    if (calculateChangedBits !== null && typeof calculateChangedBits !== 'function') {
      throw new Error('createContext: Expected the optional second argument to be a function.');
    }
  }

  var context = {
    $$typeof: CONTEXT_TYPE,
    _dependencies: null,
    _currentValue: defaultValue,
    _calculateChangedBits: calculateChangedBits,
    Provider: null,
    Consumer: null
  };
  context.Provider = {
    $$typeof: PROVIDER_TYPE,
    _context: context
  };
  var Consumer = {
    $$typeof: CONTEXT_TYPE,
    _context: context,
    _calculateChangedBits: context._calculateChangedBits
  };
  Object.defineProperties(Consumer, {
    Provider: {
      get: function get() {
        console.error('Rendering <Context.Consumer.Provider> is not supported and will be removed in ' + 'a future major release. Did you mean to render <Context.Provider> instead?');
        return context.Provider;
      },
      set: function set(_Provider) {
        context.Provider = _Provider;
      }
    },
    _currentValue: {
      get: function get() {
        return context._currentValue;
      },
      set: function set(_currentValue) {
        context._currentValue = _currentValue;
      }
    },
    Consumer: {
      get: function get() {
        console.error(false, 'Rendering <Context.Consumer.Consumer> is not supported and will be removed in ' + 'a future major release. Did you mean to render <Context.Consumer> instead?');
        return context.Consumer;
      }
    }
  });
  context.Consumer = Consumer;
  context._contextStack = new ContextStack(context, defaultValue);
  return context;
}

function resolveTargetComponent() {
  if (Target.component === undefined) {
    throw new Error('Invalid hook call. Hooks can only be called inside of the body of a function component.');
  }

  return Target.component;
}

function useEffect(effect, deps) {
  var component = resolveTargetComponent();
  return component.useEffect(effect, deps);
}
function useMemo(create, deps) {
  var component = resolveTargetComponent();
  return component.useMemo(create, deps);
}
function useCallback(callback, deps) {
  return useMemo(function () {
    return callback;
  }, deps);
}
function useContext(context, observedBits) {
  var component = resolveTargetComponent();
  return readContext(component, context, observedBits);
}
function useState(initialState) {
  var update = function update(oldValue, newValue) {
    return typeof newValue === 'function' ? newValue(oldValue) : newValue;
  };

  return useReducer(update, initialState);
}
function useReducer(reducer, initialArg, init) {
  var component = resolveTargetComponent();

  var _component$setState = component.setState(typeof init === 'function' ? init(initialArg) : initialArg),
      _component$setState2 = _slicedToArray(_component$setState, 2),
      state = _component$setState2[0],
      key = _component$setState2[1];

  return [state, function (value) {
    return component.useReducer(value, key, reducer);
  }];
}

var oops = {
  h: h,
  jsx: jsx,
  memo: memo,
  render: render,
  Fragment: FRAGMENTS_TYPE,
  useMemo: useMemo,
  useState: useState,
  useEffect: useEffect,
  useContext: useContext,
  useReducer: useReducer,
  useCallback: useCallback,
  createContext: createContext
};

exports.Fragment = FRAGMENTS_TYPE;
exports.createContext = createContext;
exports.default = oops;
exports.h = h;
exports.jsx = jsx;
exports.memo = memo;
exports.render = render;
exports.useCallback = useCallback;
exports.useContext = useContext;
exports.useEffect = useEffect;
exports.useMemo = useMemo;
exports.useReducer = useReducer;
exports.useState = useState;
