import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { planCEM } from "../logic.js";
import { clamp } from "../logic.js";

/* Latent planning (V-JEPA 2-AC's control loop) — toolkit port, dark stage.
   Place a goal; the "robot" plans by sampling action sequences in a 2-D
   stand-in for latent space, scoring each rollout by L1 distance to the goal
   embedding, keeping the elites (CEM), taking one step, and re-planning. */
export default function LatentPlanningLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const cv = document.createElement("canvas");
    cv.style.cssText = "width:100%;height:300px;display:block;border-radius:8px;cursor:crosshair";
    stage.appendChild(cv);
    const ctx = cv.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = cv.offsetWidth * DPR; cv.height = 300 * DPR; };
    resize();

    const readout = document.createElement("div");
    readout.style.cssText = "font-family:var(--font-mono);font-size:12px;color:#C8CFDA;margin-top:10px;line-height:1.5;min-height:34px";
    stage.appendChild(readout);

    const HORIZON = 4, N = 60, ELITE = 10;
    let cur = { x: 0.16, y: 0.78 }, goal = { x: 0.78, y: 0.28 };
    let samples = [], elites = [], running = false, step = 0, reached = false;
    let raf = 0, timer = 0;

    const draw = () => {
      const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      const P = (p) => [p.x * W, p.y * H];
      ctx.strokeStyle = "rgba(120,140,200,.16)"; ctx.lineWidth = DPR;
      for (let i = 1; i < 8; i++) {
        ctx.beginPath(); ctx.moveTo((i / 8) * W, 0); ctx.lineTo((i / 8) * W, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, (i / 8) * H); ctx.lineTo(W, (i / 8) * H); ctx.stroke();
      }
      const [sx, sy] = P(cur);
      samples.forEach((c) => {
        ctx.beginPath(); ctx.moveTo(sx, sy);
        c.seq.forEach((pt) => { const [x, y] = P(pt); ctx.lineTo(x, y); });
        ctx.strokeStyle = R.C.violet + "33"; ctx.lineWidth = DPR; ctx.stroke();
      });
      elites.forEach((c) => {
        ctx.beginPath(); ctx.moveTo(sx, sy);
        c.seq.forEach((pt) => { const [x, y] = P(pt); ctx.lineTo(x, y); });
        ctx.strokeStyle = R.C.cyan; ctx.lineWidth = 1.6 * DPR; ctx.stroke();
      });
      const [gx, gy] = P(goal);
      ctx.strokeStyle = R.C.orange; ctx.lineWidth = 2 * DPR;
      ctx.beginPath(); ctx.arc(gx, gy, 13 * DPR, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(gx, gy, 4 * DPR, 0, 7); ctx.fillStyle = R.C.orange; ctx.fill();
      ctx.beginPath(); ctx.arc(sx, sy, 7 * DPR, 0, 7);
      ctx.fillStyle = R.C.cyan; ctx.shadowColor = R.C.cyan; ctx.shadowBlur = 14 * DPR; ctx.fill();
      ctx.shadowBlur = 0;
    };

    const say = (msg) => { readout.innerHTML = msg; };
    say("Ready. The robot has only a predictor — “if I take these actions, where will my latent state be?” Tap to move the goal, then plan.");

    const tickPlan = () => {
      if (!running) return;
      const dist = Math.abs(cur.x - goal.x) + Math.abs(cur.y - goal.y);
      if (dist < 0.06 || step > 40) {
        running = false; reached = true; samples = []; elites = []; draw();
        say(`<b style="color:${R.C.cyan}">Goal reached.</b> Every rollout was scored by L1 distance between <i>predicted</i> and <i>goal</i> embeddings — never pixels. That's why this runs in ~16s/action on a real arm.`);
        planBtn.textContent = "↺ Plan again"; planBtn.className = "lab-btn primary";
        return;
      }
      const { cand, elites: el, bestSeq } = planCEM(cur, goal, { horizon: HORIZON, samples: N, elite: ELITE, iters: 2 });
      samples = cand; elites = el; draw();
      say(`Planning… faint paths are imagined action sequences; bright ones are the elites the Cross-Entropy Method keeps. Step <b style="color:${R.C.cyan}">${step}</b>.`);
      timer = setTimeout(() => {
        if (!running) return;
        if (bestSeq && bestSeq[0]) cur = bestSeq[0];
        step += 1;
        tickPlan();
      }, 440);
    };

    const start = () => {
      if (running) return;
      reached = false; step = 0; cur = { x: 0.16, y: 0.78 }; running = true;
      planBtn.textContent = "■ Stop"; planBtn.className = "lab-btn";
      tickPlan();
    };
    const stop = () => { running = false; clearTimeout(timer); samples = []; elites = []; draw(); planBtn.textContent = "▶ Plan & act"; planBtn.className = "lab-btn primary"; };

    cv.addEventListener("click", (e) => {
      if (running) return;
      const r = cv.getBoundingClientRect();
      goal = { x: clamp((e.clientX - r.left) / r.width, 0.05, 0.95), y: clamp((e.clientY - r.top) / r.height, 0.05, 0.95) };
      reached = false; draw();
    });
    const planBtn = R.btn(ctrl, "▶ Plan & act", "primary", () => (running ? stop() : start()));

    draw();
    const onR = () => { resize(); draw(); }; window.addEventListener("resize", onR);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); running = false; window.removeEventListener("resize", onR); };
  }, []);

  return (
    <Lab id="planning" title="Plan in latent space (V-JEPA 2's control loop)" setup={setup}
      note="The grid is a 2-D stand-in for latent space. The amber ring is the goal image's embedding; the glowing dot is the robot's current state. Tap to move the goal, then plan — it samples action sequences (faint), keeps the elites closest to the goal (bright), takes one step, and re-plans. This is MPC + the Cross-Entropy Method, exactly as V-JEPA 2-AC does it." />
  );
}
