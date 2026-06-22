import { describe, it, expect } from "vitest";
import { energyAt, energyCurve, negatives, lowEnergyWidth } from "./energyLandscape.js";

describe("energy landscape", () => {
  it("data sits in a low-energy valley near the center", () => {
    const c = 0.4;
    expect(energyAt("regularized", c, { center: c })).toBeLessThan(energyAt("regularized", 0.9, { center: c }));
    expect(energyAt("contrastive", c, { center: c })).toBeLessThan(energyAt("contrastive", 0.9, { center: c }));
  });

  it("regularizer strength narrows the low-energy region (steeper walls)", () => {
    const weak = lowEnergyWidth("regularized", { strength: 0.1 });
    const strong = lowEnergyWidth("regularized", { strength: 0.9 });
    expect(strong).toBeLessThanOrEqual(weak);
  });

  it("more contrastive strength samples more negatives", () => {
    expect(negatives({ strength: 0.9 }).length).toBeGreaterThan(negatives({ strength: 0.1 }).length);
  });

  it("energyCurve returns a normalized, bounded curve", () => {
    const curve = energyCurve("regularized", {}, 50);
    expect(curve.length).toBe(51);
    expect(curve.every((p) => p.e >= 0 && p.e <= 1 && p.u >= 0 && p.u <= 1)).toBe(true);
  });
});
