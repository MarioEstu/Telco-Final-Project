/* Utilidades compartidas. Sin dependencias; scripts clásicos para funcionar también abriendo index.html desde el disco. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var U = {
    reduce: reduce,
    $: function (s, r) { return (r || document).querySelector(s); },
    $$: function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); },
    svg: function (tag, attrs, html) {
      var e = document.createElementNS(NS, tag);
      if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (html != null) e.innerHTML = html;
      return e;
    },
    esc: function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
    icon: function (name, cls) { return '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; },
    /* Redondeo a 1 decimal con la convención del documento: los empates caen hacia cero (13.75 se muestra 13.7). */
    r1: function (x) { return Math.sign(x) * Math.round(Math.abs(x) * 10 - 1e-9) / 10; },
    f1: function (x) { var v = U.r1(x); return (v < 0 ? '−' : '') + Math.abs(v).toFixed(1); },
    f2: function (x) { return (x < 0 ? '−' : '') + Math.abs(x).toFixed(2); },
    usd: function (x, dec) { return x.toLocaleString('en-US', { minimumFractionDigits: dec ? 2 : 0, maximumFractionDigits: dec ? 2 : 0 }); },
    clamp: function (v, a, b) { return Math.max(a, Math.min(b, v)); },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    sleep: function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); },
    store: {
      get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
      set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    }
  };

  /* Bus de eventos mínimo (estado compartido entre secciones: corte de fibra, etc.) */
  var subs = {};
  U.bus = {
    on: function (ev, fn) { (subs[ev] = subs[ev] || []).push(fn); },
    emit: function (ev, d) { (subs[ev] || []).forEach(function (fn) { fn(d); }); }
  };
  U.state = { cut: false, cutTramo: 2 };

  /* Campo con deslizador: devuelve {el, input, out} y llama onInput(valor) */
  U.rangeField = function (o) {
    var wrap = document.createElement('div');
    wrap.className = 'field';
    var id = 'f-' + o.id;
    wrap.innerHTML =
      '<div class="field__row"><label class="field__lab" for="' + id + '">' + o.label + '</label><output class="mono" for="' + id + '"></output></div>' +
      '<input type="range" id="' + id + '" min="' + o.min + '" max="' + o.max + '" step="' + o.step + '" value="' + o.value + '">' +
      (o.hint ? '<span class="field__hint">' + o.hint + '</span>' : '');
    var input = wrap.querySelector('input'), out = wrap.querySelector('output');
    var fmt = o.fmt || function (v) { return String(v); };
    function sync() { out.textContent = fmt(parseFloat(input.value)); }
    input.addEventListener('input', function () { sync(); o.onInput(parseFloat(input.value)); });
    sync();
    return { el: wrap, input: input, out: out, set: function (v) { input.value = v; sync(); } };
  };

  /* Tooltip flotante */
  var tip = null;
  U.tip = {
    show: function (html, x, y) {
      tip = tip || document.getElementById('tip');
      tip.innerHTML = html; tip.hidden = false;
      var w = tip.offsetWidth, h = tip.offsetHeight;
      tip.style.left = Math.min(window.innerWidth - w - 8, Math.max(8, x + 14)) + 'px';
      tip.style.top = Math.min(window.innerHeight - h - 8, Math.max(8, y + 16)) + 'px';
    },
    hide: function () { tip = tip || document.getElementById('tip'); tip.hidden = true; }
  };
  U.bindTip = function (el, htmlFn) {
    el.addEventListener('mousemove', function (e) { U.tip.show(typeof htmlFn === 'function' ? htmlFn() : htmlFn, e.clientX, e.clientY); });
    el.addEventListener('mouseleave', U.tip.hide);
  };

  /* Contador animado */
  U.countUp = function (el) {
    var target = parseFloat(el.getAttribute('data-count')), int = el.getAttribute('data-fmt') === 'int';
    var done = function () { el.textContent = int ? U.usd(target) : String(target); };
    if (reduce) return done();
    var t0 = null, dur = 1400;
    function step(t) {
      if (t0 == null) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      var v = target * e;
      el.textContent = int ? U.usd(Math.round(v)) : String(Math.round(v));
      if (p < 1) requestAnimationFrame(step); else done();
    }
    requestAnimationFrame(step);
  };

  window.U = U;
})();
