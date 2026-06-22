# Predict the Representation — An Interactive JEPA Course

**→ Live: [josephfemia.github.io/jepa_learning](https://josephfemia.github.io/jepa_learning/)**  ·  [Jump to the from-scratch labs](https://josephfemia.github.io/jepa_learning/#labs)

![Predict the representation, not the pixels — an interactive JEPA & world-models course](public/og-image.png)

An interactive, single-page course that takes you from a **basic machine-learning background** to **JEPA and world-model fluency** — approaching ML-researcher depth. It's built around one thesis, the one Yann LeCun keeps returning to:

> **Predict the representation, not the pixels.**

Most self-supervised models waste capacity reconstructing every pixel — including the unpredictable noise. JEPA (Joint-Embedding Predictive Architecture) predicts in a learned *latent* space instead, so the model spends its budget on what's actually predictable about the world. This course builds that idea up from scratch, *no black boxes*.

## What makes it different

It deliberately mixes three learning modes so it never becomes a wall of text:

- **📖 Read** — concept-first explanations in an Andrej Karpathy "build-from-scratch, concrete-before-abstract" voice.
- **🧪 Interact** — hands-on labs and diagrams: the reconstruction tax, masking strategies, representation *collapse* (and the tricks that prevent it), an interactive **energy-landscape explorer**, a **VICReg term isolator**, a latent-space **CEM planner**, the H-JEPA hierarchy, a model explorer, and more — all original SVG/Canvas, no external assets.
- **🧠 Remember** — learning-science tactics baked in: predict-first prompts, discovery sequencing, spaced-retrieval checkpoints, and dual coding.

Plus **executable from-scratch notebooks** (`#labs`) and an accuracy bar where **every numeric or named claim traces to a primary source.**

The course reads as **separate but cohesive lectures**: a left sidebar paginates between them, and a Prev/Next pager threads them into one naturally-flowing arc.

## What you'll learn

`The core idea` → `why latent prediction wins` → `building a JEPA` → `representation collapse & how to avoid it` → `under the hood (objectives & math)` → `JEPA vs. the alternatives` → `the research timeline` → `the model family (I-JEPA, V-JEPA, …)` → `world models & planning` → `recap`.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # production build → dist/
npm run preview  # preview the production build
npm test         # Vitest unit tests (quiz scoring, CEM planner, lab logic cores)
```

Requires Node 18+.

## Stack

- **Vite** + **React 18**, a tiny hash router (`#labs` → the from-scratch notebooks page, else the course).
- **Tailwind CSS** (core utilities + arbitrary values via JIT) plus a shared design system in `src/index.css`.
- A small framework-agnostic **visualization toolkit** in `src/widgets/` (`rllab.js` for SVG/DOM + `animate.js` for reduced-motion-aware tweens), with a React `Lab` wrapper — the interactive labs are authored against it.
- No runtime dependencies. Three web fonts: **Archivo** (display/UI), **Source Serif 4** (prose), **IBM Plex Mono** (code).
- **Light-mode only.** Editorial palette: warm-neutral paper, one **cobalt** accent (`#2742CC`), an **orange** "signal" (`#E8590C`) for emphasis, muted semantic tints, hairline borders.

## Project structure

```
.
├── index.html              # Vite entry (+ Open Graph / Twitter card meta)
├── vite.config.js
├── tailwind.config.js      # scans index.html + src/**
├── public/
│   ├── og-image.png        # social share card
│   └── notebooks/          # executed from-scratch .ipynb (served at /notebooks)
├── src/
│   ├── main.jsx            # React root → renders <JepaCourse />
│   ├── index.css           # shared design system (tokens, sidebar, .lab stage, …)
│   ├── theme.js            # single light palette + ThemeContext / useTheme()
│   ├── data.js             # course data (SECTIONS, NAV_GROUPS, PAGES, MODELS, …)
│   ├── logic.js            # pure, tested helpers (scoreQuiz, planCEM, clamp/lerp, …)
│   ├── logic/              # per-lab numeric cores + vitest tests (collapseSim, energyLandscape, reconTax)
│   ├── widgets/            # rllab.js toolkit + animate.js + Lab.jsx wrapper
│   ├── labs/               # toolkit-based interactive labs (CollapseLab, EnergyLandscapeLab, …)
│   ├── Notebooks.jsx       # the #labs page (renders executed notebooks)
│   └── JepaCourse.jsx      # course shell (sidebar SPA) + remaining components + the lecture bodies
└── docs/superpowers/specs/ # design / review notes
```

## How to extend it (conventions)

- **Run `npm run build` before considering any change done.** It's the real "does it compile" check and catches JSX errors and Tailwind JIT misses.
- **Colors come from `useTheme()`** (`C.cyan` = cobalt accent, `C.amber` = orange signal, `C.green`, `C.violet`, surfaces, text), never hardcoded hex — except the intentionally-dark code blocks and the dark `.lab-stage`, where the `rllab.js` `C` palette supplies bright-on-dark colors.
- **Module-scope data stores color *names as strings*** (`"cyan"`) and resolves them with `C[name]` inside components — never reference the theme object at module scope.
- **Tailwind:** literal class strings only (`max-w-[1080px]`), never built by concatenation, or JIT won't emit them.
- **No `localStorage`/`sessionStorage`** — React state only (SSR-safe, intentional).
- **Interactive sandboxes** render on the dark `.lab-stage` via the toolkit; **static schematics** stay on white `.figure` cards. Canvas/animation must respect `prefers-reduced-motion` and clean up `requestAnimationFrame` on unmount.
- **Diagrams are schematics**, not literal training traces — keep illustrative simplifications labeled.
- **Pure logic that has tests lives in `logic.js` / `logic/`** so the components import the exact code the tests cover.

### Learning-science tactics (preserve these when extending)

- **Pretesting / "predict first"** — `GuessGate` asks the learner to guess *before* the answer is revealed (guessing wrong first improves retention).
- **Discovery sequencing** — the history timeline frames each step as *problem → idea*, so JEPA feels *inevitable*, not arbitrary.
- **Generative learning** — every abstract idea has a manipulable lab.
- **Dual coding** — concepts paired with a visual, never text alone.
- **Spaced retrieval** — `Checkpoint` quiz with immediate per-question feedback; recall prompts at lecture transitions.
- **Karpathy voice** — `Instructor` asides, from-scratch `CodeBlock`s, concrete-before-abstract, explicit demystifying, teach-it-back advice.
- **Congruent color-coding** — cobalt = signal/latent, green = correct, orange = the "pixel/generative" foil, violet = energy/abstraction.

## Content accuracy reference (verified facts the course relies on)

Every numeric/named claim traces to a primary source (links are in the course footer). Prefer the paper over secondary coverage, and hedge research bets ("critics argue…", "the claim is X under assumption Y, not a universal theorem").

- **JEPA** — LeCun, *A Path Towards Autonomous Machine Intelligence* (2022). Six-module agent: configurator, perception, world model, cost, actor, short-term memory. H-JEPA = hierarchical.
- **I-JEPA** (Assran et al., CVPR 2023) — context encoder (ViT, visible patches) + EMA target encoder (full image, stop-gradient) + a **narrow ViT predictor** conditioned on target position. Multi-block masking: **1 context block scale (0.85, 1.0)**, **4 target blocks scale (0.15, 0.2), aspect (0.75, 1.5)**, overlap removed, targets masked at the *encoder output*. ViT-H/14 on ImageNet, 16 A100s, <72h.
- **V-JEPA** (Bardes et al., Feb 2024) — 3D (spatiotemporal) multi-block masking; latent prediction.
- **V-JEPA 2** (Assran, Ballas et al., Jun 11 2025) — ViT-g (>1B params), VideoMix22M (**1M+ hours**), mask-denoising + 3D RoPE. Stage 2 **V-JEPA 2-AC**: 24-layer predictor, **7-DoF** actions, **<62 h** DROID robot video, encoder frozen. Planning = **MPC + Cross-Entropy Method**, energy = **L1 distance** to the goal-image embedding, **~16 s/action vs ~4 min for Cosmos (≈15×)** — the gap is latent-embedding scoring vs full pixel rendering, same CEM both sides. Zero-shot on Franka arms in two labs, no task reward.
- **LeJEPA** (Balestriero & LeCun, Nov 2025) — proves the **isotropic Gaussian** minimizes worst-case downstream risk *for linear probes with Gaussian priors* (not a universal theorem); enforces it via **SIGReg** (random 1-D projections + **Epps–Pulley** normality test; Cramér–Wold justification); removes EMA/stop-gradient; one hyperparameter λ.
- **VICReg** (Bardes, Ponce & LeCun, 2022) — three terms: invariance (MSE), variance (hinge on std, γ=1), covariance (squared off-diagonals). Coefficients **λ=25, μ=25, ν=1** are the paper's ImageNet values, *not universal* (tuned per dataset/batch/dimension). Hinge the *std*, not the variance.
- **Stop-gradient vs EMA** — distinct mechanisms: the stop-gradient breaks the learning-signal symmetry (the actual anti-collapse lever); EMA just makes the teacher a slow copy. BYOL showed a plain momentum encoder can substitute for EMA — the asymmetry is what matters. Why EMA helps as much as it does isn't fully understood.
- **DINO-WM** (Zhou et al., 2024/25) — frozen DINOv2 + learned predictor; avoids collapse by not training the encoder.
- **PLDM** (Sobal et al., 2025) — end-to-end JEPA-WM, VICReg-derived **7-term** objective.
- **LeWorldModel / LeWM** (Maes, Le Lidec, Scieur, LeCun, Balestriero; arXiv 2603.19312, Mar 2026) — end-to-end from pixels, **ViT-Tiny, ~15M params total**, two-term loss (next-embedding prediction + SIGReg), no EMA/stop-grad/frozen encoder, **192-dim single token (~200× fewer than DINO-WM)**, plans **~1 s vs ~47 s (≈48×)**, +18% over PLDM on Push-T, underperforms on the simplest env (Two-Room — the isotropic-Gaussian prior is too strong for a low-dim distribution).
- **AMI Labs** (Advanced Machine Intelligence; "ami" = *friend* in French) — LeCun left Meta Nov 2025, co-founded AMI Labs (Paris, Dec 2025), ~$1B seed early 2026, executive chairman; Alexandre LeBrun CEO. Built on the world-model (not LLM) bet.

## Deploy (GitHub Pages)

A GitHub Actions workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) builds and
publishes to GitHub Pages on every push to `master`/`main`. No manual config is needed: hash routing
(`#labs`) requires no SPA rewrites, and `vite.config.js` reads `base` from `VITE_BASE`, which the
workflow derives automatically from the repository name (`/<repo>/` for a project page, `/` for a
`<user>.github.io` page). The workflow also enables Pages itself.

One-time setup — create a **public** repo (free Pages requires public), then:

```bash
git remote add origin https://github.com/<USER>/<REPO>.git
git push -u origin master        # use `git branch -M main` first if you prefer main
```

When the **Actions → Deploy to GitHub Pages** run is green, the site is live at
`https://<USER>.github.io/<REPO>/` (and `/#labs` for the notebooks).

(If a run ever fails with a Pages 404, enable Settings → Pages → Source: **GitHub Actions**, then re-run.)

## Notes

- Light-only theme via React context (no `localStorage`; SSR-safe by design).
- All diagrams/animations are original SVG/Canvas; canvas effects respect `prefers-reduced-motion`.
- Diagrams are faithful *schematics* of the underlying mechanisms, not literal training traces.

## License

Dual-licensed:

- **Code** (source, build config, tooling) — **MIT**, see [`LICENSE`](LICENSE).
- **Course content** (text, diagrams, animations) — **CC BY 4.0**, see [`LICENSE-CONTENT.md`](LICENSE-CONTENT.md).

In short: reuse the code freely, and share or adapt the course content as long as you credit Joseph Femia.
