import { describe, it, expect } from "vitest";
import { usefulSignal, wastedEffort, usefulFraction } from "./reconTax.js";

describe("reconstruction tax", () => {
  it("useful signal saturates early (concave, near-100 at full detail)", () => {
    expect(usefulSignal(100)).toBeGreaterThan(95);
    // marginal gain from 20→40 exceeds gain from 80→100 (diminishing returns)
    expect(usefulSignal(40) - usefulSignal(20)).toBeGreaterThan(usefulSignal(100) - usefulSignal(80));
  });
  it("wasted effort rises monotonically with detail", () => {
    expect(wastedEffort(100)).toBeGreaterThan(wastedEffort(50));
    expect(wastedEffort(50)).toBeGreaterThan(wastedEffort(10));
  });
  it("useful fraction falls as detail rises (the tax)", () => {
    expect(usefulFraction(10)).toBeGreaterThan(usefulFraction(100));
  });
});
