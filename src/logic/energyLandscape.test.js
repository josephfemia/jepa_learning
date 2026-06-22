import { describe, it, expect } from "vitest";
import { energyAt, energyCurve, negatives, lowEnergyWidth } from "./energyLandscape.js";

describe("energy landscape", () => {
  it("data sits in a low-energy valley near the center", () => {
    const c = 0.4;
    expect(energyAt("regularized", c, { center: c })).toBeLessThan(energyAt("regularized", 0.9, { center: c }));
    expect(energyAt("contrastive", c, { center: c })).toBeLessThan(energyAt("contrastive", 0.9, { center: c }));
  });

  it("regularizer strength shrinks the low-energy region (steeper walls + narrower valley)", () => {
    const weak = lowEnergyWidth("regularized", { strength: 0.1 });
    const strong = lowEnergyWidth("regularized", { strength: 0.9 });
    expect(strong).toBeLessThan(weak);
  });

  it("more contrastive negatives shrink the low-energy region (the bumps hem in the valley)", () => {
    const weak = lowEnergyWidth("contrastive", { strength: 0.1 });
    const strong = lowEnergyWidth("contrastive", { strength: 0.9 });
    expect(strong).toBeLessThan(weak);
  });

  it("more contrastive strength samples more negatives", () => {
    expect(negatives({ strength: 0.9 }).length).toBeGreaterThan(negatives({ strength: 0.1 }).length);
  });

  it("negative arrows sit on the energy bumps they create (drawn e matches energyAt)", () => {
    const opts = { strength: 0.7 };
    for (const ng of negatives(opts)) {
      expect(ng.e).toBeCloseTo(energyAt("contrastive", ng.u, opts), 6);
      expect(ng.e).toBeGreaterThan(0.5); // negatives are genuinely high-energy
    }
  });

  it("the data valley center stays low-energy even with many negatives", () => {
    const c = 0.4;
    expect(energyAt("contrastive", c, { center: c, strength: 0.9 })).toBeLessThan(0.3);
  });

  it("energyCurve returns a normalized, bounded curve", () => {
    const curve = energyCurve("regularized", {}, 50);
    expect(curve.length).toBe(51);
    expect(curve.every((p) => p.e >= 0 && p.e <= 1 && p.u >= 0 && p.u <= 1)).toBe(true);
  });
});
