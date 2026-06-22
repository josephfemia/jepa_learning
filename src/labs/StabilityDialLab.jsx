import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { MODES, dial, label } from "../logic/stabilityDial.js";

/* The Stability Dial — turn the world-model table into a felt tradeoff. Four
   recipes for training a world model end-to-end without collapse:
     none      → collapses (both meters crater)
     frozen    → stable but capped (high stability, mid quality)
     multiterm → powerful but fragile (mid stability, good quality)
     sigreg    → the synthesis (both high)
   A stability×quality plane plots all four; the selected one lights up with a
   small embedding cloud whose health matches its quality. Cycle the modes and
   watch only SIGReg land in the top-right corner — the only mode that doesn't
   make you choose. */
export default function StabilityDialLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const W = 600, H = 320;
    const svg = R.SVG(stage, W, H);
    // plot box: x = stability, y = quality (up)
    const P = { x0: 64, y0: 22, x1: 360, y1: H - 50 };
    const X = (u) => P.x0 + u * (P.x1 - P.x0);
    const Y = (v) => P.y0 + (1 - v) * (P.y1 - P.y0);
    // embedding-cloud panel on the right
    const G = { x0: 408, y0: 64, x1: W - 28, y1: H - 64 };

    const COLOR = { none: R.C.red, frozen: R.C.violet, multiterm: R.C.orange, sigreg: R.C.green };
    let mode = "sigreg";

    const meter = R.meters(stage, ["training stability", "feature quality / task ceiling"]);
    const refresh = () => {
      const d = dial(mode);
      meter.set(0, Math.round(d.stability * 100), R.C.orange);
      meter.set(1, Math.round(d.quality * 100), R.C.orange);
    };

    // a fixed jittered cloud layout; we contract it toward a point as quality drops
    const N = 40;
    const cloud = Array.from({ length: N }, () => ({
      x: 0.12 + Math.random() * 0.76,
      y: 0.12 + Math.random() * 0.76,
    }));

    const draw = () => {
      R.clr(svg);

      // ---- stability × quality plane ----
      svg.appendChild(R.E("rect", { x: P.x0, y: P.y0, width: P.x1 - P.x0, height: P.y1 - P.y0, fill: "rgba(120,140,200,0.05)", stroke: R.C.grid, "stroke-width": 1, rx: 6 }));
      // "the corner you want" — top-right shading
      svg.appendChild(R.E("rect", { x: X(0.66), y: Y(1), width: (P.x1 - X(0.66)), height: (Y(0.66) - P.y0), fill: R.C.green, "fill-opacity": 0.07 }));
      svg.appendChild(R.TX(X(0.99), Y(0.96) + 2, "both high", { anchor: "end", size: 9.5, fill: R.C.green, sans: true }));
      // axis labels
      svg.appendChild(R.TX((P.x0 + P.x1) / 2, P.y1 + 18, "training stability →", { anchor: "middle", size: 10, fill: R.C.dim, sans: true }));
      svg.appendChild(R.TX(P.x0 - 10, P.y0 + 2, "quality ↑", { anchor: "end", size: 10, fill: R.C.dim, sans: true }));

      // all four modes as dots; selected one is large + ringed
      MODES.forEach((m) => {
        const d = dial(m);
        const c = COLOR[m];
        const cx = X(d.stability), cy = Y(d.quality);
        const sel = m === mode;
        if (sel) svg.appendChild(R.E("circle", { cx, cy, r: 13, fill: "none", stroke: c, "stroke-width": 1.5, "stroke-opacity": 0.5 }));
        svg.appendChild(R.E("circle", { cx, cy, r: sel ? 7 : 4.5, fill: c, "fill-opacity": sel ? 1 : 0.5, stroke: "#0b0e14", "stroke-width": sel ? 1.5 : 0 }));
        svg.appendChild(R.TX(cx, cy - (sel ? 16 : 10), label(m), { anchor: "middle", size: sel ? 10.5 : 9, fill: c, weight: sel ? 700 : 500, sans: true }));
      });

      // ---- embedding-cloud health panel ----
      const d = dial(mode);
      const c = COLOR[mode];
      svg.appendChild(R.E("rect", { x: G.x0, y: G.y0, width: G.x1 - G.x0, height: G.y1 - G.y0, fill: "rgba(120,140,200,0.05)", stroke: R.C.grid, "stroke-width": 1, rx: 6 }));
      svg.appendChild(R.TX((G.x0 + G.x1) / 2, G.y0 - 8, "learned features", { anchor: "middle", size: 10, fill: R.C.dim, sans: true }));
      // higher quality → cloud stays spread; low quality → contracts toward center (collapse)
      const gx = (u) => G.x0 + u * (G.x1 - G.x0);
      const gy = (v) => G.y0 + v * (G.y1 - G.y0);
      const spread = R.clamp(0.12 + d.quality * 0.88, 0, 1);
      cloud.forEach((p) => {
        const px = gx(0.5 + (p.x - 0.5) * spread);
        const py = gy(0.5 + (p.y - 0.5) * spread);
        svg.appendChild(R.E("circle", { cx: px, cy: py, r: 2.6, fill: c, "fill-opacity": 0.8 }));
      });
      svg.appendChild(R.TX((G.x0 + G.x1) / 2, G.y1 + 16,
        d.quality < 0.35 ? "collapsed — low rank" : (d.quality < 0.62 ? "usable, capped" : "rich, well-spread"),
        { anchor: "middle", size: 9.5, fill: c, sans: true }));
    };

    // mode selector buttons
    const btns = {};
    MODES.forEach((m) => {
      btns[m] = R.btn(ctrl, label(m), m === mode ? "primary" : "", () => {
        mode = m;
        MODES.forEach((k) => { btns[k].className = "lab-btn" + (k === mode ? " primary" : ""); });
        draw(); refresh();
      });
    });

    R.legend(stage, [
      [R.C.red, "none (collapses)"],
      [R.C.violet, "frozen (capped)"],
      [R.C.orange, "multi-term (fragile)"],
      [R.C.green, "SIGReg (both high)"],
    ]);

    draw(); refresh();
  }, []);

  return (
    <Lab id="stability" title="The stability dial — pick a recipe, pay the price" setup={setup}
      note="Four answers to 'train a world model end-to-end without collapse.' Drop the regularizer entirely and it collapses — both meters crater. Freeze the encoder and you're stable but capped by whatever features you inherited. Train end-to-end with a stack of seven VICReg-style terms (PLDM) and you get strong features, but the run is fragile and tuning-heavy. Add SIGReg instead (LeWM) and you land in the top-right corner of the plane — high stability AND high quality. Cycle the modes: every other recipe forces a tradeoff between the two axes. SIGReg is the only one that refuses to make you choose. (Meter values are illustrative — the ordering, not the exact percentages, is the point.)" />
  );
}
