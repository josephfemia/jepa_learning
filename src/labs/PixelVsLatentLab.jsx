import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { usefulSignal, wastedEffort, usefulFraction } from "../logic/reconTax.js";

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

    const bar = (y, label, val, color, sub) => {
      svg.appendChild(R.TX(20, y - 10, label, { anchor: "start", sans: true, size: 12, fill: "#E7ECF5", weight: 600 }));
      svg.appendChild(R.TX(W - 20, y - 10, String(val), { anchor: "end", size: 13, fill: color, weight: 600 }));
      svg.appendChild(R.E("rect", { x: 20, y, width: W - 40, height: 16, rx: 8, fill: "rgba(200,207,218,0.12)" }));
      svg.appendChild(R.E("rect", { x: 20, y, width: (W - 40) * Math.min(1, val / 100), height: 16, rx: 8, fill: color }));
      svg.appendChild(R.TX(20, y + 34, sub, { anchor: "start", size: 10.5, fill: R.C.dim }));
    };
    const draw = () => {
      R.clr(svg);
      const u = usefulSignal(detail), w = wastedEffort(detail);
      bar(46, "Useful semantic signal", u, R.C.cyan, "what helps downstream reasoning");
      bar(132, "Effort on unpredictable detail", w, R.C.orange, "texture, noise, lighting — can't be predicted");
      const f = usefulFraction(detail);
      readout.innerHTML = f > 0.6
        ? `Stay abstract and almost all capacity is <b style="color:${R.C.cyan}">useful signal</b> — the regime JEPA lives in.`
        : f > 0.35
        ? `As you demand more detail, effort tilts toward things that don't help downstream. The useful signal already saturated.`
        : `At pixel-perfect reconstruction most of the budget goes to detail the model can't even reliably predict — <b style="color:${R.C.orange}">the reconstruction tax</b>.`;
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
