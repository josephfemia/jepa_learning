# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

An interactive, single-page **web course teaching JEPA (Joint-Embedding Predictive
Architecture) and world models** — Yann LeCun's research program. It takes a learner from a
basic ML background toward ML-researcher depth, organized around one thesis:
**"predict the representation, not the pixels."**

It deliberately mixes three learning modes — reading, hands-on interactive labs, and
learning-science tactics (predict-first prompts, discovery sequencing, spaced retrieval, dual
coding) — in an Andrej Karpathy "build-from-scratch / no black boxes" voice.

> **`README.md` is the canonical reference.** It holds the content-accuracy reference (verified
> facts with primary sources), the learning-science tactics, the extension conventions, and the
> project map. Read it before any non-trivial change. This file is the quick map.

## Stack & commands

- **Vite 5 + React 18**, tiny hash router (`#labs` → notebooks page, else the course).
- **Tailwind CSS** (JIT) + a shared design system in `src/index.css` (mirrors the companion
  project `robotic_learning`: cobalt accent, orange signal, hairline borders).
- A framework-agnostic **viz toolkit** in `src/widgets/` (`rllab.js` SVG/DOM + `animate.js`) with
  a React `Lab` wrapper; interactive labs are authored against it.
- **Light-mode only.** No other runtime deps. Requires Node 18+.

```bash
npm install
npm run dev       # dev server → http://localhost:5173   (or ./launch.sh)
npm run build     # production build → dist/  (the real "does it compile" check)
npm run preview   # preview the production build
npm test          # Vitest unit tests (scoreQuiz + planCEM in logic.js; lab cores in logic/)
```

**Before considering any change done, run `npm run build`.** It catches JSX errors, and Tailwind
JIT silently drops a class if a source path is misconfigured.

## Layout

```
index.html              # Vite entry
launch.sh               # one-command dev launcher
src/
  main.jsx              # React root → renders <JepaCourse />
  index.css             # shared design system (tokens, sidebar, .lecture pagination, .lab stage, …)
  theme.js              # single LIGHT palette + ThemeContext + useTheme() (cobalt/orange tokens)
  data.js               # course data: SECTIONS, NAV_GROUPS, PAGES, PAGE_LABEL, SECTION_CHECK, TIMELINE, MODELS,
                        #   + UNITS (syllabus modules), LECTURE_META (objectives/takeaways/time/difficulty/readings),
                        #   REVIEW (final-exam deck), SOURCES/SOURCE_ORDER (shared citations), GLOSSARY, WORLD_MODELS
  logic.js              # pure helpers + testable logic (clamp/lerp, scoreQuiz, planCEM, l1Energy)
  logic/                # per-lab numeric cores + vitest tests (collapseSim, energyLandscape, reconTax, minOverZ, hjepaHorizon)
  widgets/              # rllab.js (toolkit; incl. meters() + watchResize() for canvas labs) + animate.js + Lab.jsx
  labs/                 # toolkit-based interactive labs: CollapseLab, EnergyLandscapeLab, VICRegIsolatorLab,
                        #   LatentPlanningLab, PixelVsLatentLab, MaskingDifficultyLab, LatentGeometryLab,
                        #   + MinOverZLab, EmaLagLab, HJepaHorizonLab, ForcesLab (3b1b-style explainers)
  JepaCourse.jsx        # course shell (sidebar SPA) + remaining components + the lecture bodies
  Notebooks.jsx         # the #labs page: renders the executed .ipynb (md+code+outputs)
public/notebooks/       # executed jepa-from-scratch/*.ipynb, served at /notebooks
tailwind.config.js      # scans index.html + src/**
README.md               # canonical reference (READ THIS)
```

**Two pages, one tiny hash router** (in the `JepaCourse` default export): `#labs` →
`NotebooksPage`; anything else → `CourseBody`.

**Navigation model = paginated sidebar SPA** (matching `robotic_learning`): the eleven lectures are
grouped in a left sidebar; only the current lecture is visible (`.lecture` / `.lecture.visible`),
and a **Prev/Next pager + Mark-complete** bar at the foot of each threads the *separate* lectures
into one cohesive, naturally-flowing course. A "Start here" welcome page is the first page; the
sidebar also links to `#labs`.

**Read `JepaCourse.jsx` in layers:**
- **Reusable primitives:** `Reveal`, `Eyebrow`, `Instructor`, `CodeBlock`, `GuessGate`
  (predict-first + `tag="Recall"` spaced-retrieval variant), `Section`, `Heading`, `P`, `H3`,
  `Hi`, `B`, etc.
- **Shell chrome:** `Sidebar`, `MobileTopBar`, `StartLecture`, `SourcesFooter`, `CompleteBarPager`,
  plus `PageContext`/`usePage` (the current page id + navigation + completion).
- **Interactive labs:** the toolkit-based ones live in `src/labs/` (imported, aliased). Remaining
  in-file labs/diagrams: `MaskingLab`, `ArchitectureDiagram`, `MaskingStrategyViz`,
  `ApproachCompare`, `DiscoveryTimeline`, `ModelExplorer`, `TwoStageTraining`,
  `WorldModelLandscape`, `HJepaDiagram`, `MathAppendix`, `Glossary`, `Checkpoint`, `HeroCanvas`.
- **Default export:** `JepaCourse()` provides the single `LIGHT` theme and the hash router; the UI
  is in `CourseBody`.

Lecture completion drives the sidebar checkmarks + progress: a page is "done" when its
`SECTION_CHECK` self-test fires or the learner clicks Mark-complete. Pure logic that has tests lives
in `logic.js` / `logic/` so components import the exact code the tests cover.

### Lectures (the `SECTIONS` array, in order, plus a `start` welcome page)
`idea` → `why` → `build` → `collapse` → `depth` (Under the Hood) → `depth2` (Frontier & Eval) →
`compare` → `history` → `models` → `worldmodels` → `recap`. Eleven lectures, numbered **01–11**
consistently in both the sidebar (`PAGE_IDX`) and the lecture headings (`Heading num=`). `PAGES` is
the linear pager order.

## Conventions & gotchas (read before editing)

- **Design language:** editorial / GitHub-influenced light theme — warm-neutral paper, ONE cobalt
  accent (`C.cyan` = `#2742CC`), an orange "signal" (`C.amber` = `#E8590C`) for emphasis/action,
  muted semantic tints, hairline borders. Type: **Archivo** (display/UI), **Source Serif 4** (body
  prose), **IBM Plex Mono** (code). Use the `--font-*` vars, not reintroduced fonts.
- **Colors come from `useTheme()`**, never hardcoded hex — except the always-dark code blocks and
  the dark `.lab-stage`, where the `rllab.js` `C` palette supplies bright-on-dark colors. The app is
  **light-only**; keep new UI consistent with the single palette.
- **Never reference the theme at module scope** — it only exists inside components via the hook.
  Module-scope data stores color **names as strings** (`"cyan"`) and resolves them with `C[name]`.
- **Interactive sandboxes** render on the dark `.lab-stage` via the toolkit (`Lab` + `rllab.js`);
  **static schematics** stay on white `.figure`-style cards. (This is `robotic_learning`'s rule.)
- **No `localStorage`/`sessionStorage`.** React state only (SSR-safe, intentional).
- **Tailwind:** core utilities + arbitrary values; the literal class string must appear in source —
  don't build class names by concatenation, or JIT won't emit them.
- **Canvas effects** must respect `prefers-reduced-motion` and clean up `requestAnimationFrame` on
  unmount (the toolkit's `animate.js` is reduced-motion-aware).
- **Canvas labs MUST use `R.watchResize(cv, …)`, not a bare `window.resize` listener.** Lectures are
  all in the DOM (toggled by CSS `display:none`), so a canvas mounts at `offsetWidth === 0` and would
  render blank until a window resize. `watchResize` (a ResizeObserver) re-sizes when the lecture
  becomes visible. SVG labs are immune (viewBox scales). Re-draw inside the callback if the lab isn't
  already animating every frame.
- **Diagrams are schematics**, not literal training traces — keep illustrative simplifications labeled.
- **Accuracy bar:** every numeric/named claim must trace to a primary source (see the
  "Content accuracy reference" in `README.md`). Prefer the paper over blog coverage; hedge research
  bets ("critics argue…", "the claim holds under assumption X, not universally").

## Standing requirements (preserve when extending)

- Mixed learning modes (read + interact + psychology) — never a wall of text.
- Karpathy-style voice in explanatory moments.
- Light-only, consistent with the cobalt/orange design system shared with `robotic_learning`.
- Research-grounded, accurate content with primary-source citations.
- Discovery sequencing — let the learner *arrive* at conclusions; don't overwhelm.
- Congruent color-coding: cobalt = signal/latent, green = correct, orange = generative/pixel foil
  (sparing), violet = energy/abstraction.

**Always finish a change with `npm run build` and a visual check.**
