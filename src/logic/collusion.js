/* Pure dynamics for the collusion→collapse lab — the mechanism behind the
   stop-gradient. A small "target" cloud and a matched "predicted" cloud live in
   the unit square. The predictor always chases the target. The target only
   chases the prediction back when there is NO stop-gradient (gradients reach
   both branches) — and then how fast it gives chase depends on the EMA rate τ.
   When both clouds are free to chase each other they spiral to a shared point:
   collusion → collapse. No DOM, no React. `rng` is injectable for tests. */
import { lerp, clamp } from "../logic.js";

/* Centroid of a point cloud. */
function centroid(pts) {
  const n = pts.length || 1;
  let mx = 0, my = 0;
  for (const p of pts) { mx += p.x; my += p.y; }
  return { x: mx / n, y: my / n };
}

/* Mean squared distance from the centroid — a spread proxy. */
function spread2(pts) {
  const n = pts.length || 1;
  const c = centroid(pts);
  return pts.reduce((s, p) => s + (p.x - c.x) ** 2 + (p.y - c.y) ** 2, 0) / n;
}

/* Spread a matched pair of clouds in the unit square. The prediction starts as
   a jittered copy of the target so the two are already paired up. */
export function initCollusion(n = 48, rng = Math.random) {
  const target = Array.from({ length: n }, () => ({
    x: 0.1 + rng() * 0.8,
    y: 0.1 + rng() * 0.8,
  }));
  const pred = target.map((p) => ({
    x: clamp(p.x + (rng() - 0.5) * 0.18, 0.02, 0.98),
    y: clamp(p.y + (rng() - 0.5) * 0.18, 0.02, 0.98),
  }));
  return { target, pred };
}

/* Advance one step. Returns a NEW {target, pred}.
   - pred → lerp(pred, target, 0.08): the predictor always learns toward the
     (current) target — that is the legitimate way to lower the loss.
   - target → chases pred ONLY when stopGrad is OFF. Rate = (1 - tau): low τ
     snaps the target onto the prediction (collusion), high τ barely moves it.
     A stop-gradient (stopGrad ON) freezes the target as a goalpost — it does
     NOT chase pred — so the only way to cut the loss is to predict better. */
export function collusionStep(state, { stopGrad = true, tau = 0.99 } = {}) {
  const { target, pred } = state;
  const predRate = 0.08;
  const targRate = stopGrad ? 0 : clamp(1 - tau, 0, 1);
  const pc = centroid(pred);

  const newPred = pred.map((p, i) => {
    const t = target[i];
    return { x: lerp(p.x, t.x, predRate), y: lerp(p.y, t.y, predRate) };
  });
  // The target chases the OLD prediction (the gradient signal at this step). The
  // cheapest joint move for BOTH branches is to slide toward a shared meeting
  // point, so the target eases toward its own pred AND toward the shared
  // centroid of the prediction cloud — that global pull is what drives the whole
  // cloud to a single point (collusion → collapse).
  const newTarget = target.map((t, i) => {
    if (targRate === 0) return { x: t.x, y: t.y };
    const p = pred[i];
    const goalX = (p.x + pc.x) / 2, goalY = (p.y + pc.y) / 2;
    return { x: lerp(t.x, goalX, targRate), y: lerp(t.y, goalY, targRate) };
  });
  return { target: newTarget, pred: newPred };
}

/* Mean pred↔target distance, normalized to [0,1] (→0 as the two coincide).
   The irony of collusion: this also →0 when the clouds collapse onto a point. */
export function lossProxy(state) {
  const { target, pred } = state;
  const n = target.length || 1;
  let d = 0;
  for (let i = 0; i < n; i++) {
    d += Math.hypot(pred[i].x - target[i].x, pred[i].y - target[i].y);
  }
  const mean = d / n;
  // unit-square diagonal ≈ 1.414; a healthy paired offset (~0.09) maps well below 1
  return clamp(mean / 0.5, 0, 1);
}

/* Spread of the TARGET cloud, normalized to [0,1] (→0 when collapsed). This is
   the real-knowledge proxy: a dead, single-point cloud carries no information. */
export function knowledgeProxy(state) {
  // a healthy spread cloud in the unit square has spread2 ≈ 0.05–0.07
  return clamp(spread2(state.target) / 0.06, 0, 1);
}
