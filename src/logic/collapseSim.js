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
