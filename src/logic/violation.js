/* Pure math for the Violation-of-Expectation probe lab. No DOM, no React.
   A world model is judged by its SURPRISE: it should assign high prediction
   error / energy to a physically impossible event and low energy to a plausible
   one. `weirdness` morphs the scene from a gravity parabola (0) to an impossible
   hover/rise (1); `surprise` is the model's energy on that event. */
import { lerp, clamp } from "../logic.js";

/* The ball's path in screen coordinates, both in [0,1]. y is screen-space:
   larger y = lower on screen, so "falling" means y increases.
   - weirdness 0: rolls right off the table edge, then accelerates downward under
     gravity (a parabola).
   - weirdness 1: rolls right but then DEFIES gravity — drifts up instead of
     falling. We interpolate the vertical motion between the two. */
export function trajectory(weirdness, steps = 48) {
  const edge = 0.42;        // fraction of the path spent rolling on the table
  const yTable = 0.32;      // table height (screen y of the rolling ball)
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;            // 0..1 along the event
    const x = lerp(0.12, 0.9, t);   // always rolls left → right, monotonic
    let y;
    if (t <= edge) {
      y = yTable;                   // on the table, level
    } else {
      const f = (t - edge) / (1 - edge); // 0..1 after the edge
      // plausible: gravity parabola — y grows with f^2 (falls, accelerating).
      const fall = yTable + 0.62 * f * f;
      // impossible: the ball rises / hovers instead of falling.
      const hover = yTable - 0.22 * f;
      y = lerp(fall, hover, weirdness);
    }
    out.push({ x, y: clamp(y, 0, 1) });
  }
  return out;
}

/* The model's surprise (prediction error vs learned physics), in [0,1].
   Monotonically increasing in weirdness: low for the plausible fall, high for
   the impossible hover. A gentle curve so the climb is felt across the slider. */
export function surprise(weirdness) {
  const w = clamp(weirdness, 0, 1);
  return clamp(0.05 + 0.9 * Math.pow(w, 0.85), 0, 1);
}
