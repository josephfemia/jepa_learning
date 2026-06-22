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
  const valley = GAUSS(u, center, width);
  if (mode === "regularized") {
    // walls rise with strength; valley floor stays low → low energy stays rare
    const wall = 0.15 + 0.85 * strength;
    return Math.min(1, 0.08 + (1 - valley) * wall);
  }
  // contrastive: base bowl; negatives (added separately) carve the far side
  return Math.max(0.06, 1 - valley * (0.6 + 0.35 * strength));
}

/* Sampled curve [{u,e}] across the slice. `n` points. */
export function energyCurve(mode, opts = {}, n = 100) {
  const out = [];
  for (let i = 0; i <= n; i++) { const u = i / n; out.push({ u, e: energyAt(mode, u, opts) }); }
  return out;
}

/* Contrastive negatives: evenly spread sample points (excluding the valley),
   each drawn at high energy to show "pushed up". count grows with strength. */
export function negatives(opts = {}) {
  const { strength = 0.5, center = 0.4 } = opts;
  const count = Math.max(1, Math.round(1 + strength * 6));
  const out = [];
  for (let i = 0; i < count; i++) {
    const u = (i + 0.5) / count;
    if (Math.abs(u - center) < 0.12) continue; // don't sit on the data
    out.push({ u, e: 0.9 });
  }
  return out;
}

/* How wide the low-energy region is (fraction of the slice below `thresh`).
   The whole point: a USEFUL landscape keeps this small. */
export function lowEnergyWidth(mode, opts = {}, thresh = 0.3, n = 200) {
  let below = 0;
  for (let i = 0; i <= n; i++) if (energyAt(mode, i / n, opts) < thresh) below++;
  return below / (n + 1);
}
