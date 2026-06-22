import React, { useCallback } from "react";
import Lab from "../widgets/Lab.jsx";
import R from "../widgets/rllab.js";
import { ANCHORS, SUBJECT, viewEmbedding, dist, nearestClass } from "../logic/embeddingInvariance.js";

/* What an embedding IS — and why invariance matters. A 2-D semantic plane whose
   axes "mean" things (has-wheels / furry). Items land near their kind. Drag the
   augmentation slider on one cat: a GOOD (invariant) encoder barely moves the dot
   — same meaning, same point; a BROKEN encoder lets the nuisance drag the dot
   toward an unrelated class (the truck). The readout shows which kind it's now
   nearest. This is the prerequisite the whole course rests on. */
export default function EmbeddingInvarianceLab() {
  const setup = useCallback(({ stage, ctrl }) => {
    const W = 600, H = 300;
    const svg = R.SVG(stage, W, H);
    // plane box inside the svg
    const P = { x0: 70, y0: 24, x1: W - 24, y1: H - 54 };
    const X = (u) => P.x0 + u * (P.x1 - P.x0);
    const Y = (v) => P.y0 + (1 - v) * (P.y1 - P.y0);  // v up
    const col = (name) => R.C[name] || R.C.ink;

    let aug = 0, broken = false;

    const readout = R.ce("div");
    readout.style.cssText = "font-family:var(--font-mono);font-size:12px;color:#C8CFDA;margin-top:10px;line-height:1.55;min-height:50px";
    stage.appendChild(readout);

    const otherCat = ANCHORS.find((a) => a.id === "cat2");
    const truck = ANCHORS.find((a) => a.id === "truck");

    const draw = () => {
      R.clr(svg);
      // plane frame + faux-semantic axis hints
      svg.appendChild(R.E("rect", { x: P.x0, y: P.y0, width: P.x1 - P.x0, height: P.y1 - P.y0, fill: "rgba(120,140,200,0.05)", stroke: R.C.grid, "stroke-width": 1, rx: 6 }));
      svg.appendChild(R.TX(P.x1, P.y1 + 18, "has wheels →", { anchor: "end", size: 10, fill: R.C.dim }));
      svg.appendChild(R.TX(P.x0 - 10, P.y0 + 4, "furry ↑", { anchor: "end", size: 10, fill: R.C.dim }));
      svg.appendChild(R.TX(P.x0, 14, "embedding space — axes come to MEAN things", { anchor: "start", size: 10, fill: R.C.dim }));

      // anchors (the labeled neighborhood)
      ANCHORS.forEach((a) => {
        const c = col(a.color);
        svg.appendChild(R.E("circle", { cx: X(a.x), cy: Y(a.y), r: 7, fill: c, "fill-opacity": 0.85 }));
        svg.appendChild(R.TX(X(a.x) + 11, Y(a.y) + 4, a.label, { anchor: "start", size: 10.5, fill: c, sans: true }));
      });

      // the subject's augmented view
      const seedAngle = aug * 6.283;
      const v = viewEmbedding(SUBJECT.base, aug, broken, seedAngle);
      const cx = X(v.x), cy = Y(v.y);

      // "all views of this cat" tight cluster halo for the good encoder
      if (!broken) {
        svg.appendChild(R.E("circle", { cx: X(SUBJECT.base.x), cy: Y(SUBJECT.base.y), r: 26, fill: R.C.green, "fill-opacity": 0.10, stroke: R.C.green, "stroke-opacity": 0.4, "stroke-dasharray": "4 4", "stroke-width": 1 }));
      } else {
        // a drift trail from home to where the nuisance dragged it
        svg.appendChild(R.E("line", { x1: X(SUBJECT.base.x), y1: Y(SUBJECT.base.y), x2: cx, y2: cy, stroke: R.C.red, "stroke-width": 1.4, "stroke-dasharray": "3 3" }));
        svg.appendChild(R.E("circle", { cx: X(SUBJECT.base.x), cy: Y(SUBJECT.base.y), r: 4, fill: "none", stroke: R.C.dim, "stroke-width": 1 }));
      }

      // the moving view dot (the cat we are augmenting), violet = the subject
      svg.appendChild(R.E("circle", { cx, cy, r: 8, fill: R.C.violet, stroke: "#0b0e14", "stroke-width": 1.5 }));
      svg.appendChild(R.TX(cx, cy - 14, "augmented cat", { size: 10, fill: R.C.violet, weight: 600 }));

      // distances
      const dCat = dist(v, otherCat);
      const dTruck = dist(v, truck);
      const near = nearestClass(v);
      const nearC = col(near.color);
      const verdict = broken
        ? (near.cls === "cat"
            ? `Still nearest a <b style="color:${R.C.green}">cat</b> — push the slider further.`
            : `Now nearest the <b style="color:${nearC}">${near.label}</b> — the nuisance dragged the meaning into an unrelated class. The embedding is contaminated.`)
        : `Stays nearest its own kind — <b style="color:${R.C.green}">cat</b>. Crop it, recolor it, blur it: the meaning is unchanged, so the point barely moves. <b style="color:${R.C.green}">Invariance.</b>`;

      readout.innerHTML =
        `<b style="color:${broken ? R.C.orange : R.C.green}">${broken ? "broken encoder" : "good encoder"}</b> — ` +
        `dist to other cat <b style="color:${R.C.green}">${dCat.toFixed(2)}</b> · dist to truck <b style="color:${R.C.orange}">${dTruck.toFixed(2)}</b><br>${verdict}`;
    };

    R.slider(ctrl, { label: "crop / recolor / blur strength", min: 0, max: 1, step: 0.01, value: aug, fmt: (x) => x.toFixed(2), on: (x) => { aug = x; draw(); } });
    let toggle;
    toggle = R.btn(ctrl, "encoder: good", "primary", () => {
      broken = !broken;
      toggle.textContent = broken ? "encoder: broken" : "encoder: good";
      toggle.className = "lab-btn" + (broken ? "" : " primary");
      draw();
    });
    R.legend(stage, [[R.C.violet, "the cat we augment"], [R.C.green, "cat (its kind)"], [R.C.orange, "truck (unrelated)"], [R.C.cyan, "ball"]]);
    draw();
  }, []);

  return (
    <Lab id="embed" title="What an embedding is — and why invariance matters" setup={setup}
      note="An embedding is just a vector — a point in a space whose axes come to MEAN things (here, faux 'furriness' and 'has-wheels'). Similar things land near each other. Now the key property a good encoder needs: invariance. Crop, recolor, or blur the same cat and a GOOD encoder barely moves its point (same meaning → same point). Flip to the BROKEN encoder and drag the slider — the nuisance drags the point clean out of its cluster toward the truck. Same image, contaminated embedding. JEPA's whole job is learning the invariant version." />
  );
}
