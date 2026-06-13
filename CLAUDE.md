# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

An interactive, single-page **web course teaching JEPA (Joint-Embedding Predictive
Architecture) and world models** — Yann LeCun's research program. It takes a learner from a
basic ML background toward ML-researcher depth, organized around one thesis:
**"predict the representation, not the pixels."**

It deliberately mixes three learning modes — reading, 13+ hands-on interactive labs, and
learning-science tactics (predict-first prompts, discovery sequencing, spaced retrieval, dual
coding) — in an Andrej Karpathy "build-from-scratch / no black boxes" voice.

> **`PROJECT_BRIEF.md` is the authoritative handoff doc.** Read it before any non-trivial
> change — it covers the full ask history, content-accuracy reference (verified facts with
> primary sources), conventions, and a backlog of extension ideas. This file is the quick map.

## Stack & commands

- **Vite 5 + React 18** (single component, no router), **Tailwind CSS** (JIT), no other runtime deps.
- Requires Node 18+.

```bash
npm install
npm run dev       # dev server → http://localhost:5173
npm run build     # production build → dist/  (the real "does it compile" check)
npm run preview   # preview the production build
```

**Before considering any change done, run `npm run build`.** It catches JSX errors, and Tailwind
JIT silently drops a class if a source path is misconfigured.

## Layout

```
index.html              # Vite entry
src/
  main.jsx              # React root → renders <JepaCourse /> in <React.StrictMode>
  index.css             # Tailwind directives + minimal reset (dark fallback bg)
  JepaCourse.jsx        # THE ENTIRE COURSE — one self-contained ~2,300-line component
tailwind.config.js      # scans index.html + src/**
PROJECT_BRIEF.md        # full handoff doc (READ THIS)
```

**Everything lives in `src/JepaCourse.jsx`.** Read it in layers:
- **Theming (top):** `DARK`/`LIGHT` palette objects, `ThemeContext` + `useTheme()` hook.
- **Reusable primitives:** `Reveal`, `Eyebrow`, `Instructor`, `CodeBlock`, `GuessGate`, `Section`,
  `Heading`, `P`, `H3`, `Hi`, `B`, `Toggle`, etc.
- **Interactive labs (13):** `PixelVsLatentLab`, `MaskingLab`, `ArchitectureDiagram`, `CollapseLab`,
  `ContrastiveVsRegularized`, `MaskingStrategyViz`, `ApproachCompare`, `DiscoveryTimeline`,
  `ModelExplorer`, `TwoStageTraining`, `LatentPlanningLab`, `WorldModelLandscape`, `Glossary`,
  `Checkpoint`, `HeroCanvas`.
- **Module-scope data:** `SECTIONS`, `TIMELINE`, `MODELS`, `WORLD_MODELS`, `GLOSSARY`.
- **Layout:** `useScrollProgress`, nav + theme toggle, hero, 10 `<Section>`s, footer (primary sources).
- **Default export:** `JepaCourse()` — holds `dark` state, wraps everything in `ThemeContext.Provider`;
  the real UI is in `CourseBody`.

### Sections (the `SECTIONS` array, in order)
`idea` → `why` → `build` → `collapse` → `depth` (Under the Hood, shown as eyebrow "04½") →
`compare` → `history` → `models` → `worldmodels` → `recap`. Each `id` is a scroll anchor.

## Conventions & gotchas (read before editing)

- **Colors come from `useTheme()`**, never hardcoded hex (a few intentional exceptions for the
  always-dark code blocks). Keep new UI theme-aware so **both light and dark** stay correct.
- **Never reference `C` (the theme) at module scope** — it only exists inside components via the
  hook. Module-scope data stores color **names as strings** (`"cyan"`) and resolves them with
  `C[name]` inside the component.
- **No `localStorage`/`sessionStorage`.** Use React state only (SSR-safe, intentional constraint).
- **Tailwind:** core utilities + arbitrary values (`max-w-[1080px]`, `text-[15px]`). The literal
  class string must appear in source — **don't build class names by string concatenation**, or JIT
  won't emit them.
- **Canvas effects** must respect `prefers-reduced-motion` and clean up `requestAnimationFrame` on
  unmount. If a canvas recolors on theme change, include `C.isDark` in the effect deps (see `HeroCanvas`).
- **Diagrams are schematics**, not literal training traces — keep illustrative simplifications labeled.
- **Accuracy bar:** every numeric/named claim must trace to a primary source (see `PROJECT_BRIEF.md`
  §8). Prefer the paper over blog coverage; hedge research bets ("critics argue…").

## Standing requirements (preserve when extending)

- Mixed learning modes (read + interact + psychology) — never a wall of text.
- Karpathy-style voice in explanatory moments.
- Works in both light and dark mode.
- Research-grounded, accurate content with primary-source citations.
- Discovery sequencing — let the learner *arrive* at conclusions; don't overwhelm.
- Congruent color-coding (blue/teal = signal/focus, green = correct, amber sparingly, red avoided).

**Always finish a change with `npm run build` and a visual check in both light and dark mode.**
