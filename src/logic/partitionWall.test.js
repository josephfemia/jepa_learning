import { describe, it, expect } from "vitest";
import { outcomeCount, probCost, energyCost, fmtCount } from "./partitionWall.js";

describe("partition-function wall", () => {
  it("outcomeCount grows exponentially in level (base 3)", () => {
    expect(outcomeCount(1)).toBe(3);
    expect(outcomeCount(6)).toBe(729);
    expect(outcomeCount(2, 4)).toBe(16);
  });

  it("probCost equals outcomeCount (must visit every outcome)", () => {
    expect(probCost(6)).toBe(729);
    for (let l = 1; l <= 10; l++) expect(probCost(l)).toBe(outcomeCount(l));
  });

  it("probCost is strictly increasing in level", () => {
    for (let l = 1; l < 10; l++) expect(probCost(l + 1)).toBeGreaterThan(probCost(l));
  });

  it("energyCost is flat at 1", () => {
    expect(energyCost()).toBe(1);
  });

  it("probCost exceeds energyCost for level >= 1", () => {
    for (let l = 1; l <= 10; l++) expect(probCost(l)).toBeGreaterThan(energyCost());
  });

  it("fmtCount produces compact strings", () => {
    expect(fmtCount(729)).toBe("729");
    expect(fmtCount(1200)).toBe("1.2k");
    expect(fmtCount(59049)).toBe("59k");
    expect(fmtCount(3.4e6)).toBe("3.4M");
    expect(fmtCount(5.9e7)).toBe("5.9e7");
  });
});
