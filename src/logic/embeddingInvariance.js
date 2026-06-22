/* Pure model for the "what is an embedding / invariance" lab.
   An embedding is a point in a space whose axes come to MEAN things. A GOOD
   encoder is INVARIANT to nuisances: crop/recolor/blur the same cat and its
   embedding barely moves (same meaning → same point). A BROKEN encoder lets the
   nuisance drag the point — here, toward an unrelated class. Illustrative, not a
   measurement: positions are in a unit square [0,1]². */

/* The labeled anchors that define the semantic plane. Colors are stored as
   palette NAMES (resolved against R.C in the component) per project convention. */
export const ANCHORS = [
  { id: "cat1", label: "cat", cls: "cat", color: "green", x: 0.30, y: 0.70 },
  { id: "cat2", label: "cat", cls: "cat", color: "green", x: 0.40, y: 0.80 },
  { id: "truck", label: "truck", cls: "truck", color: "orange", x: 0.82, y: 0.30 },
  { id: "ball", label: "ball", cls: "ball", color: "cyan", x: 0.68, y: 0.74 },
];

/* The item we manipulate: a cat, living in the cat cluster. */
export const SUBJECT = { id: "subj", cls: "cat", base: { x: 0.30, y: 0.70 } };

/* A nuisance "drift target" the broken encoder slides the point toward: the
   truck, an unrelated class. Picked so a broken encoder visibly leaves its kind. */
export const DRIFT_TARGET = { x: 0.82, y: 0.30 };

/* Where the augmented view of the subject lands.
   - GOOD encoder: invariant — a tiny deterministic jitter around basePos that does
     NOT grow with augStrength (the meaning is unchanged, so the point barely moves).
   - BROKEN encoder: the nuisance contaminates the embedding — a large displacement
     toward DRIFT_TARGET that scales linearly with augStrength.
   seedAngle makes the good-encoder jitter deterministic (no RNG needed) and lets the
   point wiggle a touch as the slider moves, without ever leaving the cluster. */
export function viewEmbedding(basePos, augStrength, broken, seedAngle = 0) {
  const a = Math.max(0, Math.min(1, augStrength));
  if (!broken) {
    // tiny, bounded jitter — independent of augStrength magnitude
    const r = 0.012;
    return {
      x: basePos.x + r * Math.cos(seedAngle * 3.1),
      y: basePos.y + r * Math.sin(seedAngle * 2.3),
    };
  }
  // broken: drift toward the unrelated class, growing with augStrength
  return {
    x: basePos.x + (DRIFT_TARGET.x - basePos.x) * a,
    y: basePos.y + (DRIFT_TARGET.y - basePos.y) * a,
  };
}

/* Euclidean distance between two {x,y} points. */
export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/* How far the augmented view sits from its original (base) position. */
export function displacement(basePos, augStrength, broken, seedAngle = 0) {
  return dist(basePos, viewEmbedding(basePos, augStrength, broken, seedAngle));
}

/* Which labeled anchor is nearest a given position. Returns the anchor object. */
export function nearestClass(pos, anchors = ANCHORS) {
  let best = anchors[0], bestD = Infinity;
  for (const a of anchors) {
    const d = dist(pos, a);
    if (d < bestD) { bestD = d; best = a; }
  }
  return best;
}
