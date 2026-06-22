import { describe, it, expect } from "vitest";
import { MODES, dial, label } from "./stabilityDial.js";

describe("stabilityDial", () => {
  it("SIGReg reaches higher feature quality than a frozen encoder", () => {
    expect(dial("sigreg").quality).toBeGreaterThan(dial("frozen").quality);
  });

  it("no-reg end-to-end is far less stable than freezing the encoder", () => {
    expect(dial("none").stability).toBeLessThan(dial("frozen").stability);
  });

  it("SIGReg is the synthesis — both meters high (>0.8)", () => {
    const d = dial("sigreg");
    expect(d.stability).toBeGreaterThan(0.8);
    expect(d.quality).toBeGreaterThan(0.8);
  });

  it("multi-term is more fragile than SIGReg but more capable than none", () => {
    expect(dial("multiterm").stability).toBeLessThan(dial("sigreg").stability);
    expect(dial("multiterm").quality).toBeGreaterThan(dial("none").quality);
  });

  it("every mode returns stability and quality in [0,1]", () => {
    for (const m of MODES) {
      const d = dial(m);
      expect(d.stability).toBeGreaterThanOrEqual(0);
      expect(d.stability).toBeLessThanOrEqual(1);
      expect(d.quality).toBeGreaterThanOrEqual(0);
      expect(d.quality).toBeLessThanOrEqual(1);
    }
  });

  it("unknown mode falls back to the collapsing case", () => {
    expect(dial("bogus")).toEqual(dial("none"));
  });

  it("every mode has a short human label", () => {
    for (const m of MODES) expect(typeof label(m)).toBe("string");
  });
});
