import { describe, it, expect } from "vitest";
import {
  ANCHORS, SUBJECT, viewEmbedding, displacement, nearestClass,
} from "./embeddingInvariance.js";

describe("embeddingInvariance", () => {
  const base = SUBJECT.base;

  it("good encoder displacement stays small for any augStrength", () => {
    for (const a of [0, 0.25, 0.5, 0.75, 1]) {
      for (const ang of [0, 1.2, 2.7, 4.5]) {
        expect(displacement(base, a, false, ang)).toBeLessThan(0.05);
      }
    }
  });

  it("broken encoder displacement grows with augStrength", () => {
    const lo = displacement(base, 0.1, true);
    const mid = displacement(base, 0.5, true);
    const hi = displacement(base, 1.0, true);
    expect(mid).toBeGreaterThan(lo);
    expect(hi).toBeGreaterThan(mid);
  });

  it("broken encoder displaces far more than good at high augStrength", () => {
    expect(displacement(base, 1.0, true)).toBeGreaterThan(
      displacement(base, 1.0, false) * 5
    );
  });

  it("nearestClass returns the own-class (cat) anchor for the good encoder", () => {
    const pos = viewEmbedding(base, 1.0, false);
    expect(nearestClass(pos).cls).toBe("cat");
  });

  it("nearestClass can flip to an unrelated class for the broken encoder at high aug", () => {
    const own = nearestClass(viewEmbedding(base, 0, true)).cls;
    const drifted = nearestClass(viewEmbedding(base, 1.0, true)).cls;
    expect(own).toBe("cat");
    expect(drifted).not.toBe("cat");
  });
});
