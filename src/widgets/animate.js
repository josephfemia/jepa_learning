/**
 * animate.js — rAF animation helpers + motion toolkit.
 *
 * Ported from robotic_learning/src/composables/useAnimate.js. Pure JS, no
 * framework. Reduced-motion aware (mirrors the CSS @media query).
 */

// ── easings: [0,1] → [0,1] ──────────────────────────────────────────────────
const linear = t => t;
const quadInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const cubicInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easings = { linear, quadInOut, cubicInOut };

/** True when the user has requested reduced motion. SSR-safe. */
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return !!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animate a value with a named/custom easing. Under reduced motion the rAF loop
 * is skipped: onStep(1) then onDone() run once, synchronously.
 */
export function tween(dur, { ease = quadInOut, onStep, onDone } = {}) {
  if (prefersReducedMotion()) {
    if (onStep) onStep(1);
    if (onDone) onDone();
    return;
  }
  let t0 = null;
  function fr(ts) {
    if (t0 === null) t0 = ts;
    const p = Math.min(1, (ts - t0) / dur);
    if (onStep) onStep(ease(p));
    if (p < 1) requestAnimationFrame(fr);
    else if (onDone) onDone();
  }
  requestAnimationFrame(fr);
}

/** Fade + scale an element in. No-op-safe on null el; instant under reduced motion. */
export function growIn(el, { dur = 400, ease = quadInOut, fromScale = 0.92, onDone } = {}) {
  if (!el) return;
  tween(dur, {
    ease,
    onStep(e) { el.style.opacity = e; el.style.transform = `scale(${fromScale + (1 - fromScale) * e})`; },
    onDone() { el.style.opacity = ''; el.style.transform = ''; if (onDone) onDone(); },
  });
}

/** SVG path write-on via stroke-dasharray. */
export function writeOn(pathEl, { dur = 600, ease = cubicInOut, onDone } = {}) {
  if (!pathEl) return;
  let len;
  try { len = pathEl.getTotalLength(); }
  catch (_) { if (onDone) onDone(); return; }
  pathEl.style.strokeDasharray = len;
  pathEl.style.strokeDashoffset = len;
  tween(dur, {
    ease,
    onStep(e) { pathEl.style.strokeDashoffset = len * (1 - e); },
    onDone() { pathEl.style.strokeDashoffset = 0; if (onDone) onDone(); },
  });
}

/** Brief attention-ring pulse on an element. */
export function focusPulse(el, { dur = 500, color = '#2742CC', onDone } = {}) {
  if (!el) return;
  tween(dur, {
    ease: quadInOut,
    onStep(e) {
      const alpha = Math.sin(Math.PI * e);
      el.style.outline = `2px solid ${color}`;
      el.style.outlineOffset = `${2 * e}px`;
      el.style.opacity = 0.3 + 0.7 * (1 - alpha * 0.5);
    },
    onDone() { el.style.outline = ''; el.style.outlineOffset = ''; el.style.opacity = ''; if (onDone) onDone(); },
  });
}
