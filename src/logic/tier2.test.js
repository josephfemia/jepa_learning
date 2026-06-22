import { describe, it, expect } from "vitest";
import { sampleLatent, covStats } from "./latentGeometry.js";
import { semanticScore, difficultyLabel } from "./maskingDifficulty.js";

// deterministic rng (mulberry32)
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

describe("latent geometry", () => {
  it("isotropic is round and uncorrelated", () => {
    const s = covStats(sampleLatent("isotropic", 400, rng(1)));
    expect(Math.abs(s.corr)).toBeLessThan(0.25);
    expect(s.vx).toBeGreaterThan(0.005);
    expect(Math.abs(s.vx - s.vy)).toBeLessThan(0.02);
  });
  it("collapsed has ~zero variance", () => {
    const s = covStats(sampleLatent("collapsed", 400, rng(2)));
    expect(s.vx).toBeLessThan(1e-3);
    expect(s.vy).toBeLessThan(1e-3);
  });
  it("dimensional collapse is highly correlated (on the diagonal)", () => {
    const s = covStats(sampleLatent("dimensional", 400, rng(3)));
    expect(s.corr).toBeGreaterThan(0.9);
  });
  it("correlated sits between (strong but not near-degenerate)", () => {
    const s = covStats(sampleLatent("correlated", 400, rng(4)));
    expect(s.corr).toBeGreaterThan(0.5);
  });
});

describe("masking difficulty", () => {
  it("bigger target blocks score more semantic", () => {
    expect(semanticScore({ scale: 0.3, count: 4 })).toBeGreaterThan(semanticScore({ scale: 0.05, count: 4 }));
  });
  it("labels span texture → semantic", () => {
    expect(difficultyLabel(semanticScore({ scale: 0.05, count: 6 }))).toBe("texture");
    expect(difficultyLabel(semanticScore({ scale: 0.3, count: 4 }))).toBe("semantic");
  });
});
