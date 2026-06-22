import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";

/* EMA teacher–student lag visualizer. A scrolling time-series of one weight:
   the student (cyan) takes noisy gradient steps; the teacher (violet) is an
   exponential moving average, teacher ← τ·teacher + (1−τ)·student. Crank τ up
   and the teacher is a smooth, slow shadow → stable targets. Crank τ down and
   the teacher snaps onto the student → they move in lockstep and can collude.
   Makes the otherwise-mystical τ ≈ 0.996 mechanical. */
export default function EmaLagLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const W = 600, H = 210, N = 130;
    const svg = R.SVG(stage, W, H);
    let tau = 0.96, frame = 0, t = 0;
    let sVal = 0.5, tVal = 0.5;
    const student = Array(N).fill(0.5), teacher = Array(N).fill(0.5);

    const meter = R.meters(stage, ["target stability"]);
    const readout = R.ce("div");
    readout.style.cssText = "font-family:var(--font-mono);font-size:12px;color:#C8CFDA;margin-top:10px;line-height:1.5;min-height:34px";
    stage.appendChild(readout);

    const X = (i) => 24 + (i / (N - 1)) * (W - 48);
    const Y = (v) => 14 + (1 - v) * (H - 42);

    const stepSim = () => {
      t += 1;
      const target = 0.5 + 0.32 * Math.sin(t * 0.025);   // slowly drifting task optimum
      sVal = R.clamp(sVal + (target - sVal) * 0.22 + (Math.random() - 0.5) * 0.14, 0.05, 0.95);
      tVal = tau * tVal + (1 - tau) * sVal;
      student.push(sVal); student.shift();
      teacher.push(tVal); teacher.shift();
    };

    const path = (arr, color, wdt) => {
      const d = "M " + arr.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" L ");
      svg.appendChild(R.E("path", { d, fill: "none", stroke: color, "stroke-width": wdt, "stroke-linejoin": "round" }));
    };

    const draw = () => {
      R.clr(svg);
      svg.appendChild(R.TX(24, 12, "weight value", { anchor: "start", size: 10, fill: R.C.dim }));
      svg.appendChild(R.TX(W - 24, H - 6, "training steps →", { anchor: "end", size: 10, fill: R.C.dim }));
      path(student, R.C.cyan, 1.3);
      path(teacher, R.C.violet, 2.6);
      svg.appendChild(R.E("circle", { cx: X(N - 1), cy: Y(student[N - 1]), r: 4, fill: R.C.cyan }));
      svg.appendChild(R.E("circle", { cx: X(N - 1), cy: Y(teacher[N - 1]), r: 5, fill: R.C.violet }));

      // stability = inverse of how much the teacher jitters per step (rolling)
      let jit = 0;
      for (let i = N - 14; i < N; i++) jit += Math.abs(teacher[i] - teacher[i - 1]);
      jit /= 14;
      const stability = Math.round(R.clamp(1 - jit / 0.05, 0, 1) * 100);
      meter.set(0, stability, R.C.orange);
      readout.innerHTML = tau >= 0.92
        ? `Targets are <b style="color:${R.C.violet}">smooth and slow</b> — the student can't game a moving average it can't predict. This is the stable regime (real JEPAs use τ ≈ 0.996).`
        : tau >= 0.75
        ? `The teacher is starting to <b>track</b> the student. Targets get jumpier — less stable to learn against.`
        : `Low τ: the teacher snaps onto the student and they move in <b style="color:${R.C.orange}">lockstep</b>. Nothing keeps the target un-gameable — exactly the collusion that lets collapse happen.`;
    };

    let raf = 0;
    const tick = () => { frame = (frame + 1) % 2; if (frame === 0) { stepSim(); draw(); } raf = requestAnimationFrame(tick); };

    R.slider(ctrl, { label: "τ — EMA retention", min: 0.5, max: 0.995, step: 0.005, value: tau, fmt: (v) => v.toFixed(3), on: (v) => { tau = v; } });
    R.legend(stage, [[R.C.cyan, "student (gradient steps)"], [R.C.violet, "teacher = EMA (the targets)"]]);

    draw(); tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <Lab id="emalag" title="Why the teacher lags the student" setup={setup}
      note="The teacher's weights are an exponential moving average of the student's: teacher ← τ·teacher + (1−τ)·student. Slide τ toward 1 and the teacher becomes a smooth, slow shadow — stable targets the student can't trivially game. Slide it down and the teacher snaps onto the student: they move in lockstep, and that's the collusion route to collapse. The lag is the point." />
  );
}
