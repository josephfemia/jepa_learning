# Project Brief — Interactive JEPA Course

> Handoff document for Claude Code (or any developer) continuing this project.
> Read this top to bottom before making changes. It captures **what the project is**,
> **how it was asked for**, **how it's built**, and **how to extend it safely**.

---

## 1. What this project is

A polished, single-page **interactive web course** that teaches **JEPA (Joint-Embedding
Predictive Architecture)** and **world models** — Yann LeCun's research program — to a learner
who starts with a *basic machine-learning background* and finishes near *ML-researcher depth*.

The whole course is organized around one thesis, repeated as a through-line:

> **Predict the representation, not the pixels.**

It is intentionally more than a written explainer. It mixes three modes of learning:
1. **Reading** — tight, chunked prose.
2. **Interaction** — 13 hands-on labs/diagrams (mask an image, collapse a latent space, run a CEM planner, etc.).
3. **Learning-science tactics** — see §4.

The course was originally framed for someone preparing to **apply to AMI Labs** (Yann LeCun's
world-models startup), so it deliberately ends by connecting the technical arc to AMI Labs and
the latest world-model research.

**Live entry point:** `src/JepaCourse.jsx` (one self-contained React component, ~2,300 lines).

---

## 2. The sequence of asks that produced it (chronological)

This is the history of requests so you understand *why* the project is shaped the way it is.

1. **"Help me learn JEPA — build a website covering JEPA, V-JEPA, and LeCun's world models.
   Start high-level, go very deep, cover how JEPA differs from other approaches and its history.
   Do full research."** → Initial static HTML site.
2. **"Make it a high-production learning site using React and Tailwind. Pretty, good UI/UX,
   maintainable, interactive. Use psychology/learning tactics. Mix reading, interaction, and
   other tactics. Don't overwhelm — let the user naturally arrive at the conclusions that led to
   JEPA and the various architectures."** → Rebuilt as the interactive React course with labs +
   learning-science scaffolding + discovery sequencing.
3. **"Teach in the style of Andrej Karpathy. Research his style and apply it."** → Added the
   "build from scratch / no black boxes" voice: readable from-scratch code, concrete-before-abstract,
   conversational "let's think about it" instructor asides, explicit demystifying, teach-it-back advice.
4. **"(a) Add a latent-planning lab for V-JEPA 2. (b) Light/dark toggle. (c) Review & enhance content.
   (d) Find & add missing content. (e) Accuracy pass."** → Added the planning lab, theme system,
   open-questions block, glossary, embedding-grounding; fixed accuracy issues.
5. **"(1) Research the psychology of visual themes (color, fonts) for learning and apply it, working
   in light & dark. (2) Enhance content. (3) Add missing content. (4) Accuracy pass. (5) Add
   informative/interactive visuals."** → Research-grounded palette (blue/teal focus primary, green
   for "correct", sparing amber, no red), color legend, architecture SVG, two-stage training viz.
6. **"Extend all the way to JEPA world models. Accuracy pass."** → Added the "World Models" section,
   world-model landscape comparator (DINO-WM / PLDM / V-JEPA 2-AC / LeWorldModel), AMI Labs context.
7. **"It should take someone from basic ML to JEPA expert / near ML-researcher level. (Also: the
   collapse simulator only shows a dot.)"** → Fixed the collapse-sim bug; added the **"Under the Hood"**
   section (EBM math, contrastive-vs-regularized, real VICReg code, masking algorithm with real numbers,
   SIGReg/Epps-Pulley, evaluation protocols).
8. **(This ask) Package all files + write this brief.**

**Standing requirements that must be preserved in any extension:**
- Mixed learning modes (read + interact + psychology), never a wall of text.
- Karpathy-style voice in explanatory moments.
- Works in **both light and dark** mode.
- Research-grounded, accurate content (cite primary sources; flag what's a research bet).
- Don't overwhelm; let the learner *arrive* at conclusions (discovery sequencing).
- No `localStorage`/`sessionStorage` (was an artifact constraint; keeping it keeps things simple/SSR-safe).

---

## 3. Course structure (10 sections, in order)

Defined in the `SECTIONS` array and rendered in `CourseBody`. Each `id` is a scroll anchor used by the nav + progress rail.

| # | id | Label | What it covers | Key interactive(s) |
|---|------|-------|----------------|--------------------|
| 01 | `idea` | The Idea | Core thesis; "predict what it *means*"; what an embedding is | `GuessGate`, `Instructor` |
| 02 | `why` | Why Latent | Reconstruction tax; EBM framing; latent variable z | `PixelVsLatentLab`, `CodeBlock` (jepa_step) |
| 03 | `build` | Architecture | Context/target encoders, predictor, EMA + stop-grad asymmetry | `ArchitectureDiagram`, `MaskingLab` |
| 04 | `collapse` | Collapse | Complete vs dimensional collapse; the three anti-collapse families | `CollapseLab` |
| 04½ | `depth` | Under the Hood | **Researcher depth:** EBM math, contrastive-vs-regularized, real VICReg code, masking numbers, SIGReg/Epps-Pulley, evaluation protocols | `ContrastiveVsRegularized`, `MaskingStrategyViz`, `CodeBlock`s |
| 05 | `compare` | Vs Others | Generative / contrastive / JEPA; LLM contrast; open critiques | `ApproachCompare` |
| 06 | `history` | History | Lineage: EBMs → CPC → World Models → BYOL/VICReg → 2022 manifesto → models; six-module agent | `DiscoveryTimeline` |
| 07 | `models` | The Models | I-JEPA, V-JEPA, V-JEPA 2, LeJEPA, LeWorldModel deep dives; two-stage training; MPC planning | `ModelExplorer`, `TwoStageTraining`, `LatentPlanningLab` |
| 08 | `worldmodels` | World Models | The destination: frozen-vs-end-to-end, the landscape, LeWM, AMI Labs | `WorldModelLandscape` |
| 09 | `recap` | Recap | Retrieval quiz, teach-it-back advice, glossary | `Checkpoint`, `Glossary` |

(The "04½" numbering is intentional — "Under the Hood" was inserted after Collapse without renumbering everything; the visible eyebrow reads `04½`.)

---

## 4. Learning-science tactics in use (preserve these when extending)

These are deliberate and research-backed. New content should reuse the same patterns.

- **Pretesting / "predict first"** — `GuessGate` asks the learner to guess *before* the answer is revealed (guessing wrong first improves retention). Used at section transitions.
- **Discovery sequencing** — the History timeline frames each step as *problem → idea*, so each advance feels motivated by the previous one's failure. JEPA feels *inevitable*, not arbitrary.
- **Generative learning / learning-by-doing** — every abstract idea has a manipulable lab.
- **Dual coding** — concepts are paired with a visual (SVG/Canvas), never text alone.
- **Spaced retrieval** — `Checkpoint` quiz at the end with immediate per-question feedback.
- **Desirable difficulty via retrieval** (not via hard-to-read fonts — the disfluency literature shows perceptual disfluency doesn't help; retrieval does).
- **Karpathy style** — `Instructor` asides ("let's think about it", "here's the catch nobody mentions"), `CodeBlock` from-scratch readable code, concrete tiny examples before abstraction, explicit demystifying ("no magic"), teach-it-back meta-advice in the recap.
- **Congruent color-coding** — colors carry consistent meaning (legend in the hero), which measurably aids recall.

### Color/typography rationale (from learning psychology research)
- **Blue/teal = primary** ("cyan" token): most consistently evidenced color for sustained focus, calm, problem-solving → used for *the signal / latent space*, the thing to concentrate on.
- **Green = correct/success** (distinct from brand teal): retention-friendly, used for right answers and the "healthy" embedding state.
- **Amber = attention/contrast, used sparingly**: the "pixel / generative world" foil. **Red is avoided** (raises anxiety).
- **Violet = energy/abstraction.**
- Generous line-height (~1.7), high text/background contrast, AA-tuned hues in light mode.

---

## 5. Architecture of `src/JepaCourse.jsx`

One file, no router. Read it in these layers:

### 5a. Theming (top of file)
- `DARK` and `LIGHT` palette objects (surfaces, text, accents, code colors, `okBg`/`warnBg`, `glow`, `isDark`).
- `ThemeContext` + `useTheme()` hook. **Every component calls `const C = useTheme()`** and reads colors off `C`. Accents are semantically named (`C.cyan`, `C.amber`, `C.violet`, `C.green`).
- `JepaCourse` (the default export) holds `dark` state and wraps everything in `<ThemeContext.Provider>`. The real UI lives in `CourseBody`.
- **Gotcha:** do **not** reference `C` at module scope (in `const`-defined data arrays or default param values). It only exists inside components via the hook. Module-scope data (e.g. `TIMELINE`, `MODELS`, `WORLD_MODELS`, `GLOSSARY`) stores color **names as strings** (`"cyan"`) and resolves them with `C[name]` inside the component.

### 5b. Reusable primitives
`Reveal` (scroll-in animation), `Eyebrow`, `Aside`, `Pill`, `Instructor`, `CodeBlock` (+ `highlightPy`/`escapeHtml` for faux syntax highlighting), `GuessGate`, `Section`, `Heading`, `P`, `H3`, `Hi` (inline accent text), `B` (bold), `SunIcon`/`MoonIcon`, `Toggle`, `Row`, `PipelineStep`, `Connector`.

### 5c. Interactive components (the 13 labs/diagrams)
| Component | Type | What it does |
|-----------|------|--------------|
| `PixelVsLatentLab` | slider | "Reconstruction tax": shows wasted vs useful effort |
| `MaskingLab` | click grid + pipeline | Build a JEPA forward pass; run encode→predict→loss |
| `ArchitectureDiagram` | static SVG | Canonical 3-network diagram with EMA/stop-grad |
| `CollapseLab` | Canvas + toggles | Toggle EMA / VICReg, watch latent space collapse/recover |
| `ContrastiveVsRegularized` | SVG toggle | Two ways to shape an energy landscape |
| `MaskingStrategyViz` | SVG + resample | I-JEPA multi-block masking with real scale numbers |
| `ApproachCompare` | tabs | Generative / Contrastive / JEPA side-by-side |
| `DiscoveryTimeline` | accordion | Problem→idea history |
| `ModelExplorer` | tabs | I-JEPA → … → LeWorldModel deep dives |
| `TwoStageTraining` | tabs | V-JEPA 2 action-free → action-conditioned |
| `LatentPlanningLab` | Canvas (CEM/MPC) | Place a goal, watch model-predictive control plan in latent space |
| `WorldModelLandscape` | tabs | DINO-WM / PLDM / V-JEPA 2-AC / LeWM comparison |
| `Glossary` | accordion | 15 key terms |
| `Checkpoint` | quiz | Retrieval practice with feedback |
| `HeroCanvas` | Canvas | Ambient drifting "latent space" particle field |

### 5d. Layout
`useScrollProgress` (progress bar + active-section tracking), nav with theme toggle, hero, then the 10 `<Section>`s, then footer with primary sources.

---

## 6. How to run / verify

```bash
npm install
npm run dev       # dev server, http://localhost:5173
npm run build     # production build → dist/  (this is the real "does it compile" check)
npm run preview
```

**Before considering any change done:** run `npm run build`. It catches JSX errors, and Tailwind
JIT will fail to emit a class if a source path is misconfigured. The current build is clean
(~262 KB JS / ~83 KB gzip, ~15 KB CSS).

---

## 7. Conventions & gotchas (read before editing)

- **Tailwind:** core utilities + arbitrary values (`max-w-[1080px]`, `text-[15px]`). These work via
  JIT as long as the literal class string appears in source. Don't build class names dynamically by
  string concatenation, or JIT won't see them.
- **Colors come from `useTheme()`**, not hardcoded hex (a few intentional exceptions exist for the
  always-dark code blocks). Keep new UI theme-aware so light mode stays correct.
- **No `localStorage`/`sessionStorage`.** Use React state.
- **Canvas effects** must respect `prefers-reduced-motion` (existing ones do) and clean up
  `requestAnimationFrame` on unmount. If a canvas should recolor on theme change, include `C.isDark`
  in the effect deps (see `HeroCanvas`).
- **Module-scope data uses string color keys**, resolved via `C[key]` in-component (see §5a gotcha).
- **Diagrams are schematics**, not literal training traces. Keep illustrative simplifications labeled
  as such; don't present a toy animation as real model output.
- **Accuracy:** every numeric/named claim should trace to a primary source (see §8). When adding
  claims, prefer the paper over secondary blog coverage, and hedge research bets ("critics argue…",
  "the claim is X, not a universal theorem").

---

## 8. Content accuracy reference (verified facts the course relies on)

Use these when editing; they've been checked against primary sources.

- **JEPA** proposed in LeCun, *A Path Towards Autonomous Machine Intelligence* (2022). Six-module
  agent: configurator, perception, world model, cost, actor, short-term memory. H-JEPA = hierarchical.
- **I-JEPA** (Assran et al., CVPR 2023): context encoder (ViT, visible patches) + EMA target encoder
  (full image, stop-gradient) + **narrow ViT predictor** conditioned on target position. Multi-block
  masking: **1 context block scale (0.85, 1.0)**, **4 target blocks scale (0.15, 0.2), aspect (0.75, 1.5)**,
  overlap removed, targets masked at the *encoder output*. ViT-H/14 on ImageNet, 16 A100s, <72h.
- **V-JEPA** (Bardes et al., Feb 2024): 3D multi-block (spatiotemporal) masking; latent prediction.
- **V-JEPA 2** (Assran, Ballas et al., Jun 11 2025): ViT-g (>1B params), VideoMix22M (**1M+ hours**),
  mask-denoising + 3D RoPE. Stage 2 **V-JEPA 2-AC**: 24-layer predictor, **7-DoF** actions, **<62 h**
  DROID robot video, encoder frozen. Planning = **MPC + Cross-Entropy Method**, energy = **L1 distance**
  to goal-image embedding, **~16 s/action vs ~4 min for Cosmos (≈15×)**. Zero-shot on Franka arms in
  two labs, no task reward.
- **LeJEPA** (Balestriero & LeCun, Nov 2025): proves **isotropic Gaussian** is the optimal embedding
  distribution; enforces via **SIGReg** (random 1-D projections + **Epps–Pulley** normality test;
  Cramér–Wold justification); removes EMA/stop-gradient; one hyperparameter λ.
- **VICReg** (Bardes, Ponce & LeCun, 2022): three terms — invariance (MSE), variance (hinge on std,
  γ=1), covariance (squared off-diagonals). Coefficients **λ=25, μ=25, ν=1**. Hinge the *std*, not the variance.
- **DINO-WM** (Zhou et al., 2025): frozen DINOv2 + learned predictor; avoids collapse by not training the encoder.
- **PLDM** (Sobal et al., 2025): end-to-end JEPA-WM, VICReg-derived **7-term** objective.
- **LeWorldModel / LeWM** (Maes, Le Lidec, Scieur, LeCun, Balestriero; arXiv 2603.19312, Mar 13 2026):
  end-to-end from pixels, **ViT-Tiny ~15M params**, two-term loss (next-embedding prediction + SIGReg),
  no EMA/stop-grad/frozen encoder, **192-dim single token (~200× fewer than DINO-WM)**, plans **~1 s
  vs ~47 s (≈48×)**, +18% over PLDM on Push-T, underperforms on the simplest env (Two-Room — SIGReg's
  Gaussian prior too strong for low-dim).
- **AMI Labs** (Advanced Machine Intelligence; "ami" = friend in French): LeCun left Meta Nov 2025,
  co-founded AMI Labs (Paris, Dec 2025), ~$1B seed early 2026, LeCun executive chairman, Alexandre
  LeBrun CEO. Built on the world-model (not LLM) bet.

Primary source links are in the component footer (`JepaCourse.jsx`, search "Primary sources").

---

## 9. Suggested next steps / extension ideas

Backlog of high-value additions (none started). Each should preserve §2's standing requirements.

**Content / depth**
- A runnable **"implement I-JEPA in ~50 lines"** appendix (masking + ViT encoder + EMA + loss), with a copy button.
- A **math appendix**: full LVEBM derivation, why minimizing over `z` gives multimodality, the
  information-theoretic (HSIC/entropy) reading of VICReg.
- A **hierarchical JEPA (H-JEPA)** explainer — currently only mentioned; could get its own diagram on
  multi-timescale planning.
- A short section on **JEPA's known weaknesses on "slow features" / distractors** (Sobal et al. 2022) —
  referenced in research but not yet a teaching moment.
- Deeper **V-JEPA 2 benchmarks** (Something-Something v2, Epic-Kitchens, video-QA) — currently omitted
  to avoid staleness; could add with clear dates/caveats.

**Interactivity**
- An interactive **CEM internals** view inside `LatentPlanningLab` (show the Gaussian over actions
  shrinking across refinement iterations).
- A **"build the loss" sandbox**: toggle each VICReg/SIGReg term and see collapse occur in `CollapseLab`
  driven by the actual term being off (tie the two labs together).
- **Section completion tracking** in the nav (checkmarks as you finish each section's quiz/lab) — note:
  keep it in React state per the no-storage rule, or introduce storage deliberately if persistence is wanted.

**Engineering / polish**
- Split `JepaCourse.jsx` into modules (`/components`, `/sections`, `/theme.js`, `/data.js`) for
  maintainability — it's intentionally one file today for portability, but it's large.
- Add tests (e.g. Vitest) for the quiz scoring and CEM planner logic.
- Accessibility audit pass (focus order, ARIA on the canvas labs, color-contrast in light mode).
- A `prefers-color-scheme` default so first paint matches the OS theme.
- Persist theme choice (would require introducing storage — currently intentionally avoided).

**Always finish a change with `npm run build` and a visual check in both light and dark mode.**

---

## 10. Tone & quality bar

This was built to a high production bar: distinctive visual identity, careful copy, real learning
design — not a templated docs page. When extending: spend boldness in one place per addition, keep
everything else quiet, write copy that helps the learner navigate (active voice, plain verbs), and
keep the through-line ("predict the representation, not the pixels") audible.
