import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { semanticScore, difficultyLabel, targetBlocks } from "../logic/maskingDifficulty.js";

/* Masking Difficulty Dial — why I-JEPA's specific scales matter. Drag the target
   size/aspect/count and watch the task swing between "semantic" and "texture". */
export default function MaskingDifficultyLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const W = 240, H = 240;
    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;gap:18px;flex-wrap:wrap;align-items:center";
    stage.appendChild(wrap);
    const svgHost = document.createElement("div"); svgHost.style.flex = "0 0 auto"; wrap.appendChild(svgHost);
    const svg = R.SVG(svgHost, W, H);
    const meter = document.createElement("div"); meter.style.cssText = "flex:1;min-width:190px"; wrap.appendChild(meter);

    let scale = 0.17, aspect = 1, count = 4, seed = 1;
    const draw = () => {
      R.clr(svg);
      const G = 8, cell = W / G;
      for (let i = 0; i <= G; i++) {
        svg.appendChild(R.E("line", { x1: i * cell, y1: 0, x2: i * cell, y2: H, stroke: "rgba(120,140,200,.18)", "stroke-width": 0.5 }));
        svg.appendChild(R.E("line", { x1: 0, y1: i * cell, x2: W, y2: i * cell, stroke: "rgba(120,140,200,.18)", "stroke-width": 0.5 }));
      }
      svg.appendChild(R.E("rect", { x: 8, y: 8, width: W - 16, height: H - 16, fill: R.C.cyan, opacity: 0.1, stroke: R.C.cyan, "stroke-width": 1.5, rx: 3 }));
      let a = seed >>> 0;
      const rng = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      targetBlocks({ scale, aspect, count }, rng).forEach((t) => {
        svg.appendChild(R.E("rect", { x: t.x * W, y: t.y * H, width: t.w * W, height: t.h * H, fill: R.C.violet, opacity: 0.4, stroke: R.C.violet, "stroke-width": 1.5, rx: 2 }));
      });
      const sc = semanticScore({ scale, count, aspect }), lab = difficultyLabel(sc);
      const c = sc > 0.6 ? R.C.green : sc > 0.33 ? R.C.cyan : R.C.orange;
      const blurb = sc > 0.6
        ? "Large target blocks force the model to predict <i>what's there</i> — object-level structure."
        : sc > 0.33
        ? "Mid-sized blocks: a mix of structure and texture."
        : "Tiny scattered blocks collapse the task to copying nearby <i>texture</i> — little semantic is learned.";
      meter.innerHTML = `
        <div style="font-family:var(--font-mono);font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;color:#8A93A3;margin-bottom:6px">task character</div>
        <div style="height:14px;border-radius:7px;background:rgba(200,207,218,.12);overflow:hidden"><div style="height:100%;width:${Math.round(sc * 100)}%;background:${c};border-radius:7px;transition:width .2s"></div></div>
        <div style="font-family:var(--font-mono);font-size:13px;color:${c};font-weight:600;margin-top:8px">${lab.toUpperCase()}</div>
        <div style="font-family:var(--font-serif);font-size:13px;color:#C8CFDA;margin-top:6px;line-height:1.5">${blurb}</div>`;
    };

    R.slider(ctrl, { label: "target scale", min: 0.04, max: 0.3, step: 0.01, value: scale, fmt: (v) => v.toFixed(2), on: (v) => { scale = v; draw(); } });
    R.slider(ctrl, { label: "aspect ratio", min: 0.5, max: 2, step: 0.05, value: aspect, fmt: (v) => v.toFixed(2), on: (v) => { aspect = v; draw(); } });
    R.slider(ctrl, { label: "target count", min: 1, max: 12, step: 1, value: count, fmt: (v) => String(v), on: (v) => { count = v; draw(); } });
    R.btn(ctrl, "↻ resample", "", () => { seed = (seed * 1103515245 + 12345) >>> 0; draw(); });
    draw();
  }, []);

  return (
    <Lab id="maskdiff" title="Tune the masking task" setup={setup}
      note="I-JEPA's scales aren't arbitrary. Drag target scale down and the meter swings to TEXTURE — the model can just interpolate neighboring patches. Keep blocks large (its real ~0.15–0.2 range) and the task stays SEMANTIC. Push aspect to an extreme and the blocks become thin slivers — easy to interpolate from their long edges, so the meter dips back toward texture too." />
  );
}
