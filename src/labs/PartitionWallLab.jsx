import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { outcomeCount, probCost, energyCost, fmtCount } from "../logic/partitionWall.js";
import { prefersReducedMotion } from "../widgets/animate.js";

/* The partition-function wall — why a probabilistic model can't just "score the
   right answer." To turn a score into a PROBABILITY it must normalize: divide by
   the sum of the score over EVERY possible output (the partition function Z).
   That sum visits the whole output space, which grows exponentially. An EBM just
   scores ONE (x, y) pair — no sum, no wall. Crank "output space" and watch the
   probabilistic cost pin to the top while the energy cost stays a single dot. */
export default function PartitionWallLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const cv = document.createElement("canvas");
    cv.style.cssText = "width:100%;height:260px;display:block;border-radius:8px";
    stage.appendChild(cv);
    const ctx = cv.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = cv.offsetWidth * DPR; cv.height = 260 * DPR; };
    resize();
    const reduce = prefersReducedMotion();

    let level = 3;          // output-space resolution (3 ** level outcomes)
    let mode = "prob";      // "prob" | "energy"
    let sweep = 0;          // index of the cell the normalizer sweep is visiting
    const SWEEP_PER_FRAME = 2;

    // We render at most a GRID_CAP x GRID_CAP lattice so the canvas stays legible;
    // the COST uses the true exponential outcomeCount(level), shown as a number.
    const GRID_CAP = 12;
    const cellsAcross = () => Math.min(GRID_CAP, Math.ceil(Math.sqrt(outcomeCount(level))));
    // the one low-energy cell (the actual answer the EBM scores)
    const answerIdx = () => {
      const n = cellsAcross();
      return Math.floor(n * 0.62) * n + Math.floor(n * 0.34);
    };

    const meter = R.meters(stage, ["cost to score ONE answer", "output coverage swept"]);
    // probabilistic cost pins to the top (skyrockets); energy is a flat dot at the
    // floor. We map cost to a bar height on a log scale so the contrast reads as
    // "pinned high" vs "barely off zero".
    const costPct = (cost) => {
      if (cost <= 1) return 2; // a dot at the floor
      // log scale: level 10 (≈59k) → ~100%
      return Math.round(R.clamp((Math.log10(cost) / Math.log10(outcomeCount(10))) * 100, 2, 100));
    };

    let raf = 0;
    const draw = () => {
      const W = cv.width, H = cv.height;
      if (W < 2) return;
      ctx.clearRect(0, 0, W, H);
      const n = cellsAcross();
      const total = outcomeCount(level);
      const pad = 14 * DPR;
      const gridSize = Math.min(W - 2 * pad, H - 44 * DPR);
      const ox = (W - gridSize) / 2, oy = pad;
      const cs = gridSize / n;
      const ai = answerIdx();

      // how far the sweep has progressed across the *rendered* grid (probabilistic)
      const renderedCells = n * n;
      const sweepCell = mode === "prob" ? Math.floor(sweep) % renderedCells : -1;

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const idx = r * n + c;
          const x = ox + c * cs, y = oy + r * cs;
          let fill = "rgba(120,140,200,0.10)";
          let stroke = R.C.grid;
          if (mode === "energy") {
            // exactly one cell lights low-energy; the rest are inert
            if (idx === ai) { fill = "rgba(91,141,239,0.85)"; stroke = R.C.cyan; }
          } else {
            // probabilistic: the normalizer sweep visits every cell
            if (idx === ai) { fill = "rgba(47,203,126,0.30)"; stroke = R.C.green; }
            if (idx <= sweepCell) fill = "rgba(232,89,12,0.32)";       // already summed
            if (idx === sweepCell) { fill = "rgba(232,89,12,0.85)"; stroke = R.C.orange; } // sweeping now
          }
          ctx.fillStyle = fill;
          ctx.fillRect(x + 0.5 * DPR, y + 0.5 * DPR, cs - 1 * DPR, cs - 1 * DPR);
          ctx.strokeStyle = stroke; ctx.lineWidth = 1 * DPR;
          ctx.strokeRect(x + 0.5 * DPR, y + 0.5 * DPR, cs - 1 * DPR, cs - 1 * DPR);
        }
      }

      // headline counter under the grid
      const cost = mode === "prob" ? probCost(level) : energyCost();
      const label = mode === "prob"
        ? "evaluations to score ONE answer = " + fmtCount(cost)
        : "evaluations to score ONE answer = 1";
      const cap = total > renderedCells ? "  (grid shows " + renderedCells + " of " + fmtCount(total) + " outcomes)" : "";
      const ty = oy + gridSize + 22 * DPR;
      ctx.fillStyle = mode === "prob" ? R.C.orange : R.C.cyan;
      ctx.font = (13 * DPR) + "px IBM Plex Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(label, W / 2, ty);
      if (cap) {
        ctx.fillStyle = R.C.dim; ctx.font = (10 * DPR) + "px IBM Plex Mono, monospace";
        ctx.fillText(cap.trim(), W / 2, ty + 16 * DPR);
      }
    };

    const refresh = () => {
      const cost = mode === "prob" ? probCost(level) : energyCost();
      meter.set(0, costPct(cost), R.C.orange);
      if (mode === "prob") {
        const renderedCells = cellsAcross() ** 2;
        meter.set(1, Math.round(R.clamp((sweep % renderedCells) / renderedCells, 0, 1) * 100), R.C.orange);
      } else {
        meter.set(1, 0, R.C.cyan); // energy never sweeps the space
      }
    };

    const tick = () => {
      if (mode === "prob") {
        const renderedCells = cellsAcross() ** 2;
        sweep = (sweep + SWEEP_PER_FRAME) % (renderedCells + 1);
      }
      draw();
      refresh();
      raf = requestAnimationFrame(tick);
    };

    R.slider(ctrl, {
      label: "output space (resolution)",
      min: 1, max: 10, step: 1, value: level,
      fmt: (v) => "3^" + v + " = " + fmtCount(outcomeCount(v)) + " outcomes",
      on: (v) => { level = v; sweep = 0; if (reduce) { draw(); refresh(); } },
    });
    const modeBtn = R.btn(ctrl, "mode: probabilistic (must normalize)", "primary", () => {
      mode = mode === "prob" ? "energy" : "prob";
      sweep = 0;
      modeBtn.textContent = mode === "prob"
        ? "mode: probabilistic (must normalize)"
        : "mode: energy (score one pair)";
      modeBtn.className = "lab-btn" + (mode === "prob" ? " primary" : "");
      if (reduce) { draw(); refresh(); }
    });
    R.legend(stage, [
      [R.C.orange, "normalizer sweep (probabilistic)"],
      [R.C.cyan, "the one scored pair (energy)"],
      [R.C.green, "the right answer"],
    ]);

    if (reduce) { draw(); refresh(); } else tick();
    const stopRO = R.watchResize(cv, () => { resize(); draw(); refresh(); });
    return () => { cancelAnimationFrame(raf); stopRO(); };
  }, []);

  return (
    <Lab id="partition" title="The partition-function wall" setup={setup}
      note="A probabilistic model can't just score the right answer — to turn a score into a PROBABILITY it has to normalize: divide by the sum of the score over EVERY possible output. That sum is the partition function Z, and computing it means visiting the entire output space. Crank the 'output space' slider and watch the count of outcomes explode (3^level) — the orange sweep has to visit all of them just to score ONE answer, so the cost bar pins to the top. Now flip to 'energy' mode: an energy-based model just scores the single (x, y) pair you handed it — one cell lights up, the cost stays a flat dot at 1, no matter how big the output space gets. That's the wall JEPA and EBMs walk around: they never integrate over all possible images. (Grid is capped for legibility; the count is the real exponential.)" />
  );
}
