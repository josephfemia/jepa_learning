/* Pure model for the Latent Geometry Inspector lab. Samples a 2-D embedding
   cloud under four regimes so you can SEE what "isotropic Gaussian" means versus
   the failure shapes. No DOM. rng is injectable for deterministic tests. */

function gaussian(rng) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export const GEOMETRIES = ["isotropic", "collapsed", "dimensional", "correlated"];

/* Sample `n` points in the unit square (centered at 0.5) for a given regime. */
export function sampleLatent(type, n = 160, rng = Math.random) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    let x = 0, y = 0;
    if (type === "isotropic") { x = gaussian(rng) * 0.16; y = gaussian(rng) * 0.16; }
    else if (type === "collapsed") { x = gaussian(rng) * 0.012; y = gaussian(rng) * 0.012; }
    else if (type === "dimensional") { const t = gaussian(rng) * 0.2; x = t; y = t + gaussian(rng) * 0.012; }
    else if (type === "correlated") { const a = gaussian(rng) * 0.2; x = a; y = 0.82 * a + gaussian(rng) * 0.055; }
    pts.push({ x: 0.5 + x, y: 0.5 + y });
  }
  return pts;
}

/* Variance per axis + Pearson correlation between axes. */
export function covStats(pts) {
  const n = pts.length || 1;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let vx = 0, vy = 0, cxy = 0;
  for (const p of pts) { const dx = p.x - mx, dy = p.y - my; vx += dx * dx; vy += dy * dy; cxy += dx * dy; }
  vx /= n; vy /= n; cxy /= n;
  const corr = vx > 1e-9 && vy > 1e-9 ? cxy / Math.sqrt(vx * vy) : 0;
  return { vx, vy, corr };
}

/* A one-line verdict for the readout. */
export function geometryVerdict(type) {
  return {
    isotropic: "Round and uncorrelated — maximal information per dimension. This is LeJEPA's target.",
    collapsed: "Everything at one point — zero information. Complete collapse.",
    dimensional: "Squashed onto a line — one wasted dimension. Dimensional collapse.",
    correlated: "An ellipse — dimensions are redundant, so the space is used inefficiently.",
  }[type];
}
