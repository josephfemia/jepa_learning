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

/* ---- SIGReg "shadow" demo: one continuous cloud you can deform & round out ---- */

/* A continuous round cloud, then squashed (anisotropy stretches one axis) and
   sheared (corr correlates the two axes). anisotropy,corr in [0,1].
   Centered at 0.5 in unit-square coords like sampleLatent. */
export function deformCloud({ anisotropy = 0, corr = 0 } = {}, n = 160, rng = Math.random) {
  const base = 0.16;
  const sx = base * (1 - 0.92 * anisotropy); // squashes x as anisotropy rises
  const sy = base;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = gaussian(rng), b = gaussian(rng);
    const x = a * sx;
    // shear: blend in the x-component to correlate the axes
    const y = (1 - corr) * (b * sy) + corr * (a * sy);
    pts.push({ x: 0.5 + x, y: 0.5 + y });
  }
  return pts;
}

/* Interpolate a cloud toward isotropic 𝒩(0,I) by fraction t in [0,1].
   t=0 → unchanged; t=1 → de-correlated axes with equal per-axis variance.
   Whitens against the cloud's own stats, then re-spreads to a common radius. */
export function sigregStep(pts, t) {
  const n = pts.length || 1;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  const s = covStats(pts);
  // 1) decorrelate y against x (scaled by t), measuring the resulting spreads
  const beta = s.vx > 1e-9 ? (s.corr * Math.sqrt(s.vy / s.vx)) : 0;
  const dxs = [], dys = [];
  let vx = 0, vy = 0;
  for (const p of pts) {
    const dx = p.x - mx;
    const dy = (p.y - my) - t * beta * (p.x - mx);
    dxs.push(dx); dys.push(dy);
    vx += dx * dx; vy += dy * dy;
  }
  vx /= n; vy /= n;
  const sx = Math.sqrt(vx) || 1e-6, sy = Math.sqrt(vy) || 1e-6;
  const target = Math.sqrt((vx + vy) / 2) || 1e-6; // shared target std (post-decorrelation)
  const gx = 1 + t * (target / sx - 1);
  const gy = 1 + t * (target / sy - 1);
  return pts.map((_, i) => ({ x: mx + dxs[i] * gx, y: my + dys[i] * gy }));
}

/* Project the cloud onto a direction `angle` (radians) and bin into a 1-D
   histogram (array of bin counts). Bins span ±range of the projection. */
export function projectShadow(pts, angleRad, bins = 24) {
  const ux = Math.cos(angleRad), uy = Math.sin(angleRad);
  const n = pts.length || 1;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  const proj = pts.map((p) => (p.x - mx) * ux + (p.y - my) * uy);
  let lo = Infinity, hi = -Infinity;
  for (const v of proj) { if (v < lo) lo = v; if (v > hi) hi = v; }
  if (!isFinite(lo) || hi - lo < 1e-9) { const h = new Array(bins).fill(0); h[Math.floor(bins / 2)] = n; return h; }
  const hist = new Array(bins).fill(0);
  const span = hi - lo;
  for (const v of proj) {
    let b = Math.floor(((v - lo) / span) * bins);
    if (b >= bins) b = bins - 1; if (b < 0) b = 0;
    hist[b]++;
  }
  return hist;
}

/* How Gaussian a 1-D histogram looks, in [0,1] (1 = a clean bell curve).
   Fits a Gaussian to the histogram's own mean/variance and returns
   1 - mean(|normalized hist − fitted Gaussian|), scaled so a bell ≈ 1. */
export function gaussianity(hist) {
  const bins = hist.length || 1;
  const total = hist.reduce((s, v) => s + v, 0);
  if (total <= 0) return 0;
  // bin centers in [0,1]
  const norm = hist.map((v) => v / total);
  let mean = 0;
  for (let i = 0; i < bins; i++) mean += ((i + 0.5) / bins) * norm[i];
  let varc = 0;
  for (let i = 0; i < bins; i++) { const c = (i + 0.5) / bins; varc += norm[i] * (c - mean) ** 2; }
  // floor the fit width at ~1.5 bins so a sub-bin spike is scored against a
  // properly-resolved bell (a delta should NOT pass as Gaussian)
  const sd = Math.max(Math.sqrt(varc), 1.5 / bins);
  // fitted Gaussian density evaluated at bin centers, normalized to sum 1
  const fit = [];
  let fitSum = 0;
  for (let i = 0; i < bins; i++) {
    const c = (i + 0.5) / bins;
    const g = Math.exp(-((c - mean) ** 2) / (2 * sd * sd));
    fit.push(g); fitSum += g;
  }
  for (let i = 0; i < bins; i++) fit[i] /= fitSum || 1;
  let mad = 0;
  for (let i = 0; i < bins; i++) mad += Math.abs(norm[i] - fit[i]);
  mad /= bins;
  // mad is small for bell-like, larger for spiky/bimodal; map to [0,1]
  const score = 1 - mad * bins * 0.5;
  return score < 0 ? 0 : (score > 1 ? 1 : score);
}
