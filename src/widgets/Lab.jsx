import React, { useEffect, useRef } from "react";
import { clr } from "./rllab.js";

/**
 * Lab — React mount point for a toolkit widget. Mirrors robotic_learning's
 * Lab.vue: a titled <figure class="lab"> with a dark .lab-stage (where the
 * widget draws its SVG/canvas) and a light .lab-controls strip (where
 * R.slider / R.btn / R.legend append their controls).
 *
 * Usage — the widget passes a STABLE setup callback (wrap in useCallback):
 *
 *   const setup = useCallback(({ stage, ctrl }) => {
 *     const svg = R.SVG(stage, 600, 240);
 *     R.slider(ctrl, { label: "γ", min: 0, max: 1, step: .01, value: .5, on: draw });
 *     draw();
 *     return () => cancelAnimationFrame(raf);   // optional cleanup
 *   }, []);
 *   return <Lab id="disc" title="Discount horizon" setup={setup} note="…" />;
 *
 * setup receives { stage, ctrl } (both cleared before each run) and may return
 * a cleanup function. svg/canvas added to the stage are auto-aria-stamped.
 */
export default function Lab({ id, title, note, kicker = "INTERACTIVE", setup }) {
  const stageRef = useRef(null);
  const ctrlRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const ctrl = ctrlRef.current;
    if (!stage || !ctrl) return;
    clr(stage);
    clr(ctrl);
    const cleanup = setup ? setup({ stage, ctrl }) : undefined;
    // aria-stamp any visuals the widget drew
    const label = "Interactive: " + title;
    stage.querySelectorAll("svg, canvas").forEach((v) => {
      if (!v.getAttribute("role")) v.setAttribute("role", "img");
      if (!v.getAttribute("aria-label")) v.setAttribute("aria-label", label);
    });
    return () => { if (typeof cleanup === "function") cleanup(); };
  }, [setup, title]);

  return (
    <figure className="lab" id={id ? "lab-" + id : undefined}>
      <figcaption className="lab-cap">
        <span className="lab-kicker">{kicker}</span> {title}
      </figcaption>
      <div className="lab-stage" ref={stageRef} />
      <div className="lab-controls" ref={ctrlRef} />
      {note && <p className="lab-note">{note}</p>}
    </figure>
  );
}
