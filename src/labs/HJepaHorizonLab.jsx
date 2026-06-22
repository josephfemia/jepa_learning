import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { detailedError, abstractError } from "../logic/hjepaHorizon.js";

/* H-JEPA horizon explorer. Two prediction "tracks" — a detailed (pixel-near)
   level and an abstract level — each shown as a center line with an uncertainty
   envelope that widens the further ahead you predict. Drag the horizon: the
   detailed envelope balloons into noise while the abstract one stays tight.
   The aha: plan long-horizon where the future is still predictable — up in the
   abstract space. That's why H-JEPA stacks levels. */
export default function HJepaHorizonLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const W = 600, H = 250, HMAX = 12;
    const svg = R.SVG(stage, W, H);
    let horizon = 5;
    const x0 = 36, x1 = W - 24;
    const X = (h) => x0 + (h / HMAX) * (x1 - x0);
    const lane = (yc, errFn, color, name) => {
      const amp = 38;
      // envelope (top forward, bottom back)
      const top = [], bot = [];
      for (let h = 0; h <= horizon; h++) { const e = errFn(h); top.push([X(h), yc - e * amp]); bot.push([X(h), yc + e * amp]); }
      const d = "M " + top.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L ") +
                " L " + bot.reverse().map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L ") + " Z";
      svg.appendChild(R.E("path", { d, fill: color + "33", stroke: color + "66", "stroke-width": 1 }));
      // center prediction line
      svg.appendChild(R.E("line", { x1: X(0), y1: yc, x2: X(horizon), y2: yc, stroke: color, "stroke-width": 2 }));
      svg.appendChild(R.E("circle", { cx: X(0), cy: yc, r: 4, fill: color }));
      // labels
      svg.appendChild(R.TX(x0, yc - amp - 10, name, { anchor: "start", sans: true, size: 12, fill: "#E7ECF5", weight: 600 }));
      const e = errFn(horizon);
      svg.appendChild(R.TX(X(horizon) + 6, yc, `${Math.round(e * 100)}%`, { anchor: "start", size: 11, fill: color, weight: 600, base: "middle" }));
      return e;
    };

    const readout = R.ce("div");
    readout.style.cssText = "font-family:var(--font-mono);font-size:12px;color:#C8CFDA;margin-top:10px;line-height:1.5;min-height:34px";
    stage.appendChild(readout);

    const draw = () => {
      R.clr(svg);
      svg.appendChild(R.TX(x0, 14, "uncertainty grows with how far ahead you predict", { anchor: "start", size: 9.5, fill: R.C.dim }));
      svg.appendChild(R.E("line", { x1: X(horizon), y1: 22, x2: X(horizon), y2: H - 24, stroke: R.C.axis, "stroke-width": 1, "stroke-dasharray": "3 3" }));
      svg.appendChild(R.TX(x1, H - 6, "horizon →", { anchor: "end", size: 10, fill: R.C.dim }));
      const det = lane(H * 0.40, detailedError, R.C.orange, "detailed level (pixel-near)");
      const abs = lane(H * 0.80, abstractError, R.C.violet, "abstract level");
      readout.innerHTML = horizon <= 3
        ? `Short horizon: both levels predict confidently. No need to abstract yet.`
        : `At horizon <b>${horizon}</b> the <b style="color:${R.C.orange}">detailed</b> prediction has smeared to <b>${Math.round(det * 100)}%</b> uncertainty — the future is basically noise down there. The <b style="color:${R.C.violet}">abstract</b> level is still only <b>${Math.round(abs * 100)}%</b>. So plan long-horizon <em>up here</em>, where the future is still predictable.`;
    };

    R.slider(ctrl, { label: "prediction horizon", min: 1, max: HMAX, step: 1, value: horizon, fmt: (v) => `${v} steps`, on: (v) => { horizon = v; draw(); } });
    R.legend(stage, [[R.C.orange, "detailed (balloons fast)"], [R.C.violet, "abstract (stays tight)"]]);
    draw();
  }, []);

  return (
    <Lab id="hjepa" title="Why hierarchy: plan where the future is predictable" setup={setup}
      note="Each band is a prediction's uncertainty, widening the further ahead it reaches. Drag the horizon out: the detailed (pixel-near) level balloons into noise, while the abstract level stays tight. That gap is the entire case for H-JEPA — make long-horizon plans in the abstract space, then hand subgoals down to the detailed level." />
  );
}
