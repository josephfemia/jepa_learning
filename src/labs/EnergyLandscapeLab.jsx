import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { energyCurve, energyAt, negatives, lowEnergyWidth } from "../logic/energyLandscape.js";

/* Energy Landscape Explorer (replaces the old static ContrastiveVsRegularized).
   The central EBM picture, made tactile: drag the data position and the
   strength knob, flip between the two ways to keep energy high everywhere else,
   and watch the low-energy region shrink. */
export default function EnergyLandscapeLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const W = 600, H = 230;
    const svg = R.SVG(stage, W, H);
    let mode = "regularized", strength = 0.5, center = 0.4;
    const X = (u) => 24 + u * (W - 48);
    const Y = (e) => 18 + (1 - e) * (H - 56);   // energy points up
    let widthOut;

    const draw = () => {
      R.clr(svg);
      const opts = { strength, center, width: 0.09 };
      const accent = mode === "regularized" ? R.C.cyan : R.C.violet;
      // baseline + axis label
      svg.appendChild(R.E("line", { x1: 24, y1: H - 38, x2: W - 24, y2: H - 38, stroke: R.C.axis, "stroke-width": 1 }));
      svg.appendChild(R.TX(24, 14, "energy", { anchor: "start", size: 10, fill: R.C.dim }));
      svg.appendChild(R.TX(W - 24, H - 24, "embedding slice →", { anchor: "end", size: 10, fill: R.C.dim }));
      // the energy curve
      const curve = energyCurve(mode, opts, 120);
      const d = "M " + curve.map((p) => `${X(p.u).toFixed(1)},${Y(p.e).toFixed(1)}`).join(" L ");
      svg.appendChild(R.E("path", { d, fill: "none", stroke: accent, "stroke-width": 2.6 }));
      // data marker in the valley
      const de = energyAt(mode, center, opts);
      svg.appendChild(R.E("circle", { cx: X(center), cy: Y(de), r: 6, fill: R.C.green }));
      svg.appendChild(R.TX(X(center), Y(de) + 20, "data · low E", { size: 11, fill: R.C.green }));
      if (mode === "contrastive") {
        negatives(opts).forEach((ng) => {
          const x = X(ng.u), yTop = Y(ng.e);
          svg.appendChild(R.E("line", { x1: x, y1: Y(0.45), x2: x, y2: yTop, stroke: R.C.orange, "stroke-width": 2, "stroke-linecap": "round" }));
          svg.appendChild(R.E("path", { d: `M ${x} ${yTop - 3} L ${x - 5} ${yTop + 8} L ${x + 5} ${yTop + 8} Z`, fill: R.C.orange }));
        });
        svg.appendChild(R.TX(W - 28, 30, "push negatives up", { anchor: "end", size: 11, fill: R.C.orange }));
      } else {
        svg.appendChild(R.TX(W - 28, 30, "walls held high by stats", { anchor: "end", size: 11, fill: R.C.cyan }));
      }
      const w = lowEnergyWidth(mode, opts);
      if (widthOut) widthOut.textContent = (w * 100).toFixed(0) + "% low-energy";
    };

    const modeBtn = R.btn(ctrl, "Mode: regularized", "primary", () => {
      mode = mode === "regularized" ? "contrastive" : "regularized";
      modeBtn.textContent = "Mode: " + mode; draw();
    });
    R.slider(ctrl, { label: "strength", min: 0, max: 1, step: 0.05, value: strength, fmt: (v) => v.toFixed(2), on: (v) => { strength = v; draw(); } });
    R.slider(ctrl, { label: "data position", min: 0.15, max: 0.85, step: 0.01, value: center, fmt: (v) => v.toFixed(2), on: (v) => { center = v; draw(); } });
    // little readout chip
    const chip = R.ce("div", "ctrl");
    const lab = R.ce("label", null, "low-energy region");
    widthOut = R.ce("span", "val", "—");
    const row = R.ce("div"); row.appendChild(lab); row.appendChild(widthOut);
    chip.appendChild(row); ctrl.appendChild(chip);

    draw();
  }, []);

  return (
    <Lab id="energy" title="Shape the energy landscape" setup={setup}
      note="An EBM is only useful if low energy is RARE — reserved for compatible data. Two ways to keep energy high everywhere else: push up sampled negatives (contrastive — you must find them), or constrain the embedding statistics so the valley can't widen (regularized — one knob, no negatives). Watch the low-energy region shrink as you turn up the strength." />
  );
}
