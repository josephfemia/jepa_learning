import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { focus, predictability, usefulness } from "../logic/slowFeatures.js";
import { prefersReducedMotion } from "../widgets/animate.js";

/* The slow-features / distractor trap, made visible. A scene has three things:
   a slowly drifting BACKGROUND (trivially predictable), the TASK OBJECT (what you
   actually care about), and a jittery DISTRACTOR. With masking at 0 the encoder's
   "attention" sits on the easy background — prediction loss looks great, but the
   representation knows nothing about the object (usefulness ≈ 0). Crank masking and
   the highlight migrates onto the object: usefulness climbs while loss rises a bit,
   because the object is genuinely harder to predict than an inert wash. The cruel
   irony: lowest loss at masking 0, where the representation is useless. */
export default function SlowFeaturesLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const cv = document.createElement("canvas");
    cv.style.cssText = "width:100%;height:260px;display:block;border-radius:8px";
    stage.appendChild(cv);
    const ctx = cv.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = cv.offsetWidth * DPR; cv.height = 260 * DPR; };
    resize();

    let masking = 0;
    const reduce = prefersReducedMotion();

    const meter = R.meters(stage, ["prediction loss", "task usefulness"]);
    const refresh = () => {
      // loss = 1 - predictability: low masking → trivially predictable bg → low loss
      meter.set(0, Math.round((1 - predictability(masking)) * 100), R.C.cyan);
      meter.set(1, Math.round(usefulness(masking) * 100), R.C.orange);
    };

    let raf = 0, t = 0;
    const draw = () => {
      const W = cv.width, H = cv.height;
      if (W < 2) return;
      ctx.clearRect(0, 0, W, H);

      const f = focus(masking);          // 0..1 attention on object
      // background phase drifts slowly (the "slow feature")
      const bx = 0.5 + 0.32 * Math.sin(t * 0.012);

      // --- slow drifting background: a soft gradient wash of vertical bands ---
      const bandN = 7;
      for (let i = 0; i < bandN; i++) {
        const phase = (i / bandN + bx * 0.25) % 1;
        const a = 0.10 + 0.10 * Math.sin(phase * Math.PI * 2);
        ctx.fillStyle = `rgba(120,140,200,${a.toFixed(3)})`;
        ctx.fillRect((i / bandN) * W, 0, (W / bandN) + 1, H);
      }
      // background "attention" frame — bright when masking is low
      const bgAtt = 1 - f;
      if (bgAtt > 0.02) {
        ctx.strokeStyle = R.C.violet;
        ctx.globalAlpha = 0.25 + 0.55 * bgAtt;
        ctx.lineWidth = (1 + 4 * bgAtt) * DPR;
        ctx.strokeRect(6 * DPR, 6 * DPR, W - 12 * DPR, H - 12 * DPR);
        ctx.globalAlpha = 1;
      }

      // --- moving distractor (jittery, mid screen) ---
      const dx = (0.5 + 0.30 * Math.sin(t * 0.05 + 1)) * W;
      const dy = (0.5 + 0.22 * Math.cos(t * 0.071)) * H;
      ctx.beginPath();
      ctx.arc(dx, dy, 9 * DPR, 0, 7);
      ctx.fillStyle = R.C.dim; ctx.globalAlpha = 0.6; ctx.fill(); ctx.globalAlpha = 1;

      // --- the task object: a square, parked, the thing you care about ---
      const ox = 0.66 * W, oy = 0.42 * H, s = 22 * DPR;
      ctx.fillStyle = R.C.green;
      ctx.shadowColor = R.C.green; ctx.shadowBlur = (2 + 10 * f) * DPR;
      ctx.fillRect(ox - s / 2, oy - s / 2, s, s);
      ctx.shadowBlur = 0;
      // object "attention" outline — brightens as masking forces focus onto it
      if (f > 0.02) {
        ctx.strokeStyle = R.C.cyan;
        ctx.globalAlpha = 0.3 + 0.7 * f;
        ctx.lineWidth = (1 + 4 * f) * DPR;
        const pad = (6 + 6 * Math.sin(t * 0.12)) * DPR;
        ctx.strokeRect(ox - s / 2 - pad, oy - s / 2 - pad, s + 2 * pad, s + 2 * pad);
        ctx.globalAlpha = 1;
      }
    };

    const tick = () => {
      t += 1;
      draw();
      raf = requestAnimationFrame(tick);
    };

    R.slider(ctrl, {
      label: "masking strength",
      min: 0, max: 1, step: 0.01, value: 0,
      fmt: (v) => v.toFixed(2),
      on: (v) => { masking = v; refresh(); if (reduce) draw(); },
    });
    R.legend(stage, [
      [R.C.green, "task object"],
      [R.C.dim, "distractor"],
      [R.C.violet, "attention: background"],
      [R.C.cyan, "attention: object"],
    ]);

    refresh();
    if (reduce) draw(); else tick();
    const stopRO = R.watchResize(cv, () => { resize(); draw(); });
    return () => { cancelAnimationFrame(raf); stopRO(); };
  }, []);

  return (
    <Lab id="slowfeat" title="The slow-features trap" setup={setup}
      note="The JEPA objective rewards what's PREDICTABLE, not what's USEFUL. At masking 0 the encoder does the lazy thing: it locks onto the slowly drifting background (the violet frame) — trivially predictable, so prediction loss looks fantastic — and ignores the green task object entirely. Read the meters: loss is low, but task usefulness is near zero. That's the trap — low loss does not mean a useful representation. Now drag masking up. The attention (cyan outline) migrates onto the object, usefulness climbs, and loss rises a little because the object is genuinely harder to predict than an inert wash. Masking / target design is the lever that forces the encoder onto the content you actually care about. (Schematic — illustrative dynamics, not a real encoder.)" />
  );
}
