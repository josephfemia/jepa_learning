import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { initCollusion, collusionStep, lossProxy, knowledgeProxy } from "../logic/collusion.js";
import { prefersReducedMotion } from "../widgets/animate.js";

/* Why the stop-gradient stops the cheating — the mechanism, made visible.
   A violet "target" cloud and a cyan "prediction" cloud. The predictor always
   chases the target. With a stop-gradient ON the target is a frozen goalpost:
   the prediction lands on it but the cloud stays alive. Switch the stop-grad
   OFF (and drag τ down) and BOTH clouds are free to chase each other — they collude,
   spiral to a single point, and the loss → 0 at the exact moment knowledge → 0. */
export default function CollusionCollapseLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const cv = document.createElement("canvas");
    cv.style.cssText = "width:100%;height:260px;display:block;border-radius:8px";
    stage.appendChild(cv);
    const ctx = cv.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = cv.offsetWidth * DPR; cv.height = 260 * DPR; };
    resize();

    let stopGrad = true, tau = 0.99;
    let state = initCollusion(48);
    const reseed = () => { state = initCollusion(48); };
    const reduce = prefersReducedMotion();

    const meter = R.meters(stage, ["prediction loss", "target spread = real knowledge"]);
    const refresh = () => {
      meter.set(0, Math.round(lossProxy(state) * 100), R.C.cyan);
      meter.set(1, Math.round(knowledgeProxy(state) * 100), R.C.orange);
    };
    // reduced motion: skip the perpetual rAF; settle to the steady state and draw once
    const settle = () => { for (let i = 0; i < 200; i++) state = collusionStep(state, { stopGrad, tau }); draw(); refresh(); };

    let raf = 0;
    const draw = () => {
      const W = cv.width, H = cv.height;
      ctx.clearRect(0, 0, W, H);
      // faint predict arrows: pred → target (trivially short once piled up)
      ctx.strokeStyle = "rgba(200,207,218,0.16)"; ctx.lineWidth = 1 * DPR;
      for (let i = 0; i < state.pred.length; i++) {
        const p = state.pred[i], t = state.target[i];
        ctx.beginPath();
        ctx.moveTo(p.x * W, p.y * H); ctx.lineTo(t.x * W, t.y * H);
        ctx.stroke();
      }
      // target cloud (violet)
      state.target.forEach((p) => {
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, 3.4 * DPR, 0, 7);
        ctx.fillStyle = R.C.violet; ctx.shadowColor = R.C.violet; ctx.shadowBlur = 5 * DPR; ctx.fill();
      });
      // prediction cloud (cyan)
      state.pred.forEach((p) => {
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, 2.6 * DPR, 0, 7);
        ctx.fillStyle = R.C.cyan; ctx.shadowColor = R.C.cyan; ctx.shadowBlur = 5 * DPR; ctx.fill();
      });
      ctx.shadowBlur = 0;
    };

    const tick = () => {
      state = collusionStep(state, { stopGrad, tau });
      draw();
      refresh();
      raf = requestAnimationFrame(tick);
    };

    const sgBtn = R.btn(ctrl, "stop-gradient: on", "primary", () => {
      stopGrad = !stopGrad;
      sgBtn.textContent = "stop-gradient: " + (stopGrad ? "on" : "off");
      sgBtn.className = "lab-btn" + (stopGrad ? " primary" : "");
      reseed();
      if (reduce) settle();
    });
    R.slider(ctrl, {
      label: "EMA target rate τ (matters when stop-grad is off)",
      min: 0.5, max: 0.999, step: 0.001, value: 0.99,
      fmt: (v) => v.toFixed(3),
      on: (v) => { tau = v; if (reduce) settle(); },
    });
    R.legend(stage, [[R.C.violet, "target cloud"], [R.C.cyan, "prediction cloud"]]);

    if (reduce) settle(); else tick();
    const stopRO = R.watchResize(cv, () => { resize(); draw(); });
    return () => { cancelAnimationFrame(raf); stopRO(); };
  }, []);

  return (
    <Lab id="collusion" title="Why the stop-gradient stops the cheating" setup={setup}
      note="The prediction (cyan) always chases the target (violet) — that's the predictor learning. With the stop-gradient ON, the target is a frozen goalpost: gradients never reach it, so the only way to cut the loss is to predict it better. The cloud stays alive. Now switch the stop-gradient OFF and drag the τ slider down: gradients reach BOTH branches, and the cheapest way to win is to slide the target and the prediction onto the same point at once — collusion. Watch them spiral together until the cloud dies. The cruel part: the loss → 0 at the exact moment real knowledge (target spread) → 0. Low loss, zero learning." />
  );
}
