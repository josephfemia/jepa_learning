import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { trajectory, surprise } from "../logic/violation.js";
import { prefersReducedMotion } from "../widgets/animate.js";

/* Violation-of-Expectation probe. A ball rolls off a table; the "weirdness"
   slider morphs the event from a plausible gravity fall to an impossible hover.
   A good world model should be MORE surprised (higher energy) by the impossible
   event — and that asymmetry IS a label-free evaluation. The surprise meter
   climbs with weirdness; the ball animates along the morphed trajectory. */
export default function ViolationLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const cv = document.createElement("canvas");
    cv.style.cssText = "width:100%;height:260px;display:block;border-radius:8px";
    stage.appendChild(cv);
    const ctx = cv.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = cv.offsetWidth * DPR; cv.height = 260 * DPR; };
    resize();

    let weird = 0;
    let phase = 0; // 0..1 progress of the ball along its path
    const reduce = prefersReducedMotion();

    const meter = R.meters(stage, ["model surprise (energy)"]);
    const refresh = () => meter.set(0, Math.round(surprise(weird) * 100), R.C.green);

    // Pad the unit square into the canvas with a margin so the ball never clips.
    const draw = () => {
      const W = cv.width, H = cv.height;
      if (W < 2) return;
      const pad = 18 * DPR;
      const PW = W - pad * 2, PH = H - pad * 2;
      const X = (u) => pad + u * PW;
      const Y = (v) => pad + v * PH;
      ctx.clearRect(0, 0, W, H);

      const path = trajectory(weird, 48);
      // surprise drives the event's color: green (plausible) → red (impossible).
      const energetic = surprise(weird);
      const ballCol = energetic > 0.5 ? R.C.red : R.C.green;

      // the table — a slab the ball rolls along then leaves.
      const edgeIdx = path.findIndex((p, i) => i > 0 && p.y !== path[i - 1].y);
      const edgeX = edgeIdx > 0 ? path[edgeIdx - 1].x : 0.42;
      const tableY = path[0].y;
      ctx.fillStyle = "rgba(120,140,200,0.20)";
      ctx.fillRect(X(0.04), Y(tableY) + 3 * DPR, X(edgeX) - X(0.04), 10 * DPR);
      ctx.fillStyle = "rgba(120,140,200,0.12)";
      ctx.fillRect(X(edgeX) - 6 * DPR, Y(tableY) + 3 * DPR, 6 * DPR, PH * 0.5);

      // the (faint) trajectory the ball will follow.
      ctx.strokeStyle = "rgba(200,207,218,0.22)";
      ctx.setLineDash([5 * DPR, 5 * DPR]);
      ctx.lineWidth = 1.4 * DPR;
      ctx.beginPath();
      path.forEach((p, i) => { const px = X(p.x), py = Y(p.y); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
      ctx.stroke();
      ctx.setLineDash([]);

      // the ball at its current phase along the path.
      const fi = phase * (path.length - 1);
      const i0 = Math.floor(fi), i1 = Math.min(path.length - 1, i0 + 1), f = fi - i0;
      const bx = X(R.lerp(path[i0].x, path[i1].x, f));
      const by = Y(R.lerp(path[i0].y, path[i1].y, f));
      const r = 8 * DPR;
      // surprise "spike" halo around the ball when the event is impossible.
      if (energetic > 0.25) {
        ctx.beginPath(); ctx.arc(bx, by, r + 6 * DPR * energetic, 0, 7);
        ctx.fillStyle = "rgba(255,107,107," + (0.10 + 0.25 * energetic).toFixed(3) + ")";
        ctx.fill();
      }
      ctx.beginPath(); ctx.arc(bx, by, r, 0, 7);
      ctx.fillStyle = ballCol; ctx.shadowColor = ballCol; ctx.shadowBlur = 8 * DPR; ctx.fill();
      ctx.shadowBlur = 0;

      // a small "!" tag when the model is surprised.
      if (energetic > 0.6) {
        ctx.fillStyle = R.C.red;
        ctx.font = (13 * DPR) + "px IBM Plex Mono, ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.fillText("! surprise", bx, by - r - 8 * DPR);
        ctx.textAlign = "start";
      }
    };

    let raf = 0;
    const tick = () => {
      phase += 0.012;
      if (phase >= 1) phase = 0; // loop the event
      draw();
      raf = requestAnimationFrame(tick);
    };

    R.slider(ctrl, {
      label: "weirdness (plausible fall → impossible hover)",
      min: 0, max: 1, step: 0.01, value: 0,
      fmt: (v) => v.toFixed(2),
      on: (v) => { weird = v; refresh(); if (reduce) { phase = 1; draw(); } },
    });
    R.legend(stage, [[R.C.green, "plausible (low energy)"], [R.C.red, "impossible (high energy)"]]);

    refresh();
    if (reduce) { phase = 1; draw(); } else tick();
    const stopRO = R.watchResize(cv, () => { resize(); draw(); });
    return () => { cancelAnimationFrame(raf); stopRO(); };
  }, []);

  return (
    <Lab id="voe" title="Violation-of-expectation probe" setup={setup}
      note="A world model that has internalized physics should be MORE surprised by an impossible event than a plausible one — and that asymmetry is a label-free evaluation. Watch the ball roll off the table and fall (a gravity parabola). Now drag the weirdness slider up: the ball stops falling and drifts UP, defying gravity. The model's surprise (energy) — its prediction error against learned physics — stays low for the plausible fall and spikes for the impossible hover. No labels, no reconstruction: you test the model by checking that the physically impossible costs more energy than the physically real." />
  );
}
