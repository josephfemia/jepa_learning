import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { cellCount, coverage, negativesNeeded, fmtCount } from "../logic/curseDim.js";

/* Curse of Dimensionality for Negatives.
   Contrastive learning pushes energy UP at sampled negatives — but to keep
   energy high EVERYWHERE you must cover the space, and the number of regions
   grows as g^D. Crank D and watch coverage crater for a fixed budget of N
   negatives. The readout "negatives needed for 90% coverage" explodes. This is
   the rigorous version of "you'd need exponentially many negatives" — and the
   reason JEPA's lineage runs through regularizers (VICReg/SIGReg) instead of
   InfoNCE. SVG, no perpetual animation (slider-driven), reduced-motion-safe. */
export default function CurseDimLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const W = 600, H = 300;
    const G = 4; // cells per axis (schematic resolution; matches curseDim default)
    const svg = R.SVG(stage, W, H);
    // grid panel (left), readouts (right)
    const P = { x0: 24, y0: 30, x1: 320, y1: H - 30 };
    let D = 2, N = 200;

    const readout = R.ce("div");
    readout.style.cssText = "font-family:var(--font-mono);font-size:12px;color:#C8CFDA;margin-top:10px;line-height:1.6;min-height:40px";
    stage.appendChild(readout);

    // deterministic pseudo-random in [0,1) so the scatter is stable per draw
    const rng = (seed) => { let s = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

    // Y for a 0..1 fraction inside a vertical bar region
    const draw = () => {
      R.clr(svg);
      const cells = cellCount(D, G);
      const cov = coverage(D, N, G);
      const need = negativesNeeded(D, 0.9, G);

      // ---- LEFT: the space, shown literally for D<=2, schematically beyond ----
      svg.appendChild(R.TX(P.x0, 16, "the space to cover (negatives must fill it)", { anchor: "start", size: 10, fill: R.C.dim }));
      const pw = P.x1 - P.x0, ph = P.y1 - P.y0;

      if (D <= 2) {
        // literal grid: D=1 → a row of G cells; D=2 → G×G cells.
        const cols = D === 1 ? G : G;
        const rows = D === 1 ? 1 : G;
        const cellsTotal = cols * rows;
        // mark which cells are "covered": deterministically hit cells by N draws
        const hit = new Array(cellsTotal).fill(false);
        // expected covered count = cov * cellsTotal; pick that many lowest-rng cells
        const order = Array.from({ length: cellsTotal }, (_, i) => i)
          .sort((a, b) => rng(a + D * 17) - rng(b + D * 17));
        const nCovered = Math.round(cov * cellsTotal);
        for (let i = 0; i < nCovered; i++) hit[order[i]] = true;

        const cwid = pw / cols, chei = ph / rows;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            const x = P.x0 + c * cwid, y = P.y0 + r * chei;
            svg.appendChild(R.E("rect", {
              x: x + 1, y: y + 1, width: cwid - 2, height: chei - 2, rx: 3,
              fill: hit[idx] ? R.C.cyan : "rgba(120,140,200,0.06)",
              "fill-opacity": hit[idx] ? 0.32 : 1,
              stroke: hit[idx] ? R.C.cyan : R.C.grid, "stroke-width": 1,
            }));
          }
        }
        // scatter N negatives as orange dots (capped for legibility)
        const shown = Math.min(N, 260);
        for (let i = 0; i < shown; i++) {
          const x = P.x0 + rng(i * 2.1 + D) * pw;
          const y = D === 1 ? P.y0 + ph / 2 + (rng(i * 3.3) - 0.5) * chei * 0.6
                            : P.y0 + rng(i * 5.7 + 1) * ph;
          svg.appendChild(R.E("circle", { cx: x, cy: y, r: 2, fill: R.C.orange, "fill-opacity": 0.8 }));
        }
      } else {
        // schematic: too many regions to draw — show the count + a covered bar.
        svg.appendChild(R.E("rect", { x: P.x0, y: P.y0, width: pw, height: ph, rx: 6, fill: "rgba(120,140,200,0.05)", stroke: R.C.grid, "stroke-width": 1 }));
        svg.appendChild(R.TX(P.x0 + pw / 2, P.y0 + ph / 2 - 22, "regions = " + G + "^" + D, { anchor: "middle", size: 13, fill: R.C.ink, sans: true, weight: 600 }));
        svg.appendChild(R.TX(P.x0 + pw / 2, P.y0 + ph / 2 + 2, "= " + fmtCount(cells), { anchor: "middle", size: 22, fill: R.C.violet, sans: true, weight: 700 }));
        svg.appendChild(R.TX(P.x0 + pw / 2, P.y0 + ph / 2 + 26, "too many to draw — " + fmtCount(N) + " negatives can't fill them", { anchor: "middle", size: 9.5, fill: R.C.dim }));
        // faint scatter to keep the "negatives are sparse" feel
        for (let i = 0; i < 120; i++) {
          svg.appendChild(R.E("circle", { cx: P.x0 + rng(i * 1.7) * pw, cy: P.y0 + rng(i * 4.2 + 9) * ph, r: 1.5, fill: R.C.orange, "fill-opacity": 0.5 }));
        }
      }

      // ---- RIGHT: the big coverage meter + needed-count ----
      const rx = 360, rw = W - 24 - rx;
      // coverage bar (vertical-ish): label + horizontal fill
      svg.appendChild(R.TX(rx, 16, "% of space within reach of a negative", { anchor: "start", size: 10, fill: R.C.dim }));
      const barY = 30, barH = 26;
      svg.appendChild(R.E("rect", { x: rx, y: barY, width: rw, height: barH, rx: 5, fill: "rgba(120,140,200,0.14)" }));
      const covCol = cov > 0.6 ? R.C.green : cov > 0.2 ? R.C.orange : R.C.red;
      svg.appendChild(R.E("rect", { x: rx, y: barY, width: Math.max(2, rw * cov), height: barH, rx: 5, fill: covCol, "fill-opacity": 0.85 }));
      svg.appendChild(R.TX(rx + 8, barY + barH / 2 + 5, (cov * 100).toFixed(cov < 0.1 ? 2 : 1) + "%", { anchor: "start", size: 14, fill: "#0b0e14", sans: true, weight: 700 }));

      // region count chip
      svg.appendChild(R.TX(rx, 92, "regions to cover (" + G + "^D)", { anchor: "start", size: 10, fill: R.C.dim }));
      svg.appendChild(R.TX(rx, 116, fmtCount(cells), { anchor: "start", size: 22, fill: R.C.violet, sans: true, weight: 700 }));

      // negatives needed for 90%
      svg.appendChild(R.TX(rx, 158, "negatives needed for 90% coverage", { anchor: "start", size: 10, fill: R.C.dim }));
      svg.appendChild(R.TX(rx, 184, fmtCount(need), { anchor: "start", size: 26, fill: R.C.orange, sans: true, weight: 700 }));
      // your budget, for contrast
      svg.appendChild(R.TX(rx, 212, "your budget N = " + fmtCount(N), { anchor: "start", size: 11, fill: R.C.cyan, sans: true }));
      const enough = N >= need;
      svg.appendChild(R.TX(rx, 232, enough ? "→ enough to cover this space" : "→ nowhere near enough", { anchor: "start", size: 10.5, fill: enough ? R.C.green : R.C.red }));

      // verdict line
      const verdict = D <= 2
        ? `At D=<b style="color:${R.C.cyan}">${D}</b> a budget of <b style="color:${R.C.orange}">${fmtCount(N)}</b> negatives covers <b style="color:${covCol}">${(cov * 100).toFixed(0)}%</b> of the space — manageable.`
        : `At D=<b style="color:${R.C.cyan}">${D}</b> there are <b style="color:${R.C.violet}">${fmtCount(cells)}</b> regions. ${fmtCount(N)} negatives reach <b style="color:${covCol}">${(cov * 100).toFixed(cov < 0.1 ? 2 : 1)}%</b> — you'd need <b style="color:${R.C.orange}">${fmtCount(need)}</b> for 90%. Sampling can't win this.`;
      readout.innerHTML = verdict;
    };

    R.slider(ctrl, { label: "dimensions D", min: 1, max: 8, step: 1, value: D, fmt: (v) => String(v), on: (v) => { D = v; draw(); } });
    // N as log-ish steps via a slider over an index into a value table
    const NVALS = [10, 25, 50, 100, 200, 400, 800, 1200, 2000];
    R.slider(ctrl, { label: "# negatives N", min: 0, max: NVALS.length - 1, step: 1, value: 3, fmt: (i) => fmtCount(NVALS[i]), on: (i) => { N = NVALS[i]; draw(); } });
    R.legend(stage, [[R.C.orange, "sampled negatives"], [R.C.cyan, "region a negative reaches"], [R.C.violet, "region count g^D"]]);
    draw();
  }, []);

  return (
    <Lab id="curse" title="Why contrastive learning loses in high dimensions" setup={setup}
      note="Contrastive learning keeps energy high by pushing UP at sampled negatives — but to hold energy high everywhere, those negatives have to COVER the space. The number of distinct regions grows as g^D (g per axis, D dimensions). Crank D: with a fixed budget of negatives, coverage craters toward 0% and the negatives you'd need for 90% coverage explodes exponentially. No sampling budget survives high D — which is exactly why JEPA's lineage runs through regularizers (VICReg, SIGReg) that constrain the embedding STATISTICS instead of sampling negatives. Illustrative grid (g=4), not a measurement." />
  );
}
