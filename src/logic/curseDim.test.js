import { describe, it, expect } from "vitest";
import { cellCount, coverage, negativesNeeded, fmtCount } from "./curseDim.js";

describe("curse of dimensionality for negatives", () => {
  it("region count grows exponentially with dimension", () => {
    expect(cellCount(1)).toBe(4);
    expect(cellCount(2)).toBe(16);
    expect(cellCount(8)).toBe(65536);
    expect(cellCount(3, 3)).toBe(27);
  });

  it("coverage craters as dimension rises for a fixed N", () => {
    expect(coverage(1, 200)).toBeGreaterThan(coverage(8, 200));
  });

  it("coverage increases with N at fixed D", () => {
    expect(coverage(4, 1000)).toBeGreaterThan(coverage(4, 100));
  });

  it("coverage stays in [0,1]", () => {
    for (const D of [1, 2, 4, 8]) {
      for (const N of [0, 10, 200, 2000]) {
        const c = coverage(D, N);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    }
  });

  it("negatives needed for 90% coverage explodes with dimension", () => {
    expect(negativesNeeded(8)).toBeGreaterThan(negativesNeeded(2));
  });

  it("fmtCount produces compact strings", () => {
    expect(fmtCount(729)).toBe("729");
    expect(fmtCount(1200)).toBe("1.2k");
    expect(fmtCount(3.4e6)).toBe("3.4M");
    expect(fmtCount(5.9e7)).toMatch(/e7$/);
  });
});
