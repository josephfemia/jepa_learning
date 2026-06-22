/* Pure model for the Stability Dial — the four answers to "train a world model
   end-to-end without collapse." Each mode trades training STABILITY against
   FEATURE QUALITY (the task ceiling the features can reach):

   - none      end-to-end, no regularizer → collapses (low stability, low quality)
   - frozen    freeze the encoder → stable but capped by inherited features
   - multiterm 7-term VICReg/PLDM → powerful but fragile / tuning-heavy
   - sigreg    LeWM: end-to-end + SIGReg → the synthesis, both high

   The aha: only `sigreg` lands top-right (both meters high) — every other mode
   forces you to pick one. No DOM, no React; values are illustrative, in [0,1]. */

export const MODES = ["none", "frozen", "multiterm", "sigreg"];

const DIAL = {
  none:      { stability: 0.08, quality: 0.20 },
  frozen:    { stability: 0.95, quality: 0.55 },
  multiterm: { stability: 0.60, quality: 0.70 },
  sigreg:    { stability: 0.90, quality: 0.88 },
};

const LABELS = {
  none:      "end-to-end · no reg",
  frozen:    "frozen encoder",
  multiterm: "multi-term (PLDM)",
  sigreg:    "SIGReg (LeWM)",
};

/* {stability, quality} in [0,1] for a mode (falls back to the collapsing case). */
export function dial(mode) {
  const d = DIAL[mode] || DIAL.none;
  return { stability: d.stability, quality: d.quality };
}

/* Short human label for a mode. */
export function label(mode) {
  return LABELS[mode] || mode;
}
