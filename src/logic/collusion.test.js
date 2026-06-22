import { describe, it, expect } from "vitest";
import { initCollusion, collusionStep, lossProxy, knowledgeProxy } from "./collusion.js";

/* deterministic mulberry32 rng so tests are reproducible */
const seeded = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const run = (state, opts, n) => { for (let i = 0; i < n; i++) state = collusionStep(state, opts); return state; };

describe("collusion → collapse mechanism", () => {
  it("no stop-grad + low τ: target collapses (knowledge→0) AND loss→0", () => {
    const start = initCollusion(48, seeded(1));
    const after = run(start, { stopGrad: false, tau: 0.5 }, 400);
    expect(knowledgeProxy(after)).toBeLessThan(0.02); // cloud died
    expect(lossProxy(after)).toBeLessThan(0.02);       // loss looks "great"
  });

  it("stop-grad ON: cloud stays alive (knowledge stays high)", () => {
    const start = initCollusion(48, seeded(2));
    const before = knowledgeProxy(start);
    const after = run(start, { stopGrad: true, tau: 0.99 }, 400);
    expect(knowledgeProxy(after)).toBeGreaterThan(0.5); // still spread
    // the target barely moves under stop-grad → spread preserved
    expect(knowledgeProxy(after)).toBeGreaterThan(before * 0.9);
  });

  it("stop-grad ON: the prediction still converges onto the target (loss falls)", () => {
    const start = initCollusion(48, seeded(3));
    const l0 = lossProxy(start);
    const after = run(start, { stopGrad: true, tau: 0.99 }, 200);
    expect(lossProxy(after)).toBeLessThan(l0); // predictor learned
  });

  it("high τ slows collusion: knowledge stays higher than at low τ", () => {
    const a = run(initCollusion(48, seeded(4)), { stopGrad: false, tau: 0.5 }, 120);
    const b = run(initCollusion(48, seeded(4)), { stopGrad: false, tau: 0.99 }, 120);
    expect(knowledgeProxy(b)).toBeGreaterThan(knowledgeProxy(a));
  });
});
