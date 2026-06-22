import { describe, it, expect } from "vitest";
import {
  deformCloud, sigregStep, projectShadow, gaussianity, covStats,
} from "./latentGeometry.js";

/* Deterministic RNG so tests are stable. Simple LCG in (0,1). */
function makeRng(seed = 12345) {
  let s = seed >>> 0;
  return () => { s = (1664525 * s + 1013904223) >>> 0; return (s % 1e6 + 0.5) / 1e6; };
}

describe("deformCloud", () => {
  it("correlation rises with the corr knob", () => {
    const round = deformCloud({ corr: 0 }, 400, makeRng(1));
    const sheared = deformCloud({ corr: 0.9 }, 400, makeRng(1));
    expect(Math.abs(covStats(round).corr)).toBeLessThan(0.25);
    expect(Math.abs(covStats(sheared).corr)).toBeGreaterThan(0.6);
  });

  it("anisotropy squashes one axis (unequal variances)", () => {
    const round = deformCloud({ anisotropy: 0 }, 400, makeRng(2));
    const squashed = deformCloud({ anisotropy: 0.9 }, 400, makeRng(2));
    const r = covStats(round), s = covStats(squashed);
    expect(Math.abs(r.vx - r.vy)).toBeLessThan(0.01);
    expect(s.vx).toBeLessThan(s.vy * 0.5); // x crushed relative to y
  });
});

describe("sigregStep", () => {
  it("t=1 yields corr≈0 and near-equal per-axis variances", () => {
    const sheared = deformCloud({ corr: 0.9, anisotropy: 0.7 }, 400, makeRng(3));
    const rounded = sigregStep(sheared, 1);
    const s = covStats(rounded);
    expect(Math.abs(s.corr)).toBeLessThan(0.05);
    expect(Math.abs(s.vx - s.vy)).toBeLessThan(1e-4);
  });

  it("t=0 is a no-op", () => {
    const c = deformCloud({ corr: 0.5 }, 200, makeRng(4));
    const same = sigregStep(c, 0);
    expect(covStats(same).corr).toBeCloseTo(covStats(c).corr, 6);
  });
});

describe("gaussianity", () => {
  it("a bell-shaped shadow scores higher than a spike or a bimodal shadow", () => {
    const round = deformCloud({ anisotropy: 0, corr: 0 }, 600, makeRng(5));
    const gRound = gaussianity(projectShadow(round, 0));
    // a spike: all mass in one bin (a fully collapsed projection)
    const spike = new Array(24).fill(0); spike[12] = 600;
    // a bimodal / two-cluster shadow (clearly not a single bell)
    const bimodal = new Array(24).fill(0); bimodal[3] = 300; bimodal[20] = 300;
    expect(gRound).toBeGreaterThan(gaussianity(spike));
    expect(gRound).toBeGreaterThan(gaussianity(bimodal));
  });
});
