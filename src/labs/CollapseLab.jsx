import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { collapseMode, stepCloud, spread, offDiagonalSpread, lossProxy, probeProxy } from "../logic/collapseSim.js";

/* The collapse simulator — toolkit port. 64 embeddings drift in the dark latent
   stage; toggle the two defenses and watch complete / dimensional / healthy. */
export default function CollapseLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const cv = document.createElement("canvas");
    cv.style.cssText = "width:100%;height:260px;display:block;border-radius:8px";
    stage.appendChild(cv);
    const ctx = cv.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = cv.offsetWidth * DPR; cv.height = 260 * DPR; };
    resize();

    let ema = false, vic = true;
    let pts = Array.from({ length: 64 }, () => {
      const hx = 0.08 + Math.random() * 0.84, hy = 0.08 + Math.random() * 0.84;
      return { hx, hy, x: hx, y: hy };
    });
    const reseed = () => { pts = pts.map((p) => ({ ...p, x: p.hx + (Math.random() - 0.5) * 0.04, y: p.hy + (Math.random() - 0.5) * 0.04 })); };
    const col = { complete: R.C.orange, dimensional: R.C.violet, healthy: R.C.green };

    // healthy reference = the spread of the "home" positions → that's 100%
    const homes = pts.map((p) => ({ x: p.hx, y: p.hy }));
    const refV = spread(homes) || 1, refC = offDiagonalSpread(homes) || 1;
    const meter = R.meters(stage, ["variance (per-dim spread)", "off-diagonal spread"]);
    const irony = R.meters(stage, ["prediction loss (lower looks 'better')", "linear-probe accuracy (real knowledge)"]);

    let raf = 0;
    const tick = () => {
      const mode = collapseMode(ema, vic);
      pts = stepCloud(pts, mode);
      const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      const c = col[mode];
      pts.forEach((p) => {
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, 3.2 * DPR, 0, 7);
        ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = (mode === "healthy" ? 8 : 4) * DPR; ctx.fill();
      });
      ctx.shadowBlur = 0;
      meter.set(0, Math.round(R.clamp(spread(pts) / refV, 0, 1) * 100), R.C.orange);
      meter.set(1, Math.round(R.clamp(offDiagonalSpread(pts) / refC, 0, 1) * 100), R.C.violet);
      // the cruel irony: training loss falls toward 0 as the cloud dies (default
      // meter coloring — the irony is in the caption, not an alarm) while the
      // linear-probe accuracy (real knowledge) crashes with it, flagged orange.
      irony.set(0, Math.round(lossProxy(pts) * 100));
      irony.set(1, Math.round(probeProxy(pts) * 100), R.C.orange);
      raf = requestAnimationFrame(tick);
    };

    const emaBtn = R.btn(ctrl, "EMA + stop-grad: off", "", () => {
      ema = !ema; emaBtn.textContent = "EMA + stop-grad: " + (ema ? "on" : "off");
      emaBtn.className = "lab-btn" + (ema ? " primary" : ""); reseed();
    });
    const vicBtn = R.btn(ctrl, "VICReg: on", "primary", () => {
      vic = !vic; vicBtn.textContent = "VICReg: " + (vic ? "on" : "off");
      vicBtn.className = "lab-btn" + (vic ? " primary" : ""); reseed();
    });
    R.legend(stage, [[R.C.orange, "complete collapse"], [R.C.violet, "dimensional collapse"], [R.C.green, "healthy"]]);

    tick();
    const stopRO = R.watchResize(cv, () => resize());
    return () => { cancelAnimationFrame(raf); stopRO(); };
  }, []);

  return (
    <Lab id="collapse" title="The collapse simulator" setup={setup}
      note="A JEPA grades itself on predicting its own embeddings — so the lazy solution is to make them all identical. Start healthy, switch the defenses off and watch the space die, then switch them back and watch it recover. Track the two geometry meters: complete collapse crashes BOTH; dimensional collapse keeps variance up but sends off-diagonal spread to zero. Then watch the cruel irony in the bottom pair: as the space dies, the prediction loss drops toward zero — it looks like the model is winning — while real knowledge (probe accuracy) collapses with it. Low loss, zero learning." />
  );
}
