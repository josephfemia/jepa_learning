# JEPA Course — Multi-Lens Review & Implementation Backlog

**Date:** 2026-06-22 · **Branch:** `reskin/robotic-learning-style`
**Reviewed by:** 5 parallel lenses — content/structure, entry-level ML engineer, senior researcher (fact-check), pedagogy/narrative, interactives/visuals.
**Verdict up front:** The course is *strong* — accurate, well-hedged, consistent voice, good labs. The issues are mostly **seams** (a recent `depth2` split left stale docs + a numbering mismatch), one **factual error**, and a single dominant **pedagogical anti-pattern**. None are foundational.

---

## 0. The one theme that matters most

> **Almost every flagship lab is preceded by an Instructor aside or prose block that states the conclusion the lab was built to let the reader *discover*.**

Pattern today: **Instructor (tells answer) → Lab (confirms)**.
3b1b/Karpathy target: **GuessGate (predict) → Lab (discover) → Instructor (consolidate/name)**.

This single reorder rule, applied to CollapseLab, PixelVsLatentLab, VICRegIsolatorLab, EnergyLandscapeLab, WorldModelLandscape, and LatentPlanningLab, would do more for the "you arrive at the conclusion naturally" goal than any other change. Most fixes are *reorder + add one GuessGate*, not new prose.

---

## 1. Style match (robotic_learning) — DONE, with optional ports

- **Visual reskin is complete.** `src/index.css` mirrors robotic_learning's `styles.css`: same cobalt (`#2742CC`) / signal-orange (`#E8590C`) tokens, same `.lab` / `.callout` / `.figure` / sidebar / pager component classes, same Archivo/Source Serif 4/IBM Plex Mono type. Build clean (296 KB).
- **Features robotic_learning has that JEPA lacks** (optional, not style gaps):
  - **KaTeX math rendering** — JEPA's math is plain text in `MathAppendix`; rendered math would raise polish. (MED, optional)
  - **xref auto cross-linking** (`useXref`) — clickable inline cross-references between sections. (LOW-MED, optional)
  - **Review/quiz deck** — robotic_learning aggregates all quizzes into a shuffled retrieval deck. JEPA has per-section checks only. (LOW, optional — strong spaced-retrieval payoff if added)

---

## 2. P0 — Correctness (fix directly, per your call)

| # | Location | Issue | Fix | Source |
|---|----------|-------|-----|--------|
| P0-1 | §03 Architecture (~`JepaCourse.jsx:1351`) **and** `README.md:107` | **WRONG:** "BYOL showed a plain momentum encoder can substitute for EMA." In BYOL the momentum encoder **is** the EMA — same mechanism. Category error. | Swap attribution to **SimSiam** (Chen & He, CVPR 2021): it *removed* the momentum/EMA encoder and kept only **stop-gradient + predictor**, showing the asymmetry (not EMA) does the work. SimSiam is already in the footer. | BYOL (Grill 2020); SimSiam (Chen & He 2021) |
| P0-2 | §03; also §04 GuessGate (that one is fine) | **OVERCLAIM:** "stop-gradient is… the actual anti-collapse lever." Why SG prevents collapse is *not settled*. | Dial down to match §04's existing hedge ("why it helps still isn't fully understood"). | SimSiam; arXiv 2203.16262 |
| P0-3 | Sidebar vs lecture headings | **Numbering mismatch:** sidebar derives `01–11` (`JepaCourse.jsx:1001`, `i+1`), but headings use `01,02,03,04,04½,04¾,05…09`. Same screen shows two numbers for one lecture. | Pick one scheme. Recommend dropping the ½/¾ gimmick → number all 11 lectures `1–11` in both places. | — |
| P0-4 | `README.md`, `CLAUDE.md`, Start page (`~1132`) | Docs say **"10 lectures" + one "depth"**; code has **11 + `depth2`**. Start blurb says "10 lectures." | Update README arc, CLAUDE lecture list, and Start blurb to 11. | — |

**Accuracy that VERIFIED clean** (no action, documented for confidence): I-JEPA (16 A100s/<72h, ViT-H/14, multi-block scales), V-JEPA 2 (16s/action vs 4min Cosmos ≈15×, 62h DROID, 7-DoF, ~300M predictor, ViT-g ~1B, L1 energy, CEM+MPC), VICReg (λ=μ=25, ν=1), LeJEPA/SIGReg (isotropic Gaussian, Cramér–Wold, Epps–Pulley), LeWorldModel (ViT-Tiny ~5M, ~200× fewer tokens, 48× faster, +18% Push-T, Two-Room honesty), AMI Labs facts. The numeric/citation discipline is excellent. Minor optional tightenings: V-JEPA2 paper itself says "16×" in places (course's ~15× is the correct arithmetic); PLDM "seven terms" vs "six coefficients"; AMI raise was $1.03B at $3.5B pre (~Mar 2026).

---

## 3. P1 — High-impact pedagogy reorders (the core theme)

Each is **reorder + one GuessGate**; lab logic already exists.

| # | Location | Move |
|---|----------|------|
| P1-1 | §01 The Idea | Add GuessGate at top (before the Instructor reveal): *"A model watches a ball roll toward a table edge. To learn well, what should it try hardest to get right?"* (A) every pixel, (B) roughly where it is + that it'll fall — the gist ✓, (C) exact RGB of center pixel. Then let Instructor confirm. |
| P1-2 | §04 Collapse | The "here's the catch" Instructor (`~1373`) spoils CollapseLab. Replace with GuessGate: *"A JEPA is graded on predicting its own learned targets. What's the laziest way to make that loss zero?"* → (B) map every input to the same embedding ✓. Move the rich "you write your own exam" aside to *after* the lab. |
| P1-3 | §04 "The 2025 punchline" Aside (`~1382`) | Fires 3 lectures early — gives away SIGReg/LeJEPA. Soften to a forward tease ("one principled term — we'll earn it in 04¾") without the answer. |
| P1-4 | §02 Why Latent | "See it for yourself" follows the full conclusion. Add GuessGate before `PixelVsLatentLab`: *"You force a model to reconstruct every pixel of TV static. Where does most effort go?"* → (B) chasing unpredictable noise ✓. Then name "reconstruction tax" *after*. |
| P1-5 | §03 Architecture | Opens into diagram+lab before any problem motivates asymmetry. Add opening GuessGate: *"Why not use a second copy of the same trainable encoder for targets?"* → (B) both could collude → all-equal embeddings, trivial loss ✓. Foreshadows collapse. (Also wire `build` into `SECTION_CHECK` — it currently has no self-test.) |
| P1-6 | §07 Models | Planning Instructor fully explains CEM *before* the GuessGate + lab that ask the same thing. Reorder: **GuessGate → LatentPlanningLab → Instructor (mechanism)**. |
| P1-7 | §08 World Models | "Three ways to not collapse" Instructor (`~1710`) pre-sorts all 4 models + names the winner before WorldModelLandscape. Replace with tension-only GuessGate; move verdict after the explorer. |
| P1-8 | §depth | VICReg code comments ("this kills COMPLETE collapse") spoil VICRegIsolatorLab. Strip the labels OR put the isolator lab first, annotated code after. |
| P1-9 | §depth / §depth2 | No Recall GuessGate entering the two hardest lectures (every other later lecture has one). Add one at top of `depth` (restate collapse) — also gives them sidebar checkmarks. |

---

## 4. P1/P2 — Entry-level bridges (fix directly; low-risk additive prose)

Top 5 (highest leverage for "basic ML → understands this"):

1. **Define ViT / patches** (HIGH) — §03 says "it's always a Vision Transformer"; ViT/patches/tokens are never explained yet gate §03, MaskingLab, §04½, the appendix. Add one Instructor: *image → grid of patch-vectors → one vector per patch; you don't need transformer internals.*
2. **Define self-supervised learning** (HIGH) — §01 opens on "every self-supervised model…" without defining the paradigm the whole course lives in. One sentence: *no human labels; the data hides part of itself.*
3. **Make the central "aha" explicit** (HIGH) — §02 "the encoder can make it abstract and smooth — so" compresses the crux. Spell out *why a learned target lets the encoder drop detail but fixed pixels don't.*
4. **Define negatives / augmentations** (MED) — §05 sells "no negatives" as a win but never says what a negative/augmentation is. Add to ApproachCompare contrastive panel.
5. **Prerequisites box on Start page + surface the Glossary early** (MED) — Glossary is excellent but stranded in §09 Recap; a reader hitting "EBM" in §02 doesn't know it exists. Add a "what you should know" box + early glossary pointer. Add 4 missing glossary entries: self-supervised, ViT/patches, negatives & augmentations, linear probe.

Secondary bridges (MED/LOW, additive one-liners): `stop_gradient` gloss at first code appearance (§02); EMA-as-formula intuition (§03); concrete `z` micro-example + "min over z = optimization finds it" (§02); dimensional-collapse concrete picture ("1000 of 1024 dims always ~equal") (§04); covariance-matrix one-liner before `vicreg.py` (§04½); linear-probe/k-NN "why it works" gloss (§04½); CEM mechanism "keep best 10%, recenter, shrink" (§07); 7-DoF / ViT-size-ladder / "/14" glosses (§07); InfoNCE one-liner (§04½); replanning "why only first action" (§08).

---

## 5. P2 — Interactives: upgrade existing (more 3b1b)

| Widget | Verdict | Highest-impact upgrade | Sev |
|--------|---------|------------------------|-----|
| **EnergyLandscapeLab** | Partly — **omits `min over z`**, the marquee idea its own appendix depends on | Add a **`z` slider** that reveals **multiple valleys**; marker hops between valid futures; dashed line tracks `min_z E`; optional β temperature for soft→hard min. Repurpose the inert "data position" slider as `z`. | HIGH |
| **MaskingLab** | Partly — predicted patches "turn green" → **looks like reconstruction**, contradicting the lesson | On done, fill predicted patches with an **abstract embedding glyph** (vector/barcode swatch), show predicted-vs-target embedding *distance*. | MED |
| **CollapseLab** | Partly — qualitative only | Draw **live variance + off-diagonal-spread bars** (both already computed in `collapseSim.js`) crashing to ~0 as collapse sets in. ~20 lines. | MED |
| **PixelVsLatentLab** | Partly — two independent bars, not a **budget** | Make it a **single 100% stacked bar** (fixed capacity) so detail visibly *eats* the signal share — the zero-sum "tax" is the point. | MED |
| **LatentPlanningLab** | Partly — best animation, but the 15× is only *told* | Add **"latent score (instant) vs pixel render (slow)" cost meter** so the 15× is *seen*; optionally expose CEM σ-shrink across iterations. | MED |
| **VICRegIsolatorLab** | Works | Add the same numeric variance/off-diagonal readout as CollapseLab. | LOW |
| **MaskingDifficultyLab** | Works | `aspect` slider doesn't affect the score (feels inert) — fold a variety term in or relabel as "shape variety (anti-cheat)" with its own indicator. | LOW |

(ArchitectureDiagram, HJepaDiagram, ApproachCompare, ModelExplorer, WorldModelLandscape, TwoStageTraining, DiscoveryTimeline are correct as static/navigator components — no change needed, except DiscoveryTimeline could gate Idea behind a second click for micro-prediction.)

---

## 6. P2 — Interactives: NEW (spec for triage)

Ranked. **A and B are the highest-leverage new visuals in the whole review** — they teach the two hardest ideas, currently prose/number only.

**A. ⭐ "min over z" multimodal energy explorer** (HIGH, easy–med)
Concept: `F(x,y) = min_z E(x,y,z)` — one context, several valid futures, no partition function. Drag a **`z` slider**; energy curve over `y` has **2–3 valleys** ("ball goes left / right / stops"); marker hops to a different valley; dashed line = `min_z`. Aha: *one context → many low-energy futures, and I never needed a probability distribution.* Extends `energyLandscape.js` + existing SVG. (Could replace/augment EnergyLandscapeLab — see §5.)

**B. ⭐ EMA teacher–student lag visualizer** (HIGH, easy)
Concept: τ≈0.996, teacher lags student by ~0.4%/step; the lag is what stops collusion. **τ slider** + step/auto-play; student dot (cyan) jumps each step, teacher dot (violet) = EMA shadow. Crank τ→0: teacher snaps onto student → **both collapse to a point** (lockstep collusion). Aha: *the lag makes the target un-gameable.* ~60 lines.

**C. H-JEPA horizon explorer** (MED, med) — promote the static diagram. **Horizon slider** + detailed-vs-abstract toggle; detailed-level error cloud balloons with horizon while abstract stays tight. Aha: *plan where the future is still predictable.*

**D. Contrastive push-pull vs regularize** (MED, med) — toggle modes + batch-size slider. Contrastive: pull-springs + repulsion arrows, shrink batch → cloud gets noisy/unstable. Non-contrastive: springs vanish, one "spread+decorrelate" field tidies regardless of batch. Aha: *contrastive needs many negatives to be stable; regularizing needs none.* Reuses `collapseSim.js` cloud.

**E. CEM convergence** (MED, easy) — standalone or fold into LatentPlanningLab. Step button + #samples/elite-fraction sliders; sampling ellipse **shrinks and recenters** over iterations. Aha: *guess, keep the best guesses, guess again near them.* `planCEM` already computes it.

**F. Predictor-in-latent vs pixel-decoder** (MED, med) — toggle "reconstruct pixels" vs "predict embedding"; pixel path fights noise (high error), latent path nails the meaning (distance→0). Could merge with PixelVsLatentLab/MaskingLab.

---

## 7. P3 — Polish (content/structure)

- De-duplicate the **energy-based-model setup** explained near-fully twice (§02 `~1299` and top of §depth `~1417`). In depth, open with "you met this in §02; here's the precise version" and keep only the `min_z` formalization.
- Trim one of **§01's three near-identical thesis restatements** (the `~1267` one-sentence Aside duplicates the Instructor above it).
- Add **transition lines** at two visible seams: §05 compare → §06 history; §07 models → §08 worldmodels (sharpen "the family" vs "the idea + collapse-in-world-models").
- `depth2` eval section sits oddly between SIGReg and the math appendix — consider leading depth2 with eval (concrete) before SIGReg (abstract).
- Start "~40 min" looks optimistic given density + labs → "~45–60 min."
- §01: pair the "what's an embedding" aside with a tiny static `.figure` SVG (cat-vec ≈ cat-vec, far from truck-vec) for dual coding.
- §06 DiscoveryTimeline: reveal Problem on click 1, gate Idea behind click 2 (data already separates them).
- Recap: make Q1 a *generative* recall ("in one sentence, what single choice defines JEPA?") rather than multiple choice.

---

## 8. Proposed Phase-B implementation batches

Suggested order (each is a commit-sized batch; build+visual check after each):

1. **Batch 1 — Correctness** (P0-1…4): BYOL→SimSiam fix + README, hedge SG, fix numbering, fix lecture count. *Low risk, high trust.*
2. **Batch 2 — Entry-level bridges** (P1/P2 §4): ViT, self-supervised, the §02 aha, negatives, prereq box + glossary entries, secondary one-liners. *Additive, low risk.*
3. **Batch 3 — Pedagogy reorders** (P1-1…9): the GuessGate→Lab→Instructor rule across the flagship labs + SECTION_CHECK wiring. *Medium risk — touches flow; verify each.*
4. **Batch 4 — Existing-lab upgrades** (§5): EnergyLandscape `z`/multivalley, CollapseLab + VICRegIsolator meters, PixelVsLatent budget bar, MaskingLab embedding glyph, LatentPlanning cost meter. *Medium.*
5. **Batch 5 — New interactives** (§6, the approved subset): A & B first.
6. **Batch 6 — Polish** (§7) + optional ports (KaTeX/xref/ReviewDeck) if wanted.

**Open triage questions for you:** which new interactives (A–F) to build; whether to do all pedagogy reorders or a subset; whether to keep the ½/¾ numbering or renumber 1–11; whether to port any robotic_learning features (KaTeX/xref/ReviewDeck).
