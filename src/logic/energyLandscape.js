/* Pure model for the Energy Landscape Explorer lab.
   An energy E(u) over a 1-D slice of embedding space, u ∈ [0,1]. Compatible data
   sits in a valley near `center`; the question is how you keep energy HIGH
   everywhere else so "low energy" stays meaningful (else: collapse).

   Two regimes, the two ways to shape an EBM landscape:
     • contrastive — push energy UP at sampled negatives; more negatives ⇒ the
       valley is hemmed in from both sides (but you need to sample them).
     • regularized — constrain embedding statistics so the valley simply can't
       widen; one strength knob, no negatives. Higher strength ⇒ steeper walls. */

const GAUSS = (u, c, w) => Math.exp(-Math.pow((u - c) / w, 2));

/* Energy at a single u. opts: { strength∈[0,1], center, width } */
export function energyAt(mode, u, opts = {}) {
  const { strength = 0.5, center = 0.4, width = 0.09 } = opts;
  if (mode === "regularized") {
    // higher strength: walls rise everywhere outside the valley AND the valley
    // itself narrows → the low-energy region shrinks from both effects.
    const w = width * (1 - 0.55 * strength);
    const valley = GAUSS(u, center, w);
    const wall = 0.15 + 0.85 * strength;
    return Math.min(1, 0.08 + (1 - valley) * wall);
  }
  // contrastive: a shallow base bowl PLUS an upward Gaussian bump at each
  // sampled negative. More strength ⇒ more negatives ⇒ the bumps tile the
  // space and the contiguous low-energy region shrinks. The valley center
  // (where the data sits) stays low because negatives avoid it.
  const valley = GAUSS(u, center, width);
  let e = 0.1 + 0.9 * (1 - valley);
  const bumpHeight = 0.5;
  for (const ng of negSites(opts)) e += bumpHeight * GAUSS(u, ng.u, 0.06);
  return R_clamp(e, 0.05, 1);
}

const R_clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/* Sampled curve [{u,e}] across the slice. `n` points. */
export function energyCurve(mode, opts = {}, n = 100) {
  const out = [];
  for (let i = 0; i <= n; i++) { const u = i / n; out.push({ u, e: energyAt(mode, u, opts) }); }
  return out;
}

/* The negative SITES — evenly spread sample locations, excluding the valley.
   count grows with strength. Both `energyAt` (which adds an upward bump at each)
   and `negatives` (which draws the arrows) read this so the picture lines up
   exactly with the energy. */
function negSites(opts = {}) {
  const { strength = 0.5, center = 0.4 } = opts;
  const count = Math.max(1, Math.round(1 + strength * 6));
  const out = [];
  for (let i = 0; i < count; i++) {
    const u = (i + 0.5) / count;
    if (Math.abs(u - center) < 0.12) continue; // don't sit on the data
    out.push({ u });
  }
  return out;
}

/* Contrastive negatives: the sites above, each drawn high so the arrow tip
   sits on the actual energy bump it produces. */
export function negatives(opts = {}) {
  return negSites(opts).map((ng) => ({ u: ng.u, e: energyAt("contrastive", ng.u, opts) }));
}

/* How wide the low-energy region is (fraction of the slice below `thresh`).
   The whole point: a USEFUL landscape keeps this small. */
export function lowEnergyWidth(mode, opts = {}, thresh = 0.3, n = 200) {
  let below = 0;
  for (let i = 0; i <= n; i++) if (energyAt(mode, i / n, opts) < thresh) below++;
  return below / (n + 1);
}
