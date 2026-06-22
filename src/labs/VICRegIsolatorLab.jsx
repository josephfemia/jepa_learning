import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { stepPoint, spread, offDiagonalSpread } from "../logic/collapseSim.js";
import { clamp, lerp } from "../logic.js";

/* VICReg Term Isolator — toggle each of VICReg's three terms OFF and watch the
   embedding space die in the specific way that term was preventing. Makes
   "why these three terms?" visceral. */
export default function VICRegIsolatorLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const cv = document.createElement("canvas");
    cv.style.cssText = "width:100%;height:240px;display:block;border-radius:8px";
    stage.appendChild(cv);
    const ctx = cv.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = cv.offsetWidth * DPR; cv.height = 240 * DPR; };
    resize();

    const readout = document.createElement("div");
    readout.style.cssText = "font-family:var(--font-mono);font-size:12px;color:#C8CFDA;margin-top:10px;line-height:1.5";
    stage.appendChild(readout);

    let inv = true, varT = true, cov = true;
    let pts = Array.from({ length: 64 }, (_, i) => {
      const hx = 0.08 + Math.random() * 0.84, hy = 0.08 + Math.random() * 0.84;
      return { hx, hy, x: hx, y: hy, g: i % 2 };
    });
    const reseed = () => { pts = pts.map((p) => ({ ...p, x: p.hx + (Math.random() - 0.5) * 0.04, y: p.hy + (Math.random() - 0.5) * 0.04 })); };
    const homes = pts.map((p) => ({ x: p.hx, y: p.hy }));
    const refV = spread(homes) || 1, refC = offDiagonalSpread(homes) || 1;
    const meter = R.meters(stage, ["variance (per-dim spread)", "off-diagonal spread"]);

    // Live per-term loss bars: each SPIKES toward 100% the moment its defense is
    // toggled off (and the matching collapse starts), low while the term is on.
    // This ties the abstract vicreg.py terms (shown above) to the picture.
    const lossLab = document.createElement("div");
    lossLab.style.cssText = "font-family:var(--font-mono);font-size:10.5px;color:#8A93A3;margin-top:14px";
    lossLab.textContent = "vicreg.py loss terms (low = satisfied · spike = violated)";
    stage.appendChild(lossLab);
    const lossMeter = R.meters(stage, ["variance loss", "covariance loss", "invariance loss"]);
    // R.meters colors green when high (healthy semantics). A LOSS bar is the
    // opposite: high = alarm. Grab its fill nodes so we can tint high=danger and
    // keep the color-coding consistent with each term's toggle.
    const lossWrap = stage.lastElementChild;
    const lossFills = Array.from(lossWrap.children).map((row) => row.querySelector("div > div"));
    const tintLoss = (i, pct, color) => { const f = lossFills[i]; if (f) f.style.background = pct < 14 ? R.C.green : color; };
    // Per-view target mean separation when invariance holds (≈0); grows on drift.
    let driftAmt = 0;

    const status = () => {
      if (!varT) return { mode: "complete", c: R.C.orange, t: "Complete collapse", d: "Variance term off → nothing stops every embedding sliding to one point." };
      if (!cov) return { mode: "dimensional", c: R.C.violet, t: "Dimensional collapse", d: "Covariance term off → dimensions correlate; the cloud squashes onto a line." };
      if (!inv) return { mode: "drift", c: R.C.cyan, t: "Views drift apart", d: "Invariance term off → the two views of the same input are no longer pulled together." };
      return { mode: "healthy", c: R.C.green, t: "Healthy embedding space", d: "All three terms active: spread (variance), decorrelated (covariance), views agree (invariance)." };
    };

    let raf = 0;
    const tick = () => {
      const s = status();
      pts = pts.map((p) => {
        if (s.mode === "drift") {
          const tx = clamp(p.hx + (p.g ? 0.18 : -0.18), 0.05, 0.95);
          return { ...p, x: lerp(p.x, tx, 0.06), y: lerp(p.y, p.hy, 0.06) };
        }
        const n = stepPoint(p, s.mode); return { ...p, x: n.x, y: n.y };
      });
      // Track view drift: when invariance is off the two groups pull apart, so
      // the mean gap between the g=0 and g=1 sub-clouds grows; otherwise it relaxes.
      const g0 = pts.filter((p) => !p.g), g1 = pts.filter((p) => p.g);
      const mean = (a, k) => (a.length ? a.reduce((s, p) => s + p[k], 0) / a.length : 0);
      const gap = Math.hypot(mean(g0, "x") - mean(g1, "x"), mean(g0, "y") - mean(g1, "y"));
      driftAmt = clamp(gap, 0, 1);

      const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      pts.forEach((p) => {
        const c = s.mode === "drift" ? (p.g ? R.C.violet : R.C.cyan) : s.c;
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, 3.2 * DPR, 0, 7);
        ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = (s.mode === "healthy" ? 8 : 4) * DPR; ctx.fill();
      });
      ctx.shadowBlur = 0;
      readout.innerHTML = `<b style="color:${s.c}">${s.t}.</b> ${s.d}`;
      const vFrac = clamp(spread(pts) / refV, 0, 1);        // 1 healthy → 0 collapsed to a point
      const cFrac = clamp(offDiagonalSpread(pts) / refC, 0, 1); // 1 healthy → 0 flattened to a line
      meter.set(0, Math.round(vFrac * 100), R.C.orange);
      meter.set(1, Math.round(cFrac * 100), R.C.violet);

      // Loss bars: each is HIGH (spikes toward 100) exactly when its defense is
      // off and the matching collapse is underway, low when the term is on.
      // variance loss ← cloud caving to a point (1 - variance fraction)
      // covariance loss ← cloud flattening to a line (1 - off-diagonal fraction)
      // invariance loss ← the two views drifting apart (mean gap between sub-clouds)
      const varLoss = Math.round((1 - vFrac) * 100);
      const covLoss = Math.round((1 - cFrac) * 100);
      const invLoss = Math.round(clamp(driftAmt / 0.34, 0, 1) * 100);
      // High loss reads as the alarm: tint the fill in each term's signature color.
      lossMeter.set(0, varLoss, R.C.orange); tintLoss(0, varLoss, R.C.orange);
      lossMeter.set(1, covLoss, R.C.violet); tintLoss(1, covLoss, R.C.violet);
      lossMeter.set(2, invLoss, R.C.cyan); tintLoss(2, invLoss, R.C.cyan);
      raf = requestAnimationFrame(tick);
    };

    const mk = (term, label) => {
      const get = () => (term === "inv" ? inv : term === "var" ? varT : cov);
      const set = (v) => { if (term === "inv") inv = v; else if (term === "var") varT = v; else cov = v; };
      const b = R.btn(ctrl, label + ": on", "primary", () => {
        set(!get()); b.textContent = label + ": " + (get() ? "on" : "off");
        b.className = "lab-btn" + (get() ? " primary" : ""); reseed();
      });
      return b;
    };
    mk("inv", "invariance"); mk("var", "variance"); mk("cov", "covariance");

    tick();
    const stopRO = R.watchResize(cv, () => resize());
    return () => { cancelAnimationFrame(raf); stopRO(); };
  }, []);

  return (
    <Lab id="vicreg" title="VICReg term isolator" setup={setup}
      note="VICReg's three terms each prevent a different failure. Turn one off and watch the embedding cloud collapse in exactly the way that term was guarding against — variance → a point, covariance → a line, invariance → two drifting views. The three loss bars below are the matching lines of vicreg.py: the moment you toggle a term off, its loss spikes toward 100% — the abstract code lighting up against the picture." />
  );
}
