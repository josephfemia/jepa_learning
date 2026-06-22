/* Pure logic for the Partition-Function Wall lab — why a probabilistic model
   hits a wall that an energy-based model walks around.

   A probabilistic model must output a NORMALIZED distribution: probabilities
   that sum to 1 over EVERY possible output. Computing that normalizer (the
   partition function Z) means visiting the entire output space — which grows
   exponentially as the output gets richer. An EBM just scores ONE (x, y) pair:
   no sum, no normalization. So its cost to score one answer is flat at 1.
   No DOM, no React. */

/* Number of candidate outcomes at a given resolution `level`. The output space
   subdivides exponentially: base ** level (base 3 → 3, 9, 27, 81, …). */
export function outcomeCount(level, base = 3) {
  return base ** level;
}

/* Cost (number of evaluations) for a PROBABILISTIC model to score ONE answer:
   it must visit every outcome to compute the normalizer. = outcomeCount. */
export function probCost(level, base = 3) {
  return outcomeCount(level, base);
}

/* Cost for an ENERGY-based model to score one answer: a single forward pass on
   the one (x, y) pair. Flat at 1 — it never integrates over the output space. */
export function energyCost() {
  return 1;
}

/* Compact human-readable count: "729", "1.2k", "3.4M", "5.9e7". */
export function fmtCount(n) {
  if (!isFinite(n)) return "∞";
  if (n < 1000) return String(Math.round(n));
  if (n < 1e6) {
    const k = n / 1e3;
    return (k < 10 ? k.toFixed(1) : Math.round(k)) + "k";
  }
  if (n < 1e7) {
    const m = n / 1e6;
    return m.toFixed(1) + "M";
  }
  // ten million and up: scientific notation, one significant decimal
  const exp = Math.floor(Math.log10(n));
  const mant = n / 10 ** exp;
  return mant.toFixed(1) + "e" + exp;
}
