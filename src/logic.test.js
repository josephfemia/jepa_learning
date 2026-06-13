import { describe, it, expect } from "vitest";
import { clamp, lerp, scoreQuiz, l1Energy, planCEM } from "./logic.js";

/* a tiny seeded RNG so the (otherwise random) CEM planner is deterministic in tests */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("clamp / lerp", () => {
  it("clamps below, within, and above the range", () => {
    expect(clamp(-1, 0, 1)).toBe(0);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
    expect(clamp(2, 0, 1)).toBe(1);
  });
  it("lerps endpoints and midpoint", () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
});

describe("l1Energy", () => {
  it("is the Manhattan distance between two latent points", () => {
    expect(l1Energy({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
    expect(l1Energy({ x: 0.1, y: 0.2 }, { x: 0.4, y: 0.6 })).toBeCloseTo(0.7, 10);
  });
});

describe("scoreQuiz", () => {
  const items = [{ correct: 1 }, { correct: 0 }, { correct: 2 }];
  it("counts all correct", () => {
    expect(scoreQuiz(items, { 0: 1, 1: 0, 2: 2 })).toBe(3);
  });
  it("counts a partial set, ignoring unanswered", () => {
    expect(scoreQuiz(items, { 0: 1, 1: 2 })).toBe(1); // q0 right, q1 wrong, q2 unanswered
  });
  it("returns 0 when nothing is answered", () => {
    expect(scoreQuiz(items, {})).toBe(0);
  });
});

describe("planCEM", () => {
  const cur = { x: 0.16, y: 0.78 };
  const goal = { x: 0.78, y: 0.28 };

  it("returns the expected shapes (samples, elites, horizon)", () => {
    const r = planCEM(cur, goal, { horizon: 4, samples: 60, elite: 10, rng: mulberry32(1) });
    expect(r.cand).toHaveLength(60);
    expect(r.elites).toHaveLength(10);
    expect(r.bestSeq).toHaveLength(4);
  });

  it("keeps every rollout point inside the [0.03, 0.97] bounds", () => {
    const r = planCEM(cur, goal, { rng: mulberry32(7) });
    for (const c of r.cand)
      for (const p of c.seq) {
        expect(p.x).toBeGreaterThanOrEqual(0.03);
        expect(p.x).toBeLessThanOrEqual(0.97);
        expect(p.y).toBeGreaterThanOrEqual(0.03);
        expect(p.y).toBeLessThanOrEqual(0.97);
      }
  });

  it("bestEnergy equals the L1 distance of bestSeq's final point to the goal", () => {
    const r = planCEM(cur, goal, { rng: mulberry32(42) });
    expect(l1Energy(r.bestSeq[r.bestSeq.length - 1], goal)).toBeCloseTo(r.bestEnergy, 10);
  });

  it("bestEnergy is the minimum energy across all candidates", () => {
    const r = planCEM(cur, goal, { rng: mulberry32(3) });
    const min = Math.min(...r.cand.map((c) => c.energy));
    // bestSeq tracks the global best across iterations, so it is <= this iteration's min
    expect(r.bestEnergy).toBeLessThanOrEqual(min + 1e-9);
  });

  it("is deterministic given the same seed", () => {
    const a = planCEM(cur, goal, { rng: mulberry32(123) });
    const b = planCEM(cur, goal, { rng: mulberry32(123) });
    expect(a.bestEnergy).toBe(b.bestEnergy);
    expect(a.bestSeq).toEqual(b.bestSeq);
  });

  it("plans toward the goal — its best plan beats standing still", () => {
    const r = planCEM(cur, goal, { rng: mulberry32(99) });
    expect(r.bestEnergy).toBeLessThan(l1Energy(cur, goal));
  });
});
