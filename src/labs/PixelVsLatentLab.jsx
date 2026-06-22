import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { usefulFraction } from "../logic/reconTax.js";

/* The reconstruction tax — toolkit port, dark stage. Drag how much pixel detail
   a generative model must reproduce; watch where its effort actually goes. */
export default function PixelVsLatentLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const W = 600, H = 200;
    const svg = R.SVG(stage, W, H);
    const readout = document.createElement("div");
    readout.style.cssText = "font-family:var(--font-serif);font-size:13.5px;color:#C8CFDA;margin-top:12px;line-height:1.55;min-height:40px";
    stage.appendChild(readout);
    let detail = 80;

    const X0 = 24, BW = W - 48, BY = 78, BH = 40;
    const draw = () => {
      R.clr(svg);
      const f = usefulFraction(detail);          // useful share of a FIXED budget
      const usePct = Math.round(f * 100), wastePct = 100 - usePct;
      const wUse = BW * f;
      // heading
      svg.appendChild(R.TX(X0, 34, "ONE FIXED CAPACITY BUDGET", { anchor: "start", size: 10.5, fill: R.C.dim, weight: 600 }));
      svg.appendChild(R.TX(W - X0, 34, "every unit spent on noise is a unit NOT spent on meaning", { anchor: "end", size: 10.5, fill: R.C.dim }));
      // the single stacked bar (zero-sum)
      svg.appendChild(R.E("rect", { x: X0, y: BY, width: BW, height: BH, rx: 9, fill: "rgba(200,207,218,0.12)" }));
      svg.appendChild(R.E("rect", { x: X0, y: BY, width: wUse, height: BH, rx: 9, fill: R.C.cyan }));
      // wasted segment (right portion) — draw as its own rounded rect on top
      if (wastePct > 0) svg.appendChild(R.E("rect", { x: X0 + wUse, y: BY, width: BW - wUse, height: BH, rx: 9, fill: R.C.orange }));
      // divider
      svg.appendChild(R.E("line", { x1: X0 + wUse, y1: BY - 4, x2: X0 + wUse, y2: BY + BH + 4, stroke: "#0F1422", "stroke-width": 2 }));
      // in-segment labels
      if (wUse > 70) svg.appendChild(R.TX(X0 + 12, BY + BH / 2 + 4, `useful · ${usePct}%`, { anchor: "start", size: 12, fill: "#0B1020", weight: 700 }));
      if (BW - wUse > 70) svg.appendChild(R.TX(X0 + BW - 12, BY + BH / 2 + 4, `wasted · ${wastePct}%`, { anchor: "end", size: 12, fill: "#0B1020", weight: 700 }));
      // captions
      svg.appendChild(R.TX(X0, BY + BH + 26, "useful semantic signal (JEPA keeps)", { anchor: "start", size: 10.5, fill: R.C.cyan }));
      svg.appendChild(R.TX(W - X0, BY + BH + 26, "noise/texture it can't predict (the tax)", { anchor: "end", size: 10.5, fill: R.C.orange }));
      readout.innerHTML = f > 0.6
        ? `Stay abstract and almost the whole budget is <b style="color:${R.C.cyan}">useful signal</b> — the regime JEPA lives in.`
        : f > 0.35
        ? `As you demand more detail, the orange share <b>eats into</b> the budget — useful signal already saturated, so every extra unit is wasted.`
        : `At pixel-perfect reconstruction most of the one budget goes to detail the model can't even reliably predict — <b style="color:${R.C.orange}">the reconstruction tax</b>.`;
    };

    R.slider(ctrl, {
      label: "pixel detail demanded", min: 5, max: 100, step: 1, value: detail,
      fmt: (v) => (v < 35 ? "abstract" : v < 70 ? "mixed" : "pixel-perfect"),
      on: (v) => { detail = v; draw(); },
    });
    R.legend(stage, [[R.C.cyan, "useful signal (JEPA keeps)"], [R.C.orange, "wasted on detail (the tax)"]]);
    draw();
  }, []);

  return (
    <Lab id="recon" title="The reconstruction tax" setup={setup}
      note="A generative model is graded on reproducing raw pixels; a JEPA is graded in embedding space. Drag toward pixel-perfect and watch effort tilt away from meaning and toward detail that can't be predicted — that wasted effort is the tax JEPA refuses to pay." />
  );
}
