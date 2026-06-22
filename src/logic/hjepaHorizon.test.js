import { describe, it, expect } from "vitest";
import { detailedError, abstractError, horizonSeries } from "./hjepaHorizon.js";

describe("hjepaHorizon", () => {
  it("both errors are zero at horizon 0 and grow with horizon", () => {
    expect(detailedError(0)).toBeCloseTo(0, 5);
    expect(abstractError(0)).toBeCloseTo(0, 5);
    expect(detailedError(5)).toBeGreaterThan(detailedError(2));
    expect(abstractError(5)).toBeGreaterThan(abstractError(2));
  });

  it("detailed error balloons faster than abstract at every horizon > 0", () => {
    for (let h = 1; h <= 10; h++) expect(detailedError(h)).toBeGreaterThan(abstractError(h));
  });

  it("errors stay within [0,1]", () => {
    for (let h = 0; h <= 30; h++) {
      expect(detailedError(h)).toBeGreaterThanOrEqual(0);
      expect(detailedError(h)).toBeLessThanOrEqual(1);
      expect(abstractError(h)).toBeLessThanOrEqual(1);
    }
  });

  it("horizonSeries has H+1 points from 0..H", () => {
    const s = horizonSeries(8);
    expect(s).toHaveLength(9);
    expect(s[0]).toMatchObject({ h: 0 });
    expect(s[8]).toMatchObject({ h: 8 });
  });
});
