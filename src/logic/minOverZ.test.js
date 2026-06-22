import { describe, it, expect } from "vitest";
import { FUTURES, energyAtY, freeEnergy, curveY, nearestFuture } from "./minOverZ.js";

describe("minOverZ", () => {
  it("energy is low at a valid future's center", () => {
    const deepest = FUTURES.find((f) => f.d === 1.0);
    expect(energyAtY(deepest.c)).toBeCloseTo(1 - deepest.d, 1);
  });

  it("energy is high between valleys", () => {
    // a point far from any future center
    expect(energyAtY(0.02)).toBeGreaterThan(0.6);
  });

  it("free energy equals the minimum of the sampled curve", () => {
    const c = curveY();
    const minOfCurve = Math.min(...c.map((p) => p.e));
    expect(freeEnergy()).toBeCloseTo(minOfCurve, 2);
  });

  it("free energy picks the deepest well (≈ 1 − max depth)", () => {
    const maxDepth = Math.max(...FUTURES.map((f) => f.d));
    expect(freeEnergy()).toBeCloseTo(1 - maxDepth, 1);
  });

  it("nearestFuture identifies the valley a point sits in, -1 between", () => {
    expect(nearestFuture(FUTURES[0].c)).toBe(0);
    expect(nearestFuture(0.02)).toBe(-1);
  });
});
