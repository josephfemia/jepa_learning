import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { FUTURES, energyAtY, curveY, freeEnergy, nearestFuture } from "../logic/minOverZ.js";

/* "min over z" multimodal energy explorer. One context, several valid futures →
   an energy landscape over the future y with one valley per future. The z slider
   picks which future the predictor commits to; the dashed line is the free energy
   F = min_z E — the lowest valley. The aha: a JEPA can hold MANY low-energy
   futures at once, and never needs a normalized probability over them. */
export default function MinOverZLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const W = 600, H = 240;
    const svg = R.SVG(stage, W, H);
    let z = 0.5;
    const range = H - 70;
    const X = (u) => 30 + u * (W - 60);
    const Y = (e) => 22 + (1 - e) * range;   // low energy (valley) sits LOW on screen

    const readout = R.ce("div");
    readout.style.cssText = "font-family:var(--font-mono);font-size:12px;color:#C8CFDA;margin-top:10px;line-height:1.5;min-height:34px";
    stage.appendChild(readout);

    const draw = () => {
      R.clr(svg);
      svg.appendChild(R.E("line", { x1: 30, y1: H - 30, x2: W - 30, y2: H - 30, stroke: R.C.axis, "stroke-width": 1 }));
      svg.appendChild(R.TX(30, 15, "energy  E(x, y, z)", { anchor: "start", size: 10, fill: R.C.dim }));
      svg.appendChild(R.TX(W - 30, H - 8, "candidate future y →", { anchor: "end", size: 10, fill: R.C.dim }));
      // the multi-valley curve
      const cv = curveY();
      const d = "M " + cv.map((p) => `${X(p.y).toFixed(1)},${Y(p.e).toFixed(1)}`).join(" L ");
      svg.appendChild(R.E("path", { d, fill: "none", stroke: R.C.violet, "stroke-width": 2.4 }));
      // free-energy line (the min)
      const F = freeEnergy();
      svg.appendChild(R.E("line", { x1: 30, y1: Y(F), x2: W - 30, y2: Y(F), stroke: R.C.cyan, "stroke-width": 1.2, "stroke-dasharray": "5 4" }));
      svg.appendChild(R.TX(34, Y(F) - 7, `F = min over z of E = ${F.toFixed(2)}`, { anchor: "start", size: 10.5, fill: R.C.cyan }));
      // future labels under their valleys
      FUTURES.forEach((f) => svg.appendChild(R.TX(X(f.c), H - 14, f.label, { size: 9.5, fill: R.C.dim })));
      // the z marker riding the curve
      const ez = energyAtY(z);
      svg.appendChild(R.E("line", { x1: X(z), y1: Y(ez), x2: X(z), y2: H - 30, stroke: R.C.green, "stroke-width": 1, "stroke-dasharray": "2 3" }));
      svg.appendChild(R.E("circle", { cx: X(z), cy: Y(ez), r: 6, fill: R.C.green }));
      svg.appendChild(R.TX(X(z), Y(ez) - 12, `z`, { size: 10, fill: R.C.green, weight: 600 }));
      const nf = nearestFuture(z);
      readout.innerHTML = nf >= 0
        ? `z lands in a <b style="color:${R.C.green}">valid future</b> — "${FUTURES[nf].label}." Energy is low (${ez.toFixed(2)}); it's one of several equally legitimate answers, no probability needed.`
        : `Between valleys: energy is high (${ez.toFixed(2)}). No real future looks like this — z has to settle <em>into</em> a valley, and min&nbsp;<sub>z</sub> keeps the best one.`;
    };

    R.slider(ctrl, { label: "latent z (which future)", min: 0, max: 1, step: 0.005, value: z, fmt: (v) => v.toFixed(2), on: (v) => { z = v; draw(); } });
    R.legend(stage, [[R.C.violet, "energy over futures"], [R.C.green, "the future z selects"], [R.C.cyan, "F = min over z"]]);
    draw();
  }, []);

  return (
    <Lab id="minz" title="One context, many valid futures (min over z)" setup={setup}
      note="The context fixes everything except z. Drag z and the marker hops between valleys — each a different legitimate future. The free energy F = minₖ E(x,y,z) is just the lowest valley (dashed line): a JEPA can hold several low-energy futures at once and never has to normalize a probability over all of them. That's the whole reason EBMs sidestep the partition function." />
  );
}
