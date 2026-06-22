import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { stepPoint } from "../logic/collapseSim.js";
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
      const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      pts.forEach((p) => {
        const c = s.mode === "drift" ? (p.g ? R.C.violet : R.C.cyan) : s.c;
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, 3.2 * DPR, 0, 7);
        ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = (s.mode === "healthy" ? 8 : 4) * DPR; ctx.fill();
      });
      ctx.shadowBlur = 0;
      readout.innerHTML = `<b style="color:${s.c}">${s.t}.</b> ${s.d}`;
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
    const onR = () => resize(); window.addEventListener("resize", onR);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onR); };
  }, []);

  return (
    <Lab id="vicreg" title="VICReg term isolator" setup={setup}
      note="VICReg's three terms each prevent a different failure. Turn one off and watch the embedding cloud collapse in exactly the way that term was guarding against — variance → a point, covariance → a line, invariance → two drifting views." />
  );
}
