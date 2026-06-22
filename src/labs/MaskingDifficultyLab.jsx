import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import {
  semanticScore, difficultyLabel, targetBlocks,
  isTrivial, modelStrategy, guessOutcomes,
} from "../logic/maskingDifficulty.js";

/* Masking Difficulty Dial — why I-JEPA's specific scales matter. Drag the target
   size/aspect/count and watch the task swing between "semantic" and "texture".
   "Let the model try" dual-codes it: tiny targets get solved by COPYING the
   neighbouring texture (looks right, learns nothing); large targets force the
   model to GUESS the hidden object (real semantic work, sometimes wrong). */
export default function MaskingDifficultyLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const W = 240, H = 240;
    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;gap:18px;flex-wrap:wrap;align-items:center";
    stage.appendChild(wrap);
    const svgHost = document.createElement("div"); svgHost.style.flex = "0 0 auto"; wrap.appendChild(svgHost);
    const svg = R.SVG(svgHost, W, H);
    const meter = document.createElement("div"); meter.style.cssText = "flex:1;min-width:190px"; wrap.appendChild(meter);

    let scale = 0.17, aspect = 1, count = 4, seed = 1, reveal = false;

    const mkRng = (s) => { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

    const G = 8, cell = W / G;

    // The hidden "image": a textured background + one colored object (a circle).
    // Object center/size is fixed so the lesson is stable across resamples.
    const obj = { cx: 0.5, cy: 0.46, r: 0.2 };
    const drawScene = () => {
      // textured background: faint diagonal hatching so "copy a neighbour" is meaningful
      for (let i = -8; i < 16; i++) {
        const x = i * cell;
        svg.appendChild(R.E("line", { x1: x, y1: 0, x2: x + H, y2: H, stroke: "rgba(120,140,200,.10)", "stroke-width": 6 }));
      }
      // the object (what the model is supposed to understand)
      svg.appendChild(R.E("circle", { cx: obj.cx * W, cy: obj.cy * H, r: obj.r * W, fill: R.C.cyan, opacity: 0.32, stroke: R.C.cyan, "stroke-width": 1.5 }));
      svg.appendChild(R.E("rect", { x: (obj.cx - 0.06) * W, y: (obj.cy + obj.r - 0.02) * H, width: 0.12 * W, height: 0.22 * H, fill: R.C.cyan, opacity: 0.22 }));
    };

    const draw = () => {
      R.clr(svg);
      // frame
      svg.appendChild(R.E("rect", { x: 8, y: 8, width: W - 16, height: H - 16, fill: R.C.cyan, opacity: 0.05, stroke: R.C.cyan, "stroke-width": 1.5, rx: 3 }));
      drawScene();
      // grid overlay
      for (let i = 0; i <= G; i++) {
        svg.appendChild(R.E("line", { x1: i * cell, y1: 0, x2: i * cell, y2: H, stroke: "rgba(120,140,200,.18)", "stroke-width": 0.5 }));
        svg.appendChild(R.E("line", { x1: 0, y1: i * cell, x2: W, y2: i * cell, stroke: "rgba(120,140,200,.18)", "stroke-width": 0.5 }));
      }

      const blocks = targetBlocks({ scale, aspect, count }, mkRng(seed));
      const strategy = modelStrategy(scale);
      const outcomes = reveal && strategy === "guess" ? guessOutcomes({ scale, count }, mkRng(seed ^ 0x9e3779b9)) : null;

      blocks.forEach((t, i) => {
        const bx = t.x * W, by = t.y * H, bw = t.w * W, bh = t.h * H;
        if (!reveal) {
          // masked: a charcoal "hole" hiding the scene
          svg.appendChild(R.E("rect", { x: bx, y: by, width: bw, height: bh, fill: "#1A1F29", opacity: 0.92, stroke: R.C.violet, "stroke-width": 1.5, rx: 2 }));
        } else if (strategy === "copy") {
          // TRIVIAL: the model just lets the surrounding texture show through — the
          // background was already drawn beneath, so we leave the hole transparent
          // and only mark it as a trivial texture copy. Visibly "correct", empty.
          svg.appendChild(R.E("rect", { x: bx, y: by, width: bw, height: bh, fill: R.C.dim, opacity: 0.1, stroke: R.C.dim, "stroke-width": 1, "stroke-dasharray": "3 3", rx: 2 }));
          svg.appendChild(R.TX(bx + bw / 2, by + bh / 2 + 4, "copy", { anchor: "middle", size: 9, fill: R.C.dim, sans: true }));
        } else {
          // SEMANTIC: the model GUESSES the object — sometimes right, sometimes wrong
          const right = outcomes[i];
          const col = right ? R.C.green : R.C.red;
          svg.appendChild(R.E("rect", { x: bx, y: by, width: bw, height: bh, fill: col, opacity: 0.22, stroke: col, "stroke-width": 1.5, rx: 2 }));
          // a sketched guess of the circle, clipped feel via a small arc/dot
          svg.appendChild(R.E("circle", { cx: bx + bw / 2, cy: by + bh / 2, r: Math.min(bw, bh) * 0.28, fill: "none", stroke: col, "stroke-width": 1.5, "stroke-dasharray": right ? "none" : "2 2" }));
          svg.appendChild(R.TX(bx + bw / 2, by + bh - 5, right ? "✓ guess" : "✗ guess", { anchor: "middle", size: 8.5, fill: col, sans: true }));
        }
      });

      // task-character score: when revealed, drive it from what actually happened
      // (copy ⇒ texture / low; guess ⇒ semantic / high) so it's SHOWN not asserted.
      let sc;
      if (reveal) {
        sc = strategy === "copy"
          ? Math.min(0.28, semanticScore({ scale, count, aspect }))
          : Math.max(0.62, semanticScore({ scale, count, aspect }));
      } else {
        sc = semanticScore({ scale, count, aspect });
      }
      const lab = difficultyLabel(sc);
      const c = sc > 0.6 ? R.C.green : sc > 0.33 ? R.C.cyan : R.C.orange;
      const trivial = isTrivial(scale);
      const blurb = !reveal
        ? (sc > 0.6
            ? "Large target blocks force the model to predict <i>what's there</i> — object-level structure."
            : sc > 0.33
            ? "Mid-sized blocks: a mix of structure and texture."
            : "Tiny scattered blocks collapse the task to copying nearby <i>texture</i> — little semantic is learned.")
        : (strategy === "copy"
            ? "The model just <b>pasted the neighbouring texture</b> into each hole — every patch looks right, yet it never had to understand the object. <i>Predictable ≠ useful.</i>"
            : "The blocks hide the object, so the model has to <b>guess what's there</b> — it gets some right (green) and some wrong (red). That mistake pressure is where the semantics come from.");
      meter.innerHTML = `
        <div style="font-family:var(--font-mono);font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;color:#8A93A3;margin-bottom:6px">task character</div>
        <div style="height:14px;border-radius:7px;background:rgba(200,207,218,.12);overflow:hidden"><div style="height:100%;width:${Math.round(sc * 100)}%;background:${c};border-radius:7px;transition:width .2s"></div></div>
        <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:9px;color:#8A93A3;margin-top:3px"><span>texture</span><span>semantic</span></div>
        <div style="font-family:var(--font-mono);font-size:13px;color:${c};font-weight:600;margin-top:8px">${lab.toUpperCase()}${reveal ? ` · model: ${strategy === "copy" ? "COPIES TEXTURE" : "GUESSES OBJECT"}` : ""}</div>
        <div style="font-family:var(--font-serif);font-size:13px;color:#C8CFDA;margin-top:6px;line-height:1.5">${blurb}</div>`;
    };

    R.slider(ctrl, { label: "target scale", min: 0.04, max: 0.3, step: 0.01, value: scale, fmt: (v) => v.toFixed(2), on: (v) => { scale = v; draw(); } });
    R.slider(ctrl, { label: "aspect ratio", min: 0.5, max: 2, step: 0.05, value: aspect, fmt: (v) => v.toFixed(2), on: (v) => { aspect = v; draw(); } });
    R.slider(ctrl, { label: "target count", min: 1, max: 12, step: 1, value: count, fmt: (v) => String(v), on: (v) => { count = v; draw(); } });
    const tryBtn = R.btn(ctrl, "▶ let the model try", "primary", () => {
      reveal = !reveal;
      tryBtn.textContent = reveal ? "■ hide the fill" : "▶ let the model try";
      tryBtn.className = "lab-btn" + (reveal ? "" : " primary");
      draw();
    });
    R.btn(ctrl, "↻ resample", "", () => { seed = (seed * 1103515245 + 12345) >>> 0; draw(); });
    draw();
  }, []);

  return (
    <Lab id="maskdiff" title="Tune the masking task" setup={setup}
      note="I-JEPA's scales aren't arbitrary. Under the mask is a real scene — an object on a textured background. Hit ‘let the model try’: with tiny targets the model just COPIES the neighbouring texture (looks perfect, learns nothing); with large blocks it has to GUESS the hidden object (green = right, red = wrong) — and that pressure is what makes the task semantic. Drag scale up into its real ~0.15–0.2 range, push aspect to a sliver, and watch the meter swing." />
  );
}
