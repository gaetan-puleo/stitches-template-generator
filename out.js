(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // node_modules/atoa/atoa.js
  var require_atoa = __commonJS({
    "node_modules/atoa/atoa.js"(exports, module) {
      module.exports = function atoa(a, n) {
        return Array.prototype.slice.call(a, n);
      };
    }
  });

  // node_modules/ticky/ticky-browser.js
  var require_ticky_browser = __commonJS({
    "node_modules/ticky/ticky-browser.js"(exports, module) {
      var si = typeof setImmediate === "function";
      var tick;
      if (si) {
        tick = function(fn) {
          setImmediate(fn);
        };
      } else {
        tick = function(fn) {
          setTimeout(fn, 0);
        };
      }
      module.exports = tick;
    }
  });

  // node_modules/contra/debounce.js
  var require_debounce = __commonJS({
    "node_modules/contra/debounce.js"(exports, module) {
      "use strict";
      var ticky = require_ticky_browser();
      module.exports = function debounce(fn, args, ctx) {
        if (!fn) {
          return;
        }
        ticky(function run() {
          fn.apply(ctx || null, args || []);
        });
      };
    }
  });

  // node_modules/contra/emitter.js
  var require_emitter = __commonJS({
    "node_modules/contra/emitter.js"(exports, module) {
      "use strict";
      var atoa = require_atoa();
      var debounce = require_debounce();
      module.exports = function emitter(thing, options) {
        var opts = options || {};
        var evt = {};
        if (thing === void 0) {
          thing = {};
        }
        thing.on = function(type, fn) {
          if (!evt[type]) {
            evt[type] = [fn];
          } else {
            evt[type].push(fn);
          }
          return thing;
        };
        thing.once = function(type, fn) {
          fn._once = true;
          thing.on(type, fn);
          return thing;
        };
        thing.off = function(type, fn) {
          var c = arguments.length;
          if (c === 1) {
            delete evt[type];
          } else if (c === 0) {
            evt = {};
          } else {
            var et = evt[type];
            if (!et) {
              return thing;
            }
            et.splice(et.indexOf(fn), 1);
          }
          return thing;
        };
        thing.emit = function() {
          var args = atoa(arguments);
          return thing.emitterSnapshot(args.shift()).apply(this, args);
        };
        thing.emitterSnapshot = function(type) {
          var et = (evt[type] || []).slice(0);
          return function() {
            var args = atoa(arguments);
            var ctx = this || thing;
            if (type === "error" && opts.throws !== false && !et.length) {
              throw args.length === 1 ? args[0] : args;
            }
            et.forEach(function emitter2(listen) {
              if (opts.async) {
                debounce(listen, args, ctx);
              } else {
                listen.apply(ctx, args);
              }
              if (listen._once) {
                thing.off(type, listen);
              }
            });
            return thing;
          };
        };
        return thing;
      };
    }
  });

  // node_modules/custom-event/index.js
  var require_custom_event = __commonJS({
    "node_modules/custom-event/index.js"(exports, module) {
      var NativeCustomEvent = global.CustomEvent;
      function useNative() {
        try {
          var p = new NativeCustomEvent("cat", { detail: { foo: "bar" } });
          return "cat" === p.type && "bar" === p.detail.foo;
        } catch (e) {
        }
        return false;
      }
      module.exports = useNative() ? NativeCustomEvent : (
        // IE >= 9
        "undefined" !== typeof document && "function" === typeof document.createEvent ? function CustomEvent(type, params) {
          var e = document.createEvent("CustomEvent");
          if (params) {
            e.initCustomEvent(type, params.bubbles, params.cancelable, params.detail);
          } else {
            e.initCustomEvent(type, false, false, void 0);
          }
          return e;
        } : (
          // IE <= 8
          function CustomEvent(type, params) {
            var e = document.createEventObject();
            e.type = type;
            if (params) {
              e.bubbles = Boolean(params.bubbles);
              e.cancelable = Boolean(params.cancelable);
              e.detail = params.detail;
            } else {
              e.bubbles = false;
              e.cancelable = false;
              e.detail = void 0;
            }
            return e;
          }
        )
      );
    }
  });

  // node_modules/crossvent/src/eventmap.js
  var require_eventmap = __commonJS({
    "node_modules/crossvent/src/eventmap.js"(exports, module) {
      "use strict";
      var eventmap = [];
      var eventname = "";
      var ron = /^on/;
      for (eventname in global) {
        if (ron.test(eventname)) {
          eventmap.push(eventname.slice(2));
        }
      }
      module.exports = eventmap;
    }
  });

  // node_modules/crossvent/src/crossvent.js
  var require_crossvent = __commonJS({
    "node_modules/crossvent/src/crossvent.js"(exports, module) {
      "use strict";
      var customEvent = require_custom_event();
      var eventmap = require_eventmap();
      var doc = global.document;
      var addEvent = addEventEasy;
      var removeEvent = removeEventEasy;
      var hardCache = [];
      if (!global.addEventListener) {
        addEvent = addEventHard;
        removeEvent = removeEventHard;
      }
      module.exports = {
        add: addEvent,
        remove: removeEvent,
        fabricate: fabricateEvent
      };
      function addEventEasy(el, type, fn, capturing) {
        return el.addEventListener(type, fn, capturing);
      }
      function addEventHard(el, type, fn) {
        return el.attachEvent("on" + type, wrap(el, type, fn));
      }
      function removeEventEasy(el, type, fn, capturing) {
        return el.removeEventListener(type, fn, capturing);
      }
      function removeEventHard(el, type, fn) {
        var listener = unwrap(el, type, fn);
        if (listener) {
          return el.detachEvent("on" + type, listener);
        }
      }
      function fabricateEvent(el, type, model) {
        var e = eventmap.indexOf(type) === -1 ? makeCustomEvent() : makeClassicEvent();
        if (el.dispatchEvent) {
          el.dispatchEvent(e);
        } else {
          el.fireEvent("on" + type, e);
        }
        function makeClassicEvent() {
          var e2;
          if (doc.createEvent) {
            e2 = doc.createEvent("Event");
            e2.initEvent(type, true, true);
          } else if (doc.createEventObject) {
            e2 = doc.createEventObject();
          }
          return e2;
        }
        function makeCustomEvent() {
          return new customEvent(type, { detail: model });
        }
      }
      function wrapperFactory(el, type, fn) {
        return function wrapper(originalEvent) {
          var e = originalEvent || global.event;
          e.target = e.target || e.srcElement;
          e.preventDefault = e.preventDefault || function preventDefault() {
            e.returnValue = false;
          };
          e.stopPropagation = e.stopPropagation || function stopPropagation() {
            e.cancelBubble = true;
          };
          e.which = e.which || e.keyCode;
          fn.call(el, e);
        };
      }
      function wrap(el, type, fn) {
        var wrapper = unwrap(el, type, fn) || wrapperFactory(el, type, fn);
        hardCache.push({
          wrapper,
          element: el,
          type,
          fn
        });
        return wrapper;
      }
      function unwrap(el, type, fn) {
        var i = find(el, type, fn);
        if (i) {
          var wrapper = hardCache[i].wrapper;
          hardCache.splice(i, 1);
          return wrapper;
        }
      }
      function find(el, type, fn) {
        var i, item;
        for (i = 0; i < hardCache.length; i++) {
          item = hardCache[i];
          if (item.element === el && item.type === type && item.fn === fn) {
            return i;
          }
        }
      }
    }
  });

  // node_modules/dragula/classes.js
  var require_classes = __commonJS({
    "node_modules/dragula/classes.js"(exports, module) {
      "use strict";
      var cache = {};
      var start = "(?:^|\\s)";
      var end = "(?:\\s|$)";
      function lookupClass(className) {
        var cached = cache[className];
        if (cached) {
          cached.lastIndex = 0;
        } else {
          cache[className] = cached = new RegExp(start + className + end, "g");
        }
        return cached;
      }
      function addClass(el, className) {
        var current = el.className;
        if (!current.length) {
          el.className = className;
        } else if (!lookupClass(className).test(current)) {
          el.className += " " + className;
        }
      }
      function rmClass(el, className) {
        el.className = el.className.replace(lookupClass(className), " ").trim();
      }
      module.exports = {
        add: addClass,
        rm: rmClass
      };
    }
  });

  // node_modules/dragula/dragula.js
  var require_dragula = __commonJS({
    "node_modules/dragula/dragula.js"(exports, module) {
      "use strict";
      var emitter = require_emitter();
      var crossvent = require_crossvent();
      var classes = require_classes();
      var doc = document;
      var documentElement = doc.documentElement;
      function dragula2(initialContainers, options) {
        var len = arguments.length;
        if (len === 1 && Array.isArray(initialContainers) === false) {
          options = initialContainers;
          initialContainers = [];
        }
        var _mirror;
        var _source;
        var _item;
        var _offsetX;
        var _offsetY;
        var _moveX;
        var _moveY;
        var _initialSibling;
        var _currentSibling;
        var _copy;
        var _renderTimer;
        var _lastDropTarget = null;
        var _grabbed;
        var o = options || {};
        if (o.moves === void 0) {
          o.moves = always;
        }
        if (o.accepts === void 0) {
          o.accepts = always;
        }
        if (o.invalid === void 0) {
          o.invalid = invalidTarget;
        }
        if (o.containers === void 0) {
          o.containers = initialContainers || [];
        }
        if (o.isContainer === void 0) {
          o.isContainer = never;
        }
        if (o.copy === void 0) {
          o.copy = false;
        }
        if (o.copySortSource === void 0) {
          o.copySortSource = false;
        }
        if (o.revertOnSpill === void 0) {
          o.revertOnSpill = false;
        }
        if (o.removeOnSpill === void 0) {
          o.removeOnSpill = false;
        }
        if (o.direction === void 0) {
          o.direction = "vertical";
        }
        if (o.ignoreInputTextSelection === void 0) {
          o.ignoreInputTextSelection = true;
        }
        if (o.mirrorContainer === void 0) {
          o.mirrorContainer = doc.body;
        }
        var drake = emitter({
          containers: o.containers,
          start: manualStart,
          end,
          cancel,
          remove,
          destroy,
          canMove,
          dragging: false
        });
        if (o.removeOnSpill === true) {
          drake.on("over", spillOver).on("out", spillOut);
        }
        events();
        return drake;
        function isContainer(el) {
          return drake.containers.indexOf(el) !== -1 || o.isContainer(el);
        }
        function events(remove2) {
          var op = remove2 ? "remove" : "add";
          touchy(documentElement, op, "mousedown", grab);
          touchy(documentElement, op, "mouseup", release);
        }
        function eventualMovements(remove2) {
          var op = remove2 ? "remove" : "add";
          touchy(documentElement, op, "mousemove", startBecauseMouseMoved);
        }
        function movements(remove2) {
          var op = remove2 ? "remove" : "add";
          crossvent[op](documentElement, "selectstart", preventGrabbed);
          crossvent[op](documentElement, "click", preventGrabbed);
        }
        function destroy() {
          events(true);
          release({});
        }
        function preventGrabbed(e) {
          if (_grabbed) {
            e.preventDefault();
          }
        }
        function grab(e) {
          _moveX = e.clientX;
          _moveY = e.clientY;
          var ignore = whichMouseButton(e) !== 1 || e.metaKey || e.ctrlKey;
          if (ignore) {
            return;
          }
          var item = e.target;
          var context = canStart(item);
          if (!context) {
            return;
          }
          _grabbed = context;
          eventualMovements();
          if (e.type === "mousedown") {
            if (isInput(item)) {
              item.focus();
            } else {
              e.preventDefault();
            }
          }
        }
        function startBecauseMouseMoved(e) {
          if (!_grabbed) {
            return;
          }
          if (whichMouseButton(e) === 0) {
            release({});
            return;
          }
          if (e.clientX !== void 0 && Math.abs(e.clientX - _moveX) <= (o.slideFactorX || 0) && (e.clientY !== void 0 && Math.abs(e.clientY - _moveY) <= (o.slideFactorY || 0))) {
            return;
          }
          if (o.ignoreInputTextSelection) {
            var clientX = getCoord("clientX", e) || 0;
            var clientY = getCoord("clientY", e) || 0;
            var elementBehindCursor = doc.elementFromPoint(clientX, clientY);
            if (isInput(elementBehindCursor)) {
              return;
            }
          }
          var grabbed = _grabbed;
          eventualMovements(true);
          movements();
          end();
          start(grabbed);
          var offset = getOffset(_item);
          _offsetX = getCoord("pageX", e) - offset.left;
          _offsetY = getCoord("pageY", e) - offset.top;
          classes.add(_copy || _item, "gu-transit");
          renderMirrorImage();
          drag(e);
        }
        function canStart(item) {
          if (drake.dragging && _mirror) {
            return;
          }
          if (isContainer(item)) {
            return;
          }
          var handle = item;
          while (getParent(item) && isContainer(getParent(item)) === false) {
            if (o.invalid(item, handle)) {
              return;
            }
            item = getParent(item);
            if (!item) {
              return;
            }
          }
          var source = getParent(item);
          if (!source) {
            return;
          }
          if (o.invalid(item, handle)) {
            return;
          }
          var movable = o.moves(item, source, handle, nextEl(item));
          if (!movable) {
            return;
          }
          return {
            item,
            source
          };
        }
        function canMove(item) {
          return !!canStart(item);
        }
        function manualStart(item) {
          var context = canStart(item);
          if (context) {
            start(context);
          }
        }
        function start(context) {
          if (isCopy(context.item, context.source)) {
            _copy = context.item.cloneNode(true);
            drake.emit("cloned", _copy, context.item, "copy");
          }
          _source = context.source;
          _item = context.item;
          _initialSibling = _currentSibling = nextEl(context.item);
          drake.dragging = true;
          drake.emit("drag", _item, _source);
        }
        function invalidTarget() {
          return false;
        }
        function end() {
          if (!drake.dragging) {
            return;
          }
          var item = _copy || _item;
          drop(item, getParent(item));
        }
        function ungrab() {
          _grabbed = false;
          eventualMovements(true);
          movements(true);
        }
        function release(e) {
          ungrab();
          if (!drake.dragging) {
            return;
          }
          var item = _copy || _item;
          var clientX = getCoord("clientX", e) || 0;
          var clientY = getCoord("clientY", e) || 0;
          var elementBehindCursor = getElementBehindPoint(_mirror, clientX, clientY);
          var dropTarget = findDropTarget(elementBehindCursor, clientX, clientY);
          if (dropTarget && (_copy && o.copySortSource || (!_copy || dropTarget !== _source))) {
            drop(item, dropTarget);
          } else if (o.removeOnSpill) {
            remove();
          } else {
            cancel();
          }
        }
        function drop(item, target) {
          var parent = getParent(item);
          if (_copy && o.copySortSource && target === _source) {
            parent.removeChild(_item);
          }
          if (isInitialPlacement(target)) {
            drake.emit("cancel", item, _source, _source);
          } else {
            drake.emit("drop", item, target, _source, _currentSibling);
          }
          cleanup();
        }
        function remove() {
          if (!drake.dragging) {
            return;
          }
          var item = _copy || _item;
          var parent = getParent(item);
          if (parent) {
            parent.removeChild(item);
          }
          drake.emit(_copy ? "cancel" : "remove", item, parent, _source);
          cleanup();
        }
        function cancel(revert) {
          if (!drake.dragging) {
            return;
          }
          var reverts = arguments.length > 0 ? revert : o.revertOnSpill;
          var item = _copy || _item;
          var parent = getParent(item);
          var initial = isInitialPlacement(parent);
          if (initial === false && reverts) {
            if (_copy) {
              if (parent) {
                parent.removeChild(_copy);
              }
            } else {
              _source.insertBefore(item, _initialSibling);
            }
          }
          if (initial || reverts) {
            drake.emit("cancel", item, _source, _source);
          } else {
            drake.emit("drop", item, parent, _source, _currentSibling);
          }
          cleanup();
        }
        function cleanup() {
          var item = _copy || _item;
          ungrab();
          removeMirrorImage();
          if (item) {
            classes.rm(item, "gu-transit");
          }
          if (_renderTimer) {
            clearTimeout(_renderTimer);
          }
          drake.dragging = false;
          if (_lastDropTarget) {
            drake.emit("out", item, _lastDropTarget, _source);
          }
          drake.emit("dragend", item);
          _source = _item = _copy = _initialSibling = _currentSibling = _renderTimer = _lastDropTarget = null;
        }
        function isInitialPlacement(target, s) {
          var sibling;
          if (s !== void 0) {
            sibling = s;
          } else if (_mirror) {
            sibling = _currentSibling;
          } else {
            sibling = nextEl(_copy || _item);
          }
          return target === _source && sibling === _initialSibling;
        }
        function findDropTarget(elementBehindCursor, clientX, clientY) {
          var target = elementBehindCursor;
          while (target && !accepted()) {
            target = getParent(target);
          }
          return target;
          function accepted() {
            var droppable2 = isContainer(target);
            if (droppable2 === false) {
              return false;
            }
            var immediate = getImmediateChild(target, elementBehindCursor);
            var reference = getReference(target, immediate, clientX, clientY);
            var initial = isInitialPlacement(target, reference);
            if (initial) {
              return true;
            }
            return o.accepts(_item, target, _source, reference);
          }
        }
        function drag(e) {
          if (!_mirror) {
            return;
          }
          e.preventDefault();
          var clientX = getCoord("clientX", e) || 0;
          var clientY = getCoord("clientY", e) || 0;
          var x = clientX - _offsetX;
          var y = clientY - _offsetY;
          _mirror.style.left = x + "px";
          _mirror.style.top = y + "px";
          var item = _copy || _item;
          var elementBehindCursor = getElementBehindPoint(_mirror, clientX, clientY);
          var dropTarget = findDropTarget(elementBehindCursor, clientX, clientY);
          var changed = dropTarget !== null && dropTarget !== _lastDropTarget;
          if (changed || dropTarget === null) {
            out();
            _lastDropTarget = dropTarget;
            over();
          }
          var parent = getParent(item);
          if (dropTarget === _source && _copy && !o.copySortSource) {
            if (parent) {
              parent.removeChild(item);
            }
            return;
          }
          var reference;
          var immediate = getImmediateChild(dropTarget, elementBehindCursor);
          if (immediate !== null) {
            reference = getReference(dropTarget, immediate, clientX, clientY);
          } else if (o.revertOnSpill === true && !_copy) {
            reference = _initialSibling;
            dropTarget = _source;
          } else {
            if (_copy && parent) {
              parent.removeChild(item);
            }
            return;
          }
          if (reference === null && changed || reference !== item && reference !== nextEl(item)) {
            _currentSibling = reference;
            dropTarget.insertBefore(item, reference);
            drake.emit("shadow", item, dropTarget, _source);
          }
          function moved(type) {
            drake.emit(type, item, _lastDropTarget, _source);
          }
          function over() {
            if (changed) {
              moved("over");
            }
          }
          function out() {
            if (_lastDropTarget) {
              moved("out");
            }
          }
        }
        function spillOver(el) {
          classes.rm(el, "gu-hide");
        }
        function spillOut(el) {
          if (drake.dragging) {
            classes.add(el, "gu-hide");
          }
        }
        function renderMirrorImage() {
          if (_mirror) {
            return;
          }
          var rect = _item.getBoundingClientRect();
          _mirror = _item.cloneNode(true);
          _mirror.style.width = getRectWidth(rect) + "px";
          _mirror.style.height = getRectHeight(rect) + "px";
          classes.rm(_mirror, "gu-transit");
          classes.add(_mirror, "gu-mirror");
          o.mirrorContainer.appendChild(_mirror);
          touchy(documentElement, "add", "mousemove", drag);
          classes.add(o.mirrorContainer, "gu-unselectable");
          drake.emit("cloned", _mirror, _item, "mirror");
        }
        function removeMirrorImage() {
          if (_mirror) {
            classes.rm(o.mirrorContainer, "gu-unselectable");
            touchy(documentElement, "remove", "mousemove", drag);
            getParent(_mirror).removeChild(_mirror);
            _mirror = null;
          }
        }
        function getImmediateChild(dropTarget, target) {
          var immediate = target;
          while (immediate !== dropTarget && getParent(immediate) !== dropTarget) {
            immediate = getParent(immediate);
          }
          if (immediate === documentElement) {
            return null;
          }
          return immediate;
        }
        function getReference(dropTarget, target, x, y) {
          var horizontal = o.direction === "horizontal";
          var reference = target !== dropTarget ? inside() : outside();
          return reference;
          function outside() {
            var len2 = dropTarget.children.length;
            var i;
            var el;
            var rect;
            for (i = 0; i < len2; i++) {
              el = dropTarget.children[i];
              rect = el.getBoundingClientRect();
              if (horizontal && rect.left + rect.width / 2 > x) {
                return el;
              }
              if (!horizontal && rect.top + rect.height / 2 > y) {
                return el;
              }
            }
            return null;
          }
          function inside() {
            var rect = target.getBoundingClientRect();
            if (horizontal) {
              return resolve(x > rect.left + getRectWidth(rect) / 2);
            }
            return resolve(y > rect.top + getRectHeight(rect) / 2);
          }
          function resolve(after) {
            return after ? nextEl(target) : target;
          }
        }
        function isCopy(item, container) {
          return typeof o.copy === "boolean" ? o.copy : o.copy(item, container);
        }
      }
      function touchy(el, op, type, fn) {
        var touch = {
          mouseup: "touchend",
          mousedown: "touchstart",
          mousemove: "touchmove"
        };
        var pointers = {
          mouseup: "pointerup",
          mousedown: "pointerdown",
          mousemove: "pointermove"
        };
        var microsoft = {
          mouseup: "MSPointerUp",
          mousedown: "MSPointerDown",
          mousemove: "MSPointerMove"
        };
        if (global.navigator.pointerEnabled) {
          crossvent[op](el, pointers[type], fn);
        } else if (global.navigator.msPointerEnabled) {
          crossvent[op](el, microsoft[type], fn);
        } else {
          crossvent[op](el, touch[type], fn);
          crossvent[op](el, type, fn);
        }
      }
      function whichMouseButton(e) {
        if (e.touches !== void 0) {
          return e.touches.length;
        }
        if (e.which !== void 0 && e.which !== 0) {
          return e.which;
        }
        if (e.buttons !== void 0) {
          return e.buttons;
        }
        var button = e.button;
        if (button !== void 0) {
          return button & 1 ? 1 : button & 2 ? 3 : button & 4 ? 2 : 0;
        }
      }
      function getOffset(el) {
        var rect = el.getBoundingClientRect();
        return {
          left: rect.left + getScroll("scrollLeft", "pageXOffset"),
          top: rect.top + getScroll("scrollTop", "pageYOffset")
        };
      }
      function getScroll(scrollProp, offsetProp) {
        if (typeof global[offsetProp] !== "undefined") {
          return global[offsetProp];
        }
        if (documentElement.clientHeight) {
          return documentElement[scrollProp];
        }
        return doc.body[scrollProp];
      }
      function getElementBehindPoint(point, x, y) {
        point = point || {};
        var state = point.className || "";
        var el;
        point.className += " gu-hide";
        el = doc.elementFromPoint(x, y);
        point.className = state;
        return el;
      }
      function never() {
        return false;
      }
      function always() {
        return true;
      }
      function getRectWidth(rect) {
        return rect.width || rect.right - rect.left;
      }
      function getRectHeight(rect) {
        return rect.height || rect.bottom - rect.top;
      }
      function getParent(el) {
        return el.parentNode === doc ? null : el.parentNode;
      }
      function isInput(el) {
        return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || isEditable(el);
      }
      function isEditable(el) {
        if (!el) {
          return false;
        }
        if (el.contentEditable === "false") {
          return false;
        }
        if (el.contentEditable === "true") {
          return true;
        }
        return isEditable(getParent(el));
      }
      function nextEl(el) {
        return el.nextElementSibling || manually();
        function manually() {
          var sibling = el;
          do {
            sibling = sibling.nextSibling;
          } while (sibling && sibling.nodeType !== 1);
          return sibling;
        }
      }
      function getEventHost(e) {
        if (e.targetTouches && e.targetTouches.length) {
          return e.targetTouches[0];
        }
        if (e.changedTouches && e.changedTouches.length) {
          return e.changedTouches[0];
        }
        return e;
      }
      function getCoord(coord, e) {
        var host = getEventHost(e);
        var missMap = {
          pageX: "clientX",
          // IE8
          pageY: "clientY"
          // IE8
        };
        if (coord in missMap && !(coord in host) && missMap[coord] in host) {
          coord = missMap[coord];
        }
        return host[coord];
      }
      module.exports = dragula2;
    }
  });

  // node_modules/ev-emitter/ev-emitter.js
  var require_ev_emitter = __commonJS({
    "node_modules/ev-emitter/ev-emitter.js"(exports, module) {
      (function(global2, factory) {
        if (typeof define == "function" && define.amd) {
          define(factory);
        } else if (typeof module == "object" && module.exports) {
          module.exports = factory();
        } else {
          global2.EvEmitter = factory();
        }
      })(typeof window != "undefined" ? window : exports, function() {
        "use strict";
        function EvEmitter() {
        }
        var proto = EvEmitter.prototype;
        proto.on = function(eventName, listener) {
          if (!eventName || !listener) {
            return;
          }
          var events = this._events = this._events || {};
          var listeners = events[eventName] = events[eventName] || [];
          if (listeners.indexOf(listener) == -1) {
            listeners.push(listener);
          }
          return this;
        };
        proto.once = function(eventName, listener) {
          if (!eventName || !listener) {
            return;
          }
          this.on(eventName, listener);
          var onceEvents = this._onceEvents = this._onceEvents || {};
          var onceListeners = onceEvents[eventName] = onceEvents[eventName] || {};
          onceListeners[listener] = true;
          return this;
        };
        proto.off = function(eventName, listener) {
          var listeners = this._events && this._events[eventName];
          if (!listeners || !listeners.length) {
            return;
          }
          var index = listeners.indexOf(listener);
          if (index != -1) {
            listeners.splice(index, 1);
          }
          return this;
        };
        proto.emitEvent = function(eventName, args) {
          var listeners = this._events && this._events[eventName];
          if (!listeners || !listeners.length) {
            return;
          }
          listeners = listeners.slice(0);
          args = args || [];
          var onceListeners = this._onceEvents && this._onceEvents[eventName];
          for (var i = 0; i < listeners.length; i++) {
            var listener = listeners[i];
            var isOnce = onceListeners && onceListeners[listener];
            if (isOnce) {
              this.off(eventName, listener);
              delete onceListeners[listener];
            }
            listener.apply(this, args);
          }
          return this;
        };
        proto.allOff = function() {
          delete this._events;
          delete this._onceEvents;
        };
        return EvEmitter;
      });
    }
  });

  // node_modules/imagesloaded/imagesloaded.js
  var require_imagesloaded = __commonJS({
    "node_modules/imagesloaded/imagesloaded.js"(exports, module) {
      (function(window2, factory) {
        "use strict";
        if (typeof define == "function" && define.amd) {
          define([
            "ev-emitter/ev-emitter"
          ], function(EvEmitter) {
            return factory(window2, EvEmitter);
          });
        } else if (typeof module == "object" && module.exports) {
          module.exports = factory(
            window2,
            require_ev_emitter()
          );
        } else {
          window2.imagesLoaded = factory(
            window2,
            window2.EvEmitter
          );
        }
      })(
        typeof window !== "undefined" ? window : exports,
        // --------------------------  factory -------------------------- //
        function factory(window2, EvEmitter) {
          "use strict";
          var $ = window2.jQuery;
          var console = window2.console;
          function extend(a, b) {
            for (var prop in b) {
              a[prop] = b[prop];
            }
            return a;
          }
          var arraySlice = Array.prototype.slice;
          function makeArray(obj) {
            if (Array.isArray(obj)) {
              return obj;
            }
            var isArrayLike = typeof obj == "object" && typeof obj.length == "number";
            if (isArrayLike) {
              return arraySlice.call(obj);
            }
            return [obj];
          }
          function ImagesLoaded(elem, options, onAlways) {
            if (!(this instanceof ImagesLoaded)) {
              return new ImagesLoaded(elem, options, onAlways);
            }
            var queryElem = elem;
            if (typeof elem == "string") {
              queryElem = document.querySelectorAll(elem);
            }
            if (!queryElem) {
              console.error("Bad element for imagesLoaded " + (queryElem || elem));
              return;
            }
            this.elements = makeArray(queryElem);
            this.options = extend({}, this.options);
            if (typeof options == "function") {
              onAlways = options;
            } else {
              extend(this.options, options);
            }
            if (onAlways) {
              this.on("always", onAlways);
            }
            this.getImages();
            if ($) {
              this.jqDeferred = new $.Deferred();
            }
            setTimeout(this.check.bind(this));
          }
          ImagesLoaded.prototype = Object.create(EvEmitter.prototype);
          ImagesLoaded.prototype.options = {};
          ImagesLoaded.prototype.getImages = function() {
            this.images = [];
            this.elements.forEach(this.addElementImages, this);
          };
          ImagesLoaded.prototype.addElementImages = function(elem) {
            if (elem.nodeName == "IMG") {
              this.addImage(elem);
            }
            if (this.options.background === true) {
              this.addElementBackgroundImages(elem);
            }
            var nodeType = elem.nodeType;
            if (!nodeType || !elementNodeTypes[nodeType]) {
              return;
            }
            var childImgs = elem.querySelectorAll("img");
            for (var i = 0; i < childImgs.length; i++) {
              var img = childImgs[i];
              this.addImage(img);
            }
            if (typeof this.options.background == "string") {
              var children = elem.querySelectorAll(this.options.background);
              for (i = 0; i < children.length; i++) {
                var child = children[i];
                this.addElementBackgroundImages(child);
              }
            }
          };
          var elementNodeTypes = {
            1: true,
            9: true,
            11: true
          };
          ImagesLoaded.prototype.addElementBackgroundImages = function(elem) {
            var style = getComputedStyle(elem);
            if (!style) {
              return;
            }
            var reURL = /url\((['"])?(.*?)\1\)/gi;
            var matches = reURL.exec(style.backgroundImage);
            while (matches !== null) {
              var url = matches && matches[2];
              if (url) {
                this.addBackground(url, elem);
              }
              matches = reURL.exec(style.backgroundImage);
            }
          };
          ImagesLoaded.prototype.addImage = function(img) {
            var loadingImage = new LoadingImage(img);
            this.images.push(loadingImage);
          };
          ImagesLoaded.prototype.addBackground = function(url, elem) {
            var background = new Background(url, elem);
            this.images.push(background);
          };
          ImagesLoaded.prototype.check = function() {
            var _this = this;
            this.progressedCount = 0;
            this.hasAnyBroken = false;
            if (!this.images.length) {
              this.complete();
              return;
            }
            function onProgress(image, elem, message) {
              setTimeout(function() {
                _this.progress(image, elem, message);
              });
            }
            this.images.forEach(function(loadingImage) {
              loadingImage.once("progress", onProgress);
              loadingImage.check();
            });
          };
          ImagesLoaded.prototype.progress = function(image, elem, message) {
            this.progressedCount++;
            this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded;
            this.emitEvent("progress", [this, image, elem]);
            if (this.jqDeferred && this.jqDeferred.notify) {
              this.jqDeferred.notify(this, image);
            }
            if (this.progressedCount == this.images.length) {
              this.complete();
            }
            if (this.options.debug && console) {
              console.log("progress: " + message, image, elem);
            }
          };
          ImagesLoaded.prototype.complete = function() {
            var eventName = this.hasAnyBroken ? "fail" : "done";
            this.isComplete = true;
            this.emitEvent(eventName, [this]);
            this.emitEvent("always", [this]);
            if (this.jqDeferred) {
              var jqMethod = this.hasAnyBroken ? "reject" : "resolve";
              this.jqDeferred[jqMethod](this);
            }
          };
          function LoadingImage(img) {
            this.img = img;
          }
          LoadingImage.prototype = Object.create(EvEmitter.prototype);
          LoadingImage.prototype.check = function() {
            var isComplete = this.getIsImageComplete();
            if (isComplete) {
              this.confirm(this.img.naturalWidth !== 0, "naturalWidth");
              return;
            }
            this.proxyImage = new Image();
            this.proxyImage.addEventListener("load", this);
            this.proxyImage.addEventListener("error", this);
            this.img.addEventListener("load", this);
            this.img.addEventListener("error", this);
            this.proxyImage.src = this.img.src;
          };
          LoadingImage.prototype.getIsImageComplete = function() {
            return this.img.complete && this.img.naturalWidth;
          };
          LoadingImage.prototype.confirm = function(isLoaded, message) {
            this.isLoaded = isLoaded;
            this.emitEvent("progress", [this, this.img, message]);
          };
          LoadingImage.prototype.handleEvent = function(event) {
            var method = "on" + event.type;
            if (this[method]) {
              this[method](event);
            }
          };
          LoadingImage.prototype.onload = function() {
            this.confirm(true, "onload");
            this.unbindEvents();
          };
          LoadingImage.prototype.onerror = function() {
            this.confirm(false, "onerror");
            this.unbindEvents();
          };
          LoadingImage.prototype.unbindEvents = function() {
            this.proxyImage.removeEventListener("load", this);
            this.proxyImage.removeEventListener("error", this);
            this.img.removeEventListener("load", this);
            this.img.removeEventListener("error", this);
          };
          function Background(url, element) {
            this.url = url;
            this.element = element;
            this.img = new Image();
          }
          Background.prototype = Object.create(LoadingImage.prototype);
          Background.prototype.check = function() {
            this.img.addEventListener("load", this);
            this.img.addEventListener("error", this);
            this.img.src = this.url;
            var isComplete = this.getIsImageComplete();
            if (isComplete) {
              this.confirm(this.img.naturalWidth !== 0, "naturalWidth");
              this.unbindEvents();
            }
          };
          Background.prototype.unbindEvents = function() {
            this.img.removeEventListener("load", this);
            this.img.removeEventListener("error", this);
          };
          Background.prototype.confirm = function(isLoaded, message) {
            this.isLoaded = isLoaded;
            this.emitEvent("progress", [this, this.element, message]);
          };
          ImagesLoaded.makeJQueryPlugin = function(jQuery) {
            jQuery = jQuery || window2.jQuery;
            if (!jQuery) {
              return;
            }
            $ = jQuery;
            $.fn.imagesLoaded = function(options, callback) {
              var instance = new ImagesLoaded(this, options, callback);
              return instance.jqDeferred.promise($(this));
            };
          };
          ImagesLoaded.makeJQueryPlugin();
          return ImagesLoaded;
        }
      );
    }
  });

  // node_modules/js-file-download/file-download.js
  var require_file_download = __commonJS({
    "node_modules/js-file-download/file-download.js"(exports, module) {
      module.exports = function(data, filename, mime, bom) {
        var blobData = typeof bom !== "undefined" ? [bom, data] : [data];
        var blob = new Blob(blobData, { type: mime || "application/octet-stream" });
        if (typeof window.navigator.msSaveBlob !== "undefined") {
          window.navigator.msSaveBlob(blob, filename);
        } else {
          var blobURL = window.URL && window.URL.createObjectURL ? window.URL.createObjectURL(blob) : window.webkitURL.createObjectURL(blob);
          var tempLink = document.createElement("a");
          tempLink.style.display = "none";
          tempLink.href = blobURL;
          tempLink.setAttribute("download", filename);
          if (typeof tempLink.download === "undefined") {
            tempLink.setAttribute("target", "_blank");
          }
          document.body.appendChild(tempLink);
          tempLink.click();
          setTimeout(function() {
            document.body.removeChild(tempLink);
            window.URL.revokeObjectURL(blobURL);
          }, 200);
        }
      };
    }
  });

  // main.js
  var dragula = require_dragula();
  var imagesLoaded = require_imagesloaded();
  var fileDownload = require_file_download();
  var droppable = document.querySelector(".js-droppable");
  var snippets = document.querySelector(".js-snippets");
  var snippet = document.querySelectorAll(".js-snippet");
  var filter = document.querySelector(".js-filter");
  var downloadBtn = document.querySelector(".js-download");
  var deleteBtnHtml = "<div class='bg-white hidden absolute top-0 left-0 js-delete-btn px-4 py-2 shadow'><i class='far fa-trash-alt pointer-events-none'></i></div>";
  var stitchesCSSPath = "https://stitches.hyperyolo.com/output.css";
  var fontAwesomePath = "https://use.fontawesome.com/releases/v5.6.3/css/all.css";
  var fontAwesomeIntegrity = "sha384-UHRtZLI+pbxtHCWp1t77Bi1L4ZtiqrqD80Kn4Z8NTSRyMA2Fd33n5dQ8lWUE00s/";
  var stitchesHTML = (html) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <link href=${stitchesCSSPath} rel="stylesheet">
    <link rel="stylesheet" href=${fontAwesomePath} integrity=${fontAwesomeIntegrity} crossorigin="anonymous">
    <title>Stitches</title>
  </head>
  <body>${html}</body>
</html>`;
  dragula([snippets, droppable], {
    copy: function(el, source) {
      return source === snippets;
    },
    accepts: function(el, target) {
      return target !== snippets;
    }
  }).on("drop", (el, target) => {
    el.innerHTML += deleteBtnHtml;
    el.classList.add("relative");
  });
  filter.addEventListener("click", (event) => {
    if (event.target.tagName !== "BUTTON") {
      return;
    }
    const val = event.target.getAttribute("data-filter");
    for (var i = 0; i < snippet.length; i++) {
      if (snippet[i].classList.contains(val)) {
        snippet[i].style.display = "block";
      } else {
        snippet[i].style.display = "none";
      }
    }
    masonry(".js-snippets", ".js-snippet", 0, 2, 2, 1);
  });
  function masonry(grid, gridCell, gridGutter, dGridCol, tGridCol, mGridCol) {
    var g = document.querySelector(grid), gc = document.querySelectorAll(gridCell), gcLength = gc.length, gHeight = 0, i;
    for (i = 0; i < gcLength; ++i) {
      gHeight += gc[i].offsetHeight + parseInt(gridGutter);
    }
    if (window.screen.width >= 1024)
      g.style.height = gHeight / dGridCol + gHeight / (gcLength + 1) + 100 + "px";
    else if (window.screen.width < 1024 && window.screen.width >= 768)
      g.style.height = gHeight / tGridCol + gHeight / (gcLength + 1) + "px";
    else g.style.height = gHeight / mGridCol + gHeight / (gcLength + 1) + "px";
  }
  downloadBtn.addEventListener("click", (event) => {
    let selectedBlocks = [];
    let selectedSnippets = document.querySelectorAll(
      ".js-droppable > .js-snippet"
    );
    for (var i = 0; i < selectedSnippets.length; i++) {
      selectedBlocks.push(selectedSnippets[i].id);
    }
    let html = "";
    Promise.all(
      selectedBlocks.map(
        (template) => fetch(`../templates/${template}.html`).then(
          (response) => response.text()
        )
      )
    ).then((templateString) => {
      html += templateString.join("");
      fileDownload(stitchesHTML(html), "stitches.html");
    });
  });
  document.addEventListener("click", function(event) {
    if (event.target.classList.contains("js-delete-btn")) {
      document.querySelector(".js-droppable").removeChild(event.target.parentElement);
    }
  });
  ["resize", "load"].forEach(function(event) {
    window.addEventListener(event, function() {
      imagesLoaded(snippets, function() {
        masonry(".js-snippets", ".js-snippet", 0, 2, 2, 1);
      });
    });
  });
})();
/*! Bundled license information:

imagesloaded/imagesloaded.js:
  (*!
   * imagesLoaded v4.1.4
   * JavaScript is all like "You images are done yet or what?"
   * MIT License
   *)
*/
