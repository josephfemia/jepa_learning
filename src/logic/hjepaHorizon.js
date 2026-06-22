/* Pure model for the H-JEPA horizon lab. The further ahead you predict, the more
   uncertain the future — but uncertainty grows much faster for DETAILED
   (pixel-near) representations than for ABSTRACT ones. That's the whole argument
   for hierarchical world models: plan long-horizon where the future is still
   predictable, i.e. in the abstract space. Illustrative, not a measurement. */

import { clamp } from "../logic.js";

/* Prediction error ∈ [0,1] at a given horizon step h (h ≥ 0). */
export function detailedError(h) { return clamp(1 - Math.exp(-h * 0.55), 0, 1); } // balloons fast
export function abstractError(h) { return clamp(1 - Math.exp(-h * 0.085), 0, 1); } // stays tight

/* Error series [{h, det, abs}] from step 0 to H. */
export function horizonSeries(H = 10) {
  const out = [];
  for (let h = 0; h <= H; h++) out.push({ h, det: detailedError(h), abs: abstractError(h) });
  return out;
}
