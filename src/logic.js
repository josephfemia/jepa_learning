/* Pure helpers and domain logic, kept out of the component file so they can be
   unit-tested in isolation (see logic.test.js). No React, no DOM. */

/* ----------------------------- tiny utilities ---------------------------- */
export const cx = (...a) => a.filter(Boolean).join(" ");
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;

/* ------------------------------- quiz scoring ---------------------------- */
/* Count how many quiz items were answered correctly. `answers` maps a question
   index to the option index the learner picked. */
export function scoreQuiz(items, answers) {
  return items.reduce((s, it, i) => s + (answers[i] === it.correct ? 1 : 0), 0);
}

/* --------------------------- latent planning (CEM) ----------------------- */
/* L1 ("Manhattan") distance between two latent points — the energy V-JEPA 2-AC
   uses: distance between a predicted embedding and the goal embedding. */
export const l1Energy = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/* One Cross-Entropy-Method plan from the current state toward the goal.
   Samples action headings from a Gaussian, rolls each out `horizon` steps in the
   2D latent stand-in, keeps the `elite` lowest-energy rollouts, refits the
   Gaussian to them, and repeats `iters` times. Returns the final candidate set,
   the elites, and the best full sequence. `rng` is injectable for deterministic
   tests; it defaults to Math.random so runtime behavior is unchanged. */
export function planCEM(cur, g, opts = {}) {
  const { horizon = 4, samples = 60, elite = 10, iters = 2, rng = Math.random } = opts;
  let mu = { dx: g.x - cur.x, dy: g.y - cur.y };
  const norm = Math.hypot(mu.dx, mu.dy) || 1;
  mu = { dx: mu.dx / norm, dy: mu.dy / norm };
  let sigma = 0.6;
  let allRollouts = [];
  let bestSeq = null, bestEnergy = Infinity;

  for (let iter = 0; iter < iters; iter++) {
    const cand = [];
    for (let i = 0; i < samples; i++) {
      const ang = Math.atan2(mu.dy, mu.dx) + (rng() - 0.5) * sigma * 3;
      const stepLen = 0.07 + rng() * 0.05;
      const seq = [];
      let p = { ...cur };
      for (let h = 0; h < horizon; h++) {
        const a = ang + (rng() - 0.5) * 0.3 * h;
        p = { x: clamp(p.x + Math.cos(a) * stepLen, 0.03, 0.97),
              y: clamp(p.y + Math.sin(a) * stepLen, 0.03, 0.97) };
        seq.push(p);
      }
      const energy = l1Energy(seq[seq.length - 1], g);
      cand.push({ seq, energy, ang });
      if (energy < bestEnergy) { bestEnergy = energy; bestSeq = seq; }
    }
    cand.sort((a, b) => a.energy - b.energy);
    const el = cand.slice(0, elite);
    const meanAng = el.reduce((s, c) => s + c.ang, 0) / el.length;
    mu = { dx: Math.cos(meanAng), dy: Math.sin(meanAng) };
    sigma = Math.max(0.12, sigma * 0.55);
    allRollouts = cand;
    if (iter === iters - 1) return { cand, elites: el, bestSeq, bestEnergy };
  }
  return { cand: allRollouts, elites: [], bestSeq, bestEnergy };
}
