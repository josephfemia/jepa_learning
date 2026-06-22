import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { usefulFraction, frothPenalty } from "../logic/reconTax.js";
import { prefersReducedMotion } from "../widgets/animate.js";

/* The reconstruction tax, made visible. Two side-by-side reconstructions of the
   SAME scene — a stable shape (predictable) wrapped in animated "froth" (texture/
   noise that re-randomizes every frame). A generative model burns capacity trying
   to redraw the froth and gets it wrong every frame; a JEPA drops the froth and
   keeps the gist. Drag "pixel detail demanded" and watch the loss readouts diverge. */
export default function PixelVsLatentLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const H = 260;
    const cv = document.createElement("canvas");
    cv.style.cssText = "width:100%;height:260px;display:block;border-radius:8px";
    stage.appendChild(cv);
    const ctx = cv.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = cv.offsetWidth * DPR; cv.height = H * DPR; };
    resize();

    const readout = document.createElement("div");
    readout.style.cssText = "font-family:var(--font-serif);font-size:13.5px;color:#C8CFDA;margin-top:12px;line-height:1.55;min-height:40px";
    stage.appendChild(readout);

    let detail = 80;       // 5..100, the slider value
    const reduce = prefersReducedMotion();

    // Draw one panel: a backdrop, the stable cyan shape, and a froth layer.
    // mode "gen": froth is drawn sharper as detail rises, but re-randomized each
    // frame (visibly wrong). mode "jepa": froth faded/greyed and stable; shape crisp.
    const panel = (px, py, pw, ph, mode) => {
      const accent = mode === "gen" ? R.C.orange : R.C.cyan;
      // card
      ctx.fillStyle = "rgba(10,16,32,0.55)";
      roundRect(px, py, pw, ph, 10 * DPR); ctx.fill();
      ctx.strokeStyle = mode === "gen" ? "rgba(232,89,12,0.45)" : "rgba(91,141,239,0.45)";
      ctx.lineWidth = 1.5 * DPR;
      roundRect(px, py, pw, ph, 10 * DPR); ctx.stroke();

      // clip to the card for the froth + shape
      ctx.save();
      roundRect(px, py, pw, ph, 10 * DPR); ctx.clip();

      const d = detail / 100;
      // ── froth layer ──
      // grain count + sharpness grow with detail. For gen it's vivid; for jepa it's
      // dropped to a faint grey wash (the model refuses to model it).
      const cell = R.lerp(11, 4, d) * DPR;        // finer grain as detail rises
      const cols = Math.ceil(pw / cell), rows = Math.ceil(ph / cell);
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const n = Math.random();                // re-randomized EVERY frame
          if (mode === "gen") {
            // try to reproduce froth: opacity scales with demanded detail
            const a = (0.05 + 0.5 * d) * n;
            ctx.fillStyle = `rgba(232,89,12,${a.toFixed(3)})`;
          } else {
            // froth dropped: faint, near-static grey wash (low alpha, low variation)
            const a = 0.04 * (0.6 + 0.4 * n);
            ctx.fillStyle = `rgba(150,160,180,${a.toFixed(3)})`;
          }
          ctx.fillRect(px + cx * cell, py + cy * cell, cell, cell);
        }
      }

      // ── the stable, predictable shape (a ball) — identical in both panels ──
      const ccx = px + pw * 0.5, ccy = py + ph * 0.52, rad = Math.min(pw, ph) * 0.22;
      const g = ctx.createRadialGradient(ccx - rad * 0.3, ccy - rad * 0.3, rad * 0.2, ccx, ccy, rad);
      g.addColorStop(0, mode === "gen" ? "rgba(120,160,255,0.95)" : "rgba(140,180,255,0.98)");
      g.addColorStop(1, "rgba(46,80,200,0.9)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(ccx, ccy, rad, 0, 7); ctx.fill();
      ctx.restore();

      // ── labels ──
      ctx.font = `600 ${11 * DPR}px IBM Plex Mono, monospace`;
      ctx.textAlign = "left";
      ctx.fillStyle = accent;
      ctx.fillText(mode === "gen" ? "GENERATIVE" : "JEPA", px + 12 * DPR, py + 20 * DPR);

      // loss readout — gen stays HIGH and rises with detail; jepa stays LOW
      const loss = mode === "gen" ? frothPenalty(detail) : 0.06 + 0.02 * d;
      ctx.textAlign = "right";
      ctx.font = `700 ${12 * DPR}px IBM Plex Mono, monospace`;
      ctx.fillStyle = mode === "gen" ? R.C.orange : R.C.green;
      ctx.fillText(
        `${mode === "gen" ? "recon loss" : "latent loss"} ${loss.toFixed(2)}`,
        px + pw - 12 * DPR, py + 20 * DPR
      );

      // footer tag
      ctx.font = `${9.5 * DPR}px IBM Plex Mono, monospace`;
      ctx.fillStyle = "rgba(200,207,218,0.7)";
      ctx.textAlign = "left";
      ctx.fillText(
        mode === "gen" ? "kept: shape · spent on froth (wrong)" : "kept: shape · dropped: froth",
        px + 12 * DPR, py + ph - 12 * DPR
      );
    };

    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const draw = () => {
      const W = cv.width, Hp = cv.height;
      const pad = 14 * DPR, gap = 14 * DPR;
      const pw = (W - pad * 2 - gap) / 2, ph = Hp - pad * 2;
      if (pw <= 1 || ph <= 1) return;   // canvas not sized yet (hidden lecture) — watchResize redraws when visible
      ctx.clearRect(0, 0, W, Hp);
      panel(pad, pad, pw, ph, "gen");
      panel(pad + pw + gap, pad, pw, ph, "jepa");

      const wastePct = Math.round((1 - usefulFraction(detail)) * 100);
      readout.innerHTML = detail < 35
        ? `Abstract reconstruction: both keep the <b style="color:${R.C.cyan}">shape</b>, and the froth barely matters. Losses are close.`
        : detail < 70
        ? `Demanding more detail: the generative panel flickers as it re-guesses the <b style="color:${R.C.orange}">froth</b> every frame and gets it wrong — its loss climbs. The JEPA just dropped it.`
        : `Pixel-perfect: the generative model is graded on noise it can <b>never</b> predict — about <b style="color:${R.C.orange}">${wastePct}%</b> of its budget burns on froth, and its loss stays stuck high. <b style="color:${R.C.cyan}">The reconstruction tax.</b>`;
    };

    R.slider(ctrl, {
      label: "pixel detail demanded", min: 5, max: 100, step: 1, value: detail,
      fmt: (v) => (v < 35 ? "abstract" : v < 70 ? "mixed" : "pixel-perfect"),
      on: (v) => { detail = v; if (reduce) draw(); },
    });
    R.legend(stage, [[R.C.cyan, "shape (both keep)"], [R.C.orange, "froth (gen redraws & fails)"]]);

    let raf = 0, last = 0;
    const tick = (ts) => {
      // throttle the froth re-randomization to ~20fps so flicker reads as "wrong every
      // frame" without thrashing; reduced motion draws once via the slider handler.
      if (ts - last > 50) { last = ts; draw(); }
      raf = requestAnimationFrame(tick);
    };
    if (reduce) draw();
    else raf = requestAnimationFrame(tick);

    const stopRO = R.watchResize(cv, () => { resize(); draw(); });
    return () => { cancelAnimationFrame(raf); stopRO(); };
  }, []);

  return (
    <Lab id="recon" title="The reconstruction tax" setup={setup}
      note="Same scene, two reconstructions. A generative model is graded on raw pixels, so it must redraw the unpredictable froth (texture/noise) — and gets it wrong every frame, its loss stuck high. A JEPA is graded in embedding space: it keeps the stable shape and drops the froth, so its loss stays low no matter how much pixel detail you demand. Drag the slider toward pixel-perfect and watch the two losses diverge — the gap is the tax JEPA refuses to pay." />
  );
}
