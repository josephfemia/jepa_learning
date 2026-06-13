# Predict the Representation — An Interactive JEPA Course

An interactive, single-page course that takes a learner from a **basic machine-learning background** to **JEPA and world-model expertise** — approaching ML-researcher depth. Built around one thesis: *predict the representation, not the pixels.*

It blends reading, interactive labs, and learning-science tactics (predict-first prompts, discovery sequencing, spaced retrieval, dual coding) in the explanatory style of Andrej Karpathy (build-from-scratch, "no black boxes," concrete-before-abstract).

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # production build → dist/
npm run preview  # preview the production build
```

Requires Node 18+.

## Stack

- **Vite** + **React 18** (single component, no router)
- **Tailwind CSS** (core utilities + arbitrary values via JIT)
- No other runtime dependencies. Fonts load from Google Fonts via an `@import` inside the component.

## Project structure

```
.
├── index.html              # Vite entry
├── package.json
├── vite.config.js
├── tailwind.config.js      # scans index.html + src/**
├── postcss.config.js
├── src
│   ├── main.jsx            # React root → renders <JepaCourse />
│   ├── index.css           # Tailwind directives + minimal reset
│   └── JepaCourse.jsx      # THE ENTIRE COURSE (one self-contained component)
└── PROJECT_BRIEF.md        # full handoff doc for extending the project
```

**Everything lives in `src/JepaCourse.jsx`** — content, interactive labs, theming, and animation. See `PROJECT_BRIEF.md` for a complete map of the file and guidance on extending it.

## Notes

- The component manages its own dark/light theme via React context (no `localStorage`).
- All diagrams/animations are original SVG/Canvas; no external assets.
- Diagrams are faithful *schematics* of the underlying mechanisms, not literal training traces.
