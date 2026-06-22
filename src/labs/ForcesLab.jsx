import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { clamp, lerp } from "../logic.js";

/* Contrastive vs. regularized — the two ways to shape an embedding space, shown
   as FORCES on a point cloud. Contrastive pulls positive pairs together and
   pushes negatives apart: shrink the batch and coverage gets sparse, so the
   cloud goes noisy/unstable. Regularized drops the springs entirely — one
   statistical field spreads + decorrelates the cloud, stable at any batch.
   The aha: contrastive needs lots of negatives to be stable; regularizing
   needs none. */
export default function ForcesLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const cv = document.createElement("canvas");
    cv.style.cssText = "width:100%;height:280px;display:block;border-radius:8px";
    stage.appendChild(cv);
    const ctx = cv.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = cv.offsetWidth * DPR; cv.height = 280 * DPR; };
    resize();

    const readout = R.ce("div");
    readout.style.cssText = "font-family:var(--font-mono);font-size:12px;color:#C8CFDA;margin-top:10px;line-height:1.5;min-height:34px";
    stage.appendChild(readout);

    let mode = "contrastive", batch = 12;
    const N = 36;
    const pts = Array.from({ length: N }, (_, i) => {
      const hx = 0.1 + Math.random() * 0.8, hy = 0.1 + Math.random() * 0.8;
      return { hx, hy, x: hx, y: hy, partner: i % 2 === 0 ? i + 1 : i - 1 };
    });

    let raf = 0;
    const tick = () => {
      const stability = clamp((batch - 4) / 40, 0, 1);
      const jitter = mode === "contrastive" ? 0.055 * (1 - stability) : 0;
      pts.forEach((p) => {
        let tx = p.hx, ty = p.hy;
        if (mode === "contrastive") {
          const q = pts[p.partner];
          tx = lerp(p.hx, (p.hx + q.hx) / 2, 0.25);   // positive pull toward partner
          ty = lerp(p.hy, (p.hy + q.hy) / 2, 0.25);
        }
        p.x = clamp(lerp(p.x, tx, 0.08) + (Math.random() - 0.5) * jitter, 0.04, 0.96);
        p.y = clamp(lerp(p.y, ty, 0.08) + (Math.random() - 0.5) * jitter, 0.04, 0.96);
      });

      const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      const P = (p) => [p.x * W, p.y * H];

      if (mode === "contrastive") {
        // positive-pair springs
        for (let i = 0; i < N; i += 2) {
          const [ax, ay] = P(pts[i]), [bx, by] = P(pts[i + 1]);
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
          ctx.strokeStyle = R.C.cyan + "55"; ctx.lineWidth = 1.2 * DPR; ctx.stroke();
        }
        // repulsion arrows from a focus point to sampled negatives (count ∝ batch)
        const focus = pts[0]; const [fx, fy] = P(focus);
        const nArrows = Math.min(8, Math.max(1, Math.round(batch / 6)));
        for (let k = 1; k <= nArrows; k++) {
          const q = pts[(k * 5) % N]; const [qx, qy] = P(q);
          const dx = qx - fx, dy = qy - fy, L = Math.hypot(dx, dy) || 1;
          const ex = qx - (dx / L) * 10 * DPR, ey = qy - (dy / L) * 10 * DPR;
          ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(ex, ey);
          ctx.strokeStyle = R.C.orange + "AA"; ctx.lineWidth = 1.4 * DPR; ctx.stroke();
          ctx.beginPath(); ctx.arc(ex, ey, 2.4 * DPR, 0, 7); ctx.fillStyle = R.C.orange; ctx.fill();
        }
      }
      const cloudColor = mode === "regularized" ? R.C.green : (stability > 0.55 ? R.C.cyan : R.C.orange);
      pts.forEach((p) => {
        const [x, y] = P(p);
        ctx.beginPath(); ctx.arc(x, y, 3.4 * DPR, 0, 7);
        ctx.fillStyle = cloudColor; ctx.shadowColor = cloudColor; ctx.shadowBlur = 5 * DPR; ctx.fill();
      });
      ctx.shadowBlur = 0;

      readout.innerHTML = mode === "regularized"
        ? `<b style="color:${R.C.green}">Regularized.</b> No negatives, no springs — one statistical constraint spreads and decorrelates the cloud. Stable at <em>any</em> batch size.`
        : stability > 0.55
        ? `<b style="color:${R.C.cyan}">Contrastive, big batch.</b> Plenty of negatives cover the space → stable spread. But you paid for all those negatives.`
        : `<b style="color:${R.C.orange}">Contrastive, small batch.</b> Too few negatives → most directions go un-pushed and the cloud jitters. Contrastive needs big batches to be stable.`;
      raf = requestAnimationFrame(tick);
    };

    const modeBtn = R.btn(ctrl, "Mode: contrastive", "primary", () => {
      mode = mode === "contrastive" ? "regularized" : "contrastive";
      modeBtn.textContent = "Mode: " + mode; modeBtn.className = "lab-btn primary";
    });
    R.slider(ctrl, { label: "batch size (# negatives)", min: 4, max: 48, step: 2, value: batch, fmt: (v) => String(v), on: (v) => { batch = v; } });
    R.legend(stage, [[R.C.cyan, "positive pair (spring)"], [R.C.orange, "negative (pushed away)"], [R.C.green, "regularized cloud"]]);

    tick();
    const stopRO = R.watchResize(cv, () => resize());
    return () => { cancelAnimationFrame(raf); stopRO(); };
  }, []);

  return (
    <Lab id="forces" title="Contrastive vs. regularized — as forces" setup={setup}
      note="Contrastive learning pulls positive pairs together (springs) and pushes negatives apart (arrows). Shrink the batch and the negatives can't cover the space — the cloud goes unstable. Flip to regularized: the springs vanish and a single 'spread + decorrelate' field keeps the cloud healthy at any batch size. That's the trade JEPA takes — no negatives to sample." />
  );
}
