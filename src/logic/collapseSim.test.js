import { describe, it, expect } from "vitest";
import { collapseMode, stepCloud, spread, offDiagonalSpread, lossProxy, probeProxy } from "./collapseSim.js";

const makeCloud = () => {
  // deterministic spread grid in the unit square
  const pts = [];
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 6; j++) {
      const hx = 0.1 + (i / 5) * 0.8, hy = 0.1 + (j / 5) * 0.8;
      pts.push({ hx, hy, x: hx, y: hy });
    }
  return pts;
};

const run = (pts, mode, n) => { for (let i = 0; i < n; i++) pts = stepCloud(pts, mode); return pts; };

describe("collapseMode", () => {
  it("maps defenses to the right failure mode", () => {
    expect(collapseMode(false, false)).toBe("complete");
    expect(collapseMode(true, false)).toBe("dimensional");
    expect(collapseMode(true, true)).toBe("healthy");
    expect(collapseMode(false, true)).toBe("healthy"); // VICReg alone is enough
  });
});

describe("collapse dynamics", () => {
  it("complete collapse drives total spread to ~0", () => {
    const after = run(makeCloud(), "complete", 200);
    expect(spread(after)).toBeLessThan(1e-3);
  });

  it("dimensional collapse kills off-diagonal spread but not all spread", () => {
    const after = run(makeCloud(), "dimensional", 200);
    expect(offDiagonalSpread(after)).toBeLessThan(1e-3); // squashed onto y=x
    expect(spread(after)).toBeGreaterThan(0.02);          // still spread along the line
  });

  it("healthy mode holds the cloud spread", () => {
    const start = makeCloud();
    const after = run(start.map((p) => ({ ...p })), "healthy", 200);
    expect(spread(after)).toBeGreaterThan(0.1);
    expect(offDiagonalSpread(after)).toBeGreaterThan(0.02);
  });
});

describe("loss / probe proxies (the cruel-irony pair)", () => {
  it("both proxies are higher for a spread cloud than a collapsed one", () => {
    const healthy = makeCloud();
    const collapsed = run(makeCloud(), "complete", 200);
    expect(lossProxy(healthy)).toBeGreaterThan(lossProxy(collapsed));
    expect(probeProxy(healthy)).toBeGreaterThan(probeProxy(collapsed));
  });

  it("complete collapse drives loss AND probe accuracy toward 0", () => {
    const collapsed = run(makeCloud(), "complete", 200);
    expect(lossProxy(collapsed)).toBeLessThan(0.05);
    expect(probeProxy(collapsed)).toBeLessThan(0.05);
  });

  it("dimensional collapse also crashes probe accuracy (a line carries little)", () => {
    const line = run(makeCloud(), "dimensional", 200);
    const healthy = makeCloud();
    expect(probeProxy(line)).toBeLessThan(probeProxy(healthy));
  });
});
