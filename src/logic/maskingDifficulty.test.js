import { describe, it, expect } from "vitest";
import {
  semanticScore, difficultyLabel, targetBlocks,
  isTrivial, modelStrategy, guessOutcomes, TRIVIAL_SCALE,
} from "./maskingDifficulty.js";

describe("maskingDifficulty", () => {
  it("semanticScore is low for tiny targets, high for I-JEPA-scale blocks", () => {
    expect(semanticScore({ scale: 0.04 })).toBeLessThan(0.2);
    expect(semanticScore({ scale: 0.18 })).toBeGreaterThan(0.6);
  });

  it("semanticScore stays in [0,1]", () => {
    for (const scale of [0.04, 0.1, 0.17, 0.3]) {
      for (const count of [1, 6, 12]) {
        for (const aspect of [0.5, 1, 2]) {
          const s = semanticScore({ scale, count, aspect });
          expect(s).toBeGreaterThanOrEqual(0);
          expect(s).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("difficultyLabel thresholds", () => {
    expect(difficultyLabel(0.8)).toBe("semantic");
    expect(difficultyLabel(0.5)).toBe("mixed");
    expect(difficultyLabel(0.1)).toBe("texture");
  });

  it("targetBlocks returns `count` rects inside the unit square", () => {
    const blocks = targetBlocks({ scale: 0.17, aspect: 1, count: 5 }, () => 0.5);
    expect(blocks).toHaveLength(5);
    for (const b of blocks) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(1.0001);
      expect(b.y + b.h).toBeLessThanOrEqual(1.0001);
    }
  });

  it("isTrivial flips at TRIVIAL_SCALE", () => {
    expect(isTrivial(TRIVIAL_SCALE - 0.01)).toBe(true);
    expect(isTrivial(TRIVIAL_SCALE + 0.01)).toBe(false);
    expect(isTrivial(0.18)).toBe(false);
  });

  it("modelStrategy is copy for small targets, guess for large", () => {
    expect(modelStrategy(0.05)).toBe("copy");
    expect(modelStrategy(0.18)).toBe("guess");
  });

  it("guessOutcomes returns `count` booleans; bigger blocks guess right more often", () => {
    const seq = [0.4, 0.6, 0.2, 0.9, 0.5];
    let i = 0;
    const rng = () => seq[i++ % seq.length];
    const small = guessOutcomes({ scale: 0.12, count: 200 }, () => Math.random());
    const big = guessOutcomes({ scale: 0.28, count: 200 }, () => Math.random());
    expect(small).toHaveLength(200);
    expect(big).toHaveLength(200);
    const rate = (a) => a.filter(Boolean).length / a.length;
    expect(rate(big)).toBeGreaterThan(rate(small));
    const out = guessOutcomes({ scale: 0.2, count: 5 }, rng);
    expect(out).toHaveLength(5);
    for (const o of out) expect(typeof o).toBe("boolean");
  });
});
