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

When the **Actions → Deploy to GitHub Pages** run is green, the site is live at:

- `https://<USER>.github.io/<REPO>/` — the course
- `https://<USER>.github.io/<REPO>/#labs` — the from-scratch notebooks

(If a run ever fails with a Pages 404, the repo's Actions may be restricted — enable Settings → Pages →
Source: **GitHub Actions**, then re-run.)

## Stack

- **Vite** + **React 18**, a tiny hash router (`#labs` → the from-scratch notebooks page, else the course)
- **Tailwind CSS** (core utilities + arbitrary values via JIT)
- No runtime dependencies. One web font (**Fraunces**, the display serif) loads via `@import`; body/mono use the native system stacks.

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
