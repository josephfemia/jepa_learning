import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import {
  deformCloud, sigregStep, projectShadow, gaussianity, covStats,
} from "../logic/latentGeometry.js";

/* Latent Geometry Inspector — what "isotropic Gaussian" actually means, made
   manipulable. Squash + shear one continuous cloud, watch every 1-D shadow it
   casts, then "apply SIGReg" and watch the shadows become bell curves as the
   cloud rounds out — Cramér–Wold made visible. */
export default function LatentGeometryLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const cv = document.createElement("canvas");
    cv.style.cssText = "width:100%;height:300px;display:block;border-radius:8px";
    stage.appendChild(cv);
    const ctx = cv.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = cv.offsetWidth * DPR; cv.height = 300 * DPR; };
    resize();

    const readout = document.createElement("div");
    readout.style.cssText = "font-family:var(--font-mono);font-size:12px;color:#C8CFDA;margin-top:10px;line-height:1.55;min-height:34px";
    stage.appendChild(readout);

    let anisotropy = 0, corr = 0;
    let pts = deformCloud({ anisotropy, corr });
    let angle = 0;            // rotating shadow direction
    let animT = null;         // sigreg animation interpolation source/target
    let raf = 0;

    const rebuild = () => { pts = deformCloud({ anisotropy, corr }); };

    const draw = () => {
      const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      // layout: cloud on top, shadow histogram strip below
      const cloudH = H * 0.66, histTop = cloudH + 8 * DPR;
      const cx = W / 2, cy = cloudH / 2, scale = Math.min(W, cloudH) * 0.9;

      // axes
      ctx.strokeStyle = R.C.grid; ctx.lineWidth = DPR;
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, cloudH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();

      // map cloud (unit-square coords centered at 0.5) to canvas
      const px = (p) => cx + (p.x - 0.5) * scale;
      const py = (p) => cy + (p.y - 0.5) * scale;

      // rotating projection line (the "shadow direction") through the centroid
      const n = pts.length || 1;
      const mx = pts.reduce((s, p) => s + p.x, 0) / n;
      const my = pts.reduce((s, p) => s + p.y, 0) / n;
      const ux = Math.cos(angle), uy = Math.sin(angle);
      const L = scale * 0.62;
      ctx.strokeStyle = R.C.violet; ctx.lineWidth = 1.6 * DPR; ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(cx + (mx - 0.5) * scale - ux * L, cy + (my - 0.5) * scale - uy * L);
      ctx.lineTo(cx + (mx - 0.5) * scale + ux * L, cy + (my - 0.5) * scale + uy * L);
      ctx.stroke(); ctx.globalAlpha = 1;

      // verdict colour: greener the rounder it is
      const s = covStats(pts);
      const round = Math.abs(s.corr) < 0.12 && Math.abs(s.vx - s.vy) / Math.max(s.vx, s.vy, 1e-6) < 0.2;
      const col = round ? R.C.green : R.C.cyan;

      // the cloud
      ctx.globalAlpha = 0.72;
      pts.forEach((p) => { ctx.beginPath(); ctx.arc(px(p), py(p), 2.5 * DPR, 0, 7); ctx.fillStyle = col; ctx.fill(); });
      ctx.globalAlpha = 1;

      // ---- 1-D shadow histogram strip + Gaussian overlay ----
      const bins = 24;
      const hist = projectShadow(pts, angle, bins);
      const g = gaussianity(hist);
      const maxC = Math.max(1, ...hist);
      const histH = H - histTop - 6 * DPR;
      const bw = W / bins;
      // bars
      ctx.fillStyle = R.C.violet;
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < bins; i++) {
        const h = (hist[i] / maxC) * histH;
        ctx.fillRect(i * bw + bw * 0.12, H - 4 * DPR - h, bw * 0.76, h);
      }
      ctx.globalAlpha = 1;
      // fitted Gaussian overlay (same mean/var as the histogram)
      const total = hist.reduce((a, b) => a + b, 0) || 1;
      let mean = 0; for (let i = 0; i < bins; i++) mean += ((i + 0.5) / bins) * (hist[i] / total);
      let varc = 0; for (let i = 0; i < bins; i++) { const c = (i + 0.5) / bins; varc += (hist[i] / total) * (c - mean) ** 2; }
      const sd = Math.max(Math.sqrt(varc), 1.5 / bins);
      ctx.strokeStyle = R.C.green; ctx.lineWidth = 1.8 * DPR;
      ctx.beginPath();
      let peak = 0;
      for (let i = 0; i < bins; i++) { const c = (i + 0.5) / bins; peak = Math.max(peak, Math.exp(-((c - mean) ** 2) / (2 * sd * sd))); }
      for (let i = 0; i < bins; i++) {
        const c = (i + 0.5) / bins;
        const gv = Math.exp(-((c - mean) ** 2) / (2 * sd * sd)) / peak;
        const x = i * bw + bw / 2, y = H - 4 * DPR - gv * histH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      readout.innerHTML =
        `<b style="color:${col}">corr ${s.corr.toFixed(2)} · var ${s.vx.toFixed(3)} / ${s.vy.toFixed(3)}</b>` +
        ` &nbsp;·&nbsp; <b style="color:${R.C.green}">shadow Gaussianity ${(g * 100) | 0}%</b>` +
        `<br><span style="color:#8A93A3">violet line = the 1-D shadow direction (rotating); bars below = that shadow's histogram, green curve = a fitted bell. Round ⟺ every shadow is a bell.</span>`;
    };

    // ---- sliders ----
    const sA = R.slider(ctrl, {
      label: "anisotropy (squash one axis)", min: 0, max: 1, step: 0.01, value: 0,
      fmt: (v) => v.toFixed(2), on: (v) => { anisotropy = v; rebuild(); draw(); },
    });
    const sC = R.slider(ctrl, {
      label: "correlation (shear the axes)", min: 0, max: 1, step: 0.01, value: 0,
      fmt: (v) => v.toFixed(2), on: (v) => { corr = v; rebuild(); draw(); },
    });

    // ---- preset quick-jumps ----
    const preset = (a, c) => { anisotropy = a; corr = c; sA.set(a); sC.set(c); rebuild(); draw(); };
    R.btn(ctrl, "collapsed", "", () => preset(0.97, 0));
    R.btn(ctrl, "correlated", "", () => preset(0, 0.9));

    // ---- apply SIGReg (animate toward round) ----
    R.btn(ctrl, "apply SIGReg", "primary", () => {
      const start = pts.map((p) => ({ ...p }));
      R.animate(700, (e) => { pts = sigregStep(start, e); draw(); }, () => {
        // sync the deform knobs to the (now-round) result so further drags resume sanely
        anisotropy = 0; corr = 0; sA.set(0); sC.set(0); pts = deformCloud({ anisotropy, corr }); draw();
      });
    });

    R.legend(stage, [[R.C.violet, "shadow direction + histogram"], [R.C.green, "fitted Gaussian"], [R.C.cyan, "embedding cloud"]]);

    // continuous rotation of the shadow line (keeps the Cramér–Wold idea alive)
    const tick = () => { angle += 0.012; draw(); raf = requestAnimationFrame(tick); };
    const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) draw(); else raf = requestAnimationFrame(tick);

    const stopRO = R.watchResize(cv, () => { resize(); draw(); });
    return () => { cancelAnimationFrame(raf); stopRO(); };
  }, []);

  return (
    <Lab id="geometry" title="What should embeddings look like?" setup={setup}
      note="LeJEPA's claim: the ideal embedding cloud is an isotropic Gaussian — round and uncorrelated. Squash it (anisotropy) or shear it (correlation) and watch the rotating 1-D shadow stop being a bell curve. Then hit “apply SIGReg” and watch it round back out. The deep idea (Cramér–Wold): a cloud is round ⟺ every one of its 1-D shadows is a Gaussian bell — so SIGReg never needs the full high-D distribution, it just cheaply checks many random shadows." />
  );
}
