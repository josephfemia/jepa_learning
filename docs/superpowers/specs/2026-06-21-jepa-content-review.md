# JEPA Course — Multi-Perspective Content Review

**Date:** 2026-06-21
**Scope:** Tasks 4–9 of the reskin engagement — review content + interactives from four lenses
(entry-level ML engineer, senior researcher, pedagogy/voice, interactive design) and produce a
prioritized, actionable improvement queue.
**Method:** Four independent reviewers read `src/JepaCourse.jsx`, `src/data.js`, `src/logic.js`,
and `PROJECT_BRIEF.md`. Findings below are deduplicated and ranked. **Convergence** (≥2 reviewers
flagging the same thing) is called out — it's the strongest signal.

---

## Executive summary

The course is already **top-tier** in its best moments (§01 The Idea, §04 Collapse, the
CollapseLab / MaskingLab / LatentPlanningLab / Checkpoint). Its weaknesses cluster in three places:

1. **Technical machinery introduced without an intuition bridge** — EBM, stop-gradient, EMA,
   VICReg's three terms, Cramér–Wold, MPC/CEM, linear probe, isotropic-Gaussian optimality. The
   Karpathy voice is present but under-deployed exactly where it's most needed (the math sections).
2. **A handful of claims that overstate or conflate** — VICReg coefficients as universal,
   stop-gradient ≡ EMA, "provably optimal" without its assumptions, the 15×/48× speedups without
   their apples-to-oranges baseline caveat.
3. **Static/reference interactives** that tell rather than let you discover — ArchitectureDiagram,
   ContrastiveVsRegularized, MaskingStrategyViz, and the three tab-switchers (ApproachCompare,
   ModelExplorer, WorldModelLandscape).

The §04½ "Under the Hood" section is simultaneously the strongest *content* and the worst
*cognitive-load* offender — flagged by 3 of 4 reviewers as needing a split + more bridges.

---

## Part 1 — Accuracy & rigor (senior researcher lens)

Ranked by impact. Severity: **wrong** (must fix) / **imprecise** (refine) / **nuance** (add).

| # | Location | Issue | Fix | Severity |
|---|----------|-------|-----|----------|
| A1 | §depth, LeJEPA | "isotropic Gaussian is the unique distribution minimizing worst-case downstream risk" stated unconditionally | Hedge: holds **for linear downstream tasks with Gaussian priors on task params**; not universal for nonlinear fine-tuning | imprecise (high) |
| A2 | §build / ArchitectureDiagram | stop-gradient and EMA presented as one defense | Separate them: **stop-gradient** breaks the learning-signal symmetry; **EMA** is the slow weight-update rule. BYOL showed momentum can stand in for EMA → the core defense is the *asymmetry* | imprecise (med) |
| A3 | §depth, ContrastiveVsRegularized | "in high dimensions you'd need an exponential number of negatives" dismisses modern contrastive (MoCo/DINO queues) | Reframe the real reason JEPA chose regularization: **principled, proven anti-collapse vs empirical negatives that need tuning** — not that contrastive is simply "expensive" | imprecise (med) |
| A3b | §depth | **Missing** the InfoNCE / mutual-information-bound connection — promised "researcher depth" | Add 2–3 sentences: both families bound MI between context & target; contrastive estimates it (InfoNCE), regularized enforces geometric constraints that maximize it under a Gaussian proxy | nuance (high) |
| A4 | §depth, VICReg | λ=μ=25, ν=1 presented as fixed/universal | Note these are **ImageNet values**; coefficients depend on batch size, embedding dim, dataset (the §08 PLDM "7-term coefficient search" line already implies this — make them consistent) | imprecise (med) |
| A5 | §models / data.js | 15× (vs Cosmos) and 48× (vs DINO-WM) speedups lack baseline conditions | Add one clause: speedup reflects **latent-embedding scoring vs pixel rendering**, not raw model speed; same CEM search both sides | imprecise (med) |
| A6 | §depth, SIGReg | "linear in dimension and batch size" hides the projection count P | State cost as **O(P · N)** with P ≈ 100–256 random projections; Epps–Pulley itself is the cheap part | nuance (low) |
| A7 | §depth, masking | "masked at the output, not input" stated without the *why* | Add: target encoder sees the **full** image → rich targets; selection happens on its output tokens, which is what forces meaningful spatial structure | nuance (med) |
| A8 | §collapse | complete vs dimensional collapse phrased as if complete is "worst" | Both are failures; complete is the *simpler* shortcut, dimensional is *subtler/harder to detect* (motivates SIGReg) | nuance (low) |
| A9 | §worldmodels, LeWM | Two-Room underperformance noted but unexplained | Add mechanism: in low-D the true distribution is tighter than 𝒩(0,I), so the isotropic prior **adds noise** → SIGReg suits high-D | nuance (low) |
| A10 | §history / §06 | H-JEPA shown but not explained (joint training? subgoal = learned target?) | Add a short paragraph on the two-timescale training + subgoal interaction (also an entry-level gap, E13) | nuance (med) |
| A11 | §models, data.js | V-JEPA 2-AC "<62h" and stage-2 details should cite arXiv 2506.09985 | Add inline source note | factual (low) |
| A12 | §collapse | EMA's anti-collapse role overstated as understood | Note BYOL's success was "surprising"; the mechanism preventing dimensional collapse under EMA-only is **not fully understood** | nuance (med) |

---

## Part 2 — Bridges for an entry-level ML engineer

These are *additive* 1–3 sentence intuition asides (use the existing `Instructor` / `Aside`
components) placed **before** the machinery. Severity = how much it blocks comprehension.

| # | Concept (location) | Bridge to add | Severity |
|---|--------------------|---------------|----------|
| E1 | **EBM** (§why) | "Not a probability over all y (which you'd have to normalize — intractable). Just one number: how compatible are these two things? Low = a valley. You shape a landscape, never normalize." | **blocker** |
| E2 | **MPC + CEM** (§models) | Spell out the 5 steps: sample action sequences → roll out through the predictor → score by distance to goal → keep elites → refit & resample → execute first action, replan. "You're not training; you're *searching the learned model*." | **blocker** |
| E3 | **stop-gradient** (§build) | "A 'do-not-backprop' wall. Without it, student and teacher could drift together to a trivial solution. Freezing the teacher's learning signal forces an asymmetric game." | friction |
| E4 | **EMA τ=0.996** (§build) | "A slowly-updating copy: teacher keeps 99.6% of its old weights, absorbs 0.4% of the student each step. Slow on purpose — if it moved in lockstep they could collapse together." | friction |
| E5 | **VICReg's 3 terms** (§depth) | Map each term to the failure it kills: variance→complete collapse, covariance→dimensional collapse, invariance→pulls two views together. (Convergent with interactive proposal I2.) | friction |
| E6 | **Cramér–Wold** (§depth) | "If every 1-D shadow of a high-D cloud is a bell curve, the cloud is Gaussian. SIGReg checks a few random shadows cheaply instead of the full density." | friction |
| E7 | **linear probe** (§depth) | "Freeze the features, train only a linear layer. Tests whether the info is *linearly accessible* — a strict, honest measure of representation quality that fine-tuning would mask." | friction |
| E8 | **isotropic Gaussian = good** (§depth) | "Bunched in a corner = wasted space, low entropy. Spread out & uncorrelated = maximal info per dimension. SIGReg pushes toward that." | friction |
| E9 | **frozen vs end-to-end** (§worldmodels) | "Frozen = safe but stuck with inherited features. End-to-end = powerful but collapse-prone. LeWM's claim: SIGReg gives you end-to-end *without* the fragility." | friction |
| E10 | **contrastive (InfoNCE) mechanics** (§depth) | "Sample negatives, push their energy up to keep the valley narrow. Regularized methods never see negatives — they constrain statistics instead." | friction |
| E11 | **two-stage V-JEPA 2** (§models) | "Stage 1: watch 1M h, learn what happens (encoder+predictor train). Stage 2: freeze encoder, train a new head taking state+action→next state. Freeze so the new head can't collapse everything." | friction |
| E12 | **six-module agent** (§history) | Brief on how the modules interact (actor proposes → world model predicts → cost scores → gradients flow back); JEPA = the world-model module. | nice |
| E13 | **H-JEPA internals** (§history) | (see A10) two timescales, subgoals handed down. | nice |
| E14 | **z: two roles** (§why, §models) | Clarify z-as-residual-uncertainty (§why) vs z-as-action (§models) are different roles; thread the callback. (Convergent with pedagogy P3.) | friction |

---

## Part 3 — Pedagogy & voice (Karpathy / 3b1b / Welch Labs bar)

**Preserve:** the problem→idea cadence of DiscoveryTimeline; the §04 "writes its own exam" Instructor
(gold standard); color coding; CollapseLab & LatentPlanningLab as discovery tools.

Ranked fixes:

| # | Location | Issue | Fix |
|---|----------|-------|-----|
| P1 | §01→§02 | Collapse is *imported*, not *earned* | Add a predict-first GuessGate before/at PixelVsLatentLab: "Train a model to predict embeddings of what you hid — what's the laziest solution?" → makes the collapse problem inevitable |
| P2 | §depth | Cognitive overload — EBM + 2 approaches + VICReg + masking + SIGReg + eval in one section | **Split** into §04½ (EBM + contrastive-vs-regularized + VICReg) and §04¾ (SIGReg + evaluation + reading checklist). Convergent with A-section density notes. |
| P3 | §why & §models | z introduced then abandoned ~3000 words until it reappears as an action | Add a one-line callback in §02 ("we'll come back to z when we plan") and in §07 ("remember z? now it's the action"). Convergent with E14. |
| P4 | §depth, VICReg prose | Voice drifts to terse/textbook right where it's hardest | Rewrite the hinge explanation in-voice: "here's a subtle detail that trips up re-implementers: it's a *hinge*, not a penalty — once a dim is spread enough, leave it alone." |
| P5 | §build | EMA's "why" stated, not discovered | Instructor before ArchitectureDiagram: "if both encoders learn, they could collude → zero loss, zero learning. How do you break the symmetry?" then reveal EMA. |
| P6 | §models | ModelExplorer tabs are isolated islands; the problem→solution arc is lost | Add a progression timeline above the tabs (2023→2026, "what each one needed that the last lacked"). Convergent with interactive I-existing assessment. |
| P7 | §compare | LLM contrast asserted, not earned | Reuse the ball example: "LLM predicts next token in data space, error compounds; JEPA predicts state in abstract space where physics is stable — which generalizes further?" |
| P8 | §models ordering | CodeBlockInline (CEM) shown *before* the learner plays LatentPlanningLab | Reorder: play first, *then* show "here's what you just did, as code." Intuition before formalism. |
| P9 | §03 | No predict-first prompt after MaskingLab | Add GuessGate: "why is a large target block better than a single scattered pixel?" |
| P10 | §07→§08 | Jump from 2D planning toy to "LeWM matters" lacks motivation | Bridge: "the lab was 2D; real LeWM makes 192-dim tokens from robot video; training that from pixels without defenses would die; LeJEPA proved the fix; here's what it buys." |
| P11 | §09 | 40-line i_jepa.py offered cold, no walkthrough | Add a toggle/inline Instructor walkthrough of the collapse-prevention + masking lines |
| P12 | mid-course | "predict the representation" through-line weakens §05–§07 | One-line reminders at the top of §05 and §07 tying back to the thesis |

---

## Part 4 — Interactives (3b1b standard: manipulate → see consequence → understand)

### 4a. Existing — assessment

| Component | Verdict | Action |
|-----------|---------|--------|
| MaskingLab, CollapseLab, LatentPlanningLab, Checkpoint | ⭐⭐⭐⭐⭐ gold-standard | preserve; only restyle to new toolkit |
| PixelVsLatentLab | ⭐⭐⭐⭐ clear but static | optional: stacked-area capacity breakdown (I3) |
| DiscoveryTimeline | ⭐⭐⭐ good framing, minimal interaction | add "guess the next problem" gate |
| ArchitectureDiagram | ⭐⭐⭐ static schematic | **animate**: EMA update flowing, toggle stop-gradient on/off (I4) |
| ContrastiveVsRegularized | ⭐⭐⭐ before/after only | **make interactive**: drag data point, adjust contrastive push / regularizer strength, watch landscape morph (I-energy) |
| MaskingStrategyViz | ⭐⭐⭐ resample only | add scale/aspect/count sliders + task-difficulty meter (I6) |
| ApproachCompare, ModelExplorer, WorldModelLandscape, TwoStageTraining | ⭐⭐ reference tab-switchers | acceptable as reference; lift ModelExplorer with the §07 timeline (P6) |

### 4b. New interactive proposals — ranked

**Tier 1 — unlock core understanding**
- **I-energy · Energy Landscape Explorer** (§depth) — replace ContrastiveVsRegularized. Drag the data
  point; in contrastive mode add negatives and watch them get pushed up (valley narrows); in
  regularized mode a slider flattens the landscape. *The* central JEPA abstraction made tactile.
  Canvas, parametric curves. **Low effort, very high payoff.**
- **I2 · VICReg Term Isolator** (§depth) — three checkboxes (invariance/variance/covariance) wired to a
  collapse-sim canvas. Turn off variance → complete collapse; off covariance → dimensional collapse.
  Answers "why these three terms?" by killing the space. Reuses CollapseLab logic. **Low–med effort,
  very high payoff.** (Directly serves E5.)
- **I1 · Collapse Dynamics over time** (§collapse) — info-content vs training-step line; toggle each
  defense and watch the *rate* of collapse. Shows defenses as rate-limiters. Med effort.

**Tier 2 — deepen existing intuitions**
- **I5 · Latent Geometry Inspector** (§depth) — scatter + marginal histograms; switch between isotropic /
  collapsed / dimensional / correlated. "What should embeddings *look* like?" Med effort.
- **I6 · Masking Difficulty Dial** (§depth) — scale/aspect/count sliders + semantic-vs-texture meter.
  Demystifies the I-JEPA numbers. Low–med.
- **I4 · EMA Teacher Visualizer** (§build) — student random-walk + target under τ∈[0.90,0.999]; shows why
  0.996. Low. (Serves E4, P5.)

**Tier 3 — reference/research**
- **I3 · Reconstruction-Tax stacked area** (§why) — enrich PixelVsLatentLab with semantic/texture/noise
  bands. Low.
- **I8 · Action-Conditioned Playground** (§models) — action buttons shape latent trajectories; could merge
  into LatentPlanningLab. Med.
- **I9 · Evaluation Protocol Explorer** (§depth) — bars for linear/attentive/low-shot/fine-tune vs data
  budget. Low–med. (Serves E7.)
- **I10 · SIGReg Gaussianity Tester** (§depth) — 8 random projections → histograms → Gaussianity score as
  you morph the distribution. Med. (Serves E6.)

---

## Part 5 — Recommended build queue (cross-cutting, post-reskin)

Ordered by (impact × convergence ÷ effort). Each line folds together findings from multiple parts.

1. **Split §depth into §04½ + §04¾** and thread intuition bridges E1, E5, E6, E7, E8, E10 into them
   (P2 + A3b). Highest convergence in the whole review.
2. **Energy Landscape Explorer (I-energy)** replacing ContrastiveVsRegularized — Tier-1 interactive +
   fixes A3 + serves E1/E10.
3. **VICReg Term Isolator (I2)** — Tier-1 interactive + serves E5 + makes A4 concrete.
4. **Accuracy pass**: A1 (hedge "provably optimal"), A2 (separate stop-grad/EMA, also P5/E3), A4, A5,
   A12 — small text edits, high credibility payoff.
5. **Predict-first + reorder pedagogy**: P1, P8, P9, P3/E14 (z callbacks).
6. **Animate ArchitectureDiagram (I4)** + EMA visualizer — serves E4, P5, A2.
7. **§07 progression timeline (P6)** + LLM contrast rewrite (P7) + §07→§08 bridge (P10).
8. **Entry-level bridges** not already covered: E2 (MPC/CEM — blocker), E9, E11, E12/E13 (+A10 H-JEPA).
9. **Tier-2 interactives** as budget allows: I5, I6.
10. **i_jepa.py walkthrough (P11)** + mid-course thesis reminders (P12).

---

*Reviewers were run read-only against the pre-reskin content; line numbers reference the
single-file `JepaCourse.jsx` at the time of review and will shift after the module split.*
