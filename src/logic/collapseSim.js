/* Pure dynamics for the collapse simulator + VICReg term-isolator labs.
   Points live in the unit square; each has a fixed spread "home" (hx,hy) and a
   live position (x,y). One step nudges the live position toward an attractor
   that depends on which anti-collapse defenses are active. No DOM, no React. */
import { lerp } from "../logic.js";

/* Which failure mode the current defenses produce. */
export function collapseMode(ema, vic) {
  if (vic) return "healthy";   // variance+covariance hold the cloud spread + decorrelated
  if (ema) return "dimensional"; // EMA breaks the worst symmetry but points fall to a line
  return "complete";            // nothing → everything drifts to one point
}

/* One integration step for a single point under a given mode. Returns {x,y}. */
export function stepPoint(p, mode, rate = 0.06) {
  if (mode === "complete") {                 // collapse to the centre
    return { x: lerp(p.x, 0.5, rate), y: lerp(p.y, 0.5, rate) };
  }
  if (mode === "dimensional") {              // collapse onto the y=x diagonal
    const m = (p.x + p.y) / 2;
    return { x: lerp(p.x, m, rate), y: lerp(p.y, m, rate) };
  }
  return { x: lerp(p.x, p.hx, rate), y: lerp(p.y, p.hy, rate) }; // healthy → hold home
}

/* Advance every point one step (returns a new array). */
export function stepCloud(pts, mode, rate = 0.06) {
  return pts.map((p) => { const n = stepPoint(p, mode, rate); return { ...p, x: n.x, y: n.y }; });
}

/* Total spread (mean squared distance from centroid) — a proxy for how much
   information the embedding cloud still carries. Used by tests + the readout. */
export function spread(pts) {
  const n = pts.length || 1;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  return pts.reduce((s, p) => s + (p.x - mx) ** 2 + (p.y - my) ** 2, 0) / n;
}

/* Spread measured perpendicular to the y=x diagonal — distinguishes a healthy
   cloud (high) from dimensional collapse onto the line (→0). */
export function offDiagonalSpread(pts) {
  const proj = pts.map((p) => (p.x - p.y) / Math.SQRT2); // signed distance to y=x
  const n = proj.length || 1;
  const m = proj.reduce((s, v) => s + v, 0) / n;
  return proj.reduce((s, v) => s + (v - m) ** 2, 0) / n;
}

/* The training loss proxy in [0,1]. A JEPA grades itself on predicting its own
   embeddings, so the loss FALLS as the cloud shrinks: less spread ⇒ everything
   is already near everything else ⇒ the "prediction" is trivially right ⇒ loss
   →0. A spread (healthy) cloud carries real, harder-to-predict structure, so the
   loss sits high. Maps spread through a saturating curve normalized to a healthy
   reference. */
export function lossProxy(pts) {
  const s = spread(pts);
  const k = 40; // saturation rate; spread(home) ≈ 0.13 → loss ≈ high
  return 1 - Math.exp(-k * s);
}

/* A linear-probe-accuracy proxy in [0,1]. The cruel twin of lossProxy: as the
   cloud collapses, real separable information dies too. A point (complete
   collapse) or a line (dimensional collapse) carries almost nothing a linear
   probe can read, so accuracy crashes alongside the loss. Ties to BOTH the total
   spread and the off-diagonal spread, so dimensional collapse also hurts it. */
export function probeProxy(pts) {
  const s = spread(pts);          // total information available
  const d = offDiagonalSpread(pts); // genuinely 2-D (not just a line)
  const total = 1 - Math.exp(-30 * s);
  const dims = 1 - Math.exp(-60 * d);
  // both must be alive to read meaning off the embeddings
  return Math.max(0, Math.min(1, 0.5 * total + 0.5 * dims));
}
