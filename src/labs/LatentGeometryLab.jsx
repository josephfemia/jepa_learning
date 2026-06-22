import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { sampleLatent, covStats, geometryVerdict, GEOMETRIES } from "../logic/latentGeometry.js";

/* Latent Geometry Inspector — what "isotropic Gaussian" actually looks like,
   versus the failure shapes. Flip regimes and watch the cloud + the stats. */
export default function LatentGeometryLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const cv = document.createElement("canvas");
    cv.style.cssText = "width:100%;height:260px;display:block;border-radius:8px";
    stage.appendChild(cv);
    const ctx = cv.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = cv.offsetWidth * DPR; cv.height = 260 * DPR; };
    resize();
    const readout = document.createElement("div");
    readout.style.cssText = "font-family:var(--font-mono);font-size:12px;color:#C8CFDA;margin-top:10px;line-height:1.5;min-height:34px";
    stage.appendChild(readout);

    const labels = { isotropic: "isotropic 𝒩(0,I)", collapsed: "collapsed", dimensional: "dimensional", correlated: "correlated" };
    const col = { isotropic: R.C.green, collapsed: R.C.orange, dimensional: R.C.violet, correlated: R.C.orange };
    let type = "isotropic", pts = sampleLatent(type);

    const draw = () => {
      const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(120,140,200,.16)"; ctx.lineWidth = DPR;
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
      const c = col[type];
      ctx.globalAlpha = 0.7;
      pts.forEach((p) => { ctx.beginPath(); ctx.arc(p.x * W, p.y * H, 2.6 * DPR, 0, 7); ctx.fillStyle = c; ctx.fill(); });
      ctx.globalAlpha = 1;
      const s = covStats(pts);
      readout.innerHTML = `<b style="color:${c}">corr ${s.corr.toFixed(2)} · var ${s.vx.toFixed(3)} / ${s.vy.toFixed(3)}</b> — ${geometryVerdict(type)}`;
    };

    GEOMETRIES.forEach((g) => {
      R.btn(ctrl, labels[g], g === type ? "primary" : "", () => {
        type = g; pts = sampleLatent(type);
        ctrl.querySelectorAll(".lab-btn").forEach((el, i) => { el.className = "lab-btn" + (GEOMETRIES[i] === type ? " primary" : ""); });
        draw();
      });
    });

    draw();
    const onR = () => { resize(); draw(); }; window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  return (
    <Lab id="geometry" title="What should embeddings look like?" setup={setup}
      note="LeJEPA's claim is that the ideal embedding cloud is an isotropic Gaussian — round and uncorrelated. Flip between the shapes: collapsed (a point), dimensional (a line), correlated (an ellipse), isotropic (a round cloud). Round means every dimension carries independent information — that's exactly what SIGReg pushes the embeddings toward." />
  );
}
