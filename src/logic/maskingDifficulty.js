/* Pure heuristic for the Masking Difficulty Dial lab. Maps I-JEPA-style mask
   parameters to a "is this task semantic or just texture-copying?" score.
   Larger target blocks force high-level structure; tiny ones reduce to local
   texture interpolation. Illustrative, not a measurement. */
import { clamp } from "../logic.js";

/* score ∈ [0,1]: 0 = pure texture interpolation, 1 = strongly semantic.
   opts: { scale (target block area fraction), count (# target blocks), aspect (w/h) } */
export function semanticScore({ scale = 0.17, count = 4, aspect = 1 } = {}) {
  const sizeTerm = clamp((scale - 0.04) / (0.18 - 0.04), 0, 1); // small→0; I-JEPA's ~0.15–0.2 → ~semantic
  const countPenalty = clamp((count - 4) / 16, 0, 0.25);       // many tiny blocks shade toward texture
  // very elongated blocks become thin slivers — easier to interpolate from neighbors → less semantic
  const aspectPenalty = clamp(Math.abs(Math.log2(aspect)) * 0.12, 0, 0.2);
  return clamp(sizeTerm - countPenalty - aspectPenalty, 0, 1);
}

export function difficultyLabel(score) {
  return score > 0.6 ? "semantic" : score > 0.33 ? "mixed" : "texture";
}

/* Deterministic-ish target rectangles for a given config (positions use rng). */
export function targetBlocks({ scale = 0.17, aspect = 1, count = 4 } = {}, rng = Math.random) {
  return Array.from({ length: count }, () => {
    const w = Math.min(0.9, Math.sqrt(scale * aspect));
    const h = Math.min(0.9, Math.sqrt(scale / aspect));
    return { x: rng() * (0.97 - w), y: rng() * (0.93 - h) + 0.03, w, h };
  });
}
