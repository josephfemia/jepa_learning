import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { planCEM } from "../logic.js";
import { clamp } from "../logic.js";
import { prefersReducedMotion } from "../widgets/animate.js";

/* Latent planning (V-JEPA 2-AC's control loop) — toolkit port, dark stage.
   Place a goal; the "robot" plans by sampling action sequences in a 2-D
   stand-in for latent space, scoring each rollout by L1 distance to the goal
   embedding, keeping the elites (CEM), taking one step, and re-planning.

   Upgrades: an obstacle wall (with a gap) sits between start and goal, so the
   CEM elites must visibly BEND around it — scored in the lab layer since
   planCEM is obstacle-blind. Horizon and #samples are exposed as sliders wired
   to BOTH the visual (more faint rollouts / longer paths) and the cost bars
   (cost scales with horizon × samples), so cranking samples widens the
   latent-vs-pixel gap — the real lever behind the ~15× headline. */
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

    // Cost meter: the SAME CEM search, scored two ways. Latent = compare short
    // vectors (cheap). Pixel = render full frames per candidate (~15× costlier).
    const costRow = (label, color) => {
      const r = R.ce("div"); r.style.cssText = "display:flex;align-items:center;gap:9px;font-family:IBM Plex Mono,monospace;font-size:10.5px;color:#C8CFDA";
      const lab = R.ce("span", null, label); lab.style.cssText = "width:158px;flex-shrink:0";
      const track = R.ce("div"); track.style.cssText = "flex:1;height:7px;border-radius:4px;background:rgba(120,140,200,0.18);overflow:hidden";
      const fill = R.ce("div"); fill.style.cssText = `height:100%;width:0%;border-radius:4px;background:${color};transition:width .3s ease`;
      track.appendChild(fill);
      const val = R.ce("span", null, "0s"); val.style.cssText = "width:56px;text-align:right;flex-shrink:0";
      r.appendChild(lab); r.appendChild(track); r.appendChild(val); costWrap.appendChild(r);
      return { fill, val };
    };
    const costWrap = R.ce("div"); costWrap.style.cssText = "margin-top:10px;display:flex;flex-direction:column;gap:7px";
    const costLat = costRow("latent scoring (V-JEPA 2)", R.C.cyan);
    const costPix = costRow("pixel-render scoring (Cosmos)", R.C.orange);
    stage.appendChild(costWrap);

    // Per-CANDIDATE cost: scoring one rollout costs more the longer the horizon
    // (more predictor steps). Total per replan = perCandidate × samples × horizon,
    // so cranking samples (or horizon) visibly WIDENS the latent-vs-pixel gap.
    const PER_LAT = 0.0067, PER_PIX = 0.10;   // tuned so a 4×60 replan ≈ 1.6s vs 24s
    const MAX_COST = 200 * 8 * PER_PIX;        // worst-case pixel: max samples × max horizon
    let latS = 0, pixS = 0;
    const fmtT = (s) => (s >= 60 ? (s / 60).toFixed(1) + "m" : s.toFixed(s < 10 ? 1 : 0) + "s");
    const drawCost = () => {
      costLat.fill.style.width = Math.min(100, (latS / MAX_COST) * 100) + "%";
      costPix.fill.style.width = Math.min(100, (pixS / MAX_COST) * 100) + "%";
      costLat.val.textContent = fmtT(latS);
      costPix.val.textContent = fmtT(pixS);
    };
    const resetCost = () => { latS = 0; pixS = 0; drawCost(); };

    // Tunables (driven by sliders). ELITE/iters stay fixed; horizon & samples move.
    let HORIZON = 4, N = 60;
    const ELITE = 10, ITERS = 2;

    // Obstacle: a vertical wall with a gap. The CEM elites must thread the gap.
    // Stored in normalized [0,1] coords. Kept clear of the default start/goal.
    const wall = { x: 0.5, y0: 0.0, y1: 0.42, x2: 0.5, gapY0: 0.42, gapY1: 0.6, yBot0: 0.6, yBot1: 1.0 };
    // Two solid wall segments leaving a gap between gapY0 and gapY1.
    const wallSegs = [
      { x: wall.x, y0: 0.04, y1: wall.gapY0 },
      { x: wall.x, y0: wall.gapY1, y1: 0.96 },
    ];
    const WALL_HALF = 0.02; // illustrative thickness for crossing test

    let cur = { x: 0.16, y: 0.78 }, goal = { x: 0.84, y: 0.22 };
    let samples = [], elites = [], running = false, step = 0, reached = false;
    let raf = 0, timer = 0;

    // Does the straight segment a→b cross the (vertical) wall x = wx within its
    // solid y-range? Cheap illustrative test used to score candidates so the
    // rendered elites avoid the wall (planCEM itself is obstacle-blind).
    const segCrossesWall = (a, b) => {
      for (const w of wallSegs) {
        if ((a.x - w.x) * (b.x - w.x) > 1e-9) continue;   // both on same side, no cross
        if (Math.abs(a.x - b.x) < 1e-9) {                 // vertical seg riding the wall
          if (Math.abs(a.x - w.x) < WALL_HALF) {
            const lo = Math.min(a.y, b.y), hi = Math.max(a.y, b.y);
            if (hi > w.y0 && lo < w.y1) return true;
          }
          continue;
        }
        const t = (w.x - a.x) / (b.x - a.x);
        if (t < 0 || t > 1) continue;
        const yc = a.y + (b.y - a.y) * t;
        if (yc > w.y0 && yc < w.y1) return true;
      }
      return false;
    };
    // Penalty for a full rollout that pushes through the wall — large enough that
    // elites prefer to route through the gap.
    const wallPenalty = (cur0, seq) => {
      let p = cur0, hits = 0;
      for (const pt of seq) { if (segCrossesWall(p, pt)) hits += 1; p = pt; }
      return hits * 0.9;
    };

    const draw = () => {
      const W = cv.width, H = cv.height;
      if (W < 2) return;
      ctx.clearRect(0, 0, W, H);
      const P = (p) => [p.x * W, p.y * H];
      ctx.strokeStyle = "rgba(120,140,200,.16)"; ctx.lineWidth = DPR;
      for (let i = 1; i < 8; i++) {
        ctx.beginPath(); ctx.moveTo((i / 8) * W, 0); ctx.lineTo((i / 8) * W, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, (i / 8) * H); ctx.lineTo(W, (i / 8) * H); ctx.stroke();
      }
      // Obstacle wall (the forbidden region) — drawn as two solid bars + a hint at the gap.
      ctx.lineWidth = 6 * DPR; ctx.lineCap = "round"; ctx.strokeStyle = R.C.red;
      wallSegs.forEach((w) => {
        ctx.beginPath(); ctx.moveTo(w.x * W, w.y0 * H); ctx.lineTo(w.x * W, w.y1 * H); ctx.stroke();
      });
      ctx.lineCap = "butt"; ctx.lineWidth = DPR;
      ctx.setLineDash([4 * DPR, 5 * DPR]); ctx.strokeStyle = R.C.dim;
      ctx.beginPath(); ctx.moveTo(wall.x * W, wall.gapY0 * H); ctx.lineTo(wall.x * W, wall.gapY1 * H); ctx.stroke();
      ctx.setLineDash([]);

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
    say("Ready. The robot has only a predictor — “if I take these actions, where will my latent state be?” A wall sits between it and the goal; tap to move the goal, then plan and watch the elites thread the gap.");

    // Run one obstacle-aware CEM plan. planCEM is obstacle-blind, so we re-score
    // its candidates with the wall penalty in the lab layer and re-pick elites +
    // the best sequence. Returns the same shape the renderer expects.
    const planObstacleAware = () => {
      const { cand } = planCEM(cur, goal, { horizon: HORIZON, samples: N, elite: ELITE, iters: ITERS });
      const scored = cand.map((c) => ({ ...c, cost: c.energy + wallPenalty(cur, c.seq) }));
      scored.sort((a, b) => a.cost - b.cost);
      const el = scored.slice(0, ELITE);
      const best = el[0] ? el[0].seq : null;
      return { cand: scored, elites: el, bestSeq: best };
    };

    // Cost of ONE replan = perCandidate × samples × horizon (longer horizon =
    // more predictor steps per candidate). The visible gap is PER_PIX/PER_LAT ≈ 15×.
    const replanCost = () => {
      latS += PER_LAT * N * HORIZON;
      pixS += PER_PIX * N * HORIZON;
    };

    const tickPlan = () => {
      if (!running) return;
      const dist = Math.abs(cur.x - goal.x) + Math.abs(cur.y - goal.y);
      if (dist < 0.06 || step > 60) {
        running = false; reached = true; samples = []; elites = []; draw();
        const ratio = latS > 0 ? (pixS / latS).toFixed(0) : "15";
        say(`<b style="color:${R.C.cyan}">Goal reached.</b> Same CEM search, same wall both ways — but scoring in latent space cost <b style="color:${R.C.cyan}">${fmtT(latS)}</b> vs <b style="color:${R.C.orange}">${fmtT(pixS)}</b> to render pixels (~${ratio}×). More samples or a longer horizon scales BOTH — but the gap stays. The speedup is the whole reason this runs on a real arm.`);
        planBtn.textContent = "↺ Plan again"; planBtn.className = "lab-btn primary";
        return;
      }
      const { cand, elites: el, bestSeq } = planObstacleAware();
      samples = cand; elites = el; draw();
      replanCost(); drawCost();
      say(`Planning… ${N} faint imagined action sequences; the bright elites the Cross-Entropy Method keeps. They <b style="color:${R.C.cyan}">bend around the wall</b> through the gap. Step <b style="color:${R.C.cyan}">${step}</b>.`);
      timer = setTimeout(() => {
        if (!running) return;
        if (bestSeq && bestSeq[0]) cur = bestSeq[0];
        step += 1;
        tickPlan();
      }, 440);
    };

    const start = () => {
      if (running) return;
      reached = false; step = 0; cur = { x: 0.16, y: 0.78 }; running = true; resetCost();
      planBtn.textContent = "■ Stop"; planBtn.className = "lab-btn";
      if (prefersReducedMotion()) {
        // No looping animation: run the plan to completion in one synchronous pass,
        // then show the final state + accumulated cost.
        let guard = 0;
        while (running && guard < 80) {
          const dist = Math.abs(cur.x - goal.x) + Math.abs(cur.y - goal.y);
          if (dist < 0.06) break;
          const { elites: el, bestSeq } = planObstacleAware();
          elites = el; replanCost();
          if (bestSeq && bestSeq[0]) cur = bestSeq[0];
          step += 1; guard += 1;
        }
        running = false; reached = true; samples = []; draw(); drawCost();
        const ratio = latS > 0 ? (pixS / latS).toFixed(0) : "15";
        say(`<b style="color:${R.C.cyan}">Goal reached.</b> Latent scoring cost <b style="color:${R.C.cyan}">${fmtT(latS)}</b> vs <b style="color:${R.C.orange}">${fmtT(pixS)}</b> rendering pixels (~${ratio}×). The elites route through the gap.`);
        planBtn.textContent = "↺ Plan again"; planBtn.className = "lab-btn primary";
        return;
      }
      tickPlan();
    };
    const stop = () => { running = false; clearTimeout(timer); samples = []; elites = []; draw(); planBtn.textContent = "▶ Plan & act"; planBtn.className = "lab-btn primary"; };

    cv.addEventListener("click", (e) => {
      if (running) return;
      const r = cv.getBoundingClientRect();
      let gx = clamp((e.clientX - r.left) / r.width, 0.05, 0.95);
      const gy = clamp((e.clientY - r.top) / r.height, 0.05, 0.95);
      // Don't let the goal land inside a solid wall segment — nudge it off.
      const inWall = wallSegs.some((w) => Math.abs(gx - w.x) < WALL_HALF * 1.5 && gy > w.y0 && gy < w.y1);
      if (inWall) gx = gx < wall.x ? wall.x - 0.06 : wall.x + 0.06;
      goal = { x: gx, y: gy };
      reached = false; draw();
    });

    R.slider(ctrl, {
      label: "horizon (plan length)", min: 2, max: 8, step: 1, value: HORIZON,
      fmt: (v) => v + " steps",
      on: (v) => { HORIZON = v; if (!running) { samples = []; elites = []; draw(); } },
    });
    R.slider(ctrl, {
      label: "# samples (imagined rollouts)", min: 20, max: 200, step: 10, value: N,
      fmt: (v) => "" + v,
      on: (v) => { N = v; if (!running) { samples = []; elites = []; draw(); } },
    });
    const planBtn = R.btn(ctrl, "▶ Plan & act", "primary", () => (running ? stop() : start()));

    draw(); drawCost();
    const stopRO = R.watchResize(cv, () => { resize(); draw(); });
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); running = false; stopRO(); };
  }, []);

  return (
    <Lab id="planning" title="Plan in latent space (V-JEPA 2's control loop)" setup={setup}
      note="The grid is a 2-D stand-in for latent space; the red bars are an obstacle (a forbidden region) with a gap. The amber ring is the goal image's embedding; the glowing dot is the robot's current state. Tap to move the goal, set the horizon and #samples, then plan — it samples action sequences (faint), keeps the elites closest to the goal that bend around the wall (bright), takes one step, and re-plans. Costs are illustrative: cranking samples or horizon scales both bars, but the ~15× latent-vs-pixel gap stays. This is MPC + the Cross-Entropy Method, as V-JEPA 2-AC does it." />
  );
}
