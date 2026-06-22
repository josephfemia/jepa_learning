/**
 * rllab.js — framework-agnostic SVG/DOM drawing toolkit.
 *
 * Ported from the "Robot Learning" companion (robotic_learning/src/widgets/rllab.js),
 * which in turn was a verbatim port of its single-file window.RLLAB. The API is
 * identical so widgets read the same in both projects:
 *
 *   import R from '../widgets/rllab.js';   // R.E(...), R.SVG(...), R.slider(...)
 *   import { E, TX, SVG, clr } from '../widgets/rllab.js';
 *
 * The one project-specific change is the C palette: tuned to JEPA's cobalt
 * identity on the dark .lab-stage (signal = bright cobalt blue, not teal).
 */

var NS = 'http://www.w3.org/2000/svg';

/** Create an SVG element with optional attribute map. */
export function E(t, a) { var e = document.createElementNS(NS, t); if (a) { for (var k in a) e.setAttribute(k, a[k]); } return e; }

/** SVG text element. opts: anchor, size, weight, fill, base, sans. */
export function TX(x, y, str, o) { o = o || {}; var t = E('text', { x: x, y: y, 'text-anchor': o.anchor || 'middle', 'font-family': o.sans ? 'Archivo, system-ui, sans-serif' : 'IBM Plex Mono, ui-monospace, monospace', 'font-size': o.size || 12, 'font-weight': o.weight || 400, fill: o.fill || '#C8CFDA' }); if (o.base) t.setAttribute('dominant-baseline', o.base); t.textContent = str; return t; }

/** Create a responsive SVG attached to parent. Returns the svg node. */
export function SVG(parent, w, h) { var s = E('svg', { viewBox: '0 0 ' + w + ' ' + h, width: '100%', preserveAspectRatio: 'xMidYMid meet' }); s.style.display = 'block'; s.style.maxWidth = w + 'px'; s.style.margin = '0 auto'; parent.appendChild(s); return s; }

/** Remove all children from a node. */
export function clr(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }

/** Create an HTML element with optional class and text content. */
export function ce(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }

/** Clamp v to [a, b]. */
export function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

/** Linear interpolation between a and b at position t. */
export function lerp(a, b, t) { return a + (b - a) * t; }

/**
 * Build a slider control inside host.
 * opts: { label, min, max, step, value, fmt, on }
 * Returns { input, set }.
 */
export function slider(host, o) {
  var w = ce('div', 'ctrl');
  var row = ce('div');
  var lab = ce('label', null, o.label); var val = ce('span', 'val');
  function f(v) { return o.fmt ? o.fmt(v) : ('' + v); }
  var inp = document.createElement('input'); inp.type = 'range'; inp.min = o.min; inp.max = o.max; inp.step = o.step; inp.value = o.value;
  val.textContent = f(parseFloat(inp.value));
  inp.addEventListener('input', function () { var v = parseFloat(inp.value); val.textContent = f(v); if (o.on) o.on(v); });
  row.appendChild(lab); row.appendChild(val); w.appendChild(row); w.appendChild(inp); host.appendChild(w);
  return { input: inp, set: function (v) { inp.value = v; val.textContent = f(v); } };
}

/**
 * Append a button to host.
 * cls 'primary' → class 'lab-btn primary'.
 * Returns the button element.
 */
export function btn(host, label, cls, on) { var b = ce('button', 'lab-btn' + (cls ? ' ' + cls : ''), label); b.addEventListener('click', on); host.appendChild(b); return b; }

/**
 * Append a legend block to host.
 * items: array of [color, text] pairs.
 * Returns the legend element.
 */
export function legend(host, items) { var l = ce('div', 'lab-legend'); for (var i = 0; i < items.length; i++) { var s = ce('span'); var sw = ce('i'); sw.style.background = items[i][0]; s.appendChild(sw); s.appendChild(document.createTextNode(items[i][1])); l.appendChild(s); } host.appendChild(l); return l; }

/**
 * A stack of live progress meters on a dark stage. labels: array of strings.
 * Returns { set(i, pct, lowColor) } — bar i fills to pct%, green when healthy,
 * lowColor when it crashes below ~22% (so collapse is *seen* as a number).
 */
export function meters(host, labels) {
  var wrap = ce('div'); wrap.style.cssText = 'margin-top:12px;display:flex;flex-direction:column;gap:8px';
  var bars = labels.map(function (label) {
    var r = ce('div'); r.style.cssText = 'display:flex;align-items:center;gap:9px;font-family:IBM Plex Mono,ui-monospace,monospace;font-size:10.5px;color:#C8CFDA';
    var lab = ce('span', null, label); lab.style.cssText = 'width:172px;flex-shrink:0';
    var track = ce('div'); track.style.cssText = 'flex:1;height:7px;border-radius:4px;background:rgba(120,140,200,0.18);overflow:hidden';
    var fill = ce('div'); fill.style.cssText = 'height:100%;width:0%;border-radius:4px;transition:width .1s linear';
    track.appendChild(fill);
    var pct = ce('span', null, '—'); pct.style.cssText = 'width:36px;text-align:right;flex-shrink:0';
    r.appendChild(lab); r.appendChild(track); r.appendChild(pct); wrap.appendChild(r);
    return { fill: fill, pct: pct };
  });
  host.appendChild(wrap);
  return { set: function (i, p, lowColor) { var m = bars[i]; if (!m) return; m.fill.style.width = p + '%'; m.fill.style.background = p < 22 ? (lowColor || C.orange) : C.green; m.pct.textContent = p + '%'; } };
}

/**
 * Watch an element for size changes and run cb (e.g. to re-size a canvas).
 * Crucial for canvas labs: they mount inside a display:none lecture (offsetWidth
 * 0), so without this the canvas stays 0-wide until a window resize. ResizeObserver
 * fires when the lecture becomes visible (0 → real width). Returns a disconnect fn.
 */
export function watchResize(el, cb) {
  if (typeof ResizeObserver !== 'undefined') {
    var ro = new ResizeObserver(function () { cb(); });
    ro.observe(el);
    return function () { ro.disconnect(); };
  }
  window.addEventListener('resize', cb);
  return function () { window.removeEventListener('resize', cb); };
}

/** Box-Muller normal random variate. */
export function randn() { var u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

/**
 * Animate over dur ms with ease-in-out quadratic.
 * step(easedProgress) called each frame; done() called when finished.
 */
export function animate(dur, step, done) { var t0 = null; function fr(ts) { if (t0 === null) t0 = ts; var p = Math.min(1, (ts - t0) / dur); var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; step(e); if (p < 1) requestAnimationFrame(fr); else if (done) done(); } requestAnimationFrame(fr); }

/** Color palette for the dark .lab-stage — tuned to JEPA's cobalt identity. */
export var C = {
  orange: '#E8590C',   // signal / "pixel" foil
  cyan: '#5B8DEF',     // bright cobalt — signal / latent (echoes the page accent)
  green: '#2FCB7E',    // correct / healthy
  red: '#FF6B6B',
  violet: '#9D8DF1',   // energy / abstraction
  grid: 'rgba(120,140,200,0.16)',
  axis: 'rgba(205,214,232,0.55)',
  ink: '#C8CFDA',
  dim: '#8A93A3',
};

/** Default export — mirrors the toolkit surface so widgets can do R.E(...) etc. */
export default { E, TX, SVG, clr, ce, clamp, lerp, slider, btn, legend, meters, watchResize, randn, animate, C };
