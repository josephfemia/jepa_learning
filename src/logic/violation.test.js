import { describe, it, expect } from "vitest";
import { trajectory, surprise } from "./violation.js";

describe("surprise (violation-of-expectation energy)", () => {
  it("is monotonically increasing in weirdness", () => {
    expect(surprise(1)).toBeGreaterThan(surprise(0.5));
    expect(surprise(0.5)).toBeGreaterThan(surprise(0));
  });

  it("stays in [0,1]", () => {
    for (const w of [0, 0.1, 0.37, 0.5, 0.8, 1]) {
      expect(surprise(w)).toBeGreaterThanOrEqual(0);
      expect(surprise(w)).toBeLessThanOrEqual(1);
    }
  });
});

describe("trajectory", () => {
  it("has steps+1 points", () => {
    expect(trajectory(0).length).toBe(49);
    expect(trajectory(1, 60).length).toBe(61);
  });

  it("x increases monotonically (the ball always rolls right)", () => {
    const tr = trajectory(0.4);
    for (let i = 1; i < tr.length; i++) {
      expect(tr[i].x).toBeGreaterThanOrEqual(tr[i - 1].x);
    }
  });

  it("ends at a different height for plausible vs impossible", () => {
    const fall = trajectory(0).at(-1).y;
    const hover = trajectory(1).at(-1).y;
    expect(fall).not.toBeCloseTo(hover, 2);
    expect(fall).toBeGreaterThan(hover); // falling ends lower on screen (larger y)
  });

  it("keeps y within [0,1]", () => {
    for (const w of [0, 0.5, 1]) {
      for (const p of trajectory(w)) {
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(1);
      }
    }
  });
});
