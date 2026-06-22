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
