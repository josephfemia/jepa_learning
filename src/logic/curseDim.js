/* Pure model for the "curse of dimensionality for negatives" lab.
   Contrastive learning pushes energy UP at sampled negatives. To keep energy
   high *everywhere*, the negatives have to COVER the space — but the number of
   distinct regions grows exponentially with dimension D. For a fixed budget of
   N negatives, coverage craters as D rises: you'd need exponentially many
   negatives to fill the space. That's why JEPA's lineage runs through
   regularizers (VICReg/SIGReg constrain statistics) instead of InfoNCE.
   Illustrative, not a measurement — `g` cells per axis is a schematic grid. */

/* Number of distinct regions: g cells per axis, D axes → g^D. */
export function cellCount(D, g = 4) {
  return g ** D;
}

/* Fraction of the space within reach of at least one of N negatives.
   Toss N negatives uniformly into cellCount cells; coverage is the expected
   fraction of cells hit = 1 - (1 - 1/cells)^N. Clamped to [0,1]. */
export function coverage(D, N, g = 4) {
  const cells = cellCount(D, g);
  const cov = 1 - (1 - 1 / cells) ** N;
  return cov < 0 ? 0 : cov > 1 ? 1 : cov;
}

/* How many negatives you'd need to reach `target` coverage at dimension D.
   Inverts the coverage formula. Explodes (exponentially) with D. */
export function negativesNeeded(D, target = 0.9, g = 4) {
  const cells = cellCount(D, g);
  return Math.ceil(Math.log(1 - target) / Math.log(1 - 1 / cells));
}

/* Compact human-readable count ("729", "1.2k", "3.4M", "5.9e7"). */
export function fmtCount(n) {
  if (!isFinite(n)) return "∞";
  if (n < 1000) return String(Math.round(n));
  if (n < 1e6) return (n / 1e3).toFixed(n < 1e4 ? 1 : 0) + "k";
  if (n < 1e7) return (n / 1e6).toFixed(1) + "M";
  return n.toExponential(1).replace("+", "");
}
