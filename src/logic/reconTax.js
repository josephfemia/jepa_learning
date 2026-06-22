/* Pure heuristic for the reconstruction-tax lab. As a generative model is forced
   to reproduce more pixel detail, "useful semantic signal" saturates early while
   "effort on unpredictable detail" keeps climbing. Illustrative, not a measurement. */
export const usefulSignal = (detail) => Math.round(100 * (1 - Math.exp(-detail / 22)));
export const wastedEffort = (detail) => Math.round(detail * 0.9);
/* fraction of total effort that is useful (drops as detail rises) */
export const usefulFraction = (detail) => {
  const u = usefulSignal(detail), w = wastedEffort(detail);
  return u + w ? u / (u + w) : 0;
};

/* The unavoidable generative loss floor: a pixel-reconstructing model is graded on
   "froth" (texture/noise) it can never predict, so as the demanded detail rises its
   best-possible loss RISES too — you can't drive a random target to zero. Returns a
   value in [0,1] that climbs with detail. A JEPA pays none of this (it drops the froth).
   `detail` is on the same 5..100 scale the slider uses. */
export const frothPenalty = (detail) => {
  const d = Math.max(0, Math.min(100, detail)) / 100;
  // small floor + a saturating climb: most of the tax is incurred quickly once you
  // start demanding pixel fidelity, then it plateaus near its ceiling.
  return 0.08 + 0.82 * (1 - Math.exp(-2.6 * d));
};
