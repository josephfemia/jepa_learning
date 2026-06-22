/* Pure model for the "min over z" multimodal energy lab.
   One context x admits several valid futures y. The energy E(x,y) over the
   future y is a landscape with one valley per valid future; the latent z selects
   which future the predictor commits to. The FREE energy F(x,y) = min_z E is
   just the lowest valley — and crucially needs no probability distribution over
   futures, no partition function. Illustrative, not a measurement. */

const GAUSS = (u, c, w) => Math.exp(-Math.pow((u - c) / w, 2));

/* The valid futures for the demo context: position (where the ball ends up) and
   well depth (how compatible / likely that future is). */
export const FUTURES = [
  { c: 0.22, d: 0.96, label: "rolls left" },
  { c: 0.5, d: 0.74, label: "stops mid-table" },
  { c: 0.8, d: 1.0, label: "rolls right & falls" },
];

/* Energy of a candidate future y ∈ [0,1]. Low inside a valley, high between. */
export function energyAtY(y, futures = FUTURES, w = 0.07) {
  let well = 0;
  for (const f of futures) well = Math.max(well, f.d * GAUSS(y, f.c, w));
  return 1 - well;
}

/* Sampled curve [{y,e}] across the future axis. */
export function curveY(futures = FUTURES, n = 160, w = 0.07) {
  const out = [];
  for (let i = 0; i <= n; i++) { const y = i / n; out.push({ y, e: energyAtY(y, futures, w) }); }
  return out;
}

/* Free energy F = min_z E(x,y,z): the lowest point of the landscape. */
export function freeEnergy(futures = FUTURES, n = 400, w = 0.07) {
  let m = 1;
  for (let i = 0; i <= n; i++) m = Math.min(m, energyAtY(i / n, futures, w));
  return m;
}

/* Which future a given y is sitting in (index), or -1 if it's between valleys.
   thresh = how close to a valley floor counts as "in" it. */
export function nearestFuture(y, futures = FUTURES, w = 0.07, thresh = 0.25) {
  let best = -1, bestE = 1;
  for (let i = 0; i < futures.length; i++) {
    const e = 1 - futures[i].d * GAUSS(y, futures[i].c, w);
    if (e < bestE) { bestE = e; best = i; }
  }
  return bestE <= thresh ? best : -1;
}
