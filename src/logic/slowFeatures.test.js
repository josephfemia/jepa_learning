import { describe, it, expect } from "vitest";
import { focus, predictability, usefulness } from "./slowFeatures.js";

describe("slow-features / distractor trap", () => {
  it("predictability decreases with masking", () => {
    expect(predictability(0)).toBeGreaterThan(predictability(0.5));
    expect(predictability(0.5)).toBeGreaterThan(predictability(1));
  });

  it("usefulness increases with masking", () => {
    expect(usefulness(1)).toBeGreaterThan(usefulness(0.5));
    expect(usefulness(0.5)).toBeGreaterThan(usefulness(0));
  });

  it("at masking 0 the trap: predictability >> usefulness", () => {
    expect(predictability(0) - usefulness(0)).toBeGreaterThan(0.5);
  });

  it("usefulness tracks focus", () => {
    for (const m of [0, 0.25, 0.5, 0.75, 1]) {
      expect(usefulness(m)).toBe(focus(m));
    }
  });

  it("all outputs in [0,1]", () => {
    for (const m of [-1, 0, 0.3, 0.7, 1, 2]) {
      for (const f of [focus, predictability, usefulness]) {
        const v = f(m);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});
