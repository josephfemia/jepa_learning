import React, { useState, useEffect, useRef, useCallback } from "react";
import { LIGHT, ThemeContext, useTheme } from "./theme.js";
import { SECTIONS, SECTION_CHECK, TIMELINE, MODELS, GLOSSARY, WORLD_MODELS,
  NAV_GROUPS, PAGES, PAGE_LABEL, SOURCES, SOURCE_ORDER, UNITS, LECTURE_META, REVIEW } from "./data.js";
import { cx, clamp, lerp, scoreQuiz, planCEM } from "./logic.js";
import NotebooksPage, { pyHighlight } from "./Notebooks.jsx";
import CollapseLabT from "./labs/CollapseLab.jsx";
import EnergyLandscapeLab from "./labs/EnergyLandscapeLab.jsx";
import VICRegIsolatorLab from "./labs/VICRegIsolatorLab.jsx";
import LatentPlanningLabT from "./labs/LatentPlanningLab.jsx";
import PixelVsLatentLabT from "./labs/PixelVsLatentLab.jsx";
import LatentGeometryLab from "./labs/LatentGeometryLab.jsx";
import MaskingDifficultyLab from "./labs/MaskingDifficultyLab.jsx";
import EmaLagLab from "./labs/EmaLagLab.jsx";
import MinOverZLab from "./labs/MinOverZLab.jsx";
import HJepaHorizonLab from "./labs/HJepaHorizonLab.jsx";
import ForcesLab from "./labs/ForcesLab.jsx";
import CollusionCollapseLab from "./labs/CollusionCollapseLab.jsx";
import EmbeddingInvarianceLab from "./labs/EmbeddingInvarianceLab.jsx";
import PartitionWallLab from "./labs/PartitionWallLab.jsx";
import CurseDimLab from "./labs/CurseDimLab.jsx";
import ViolationLab from "./labs/ViolationLab.jsx";
import SlowFeaturesLab from "./labs/SlowFeaturesLab.jsx";
import StabilityDialLab from "./labs/StabilityDialLab.jsx";

/* ============================================================================
   JEPA — An Interactive Course
   A learning experience built around predict-the-representation.
   Pedagogy woven in: pretesting (guess-first), generative learning, discovery
   sequencing (each historical problem motivates the next idea), dual coding,
   spaced retrieval checkpoints, and progress feedback.

   Karpathy-style layer: build from scratch / no black boxes (readable code for
   the loss and the planning loop), concrete tiny example before abstraction,
   conversational "let's think about it" instructor voice, explicit demystifying
   ("no magic"), honesty about the hard part, and teach-it-back meta-advice.

   Single file. Tailwind core utilities only. No external assets.
============================================================================ */

/* Theme palettes + ThemeContext/useTheme live in theme.js; module-scope course
   data lives in data.js; pure helpers and logic live in logic.js. All imported
   at the top of this file. */



/* Reveal wrapper — in the paginated layout a whole lecture appears at once
   (the .lecture fade-in handles entry), so this just renders its children. */
function Reveal({ children, className }) {
  return <div className={className}>{children}</div>;
}

/* ----------------------------- shared UI bits ---------------------------- */
function Aside({ tag, color, children }) {
  const C = useTheme(); color = color || C.cyan;
  return (
    <div className="my-7 rounded-r-lg pl-5 pr-5 py-4"
         style={{ borderLeft: `2px solid ${color}`, background: `linear-gradient(90deg, ${color}11, transparent)` }}>
      {tag && (
        <div className="font-mono text-[11px] tracking-[0.12em] uppercase mb-2" style={{ color }}>
          {tag}
        </div>
      )}
      <div className="text-[15px] leading-relaxed" style={{ color: C.text }}>{children}</div>
    </div>
  );
}

function Pill({ children, color }) {
  const C = useTheme(); color = color || C.cyan;
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-full"
          style={{ border: `1px solid ${color}`, color }}>
      {children}
    </span>
  );
}

/* Instructor voice — Karpathy-style "let's think about this" aside.
   First-person plural, conversational, thinking-aloud. Used to set up intuition
   before formalism and to explicitly demystify ("this isn't magic"). */
function Instructor({ children, label = "let's think about it" }) {
  const C = useTheme();
  return (
    <div className="my-7 rounded-2xl p-5 sm:p-6 relative overflow-hidden"
         style={{ background: C.ink3, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold"
             style={{ background: C.cyan, color: C.ink }}>↳</div>
        <span className="font-mono text-[11px] tracking-[0.14em] uppercase" style={{ color: C.cyan }}>{label}</span>
      </div>
      <div className="text-[16px] leading-[1.72]" style={{ color: C.text }}>{children}</div>
    </div>
  );
}

/* From-scratch code block — Karpathy's "no black boxes": show the actual thing
   in a few readable lines. Tiny faux-syntax highlighter, comments emphasized. */
function CodeBlock({ title, lines }) {
  const C = useTheme();
  const [copied, setCopied] = useState(false);
  const copyRef = useRef(0);
  const copy = () => {
    const text = lines.join("\n");
    const done = () => { setCopied(true); clearTimeout(copyRef.current); copyRef.current = setTimeout(() => setCopied(false), 1600); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(done);
    else done();
  };
  return (
    <div className="my-6 rounded-xl overflow-hidden border" style={{ borderColor: C.line, background: C.codeBg }}>
      {title && (
        <div className="px-4 py-2 flex items-center gap-2 border-b" style={{ borderColor: C.codeBar, background: C.codeBar }}>
          <span className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#57534a" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#57534a" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#57534a" }} />
          </span>
          <span className="font-mono text-[12px] ml-1" style={{ color: C.textDim }}>{title}</span>
          <button onClick={copy} aria-label="Copy code to clipboard"
            className="ml-auto font-mono text-[11px] px-2 py-1 rounded-md transition-all"
            style={{ color: copied ? C.green : C.textFaint, border: `1px solid ${copied ? C.green : C.line}` }}>
            {copied ? "copied ✓" : "copy"}
          </button>
        </div>
      )}
      <pre className="px-4 py-4 overflow-x-auto font-mono text-[13px] leading-[1.85]" style={{ margin: 0 }}>
        {lines.map((ln, i) => (
          <div key={i} className="flex">
            <span className="select-none pr-4 text-right" style={{ color: "#5b564c", minWidth: 28 }}>{i + 1}</span>
            <code dangerouslySetInnerHTML={{ __html: pyHighlight(ln) }} />
          </div>
        ))}
      </pre>
    </div>
  );
}

/* The V-JEPA 2 planning loop, shown as readable code inside an Instructor aside */
function CodeBlockInline() {
  return (
    <CodeBlock title="plan.py — turning a predictor into a controller (MPC + CEM)"
      lines={[
        "goal = encode(goal_image)          # where we want to end up (an embedding)",
        "for step in range(horizon):",
        "    # Cross-Entropy Method: sample action sequences from a Gaussian,",
        "    candidates = sample_from_gaussian(mu, sigma)   # ~800 of them",
        "    for actions in candidates:",
        "        future = predict(current_state, actions)   # roll out in latent space",
        "        energy = L1(future, goal)                  # distance to goal embedding",
        "    mu, sigma = refit_to_best(candidates, energy)  # keep elites, repeat ~10x",
        "    do(best[0]); current_state = look()   # execute one action, then re-plan",
      ]} />
  );
}

/* A reusable "predict first" prompt — core to the pretesting tactic */
function GuessGate({ question, options, correct, explanation, onResolved,
  tag = "Predict first", hint = "guessing before you're told makes the answer stick", accent }) {
  const C = useTheme();
  const [picked, setPicked] = useState(null);
  const done = picked !== null;
  const chipColor = accent || C.violet;
  return (
    <div className="my-8 rounded-2xl border p-5 sm:p-6"
         style={{ borderColor: C.line, background: C.ink2 }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-[11px] tracking-wider uppercase px-2 py-0.5 rounded"
              style={{ background: C.line, color: chipColor }}>
          {tag}
        </span>
        <span className="text-xs" style={{ color: C.textFaint }}>
          {hint}
        </span>
      </div>
      <p className="text-[16px] mb-4" style={{ color: C.textHi }}>{question}</p>
      <div className="grid gap-2">
        {options.map((o, i) => {
          const isC = i === correct;
          const state = !done ? "idle" : isC ? "right" : i === picked ? "wrong" : "dim";
          return (
            <button
              key={i}
              disabled={done}
              onClick={() => { setPicked(i); onResolved && onResolved(); }}
              className="text-left rounded-xl px-4 py-3 text-[15px] transition-all duration-200 border"
              style={{
                cursor: done ? "default" : "pointer",
                borderColor: state === "right" ? C.green : state === "wrong" ? C.amber : C.line,
                background: state === "right" ? C.okBg : state === "wrong" ? C.warnBg : C.ink3,
                color: state === "dim" ? C.textFaint : C.text,
                opacity: state === "dim" ? 0.5 : 1,
              }}
            >
              <span className="font-mono text-xs mr-2" style={{ color: state==="right"?C.green:state==="wrong"?C.amber:C.textFaint }}>
                {String.fromCharCode(65 + i)}
              </span>
              {o}
              {done && isC && <span className="ml-2" style={{ color: C.green }}>✓</span>}
              {done && state === "wrong" && <span className="ml-2" style={{ color: C.amber }}>✗</span>}
            </button>
          );
        })}
      </div>
      <div className="overflow-hidden transition-all duration-500"
           style={{ maxHeight: done ? 240 : 0, opacity: done ? 1 : 0 }}>
        <div className="mt-4 pt-4 text-[15px] leading-relaxed border-t"
             style={{ borderColor: C.line, color: C.text }}>
          {explanation}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  INTERACTIVE 2 — Masking + prediction in latent space (the architecture)    */
/* ========================================================================== */
function MaskingLab() {
  const C = useTheme();
  const GRID = 6;
  const total = GRID * GRID;
  // context = visible, target = masked. Pre-seed a sensible split.
  const [masked, setMasked] = useState(() => {
    const s = new Set();
    // a contiguous-ish target block
    [8, 9, 10, 14, 15, 16, 20, 21, 22].forEach((i) => s.add(i));
    return s;
  });
  const [phase, setPhase] = useState("idle"); // idle -> encoding -> predicting -> done
  const maskedCount = masked.size;
  const ctxCount = total - maskedCount;

  const toggle = (i) => {
    if (phase !== "idle") return;
    setMasked((prev) => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };

  const run = () => {
    setPhase("encoding");
    setTimeout(() => setPhase("predicting"), 900);
    setTimeout(() => setPhase("done"), 2000);
  };
  const reset = () => setPhase("idle");

  const ratio = maskedCount / total;
  const hint =
    ratio === 0 ? "Mask some patches — those become the prediction targets." :
    ratio < 0.15 ? "Very little masked. Easy to predict, but the model barely has to learn." :
    ratio > 0.7 ? "Almost everything masked. Too little context to predict from." :
    "A healthy split: enough context to reason from, a meaningful target to predict.";

  return (
    <div className="my-8 rounded-2xl border overflow-hidden" style={{ borderColor: C.line, background: C.ink2 }}>
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <h4 className="font-semibold text-lg" style={{ color: C.textHi }}>Build a JEPA forward pass</h4>
          <Pill>interactive</Pill>
        </div>
        <p className="text-sm mb-5" style={{ color: C.textDim }}>
          Tap patches to mask them. The visible patches are the <span style={{color:C.cyan}}>context</span>; the
          masked ones are the <span style={{color:C.violet}}>targets</span>. Then run the model and watch
          prediction happen <em>in representation space</em> — never in pixels.
        </p>

        <div className="flex flex-col lg:flex-row gap-6 items-center">
          {/* the image grid */}
          <div className="shrink-0">
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)`, width: 252 }}>
              {Array.from({ length: total }).map((_, i) => {
                const isMasked = masked.has(i);
                const row = Math.floor(i / GRID), col = i % GRID;
                // a faux "scene": gradient so masking feels like hiding real content
                const bg = `hsl(${190 + col * 6}, ${30 + row * 4}%, ${18 + (row + col) * 2}%)`;
                const predicted = phase === "done" && isMasked;
                return (
                  <button
                    key={i}
                    onClick={() => toggle(i)}
                    className="aspect-square rounded-md transition-all duration-300 flex items-center justify-center overflow-hidden"
                    style={{
                      background: isMasked ? C.ink3 : bg,
                      border: isMasked
                        ? `1.5px ${predicted ? "solid" : "dashed"} ${predicted ? C.cyan : C.violet}`
                        : `1px solid ${C.cyan}55`,
                      cursor: phase === "idle" ? "pointer" : "default",
                      boxShadow: predicted ? `0 0 10px ${C.cyan}66` : "none",
                      transform: phase === "encoding" && !isMasked ? "scale(0.92)" : "none",
                    }}
                    aria-label={isMasked ? (predicted ? "predicted embedding vector (not pixels)" : "masked target patch") : "visible context patch"}
                  >
                    {predicted && <EmbeddingGlyph seed={i} />}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 font-mono text-[11px]" style={{ color: C.textFaint }}>
              <span style={{ color: C.cyan }}>context · {ctxCount}</span>
              <span style={{ color: C.violet }}>target · {maskedCount}</span>
            </div>
          </div>

          {/* the pipeline state */}
          <div className="flex-1 w-full">
            <PipelineStep label="Context encoder" sub="ViT · trainable"
              active={phase === "encoding"} done={phase === "predicting" || phase === "done"} color={C.cyan} />
            <Connector on={phase === "predicting" || phase === "done"} />
            <PipelineStep label="Predictor" sub="given target positions → predicts target embeddings"
              active={phase === "predicting"} done={phase === "done"} color={C.cyan} />
            <Connector on={phase === "done"} />
            <PipelineStep label="Loss in embedding space" sub="‖ predicted − target ‖²  (no pixels involved)"
              active={false} done={phase === "done"} color={C.amber} />

            <div className="text-[13px] mt-4 mb-4 min-h-[34px]" style={{ color: C.textDim }}>{hint}</div>
            <div className="flex gap-2">
              <button onClick={phase === "idle" ? run : reset}
                disabled={phase !== "idle" && phase !== "done"}
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                style={{
                  background: phase === "idle" ? C.cyan : "transparent",
                  color: phase === "idle" ? C.ink : C.cyan,
                  border: `1px solid ${C.cyan}`,
                  cursor: (phase === "encoding" || phase === "predicting") ? "wait" : "pointer",
                  opacity: (phase === "encoding" || phase === "predicting") ? 0.6 : 1,
                }}>
                {phase === "idle" ? "▶ Run the model" : phase === "done" ? "↺ Reset" : "running…"}
              </button>
            </div>
          </div>
        </div>

        {phase === "done" && (
          <div className="mt-5 rounded-xl p-4 text-[14px] leading-relaxed transition-all"
               style={{ background: C.ink3, color: C.text }}>
            <div className="font-mono text-[12px] mb-2 flex items-center gap-2" style={{ color: C.amber }}>
              <span>‖ ŝ<sub>y</sub> − s<sub>y</sub> ‖</span>
              <span style={{ color: C.textFaint }}>→</span>
              <span style={{ color: C.cyan }}>0.07</span>
              <span style={{ color: C.textFaint }}>(the prediction landed on the target — the loss is just this distance, in embedding space)</span>
            </div>
            Notice the targets didn't get <em>redrawn</em> — each resolves to a little <span style={{color:C.cyan}}>vector glyph</span>, not a patch of pixels.
            The predictor never drew a single pixel; it predicted the <span style={{color:C.cyan}}>embeddings</span> of
            the hidden patches from the visible ones. That's the whole trick — and why JEPA can ignore
            unpredictable detail while still learning what the scene <em>means</em>.
          </div>
        )}
      </div>
    </div>
  );
}
/* A tiny "embedding vector" glyph: a few bars of deterministic height — stands in
   for a predicted representation, so a resolved target reads as a vector, not a redrawn pixel. */
function EmbeddingGlyph({ seed = 0 }) {
  const C = useTheme();
  const bars = Array.from({ length: 5 }, (_, k) => {
    const h = 28 + ((Math.sin((seed + 1) * (k + 2) * 1.7) * 0.5 + 0.5) * 64); // 28–92%
    return h;
  });
  return (
    <div className="flex items-end justify-center gap-[2px]" style={{ width: "72%", height: "56%" }} aria-hidden="true">
      {bars.map((h, k) => (
        <span key={k} style={{ width: 3, height: `${h}%`, background: C.cyan, opacity: 0.55 + 0.4 * (h / 92), borderRadius: 1 }} />
      ))}
    </div>
  );
}
function PipelineStep({ label, sub, active, done, color }) {
  const C = useTheme();
  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300"
         style={{
           background: active ? `${color}18` : done ? C.ink3 : C.ink2,
           border: `1px solid ${active ? color : done ? color + "55" : C.line}`,
         }}>
      <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-all"
           style={{ background: active ? color : done ? color + "33" : C.line,
                    color: active ? C.ink : color }}>
        {done ? "✓" : active ? "•" : ""}
      </div>
      <div>
        <div className="text-sm font-medium" style={{ color: done || active ? C.textHi : C.textDim }}>{label}</div>
        <div className="text-[11px] font-mono" style={{ color: C.textFaint }}>{sub}</div>
      </div>
    </div>
  );
}
function Connector({ on }) {
  const C = useTheme();
  return (
    <div className="h-4 ml-[27px] w-px my-0.5 transition-all duration-500"
         style={{ background: on ? C.cyan : C.line }} />
  );
}

/* ========================================================================== */
/*  INTERACTIVE 4 — Three approaches, side by side (compare on demand)         */
/* ========================================================================== */
function ApproachCompare() {
  const C = useTheme();
  const [sel, setSel] = useState("jepa");
  const data = {
    gen: {
      name: "Generative", color: C.amber,
      tagline: "Reconstruct the missing data",
      where: "Loss in DATA space (pixels / tokens)",
      examples: "Masked Autoencoders, diffusion, LLM next-token",
      strength: "General, powerful, great at producing outputs",
      weakness: "Forced to model unpredictable detail; over-spends on low-level features",
      flow: ["x", "encode", "decode → ŷ", "compare to y in pixels"],
    },
    con: {
      name: "Contrastive", color: C.violet,
      tagline: "Pull same together, push different apart",
      where: "Loss in EMBEDDING space",
      examples: "SimCLR, MoCo, CPC",
      strength: "Strong features without a decoder",
      weakness: "Needs negatives, big batches, hand-crafted augmentations — sparse signal",
      flow: ["x, y", "encode both", "sx ↔ sy", "± by similarity"],
    },
    jepa: {
      name: "JEPA", color: C.cyan,
      tagline: "Predict the target's embedding from the context's",
      where: "Loss in EMBEDDING space",
      examples: "I-JEPA, V-JEPA, V-JEPA 2, LeJEPA",
      strength: "No decoder, no negatives; discards noise; predictor = world model",
      weakness: "Must actively prevent representation collapse",
      flow: ["x, y", "encode both", "predict sy from sx", "loss in latent space"],
    },
  };
  const d = data[sel];
  return (
    <div className="my-8">
      <div className="flex gap-2 mb-4">
        {Object.entries(data).map(([k, v]) => (
          <button key={k} onClick={() => setSel(k)}
            className="flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
            style={{
              background: sel === k ? `${v.color}1f` : C.ink2,
              border: `1px solid ${sel === k ? v.color : C.line}`,
              color: sel === k ? C.textHi : C.textDim,
            }}>
            {v.name}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: d.color + "66", background: C.ink2 }}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl font-semibold" style={{ color: C.textHi }}>{d.name}</span>
          <span className="text-sm italic" style={{ color: d.color }}>{d.tagline}</span>
        </div>
        {/* flow */}
        <div className="flex items-center gap-2 flex-wrap mb-5">
          {d.flow.map((f, i) => (
            <React.Fragment key={i}>
              <span className="font-mono text-[12px] rounded-lg px-2.5 py-1.5"
                    style={{ background: C.ink3, color: i === d.flow.length-1 ? d.color : C.text, border:`1px solid ${C.line}` }}>
                {f}
              </span>
              {i < d.flow.length - 1 && <span style={{ color: C.textFaint }}>→</span>}
            </React.Fragment>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-[14px]">
          <Row k="Where loss lives" v={d.where} color={d.color} />
          <Row k="Examples" v={d.examples} />
          <Row k="Strength" v={d.strength} />
          <Row k="Weakness" v={d.weakness} />
        </div>
        {sel === "jepa" && (
          <div className="mt-4 text-[13px] leading-relaxed rounded-xl p-3" style={{ background: C.ink3, color: C.textDim }}>
            JEPA's closest kin aren't the contrastive methods — they're the <span style={{ color: C.cyan }}>non-contrastive</span> ones:
            DINO, BYOL, and SimSiam use <em>no negatives at all</em>. They learn by <em>self-distillation</em> — the network learns from a
            slowly-updated copy of itself — kept from collapsing by other tricks (DINO's "centering + sharpening" of the teacher's outputs,
            or BYOL/SimSiam's stop-gradient + predictor head). Same anti-collapse family, same "loss in embedding space, no decoder" spirit —
            just comparing two augmented views rather than predicting one region's embedding from another's.
          </div>
        )}
      </div>
    </div>
  );
}
function Row({ k, v, color }) {
  const C = useTheme();
  return (
    <div className="rounded-xl p-3" style={{ background: C.ink3 }}>
      <div className="font-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: C.textFaint }}>{k}</div>
      <div style={{ color: color || C.text }}>{v}</div>
    </div>
  );
}

/* ========================================================================== */
/*  INTERACTIVE 5 — Discovery timeline (each problem motivates the next idea)  */
/* ========================================================================== */
function DiscoveryTimeline() {
  const C = useTheme();
  const [open, setOpen] = useState(0);
  const [ideaShown, setIdeaShown] = useState(false);
  const openNode = (i) => { if (open === i) { setOpen(-1); } else { setOpen(i); setIdeaShown(false); } };
  return (
    <div className="my-8">
      <p className="text-sm mb-5" style={{ color: C.textDim }}>
        JEPA wasn't invented in one leap. Each step below solved the problem the previous one exposed.
        Click through and watch the idea become <em style={{color:C.cyan, fontStyle:"normal"}}>inevitable</em>.
      </p>
      <div className="relative">
        {TIMELINE.map((it, i) => {
          const active = open === i;
          const ic = C[it.c] || C.cyan;
          const last = i === TIMELINE.length - 1;
          return (
            <div key={i} className="relative pl-8 pb-3 last:pb-0">
              {/* connector: from this dot's center straight down to the next dot */}
              {!last && <div className="absolute left-[6px] top-[10px] bottom-0 w-px" style={{ background: C.line }} />}
              <div className="absolute left-0 top-[5px] w-3.5 h-3.5 rounded-full transition-all"
                   style={{ background: active ? ic : C.ink, border: `2px solid ${ic}` }} />
              <button onClick={() => openNode(i)}
                className="w-full text-left rounded-xl px-4 py-3 transition-all"
                style={{ background: active ? C.ink2 : "transparent",
                         border: `1px solid ${active ? ic + "66" : "transparent"}` }}>
                <div className="font-mono text-xs mb-0.5" style={{ color: ic }}>{it.yr}</div>
                <div className="font-semibold text-[16px]" style={{ color: C.textHi }}>{it.t}</div>
                <div className="overflow-hidden transition-all duration-400"
                     style={{ maxHeight: active ? 320 : 0, opacity: active ? 1 : 0 }}>
                  <div className="mt-2 text-[14px]" style={{ color: C.textDim }}>
                    <span className="font-mono text-[11px] uppercase tracking-wide" style={{color:C.amber}}>Problem · </span>
                    {it.problem}
                  </div>
                  {ideaShown ? (
                    <div className="mt-1.5 text-[14px]" style={{ color: C.text }}>
                      <span className="font-mono text-[11px] uppercase tracking-wide" style={{color:ic}}>Idea · </span>
                      {it.idea}
                    </div>
                  ) : (
                    <span role="button" tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); setIdeaShown(true); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); e.preventDefault(); setIdeaShown(true); } }}
                      className="inline-block mt-2 font-mono text-[11px] uppercase tracking-wide"
                      style={{ color: ic, cursor: "pointer", borderBottom: `1px dotted ${ic}` }}>
                      How would you solve it? ▸ reveal the idea
                    </span>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  INTERACTIVE 6 — Model explorer (the JEPA family deep dives)                */
/* ========================================================================== */
function ModelExplorer() {
  const C = useTheme();
  const [id, setId] = useState("ijepa");
  const m = MODELS.find((x) => x.id === id);
  return (
    <div className="my-8">
      <div className="flex gap-2 flex-wrap mb-4">
        {MODELS.map((x) => (
          <button key={x.id} onClick={() => setId(x.id)}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
            style={{
              background: id === x.id ? C.cyan : C.ink2,
              color: id === x.id ? C.ink : C.text,
              border: `1px solid ${id === x.id ? C.cyan : C.line}`,
            }}>
            {x.name}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: C.line, background: C.ink2 }}>
        <div className="px-6 py-4 flex items-baseline gap-3 flex-wrap"
             style={{ background: C.ink3, borderBottom: `1px solid ${C.line}` }}>
          <span className="text-2xl font-bold" style={{ color: C.textHi }}>{m.name}</span>
          <span className="font-mono text-xs" style={{ color: C.textFaint }}>{m.domain} · {m.year}</span>
          <span className="ml-auto"><Pill>{m.pill}</Pill></span>
        </div>
        <div className="p-6">
          <p className="text-[16px] mb-4" style={{ color: C.text }}>{m.blurb}</p>
          <Aside tag="Why it matters" color={C.cyan}>{m.why}</Aside>
          <div className="flex gap-5 flex-wrap pt-4 mt-2" style={{ borderTop: `1px solid ${C.line}` }}>
            {m.stats.map(([v, l], i) => (
              <div key={i} className="min-w-[110px]">
                <div className="font-bold text-2xl leading-none" style={{ color: C.cyan, fontFamily: "var(--font-display)" }}>{v}</div>
                <div className="text-[12px] font-mono mt-1.5" style={{ color: C.textFaint }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  Retrieval checkpoint quiz (spaced practice, immediate feedback)            */
/* ========================================================================== */
function Checkpoint({ items, onComplete }) {
  const C = useTheme();
  const [answers, setAnswers] = useState({});
  const allDone = Object.keys(answers).length === items.length;
  const score = scoreQuiz(items, answers);
  useEffect(() => { if (allDone && onComplete) onComplete(); }, [allDone]);
  return (
    <div className="my-8 rounded-2xl border p-5 sm:p-6" style={{ borderColor: C.cyan + "55", background: C.ink2 }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-[11px] tracking-wider uppercase px-2 py-0.5 rounded"
              style={{ background: C.okBg, color: C.cyanDeep }}>Checkpoint</span>
        <span className="text-xs" style={{ color: C.textFaint }}>retrieve what you just learned — this is where it locks in</span>
      </div>
      {items.map((it, qi) => {
        const picked = answers[qi];
        const answered = picked !== undefined;
        return (
          <div key={qi} className="mt-5">
            <p className="text-[15px] mb-2.5" style={{ color: C.textHi }}>{qi + 1}. {it.q}</p>
            <div className="grid gap-2">
              {it.options.map((o, oi) => {
                const isC = oi === it.correct;
                const st = !answered ? "idle" : isC ? "right" : oi === picked ? "wrong" : "dim";
                return (
                  <button key={oi} disabled={answered}
                    onClick={() => setAnswers((p) => ({ ...p, [qi]: oi }))}
                    className="text-left rounded-lg px-3.5 py-2.5 text-[14px] transition-all border"
                    style={{
                      cursor: answered ? "default" : "pointer",
                      borderColor: st === "right" ? C.green : st === "wrong" ? C.amber : C.line,
                      background: st === "right" ? C.okBg : st === "wrong" ? C.warnBg : C.ink3,
                      color: st === "dim" ? C.textFaint : C.text,
                      opacity: st === "dim" ? 0.5 : 1,
                    }}>
                    {o}{answered && isC && <span style={{ color: C.green }}> ✓</span>}
                    {answered && st === "wrong" && <span style={{ color: C.amber }}> ✗</span>}
                  </button>
                );
              })}
            </div>
            {answered && (
              <div className="text-[13px] mt-2 leading-relaxed" style={{ color: C.textDim }}>{it.why}</div>
            )}
          </div>
        );
      })}
      {allDone && (
        <div className="mt-5 rounded-xl p-4 text-center"
             style={{ background: C.ink3, border: `1px solid ${C.cyan}55` }}>
          <span className="text-lg font-semibold" style={{ color: C.cyan }}>{score} / {items.length}</span>
          <span className="text-sm ml-2" style={{ color: C.textDim }}>
            {score === items.length ? "locked in. onward." : "good — the ones you missed are the ones worth re-reading."}
          </span>
        </div>
      )}
    </div>
  );
}

/* ========================================================================== */
/*  Glossary — click-to-expand key terms (quick-reference + retention aid)      */
/* ========================================================================== */
function Glossary() {
  const C = useTheme();
  const [open, setOpen] = useState(null);
  return (
    <div className="my-8">
      <div className="grid sm:grid-cols-2 gap-2">
        {GLOSSARY.map(([term, def], i) => {
          const active = open === i;
          return (
            <button key={i} onClick={() => setOpen(active ? null : i)}
              className="text-left rounded-xl p-4 transition-all"
              style={{ background: active ? C.ink3 : C.ink2, border: `1px solid ${active ? C.cyan + "88" : C.line}` }}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[14.5px]" style={{ color: active ? C.cyan : C.textHi }}>{term}</span>
                <span className="font-mono text-sm shrink-0" style={{ color: C.textFaint }}>{active ? "−" : "+"}</span>
              </div>
              <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: active ? 160 : 0, opacity: active ? 1 : 0 }}>
                <p className="text-[13.5px] leading-relaxed mt-2" style={{ color: C.textDim }}>{def}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  World-model landscape — compare the JEPA-family world models on the axes    */
/*  that actually distinguish them: is the encoder frozen or trained end-to-end, */
/*  how many loss terms, how it avoids collapse, planning cost.                 */
/* ========================================================================== */
function WorldModelLandscape() {
  const C = useTheme();
  const [id, setId] = useState("lewm");
  const m = WORLD_MODELS.find((x) => x.id === id);
  const col = C[m.color] || C.cyan;
  return (
    <div className="my-8">
      <div className="flex gap-2 flex-wrap mb-4">
        {WORLD_MODELS.map((x) => (
          <button key={x.id} onClick={() => setId(x.id)}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
            style={{ background: id === x.id ? (C[x.color] || C.cyan) : C.ink2,
                     color: id === x.id ? C.ink : C.text,
                     border: `1px solid ${id === x.id ? (C[x.color] || C.cyan) : C.line}` }}>
            {x.name}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: col + "66", background: C.ink2 }}>
        <div className="px-6 py-4 flex items-baseline gap-3 flex-wrap" style={{ background: C.ink3, borderBottom: `1px solid ${C.line}` }}>
          <span className="text-xl font-bold" style={{ color: C.textHi }}>{m.name}</span>
          <span className="font-mono text-xs" style={{ color: C.textFaint }}>{m.who}</span>
        </div>
        <div className="p-6">
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <Row k="Encoder" v={m.encoder} color={col} />
            <Row k="How it avoids collapse" v={m.collapse} />
            <Row k="Loss" v={m.loss} />
            <Row k="Planning" v={m.plan} />
          </div>
          <p className="text-[14px] leading-relaxed" style={{ color: C.textDim }}>{m.note}</p>
        </div>
      </div>
      <p className="text-[13px] mt-3" style={{ color: C.textFaint }}>
        The axis that matters: <span style={{ color: C.violet }}>freeze the encoder</span> (safe but inherited features)
        vs. <span style={{ color: C.amber }}>train end-to-end</span> (powerful but collapse-prone). LeWM's claim is that
        SIGReg finally lets you have the second without the fragility.
      </p>
    </div>
  );
}

/* ========================================================================== */
/*  V-JEPA 2 two-stage training — click each stage to see what it adds.         */
/* ========================================================================== */
function TwoStageTraining() {
  const C = useTheme();
  const [stage, setStage] = useState(1);
  const stages = {
    1: {
      title: "Stage 1 · Action-free pretraining",
      data: "1M+ hours of internet video + images",
      learns: "Predict masked future representations from visible context. No actions, no rewards, no labels — just broad physical intuition about how scenes evolve.",
      out: "A general video world model (ViT-g encoder + predictor) that understands motion and anticipates what happens next.",
      color: C.cyan,
    },
    2: {
      title: "Stage 2 · Action-conditioned post-training (V-JEPA 2-AC)",
      data: "< 62 hours of unlabeled robot video (DROID)",
      learns: "Freeze the encoder. Train a new predictor that takes the current latent state AND a robot action, and predicts the next latent state — the 'if I do this, then that' of interaction.",
      out: "A controllable world model you can plan against with MPC — deployable zero-shot on robot arms in unseen labs.",
      color: C.violet,
    },
  };
  const s = stages[stage];
  return (
    <div className="my-8 rounded-2xl border overflow-hidden" style={{ borderColor: C.line, background: C.ink2 }}>
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h4 className="font-semibold text-lg" style={{ color: C.textHi }}>How V-JEPA 2 is trained</h4>
          <Pill color={C.amber}>interactive</Pill>
        </div>
        {/* stage rail */}
        <div className="flex items-stretch gap-2 mb-5">
          {[1, 2].map((n) => {
            const active = stage === n;
            const col = stages[n].color;
            return (
              <button key={n} onClick={() => setStage(n)}
                className="flex-1 rounded-xl px-4 py-3 text-left transition-all"
                style={{ background: active ? `${col}1f` : C.ink3, border: `1px solid ${active ? col : C.line}` }}>
                <div className="font-mono text-[11px] uppercase tracking-wider mb-1" style={{ color: col }}>stage {n}</div>
                <div className="text-[13.5px] font-medium" style={{ color: active ? C.textHi : C.textDim }}>
                  {n === 1 ? "Learn to predict (action-free)" : "Learn to act (action-conditioned)"}
                </div>
              </button>
            );
          })}
        </div>
        {/* flow chips */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {[s.data, "→ encoder", stage === 2 ? "+ action" : "+ mask", "→ predict latent", s.out.split("—")[0]].map((chip, i, arr) => (
            <React.Fragment key={i}>
              <span className="font-mono text-[11.5px] rounded-lg px-2.5 py-1.5"
                    style={{ background: C.ink3, border: `1px solid ${C.line}`, color: i === arr.length - 1 ? s.color : C.text }}>
                {chip}
              </span>
              {i < arr.length - 1 && <span style={{ color: C.textFaint }}>→</span>}
            </React.Fragment>
          ))}
        </div>
        <div className="rounded-xl p-4" style={{ background: C.ink3, borderLeft: `3px solid ${s.color}` }}>
          <div className="font-semibold text-[15px] mb-2" style={{ color: C.textHi }}>{s.title}</div>
          <p className="text-[14px] leading-relaxed mb-2" style={{ color: C.text }}>{s.learns}</p>
          <p className="text-[13px] leading-relaxed" style={{ color: C.textDim }}><span style={{ color: s.color }}>Result: </span>{s.out}</p>
        </div>
        <p className="text-[13px] mt-4" style={{ color: C.textDim }}>
          The striking part is the ratio: <span style={{ color: C.cyan }}>a million hours</span> of cheap observation gives the
          physics; <span style={{ color: C.violet }}>62 hours</span> of robot data is enough to make it controllable. Watching is most of learning.
        </p>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  Architecture schematic — the canonical JEPA diagram, theme-aware SVG.       */
/*  Static but information-dense: shows the three networks and, crucially, the  */
/*  asymmetry (EMA arrow + stop-gradient) that text alone makes hard to see.    */
/* ========================================================================== */
function ArchitectureDiagram() {
  const C = useTheme();
  const sub = C.textFaint, txt = C.textDim;
  return (
    <figure className="my-8 rounded-2xl border overflow-hidden" style={{ borderColor: C.line, background: C.ink2 }}>
      <svg viewBox="0 0 720 360" className="w-full h-auto" role="img"
           aria-label="JEPA architecture: context encoder, target encoder with EMA and stop-gradient, and predictor; loss computed in embedding space.">
        <defs>
          <marker id="arrowC" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={C.cyan} /></marker>
          <marker id="arrowN" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={C.textFaint} /></marker>
        </defs>

        {/* context (top) branch */}
        <text x="60" y="70" fill={txt} fontSize="12" fontFamily="ui-monospace, Menlo, monospace" textAnchor="middle">context x</text>
        <rect x="24" y="80" width="72" height="46" rx="8" fill={C.ink3} stroke={C.cyan} />
        <text x="60" y="100" fill={C.cyan} fontSize="11" fontFamily="ui-monospace, Menlo, monospace" textAnchor="middle">visible</text>
        <text x="60" y="114" fill={C.cyan} fontSize="11" fontFamily="ui-monospace, Menlo, monospace" textAnchor="middle">patches</text>

        <line x1="96" y1="103" x2="150" y2="103" stroke={C.textFaint} strokeWidth="1.5" markerEnd="url(#arrowN)" />
        <rect x="150" y="78" width="104" height="50" rx="8" fill={C.ink3} stroke={C.cyan} />
        <text x="202" y="98" fill={C.textHi} fontSize="12" fontFamily="var(--font-display)" textAnchor="middle">Context</text>
        <text x="202" y="113" fill={C.textHi} fontSize="12" fontFamily="var(--font-display)" textAnchor="middle">Encoder</text>
        <text x="202" y="142" fill={sub} fontSize="9.5" fontFamily="ui-monospace, Menlo, monospace" textAnchor="middle">trained · ViT</text>

        <line x1="254" y1="103" x2="300" y2="103" stroke={C.textFaint} strokeWidth="1.5" markerEnd="url(#arrowN)" />
        <circle cx="318" cy="103" r="18" fill={C.ink3} stroke={C.cyan} /><text x="318" y="107" fill={C.cyan} fontSize="12" fontFamily="ui-monospace, Menlo, monospace" textAnchor="middle">s_x</text>

        {/* predictor */}
        <line x1="336" y1="103" x2="386" y2="103" stroke={C.cyan} strokeWidth="2" markerEnd="url(#arrowC)" />
        <rect x="386" y="78" width="104" height="50" rx="8" fill={C.ink3} stroke={C.cyan} strokeWidth="1.6" />
        <text x="438" y="98" fill={C.textHi} fontSize="12" fontFamily="var(--font-display)" textAnchor="middle">Predictor</text>
        <text x="438" y="113" fill={txt} fontSize="9" fontFamily="ui-monospace, Menlo, monospace" textAnchor="middle">+ target pos / z</text>
        <text x="438" y="142" fill={sub} fontSize="9.5" fontFamily="ui-monospace, Menlo, monospace" textAnchor="middle">narrow ViT</text>

        <line x1="490" y1="103" x2="536" y2="103" stroke={C.cyan} strokeWidth="2" markerEnd="url(#arrowC)" />
        <circle cx="556" cy="103" r="20" fill={C.ink3} stroke={C.cyan} strokeDasharray="3 2" /><text x="556" y="107" fill={C.cyan} fontSize="11" fontFamily="ui-monospace, Menlo, monospace" textAnchor="middle">ŝ_y</text>

        {/* target (bottom) branch */}
        <text x="60" y="250" fill={txt} fontSize="12" fontFamily="ui-monospace, Menlo, monospace" textAnchor="middle">target y</text>
        <rect x="24" y="258" width="72" height="46" rx="8" fill={C.ink3} stroke={C.violet} />
        <text x="60" y="285" fill={C.violet} fontSize="11" fontFamily="ui-monospace, Menlo, monospace" textAnchor="middle">full input</text>

        <line x1="96" y1="281" x2="150" y2="281" stroke={C.textFaint} strokeWidth="1.5" markerEnd="url(#arrowN)" />
        <rect x="150" y="256" width="104" height="50" rx="8" fill={C.ink3} stroke={C.violet} />
        <text x="202" y="276" fill={C.textHi} fontSize="12" fontFamily="var(--font-display)" textAnchor="middle">Target</text>
        <text x="202" y="291" fill={C.textHi} fontSize="12" fontFamily="var(--font-display)" textAnchor="middle">Encoder</text>
        <text x="202" y="320" fill={sub} fontSize="9.5" fontFamily="ui-monospace, Menlo, monospace" textAnchor="middle">EMA · stop-grad</text>

        <line x1="254" y1="281" x2="528" y2="281" stroke={C.textFaint} strokeWidth="1.5" markerEnd="url(#arrowN)" />
        <circle cx="556" cy="281" r="20" fill={C.ink3} stroke={C.violet} /><text x="556" y="285" fill={C.violet} fontSize="11" fontFamily="ui-monospace, Menlo, monospace" textAnchor="middle">s_y</text>

        {/* EMA weight-copy arrow (context -> target) */}
        <path d="M202,128 C150,165 150,220 202,256" fill="none" stroke={sub} strokeWidth="1.3" strokeDasharray="4 3" markerEnd="url(#arrowN)" />
        <text x="120" y="195" fill={sub} fontSize="9" fontFamily="ui-monospace, Menlo, monospace" textAnchor="middle">EMA copy</text>

        {/* loss between ŝ_y and s_y */}
        <line x1="556" y1="123" x2="556" y2="261" stroke={C.amber} strokeWidth="1.5" strokeDasharray="3 3" />
        <rect x="600" y="168" width="96" height="48" rx="8" fill={C.ink3} stroke={C.amber} />
        <text x="648" y="188" fill={C.amber} fontSize="11" fontFamily="var(--font-display)" textAnchor="middle">loss</text>
        <text x="648" y="204" fill={txt} fontSize="9" fontFamily="ui-monospace, Menlo, monospace" textAnchor="middle">‖ŝ_y − s_y‖</text>
        <line x1="576" y1="103" x2="600" y2="180" stroke={C.amber} strokeWidth="1.3" strokeDasharray="3 3" />
        <line x1="576" y1="281" x2="600" y2="206" stroke={C.amber} strokeWidth="1.3" strokeDasharray="3 3" />
      </svg>
      <figcaption className="px-5 py-3 text-[13px] border-t" style={{ borderColor: C.line, color: C.textDim }}>
        The whole architecture. The <span style={{ color: C.cyan }}>context branch</span> is trained by gradient descent;
        the <span style={{ color: C.violet }}>target branch</span> gets no gradients — its weights are a slow EMA copy
        of the context encoder. The loss compares predicted vs. actual embeddings — <span style={{ color: C.amber }}>in latent space</span>, never pixels.
      </figcaption>
    </figure>
  );
}

/* ========================================================================== */
/*  Hero canvas — drifting latent space with a few glowing "signal" nodes      */
/* ========================================================================== */
function HeroCanvas() {
  // calm, near-invisible atmosphere: a few large, soft, slowly drifting blobs in
  // the accent hue — "points in a latent space" rendered as quiet bokeh, no lines,
  // no glow. Replaces the old techy particle network.
  const C = useTheme();
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = cv.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const rgb = C.isDark ? "110,162,255" : "47,109,240";   // the accent, as soft fog
    let pts = [], raf = 0;
    const init = () => {
      cv.width = cv.offsetWidth * DPR; cv.height = cv.offsetHeight * DPR;
      const n = Math.max(5, Math.min(14, Math.floor((cv.width * cv.height) / 240000)));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * cv.width, y: Math.random() * cv.height,
        vx: (Math.random() - 0.5) * 0.05 * DPR, vy: (Math.random() - 0.5) * 0.05 * DPR,
        r: (Math.random() * 90 + 70) * DPR, a: Math.random() * 0.05 + 0.02,
      }));
    };
    const frame = () => {
      const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -p.r || p.x > W + p.r) p.vx *= -1;
        if (p.y < -p.r || p.y > H + p.r) p.vy *= -1;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(${rgb},${p.a})`); g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    init(); frame();
    if (reduce) cancelAnimationFrame(raf);          // draw one static frame, then stop
    let to; const onR = () => { clearTimeout(to); to = setTimeout(init, 200); };
    window.addEventListener("resize", onR);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onR); };
  }, [C.isDark]);
  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 w-full h-full" />;
}

/* ========================================================================== */
/*  Hierarchical JEPA (H-JEPA) schematic — two world models at different        */
/*  timescales: a fast detailed level and a slow abstract level that sets       */
/*  subgoals for it. Theme-aware static SVG.                                    */
/* ========================================================================== */
function HJepaDiagram() {
  const C = useTheme();
  const sub = C.textFaint;
  const mono = "ui-monospace, Menlo, monospace";
  const bottom = [["s_t", 150], ["s_t+1", 320], ["s_t+2", 490], ["s_t+3", 640]];
  return (
    <figure className="my-8 rounded-2xl border overflow-hidden" style={{ borderColor: C.line, background: C.ink2 }}>
      <svg viewBox="0 0 760 360" className="w-full h-auto" role="img"
           aria-label="Hierarchical JEPA: a fast, detailed level predicts the next embedding over short horizons; a slower, more abstract level predicts over long horizons and hands subgoals down to the level below.">
        <defs>
          <marker id="hV" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={C.violet} /></marker>
          <marker id="hC" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={C.cyan} /></marker>
          <marker id="hN" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={C.textFaint} /></marker>
        </defs>

        {/* abstract (top) level — caption sits clear above its node row */}
        <text x="34" y="42" fill={C.violet} fontSize="12" fontFamily={mono}>level 2 · abstract state · long horizon</text>
        <circle cx="250" cy="120" r="24" fill={C.ink3} stroke={C.violet} />
        <text x="250" y="125" fill={C.violet} fontSize="12" fontFamily={mono} textAnchor="middle">a_t</text>
        <line x1="276" y1="120" x2="514" y2="120" stroke={C.violet} strokeWidth="2" markerEnd="url(#hV)" />
        <text x="395" y="108" fill={sub} fontSize="10" fontFamily={mono} textAnchor="middle">predict (coarse, few steps)</text>
        <circle cx="540" cy="120" r="24" fill={C.ink3} stroke={C.violet} />
        <text x="540" y="125" fill={C.violet} fontSize="12" fontFamily={mono} textAnchor="middle">a_t+1</text>

        {/* abstraction up + subgoal down */}
        <line x1="170" y1="232" x2="232" y2="142" stroke={C.textFaint} strokeWidth="1.2" strokeDasharray="4 3" markerEnd="url(#hN)" />
        <text x="92" y="195" fill={sub} fontSize="10" fontFamily={mono}>abstract ↑</text>
        <line x1="548" y1="146" x2="628" y2="230" stroke={C.violet} strokeWidth="1.2" strokeDasharray="4 3" markerEnd="url(#hV)" />
        <text x="592" y="195" fill={C.violet} fontSize="10" fontFamily={mono}>subgoal ↓</text>

        {/* detailed (bottom) level — caption sits clear below its node row */}
        {bottom.map(([lab, x], i) => (
          <g key={lab}>
            <circle cx={x} cy={252} r="19" fill={C.ink3} stroke={C.cyan} />
            <text x={x} y={257} fill={C.cyan} fontSize="11" fontFamily={mono} textAnchor="middle">{lab}</text>
            {i < bottom.length - 1 && (
              <line x1={x + 19} y1={252} x2={bottom[i + 1][1] - 19} y2={252} stroke={C.cyan} strokeWidth="1.8" markerEnd="url(#hC)" />
            )}
          </g>
        ))}
        <text x="34" y="322" fill={C.cyan} fontSize="12" fontFamily={mono}>level 1 · detailed state · short horizon</text>
      </svg>
      <figcaption className="px-5 py-3 text-[13px] border-t" style={{ borderColor: C.line, color: C.textDim }}>
        <B>H-JEPA.</B> Stack the same predict-the-representation idea at two timescales. The <span style={{ color: C.cyan }}>detailed level</span>
        {" "}predicts the next embedding step-by-step; the <span style={{ color: C.violet }}>abstract level</span> predicts over long horizons
        and hands <span style={{ color: C.violet }}>subgoals</span> down. Long-horizon plans live where the future is predictable — in the abstract space.
      </figcaption>
    </figure>
  );
}

/* ========================================================================== */
/*  Math appendix — optional, deeper LVEBM derivation. Collapsible.             */
/* ========================================================================== */
function MathAppendix() {
  const C = useTheme();
  const [open, setOpen] = useState(false);
  const mono = { borderColor: C.line, background: C.ink, color: C.textHi };
  return (
    <div className="my-8 rounded-2xl border overflow-hidden" style={{ borderColor: C.line, background: C.ink2 }}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
        <span className="font-semibold text-[15px]" style={{ color: C.textHi }}>
          Math appendix — the latent-variable EBM view <span style={{ color: C.textFaint }}>(optional, deeper)</span>
        </span>
        <span className="font-mono text-lg shrink-0" style={{ color: C.cyan }}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-5 pb-6 pt-1" style={{ borderTop: `1px solid ${C.line}` }}>
          <H3>1 · From a distribution over futures to a single energy</H3>
          <P>A context <em>x</em> rarely determines its target <em>y</em>. The latent-variable EBM handles this by introducing
          <code style={{ color: C.violet, background: C.ink3, padding: "1px 5px", borderRadius: 4 }}>z</code> — the part of <em>y</em> that
          <em>x</em> can't fix — and defining a <Hi>free energy</Hi> that integrates it out:</P>
          <div className="my-5 rounded-xl border p-5 font-mono text-[13.5px] leading-[1.9] overflow-x-auto" style={mono}>
            <span style={{ color: C.textFaint }}># free energy: marginalize the latent at "temperature" 1/β</span><br />
            F<sub>β</sub>(x, y) = −(1/β) · log ∫<sub style={{ color: C.violet }}>z</sub> exp(−β · E(x, y, z)) dz<br /><br />
            <span style={{ color: C.textFaint }}># as β → ∞ this becomes the cheap form the course uses:</span><br />
            F(x, y) = min<sub style={{ color: C.violet }}>z</sub> E(x, y, z)
          </div>
          <P>The zero-temperature limit (<Hi>β → ∞</Hi>) is dominated by the single best <em>z</em>, which is exactly the
          <code style={{ color: C.cyan, background: C.ink3, padding: "1px 5px", borderRadius: 4 }}>min over z</code> you saw above —
          "pick the explanation of <em>y</em> that fits best." Finite β keeps a softer average over explanations.</P>

          <H3>2 · Why minimizing over z gives multimodality</H3>
          <P>For a fixed context <em>x</em>, sweeping <code style={{ color: C.violet, background: C.ink3, padding: "1px 5px", borderRadius: 4 }}>z</code>
          traces out a whole <em>set</em> of low-energy targets — different valid futures (the ball rolls left, or right, or stops).
          The energy surface over <em>y</em> can therefore have <Hi>several separate valleys</Hi>, one per mode, without the model having to
          put a normalized probability on each. That's how a JEPA represents "many things could happen next" without the intractable
          partition function a generative model would need.</P>

          <H3>3 · VICReg as information preservation</H3>
          <P>The anti-collapse regularizer isn't ad hoc. Read information-theoretically, its two terms push the embedding distribution
          toward <Hi>maximal information content</Hi> under a tractable Gaussian proxy:</P>
          <ul className="space-y-2 my-3">
            <li className="text-[15px] pl-5 relative" style={{ color: C.text }}><span className="absolute left-0" style={{ color: C.cyan }}>›</span>
              <B>Variance</B> (hinge on each dimension's std ≥ γ) keeps every coordinate <em>active</em> — it lower-bounds the marginal
              entropy of each dimension, ruling out the degenerate "all the same vector" solution.</li>
            <li className="text-[15px] pl-5 relative" style={{ color: C.text }}><span className="absolute left-0" style={{ color: C.cyan }}>›</span>
              <B>Covariance</B> (off-diagonals → 0) removes redundancy between dimensions. For a Gaussian, decorrelation maximizes joint
              entropy at fixed variances — so together the terms approximately <Hi>maximize the volume</Hi> the embeddings occupy.</li>
          </ul>
          <P>SIGReg (LeJEPA) makes the Gaussian target <em>explicit</em> rather than approximate: instead of bounding two moments, it tests
          full Gaussianity along random 1-D projections — and the isotropic Gaussian is exactly the distribution that maximizes entropy
          for a fixed scale, which is why LeJEPA can prove it's the optimal embedding distribution.</P>
        </div>
      )}
    </div>
  );
}

/* ----- paginated-lecture context (robotic_learning style) ----------------- */
const PageContext = React.createContext(null);
const usePage = () => React.useContext(PageContext);
/* id → "01".."10" for the sidebar index column (the welcome page has none) */
const PAGE_IDX = Object.fromEntries(SECTIONS.map((s, i) => [s.id, String(i + 1).padStart(2, "0")]));

/* One lecture: shown only when it's the current page. Each ends with a
   mark-complete + prev/next bar so the separate lectures still flow as a course. */
function Section({ id, children }) {
  const { cur } = usePage();
  return (
    <section id={id} className={cx("lecture", cur === id && "visible")}>
      {children}
      <CompleteBarPager id={id} />
    </section>
  );
}

function CompleteBarPager({ id }) {
  const { go, prevId, nextId, isDone, markPage } = usePage();
  const prev = prevId(id), next = nextId(id), done = isDone(id);
  const meta = LECTURE_META[id];
  return (
    <>
      {meta?.takeaways && (
        <div className="callout takeaways">
          <span className="co-label">Key takeaways</span>
          <ul>{meta.takeaways.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      )}
      <div className="complete-bar">
        <button className={cx("complete-btn", done && "done")} onClick={() => markPage(id)}>
          {done ? "Completed ✓" : "Mark complete"}
        </button>
        <div className="pager">
          <button disabled={!prev} onClick={() => prev && go(prev)}>← Prev</button>
          <button disabled={!next} onClick={() => next && go(next)}>Next →</button>
        </div>
      </div>
    </>
  );
}

/* The syllabus-style objectives block under each lecture header: a meta-strip
   (time / difficulty / prereqs), the learning objectives, and primary readings. */
function LectureObjectives({ id }) {
  const meta = LECTURE_META[id];
  if (!meta) return null;
  return (
    <div className="lec-meta">
      <div className="meta-strip">
        <span className="chip"><b>≈ {meta.minutes} min</b></span>
        <span className="chip">Difficulty · <b>{meta.difficulty}</b></span>
        {meta.prereqs?.length > 0 && <span className="chip">Prereqs · {meta.prereqs.join(", ")}</span>}
      </div>
      <div className="callout objectives">
        <span className="co-label">In this lecture you'll</span>
        <ul>{meta.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
        {meta.readings?.length > 0 && (
          <div className="readings">
            <span>Readings:</span>{" "}
            {meta.readings.map((k, i) => {
              const s = SOURCES[k]; if (!s) return null;
              const short = s[0].split(" — ")[1] || s[0];
              return <React.Fragment key={k}>{i > 0 ? " · " : ""}<a href={s[1]} target="_blank" rel="noreferrer">{short}</a></React.Fragment>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* Lecture header — the robotic_learning .lecture-head treatment, plus the
   syllabus objectives block when the section has LECTURE_META. */
function Heading({ id, num, eyebrow, title, intro }) {
  return (
    <>
      <div className="lecture-head">
        {num && <span className="ltag">Lecture {num}</span>}
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 10 }}>{eyebrow}</div>}
        <h2>{title}</h2>
        {intro && <p className="dek">{intro}</p>}
      </div>
      {id && <LectureObjectives id={id} />}
    </>
  );
}
function P({ children }) {
  const C = useTheme();
  return <p className="text-[17px] leading-[1.7] mb-4" style={{ color: C.text }}>{children}</p>;
}
function H3({ children }) {
  const C = useTheme();
  return <h3 className="text-[22px] font-semibold mt-10 mb-3" style={{ color: C.textHi, fontFamily: "var(--font-display)" }}>{children}</h3>;
}
const Hi = ({ children, c }) => { const C = useTheme(); return <span style={{ color: c || C.cyan }}>{children}</span>; };
const B = ({ children }) => { const C = useTheme(); return <strong style={{ color: C.textHi, fontWeight: 600 }}>{children}</strong>; };
/* Clickable cross-reference: jumps to another lecture. */
const Xref = ({ to, children }) => {
  const { go } = usePage();
  return (
    <span className="xref" role="button" tabIndex={0}
      onClick={() => go(to)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(to); } }}>
      {children}
    </span>
  );
};

/* ----------------------------- shell chrome ------------------------------ */
function Sidebar({ cur, go, isDone, progress, menuOpen }) {
  return (
    <aside className={cx("sidebar", menuOpen && "open")} id="sidebar">
      <div className="brand">
        <div className="eyebrow">Interactive course</div>
        <h1><span className="dot" />Predict the Representation</h1>
        <div className="sub">JEPA &amp; world models — Yann LeCun's bet<br />Built from scratch, to researcher depth</div>
      </div>
      <div className="progress-wrap">
        <div className="progress-label"><span>Progress</span><b>{progress}%</b></div>
        <div className="progress-track"><div className="progress-fill" style={{ width: progress + "%" }} /></div>
      </div>
      <nav className="nav" aria-label="Lectures">
        {NAV_GROUPS.map((g) => (
          <React.Fragment key={g.header}>
            <div className="nav-group">{g.header}</div>
            {g.items.map((id) => (
              <button key={id} className={cx(cur === id && "active", isDone(id) && "is-done")}
                onClick={() => go(id)} aria-current={cur === id ? "page" : undefined}>
                <span className="idx">{PAGE_IDX[id] || "·"}</span>{PAGE_LABEL[id]}
                <span className="done-mark">✓</span>
              </button>
            ))}
          </React.Fragment>
        ))}
      </nav>
      <div className="labs-link-wrap">
        <a className="labs-link" href="#labs" title="From-scratch notebooks">⌥ From-scratch labs →</a>
      </div>
    </aside>
  );
}

function MobileTopBar({ where, open, onToggle }) {
  return (
    <div className="topbar">
      <button onClick={onToggle} aria-label="Toggle lecture menu" aria-expanded={open}>
        {open ? "✕ Close" : "☰ Lectures"}
      </button>
      <span className="where">{where}</span>
    </div>
  );
}

/* The welcome page — the old hero, as the first lecture in the pager. */
function StartLecture() {
  const C = useTheme();
  const { cur, go } = usePage();
  return (
    <section id="start" className={cx("lecture", cur === "start" && "visible")}>
      <div className="relative overflow-hidden rounded-2xl mb-9"
           style={{ border: `1px solid ${C.line}`, background: C.ink2, minHeight: 230 }}>
        <HeroCanvas />
        <div className="relative z-[2] p-7 sm:p-10">
          <div className="eyebrow" style={{ marginBottom: 14 }}>An interactive course · Joint-Embedding Predictive Architecture</div>
          <h1 className="tracking-tight text-[clamp(30px,5.2vw,54px)] leading-[1.04]"
              style={{ color: C.textHi, fontFamily: "var(--font-display)", fontWeight: 800, maxWidth: "18ch", letterSpacing: "-0.03em" }}>
            Don't predict the{" "}
            <span style={{ color: C.textDim, textDecoration: "line-through", textDecorationThickness: 2, textDecorationColor: C.amber }}>pixels</span>.
            <br />Predict the <span style={{ color: C.cyan, fontStyle: "italic" }}>representation</span>.
          </h1>
        </div>
      </div>
      <p className="text-[19px] leading-relaxed mb-3" style={{ color: C.textDim, maxWidth: "60ch" }}>
        Yann LeCun's bet on how machines might learn to <B>reason, plan, and understand the physical world</B>.
        You won't just read about it — you'll mask patches, collapse a latent space, and rebuild it, until JEPA
        feels <Hi>inevitable</Hi>.
      </p>
      <p className="text-[15px] leading-relaxed mb-6" style={{ color: C.textDim, maxWidth: "60ch" }}>
        We build the idea up from scratch, one lecture at a time — no black boxes. Use the sidebar to jump around,
        or just press <B>Next</B> at the bottom of each lecture to follow the through-line.
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <button className="lab-btn primary" style={{ padding: "11px 22px", fontSize: 14 }} onClick={() => go("idea")}>
          Start the first lecture →
        </button>
        <span className="font-mono text-[12px] tracking-wide" style={{ color: C.textFaint }}>
          ~45–60 min · 11 lectures · interactive throughout
        </span>
      </div>
      <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px]" style={{ color: C.textDim }}>
        <span className="font-mono uppercase tracking-wider text-[11px]" style={{ color: C.textFaint }}>colors mean things →</span>
        {[["latent / signal", C.cyan], ["pixel / generative", C.amber], ["energy / abstraction", C.violet], ["correct", C.green]].map(([l, c]) => (
          <span key={l} className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{l}
          </span>
        ))}
      </div>
      <div className="callout" style={{ marginTop: 30 }}>
        <span className="co-label">What you should already know</span>
        <P>You've trained a model with <B>gradient descent</B> and have a rough sense of what an <B>embedding</B> is (a vector that describes an input). That's the whole prerequisite.</P>
        <P style={{ marginBottom: 0 }}>You do <em>not</em> need transformers, energy-based models, or reinforcement learning — we build each one here the first time it's needed. When a term shows up in <B>bold</B>, it's defined right nearby; the full <B>glossary</B> of key terms lives at the end, in <span style={{ color: C.cyan }}>Recap → Key terms</span>.</P>
      </div>
      <CourseSyllabus />
      <CompleteBarPager id="start" />
    </section>
  );
}

/* The syllabus block on the Start page: the four units, each lecture a jump link
   with its est. time + difficulty, then the review unit. */
function CourseSyllabus() {
  const { go } = usePage();
  const row = (lid) => {
    const m = LECTURE_META[lid];
    return (
      <button className="syl-lec" key={lid} onClick={() => go(lid)}>
        <span className="syl-idx">{PAGE_IDX[lid]}</span>
        <span className="syl-title">{PAGE_LABEL[lid]}</span>
        <span className="syl-meta">≈{m.minutes}m · {m.difficulty}</span>
      </button>
    );
  };
  return (
    <div className="syllabus">
      <h3>Syllabus</h3>
      <p className="syl-sub">Eleven lectures across four units, then a graded final review. Jump in anywhere.</p>
      {UNITS.map((u) => (
        <div className="unit" key={u.roman}>
          <div className="unit-head">
            <span className="unit-roman">{u.roman}</span>
            <div><h4>Unit {u.roman} · {u.title}</h4><p>{u.blurb}</p></div>
          </div>
          <div className="unit-lectures">{u.lectures.map(row)}</div>
        </div>
      ))}
      <div className="unit">
        <div className="unit-head">
          <span className="unit-roman">★</span>
          <div><h4>Review · Lock it in</h4><p>Recap the whole arc, then take the graded final review covering every lecture.</p></div>
        </div>
        <div className="unit-lectures">{row("recap")}</div>
      </div>
    </div>
  );
}

/* Final review — a graded, shuffled deck aggregating one core question per
   lecture (true spaced retrieval across the whole course). */
function ReviewDeck() {
  const C = useTheme();
  const { go } = usePage();
  const [order, setOrder] = useState(() => REVIEW.map((_, i) => i));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);

  const shuffle = () => {
    // deterministic-ish shuffle seeded by current counts (no Math.random dependency for SSR safety)
    const a = REVIEW.map((_, k) => k);
    for (let k = a.length - 1; k > 0; k--) { const j = (k * 7 + 3) % (k + 1); [a[k], a[j]] = [a[j], a[k]]; }
    setOrder(a); setI(0); setPicked(null); setScore(0); setAnswered(0);
  };
  const q = REVIEW[order[i]];
  const done = answered === REVIEW.length;

  const choose = (oi) => {
    if (picked != null) return;
    setPicked(oi);
    if (oi === q.correct) setScore((s) => s + 1);
    setAnswered((n) => n + 1);
  };
  const next = () => { setPicked(null); setI((v) => (v + 1) % REVIEW.length); };

  return (
    <div className="review-deck">
      <div className="rd-head">
        <span className="rd-title">Final review · all lectures</span>
        <span className="rd-score">{score} / {answered} correct{done ? " · complete" : ""}</span>
      </div>
      <div className="rd-body">
        <span className="rd-tag">{PAGE_LABEL[q.id]}</span>
        <p className="rd-q">{q.q}</p>
        {q.options.map((opt, oi) => {
          const cls = picked == null ? "rd-opt"
            : oi === q.correct ? "rd-opt right"
            : oi === picked ? "rd-opt wrong" : "rd-opt";
          return (
            <button key={oi} className={cls} disabled={picked != null} onClick={() => choose(oi)}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: C.textDim, marginRight: 9 }}>{String.fromCharCode(65 + oi)}</span>
              {opt}
            </button>
          );
        })}
      </div>
      <div className="rd-foot">
        <span>Card {i + 1} of {REVIEW.length}</span>
        <span style={{ flex: 1 }} />
        {picked != null && <button className="lab-btn primary" onClick={next}>Next card →</button>}
        <button className="lab-btn" onClick={shuffle}>↻ Shuffle &amp; restart</button>
        <button className="lab-btn" onClick={() => go(q.id)}>Review this lecture</button>
      </div>
    </div>
  );
}

function SourcesFooter() {
  const C = useTheme();
  const { cur } = usePage();
  if (cur !== "recap" && cur !== "start") return null;   // sources only on the bookend pages
  const sources = SOURCE_ORDER.map((k) => SOURCES[k]);   // shared with per-lecture readings
  return (
    <footer style={{ borderTop: `1px solid ${C.line}`, marginTop: 56, paddingTop: 28 }}>
      <h4 className="font-semibold text-[16px] mb-3" style={{ color: C.textHi, fontFamily: "var(--font-display)" }}>Primary sources</h4>
      <ul className="space-y-1.5 text-[13.5px]" style={{ color: C.textDim, listStyle: "none", margin: 0, padding: 0 }}>
        {sources.map(([t, h]) => (
          <li key={h}><a href={h} target="_blank" rel="noreferrer" style={{ color: C.textDim }}>{t} ↗</a></li>
        ))}
      </ul>
      <p className="text-[12.5px] mt-5" style={{ color: C.textFaint, fontStyle: "italic" }}>
        Diagrams and simulations are original. JEPA is presented as a living research direction, not settled fact.
      </p>
    </footer>
  );
}

/* ========================================================================== */
/*  MAIN                                                                       */
/* ========================================================================== */
export default function JepaCourse() {
  // light-only app; the single palette is provided once. A tiny hash router keeps
  // the from-scratch labs as a real, shareable separate page (#labs).
  const [route, setRoute] = useState(() => (typeof window !== "undefined" ? window.location.hash.replace(/^#\/?/, "") : ""));
  useEffect(() => {
    const f = () => setRoute(window.location.hash.replace(/^#\/?/, ""));
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return (
    <ThemeContext.Provider value={LIGHT}>
      {route === "labs" ? <NotebooksPage dark={false} setDark={() => {}} /> : <CourseBody />}
    </ThemeContext.Provider>
  );
}

function CourseBody() {
  const C = useTheme();
  const [done, setDone] = useState({});                       // auto-marks from guesses/quizzes
  const [pageDone, setPageDone] = useState(() => new Set());  // explicit "mark complete"
  const mark = useCallback((k) => setDone((d) => (d[k] ? d : { ...d, [k]: true })), []);
  const [cur, setCur] = useState("start");
  const [menuOpen, setMenuOpen] = useState(false);

  const isDone = useCallback(
    (id) => pageDone.has(id) || (SECTION_CHECK[id] ? !!done[SECTION_CHECK[id]] : false),
    [pageDone, done]);
  const markPage = useCallback((id) => setPageDone((s) => { const n = new Set(s); n.add(id); return n; }), []);
  const prevId = (id) => PAGES[PAGES.indexOf(id) - 1] || null;
  const nextId = (id) => PAGES[PAGES.indexOf(id) + 1] || null;
  const go = useCallback((id) => { setCur(id); setMenuOpen(false); if (typeof window !== "undefined") window.scrollTo(0, 0); }, []);

  const progress = Math.round((PAGES.filter((id) => isDone(id)).length / PAGES.length) * 100);
  const ctx = { cur, go, prevId, nextId, isDone, markPage, mark };

  return (
    <PageContext.Provider value={ctx}>
      <MobileTopBar where={PAGE_LABEL[cur]} open={menuOpen} onToggle={() => setMenuOpen((o) => !o)} />
      <div className={cx("scrim", menuOpen && "show")} onClick={() => setMenuOpen(false)} />
      <div className="app">
        <Sidebar cur={cur} go={go} isDone={isDone} progress={progress} menuOpen={menuOpen} />
        <main className="main">
          <div className="content">
            <StartLecture />

        {/* ---------------- 01 THE IDEA ---------------- */}
        <Section id="idea">
          <Heading id="idea" num="01" eyebrow="The core idea"
            title={<>A model that predicts what it <Hi>means</Hi>, not what it looks like</>}
            intro="Every modern self-supervised model hides part of its input and predicts the missing part. JEPA's one consequential twist is where that prediction happens." />
          <Reveal>
            <Aside tag="Why anyone is trying this" color={C.violet}>
              A four-year-old learns that an unsupported object falls without seeing a million labeled examples — and a crow solves puzzles, an orca coordinates a hunt. Animals build a <B>model of how the world works</B> from mostly passive observation, then use it to predict and plan. Today's biggest AI does the opposite: it ingests oceans of data yet struggles with the physical common sense a toddler takes for granted (this is <Hi>Moravec's paradox</Hi>: what's hard for people is easy for machines, and vice-versa). LeCun's wager is that the missing ingredient isn't more scale — it's <Hi>learning a predictive world model in an abstract space</Hi>. That's what JEPA is for.
            </Aside>
          </Reveal>
          <Reveal>
            <div>
              <P><span style={{color:C.textDim}}>First, the setup both families share. <B>Self-supervised learning</B> means there are <em>no human labels</em> — the data supplies its own answer by hiding part of itself and asking the model to fill it back in. That's the only way to learn from a billion video frames nobody will ever annotate. The question this whole course turns on is just: <em>fill it back in — where?</em></span></P>
              <P>Picture a short video of a ball rolling toward the edge of a table. A <B>generative</B> model — the family behind most headline AI — learns by reconstructing the exact missing pixels: every shadow, every reflection, the grain of the wood. To do that it must commit to one precise future, down to detail it can't possibly know.</P>
              <P>A JEPA asks a different question. Not <em>"what will the next frame look like, pixel for pixel?"</em> but <em>"what will it <Hi>mean</Hi>?"</em> It encodes the visible part, encodes the hidden part, and trains a small <B>predictor</B> to jump from one to the other — entirely inside an abstract space. The ball will be roughly <Hi>there</Hi>, moving <Hi>that way</Hi>, about to fall. The wood grain is discarded as noise.</P>
            </div>
          </Reveal>

          <GuessGate
            onResolved={() => mark("g1")}
            question="A model watches that ball roll toward the table edge. To learn well about the next instant, what should it work hardest to get right?"
            options={[
              "Every pixel — shadows, reflections, the grain of the wood",
              "Roughly where the ball is and that it's about to fall — the gist",
              "The exact RGB value of the ball's center pixel",
            ]}
            correct={1}
            explanation={<>Hold that thought. The "gist" is what's both <Hi>predictable</Hi> and useful; the exact pixels are mostly detail no model can guess. Which of those a model is <em>graded</em> on turns out to be the whole story — the aside below names it.</>}
          />

          <Reveal>
            <Instructor>
              <p className="mb-3">Okay, so let's slow down, because the phrase "predict in representation space" sounds fancy and it really isn't. Here's the whole thing in one concrete picture.</p>
              <p className="mb-3">You have a number — say the ball is at <Hi>x = 0.7</Hi> along the table. A generative model is asked to redraw the <em>entire scene</em> at the next instant: all 50,000 pixels, lighting and grain included. A JEPA is asked one small thing: from "ball at 0.7, moving right," predict the <em>embedding</em> of the next moment — basically a short list of numbers that says <Hi>"ball near the edge, still moving right, about to fall."</Hi></p>
              <p>That's it. Same input, but one model is graded on 50,000 pixels it can't all predict, and the other is graded on a handful of numbers that capture what matters. When you hear "JEPA," just think: <B>we moved the exam to an easier, more meaningful question.</B> No magic.</p>
            </Instructor>
          </Reveal>

          <GuessGate
            onResolved={() => mark("g1")}
            question="A generative video model and a JEPA both see a clip of waves crashing. Which one is structurally forced to model the exact froth of every wave?"
            options={[
              "The JEPA — it predicts everything in detail",
              "The generative model — its loss is computed on raw pixels",
              "Neither — both ignore fine detail by design",
            ]}
            correct={1}
            explanation={<>Right idea: because the generative model's loss lives in <Hi>pixel space</Hi>, it's penalized for failing to reproduce detail it can't predict. JEPA's loss lives in embedding space, so its encoder is free to discard the froth and keep the meaning.</>}
          />

          <Reveal>
            <Aside tag="The one-sentence version">
              A JEPA takes two related views, encodes each into an abstract representation, and learns to <B>predict one representation from the other</B> — measuring success as error in <Hi>embedding space</Hi>, never in pixels or tokens.
            </Aside>
          </Reveal>

          <Reveal>
            <Instructor label="wait — what's an 'embedding', concretely?">
              <p className="mb-2">If "representation" or "embedding" still feels vague, here's the grounding. An embedding is just a <B>list of numbers</B> — a vector — that a neural network produces to describe an input. Maybe 1024 numbers.</p>
              <p className="mb-2">The magic is what the numbers come to <em>mean</em> after training. One coordinate might track "how much fur is in this image," another "is there a wheel," another "is something moving left." Nobody assigns these by hand — the network discovers them because they're useful. So a picture of a cat and a picture of a different cat end up with <Hi>nearby</Hi> vectors, while a cat and a truck end up far apart.</p>
              <p>When we say JEPA "predicts in embedding space," we mean: from the vector describing what it can see, it predicts the <em>vector</em> describing what it can't — "this region will be cat-like, furry, near the edge." Comparing two short vectors is cheap and meaningful. Comparing two full images, pixel by pixel, is neither.</p>
            </Instructor>
          </Reveal>

          <EmbeddingInvarianceLab />
        </Section>

        {/* ---------------- 02 WHY LATENT ---------------- */}
        <Section id="why">
          <Heading id="why" num="02" eyebrow="Why it matters"
            title={<>The world isn't fully predictable — so stop trying to predict all of it</>} />
          <Reveal>
            <div>
              <P>LeCun's critique of generative pretraining starts from a plain observation: forcing a model to reconstruct raw inputs charges it a tax on <em>every pixel</em> — and much of any real scene (falling snow, TV static, the froth on a wave) is detail no model could ever guess. Before we name what that costs, predict it:</P>
            </div>
          </Reveal>

          <GuessGate
            onResolved={() => mark("g-why")}
            question="You force a model to reconstruct every pixel of a video of TV static. Where does most of its effort go?"
            options={[
              "Into the meaningful structure of the scene",
              "Into chasing unpredictable noise it can never get right",
              "It automatically learns to ignore the static",
            ]}
            correct={1}
            explanation={<>Exactly — and that's the trap. Watch the two costs separate as you turn the detail up:</>}
          />

          <PixelVsLatentLabT />

          <Reveal>
            <div>
              <P>There it is — the <Hi>reconstruction tax</Hi>, in two parts: <B>wasted capacity on the unpredictable</B> (the model is punished for failing to guess things that can't be guessed) and <B>obsession with low-level features</B> (it spends itself memorizing texture and lighting instead of semantic structure).</P>
              <P>Predicting in representation space defuses both. Here's the subtle part that makes it work: because the target is itself a <Hi>learned</Hi> embedding — produced by the same kind of encoder you're training — the model gets to <em>decide what "matching the target" even means</em>. It can settle on a target representation that omits the wood grain entirely, and then it is no longer penalized for failing to predict it. With a fixed <em>pixel</em> target you have no such freedom: the grain is in the answer key whether you can predict it or not. So the encoder keeps what's predictable and meaningful — "a ball, here, falling" — and drops the rest.</P>
              <P>The cleanest demonstration of the whole thesis: <B>I-JEPA vs MAE</B> use the <em>same</em> masking — the only thing that changes is the prediction <em>target</em> (embeddings vs pixels). Same setup, one swap, and the over-spending-on-detail problem disappears.</P>
            </div>
          </Reveal>

          <Reveal>
            <div>
              <H3>The energy-based framing</H3>
            </div>
            <Instructor label="don't let 'energy-based model' scare you">
              <p className="mb-2">The name sounds heavy; the idea is dead simple. A probabilistic model has to answer "how likely is <em>every</em> possible outcome?" — which means normalizing over everything, hopeless when "everything" is all possible images. An <B>energy-based model</B> ducks that entirely. It answers one question instead: <Hi>how compatible are these two things?</Hi></p>
              <p>Low number = compatible, like a ball resting at the bottom of a valley. High number = incompatible, up on a hillside. You never compute a probability — you just <B>shape a landscape</B> so the right answers sit in the valleys. For a JEPA, that "energy" is literally its prediction error in embedding space.</p>
            </Instructor>
            <div>
              <P>Formally, a JEPA is an <B>Energy-Based Model</B>. It defines a scalar energy — the prediction error in embedding space — that should be <Hi>low</Hi> for compatible pairs and high for incompatible ones. EBMs sidestep the normalization that makes probabilistic generative models choke in high dimensions: you never integrate over all possible images. <span style={{color:C.textDim}}>(<Hi>‖a − b‖²</Hi> is just the squared distance between two vectors — the same mean-squared-error you'd use on pixels, here applied to embeddings.)</span></P>
            </div>
            <div className="my-6 rounded-xl border p-5 font-mono text-[14px] leading-[1.9] overflow-x-auto"
                 style={{ borderColor: C.line, background: C.ink2, color: C.textHi }}>
              <span style={{ color: C.textFaint }}># energy = prediction error between learned representations</span><br/>
              E(x, y) = ‖ <Hi>Pred</Hi>( <Hi>Enc</Hi>(x), <Hi c={C.violet}>z</Hi> ) − <Hi>Enc</Hi>(y) ‖²<br/><br/>
              <span style={{ color: C.textFaint }}># train compatible pairs to low energy, regularize so the</span><br/>
              <span style={{ color: C.textFaint }}># encoder can't cheat by collapsing every input to one point</span><br/>
              ℒ = E(x, y) &nbsp;+&nbsp; <Hi c={C.amber}>λ · R</Hi>( <Hi>Enc</Hi>(x), <Hi>Enc</Hi>(y) )
            </div>
            <P><span style={{color:C.textDim}}>The latent variable <Hi c={C.violet}>z</Hi> captures the information about <em>y</em> not present in <em>x</em> — one context can have many valid futures, and varying <Hi c={C.violet}>z</Hi> sweeps them out. Concretely: the context is "ball rolling toward the edge." The future isn't determined — it could fall <em>left</em> or <em>right</em>. <Hi c={C.violet}>z</Hi> is the knob that selects which; the context fixes everything except <Hi c={C.violet}>z</Hi>. (You don't supply <Hi c={C.violet}>z</Hi> by hand — the <em>min over z</em> you'll see later means the optimizer tries settings of <Hi c={C.violet}>z</Hi> and keeps the one that best explains the actual target.) Keep an eye on it — when we reach planning, this very variable becomes the robot's <em>action</em>. That last term <Hi c={C.amber}>R</Hi> is doing more work than it looks: it's the whole subject of the next section.</span></P>
          </Reveal>

          <Reveal>
            <div>
              <P>"Just normalize over everything" sounds harmless until you count what "everything" is. That single sum is the wall every generative model slams into — and the one an EBM walks right past.</P>
            </div>
            <GuessGate
              question="Why can't a probabilistic model just score the right answer and call it a day, the way an EBM scores one (x, y) pair?"
              options={[
                "It can — probabilistic models are strictly simpler than EBMs",
                "To turn a score into a probability it must normalize — sum over EVERY possible output, an impossible integral",
                "Probabilities are always cheaper to compute than raw energies",
              ]}
              correct={1}
              explanation={<>Right — a probability has to sum to 1 over the <em>whole</em> output space, so scoring one answer secretly means visiting them all. Watch that cost explode while the EBM stays flat at 1:</>}
            />
            <PartitionWallLab />
          </Reveal>

          <Reveal>
            <Instructor label="let's just write it">
              <p className="mb-2">I don't want this to stay as symbols on a slide, because then it feels like something only researchers touch. So let's write the entire JEPA training step as code. This is the real thing — not pseudocode hiding the hard part. Read it top to bottom:</p>
            </Instructor>
            <CodeBlock title="jepa_step.py — the whole idea in 9 lines"
              lines={[
                "# x = what we can see (context). y = what we hid (target).",
                "def jepa_step(x, y):",
                "    sx = context_encoder(x)        # encode the visible part",
                "    sy = target_encoder(y)         # encode the hidden part (no grads here)",
                "    sy = stop_gradient(sy)         # teacher is frozen for this step",
                "",
                "    sy_hat = predictor(sx, z)      # PREDICT the target's embedding",
                "    loss = mean((sy_hat - sy) ** 2)  # error lives in embedding space",
                "    return loss + lam * regularizer(sx, sy)  # + anti-collapse term",
              ]} />
            <div>
              <P>Look at what's <em>not</em> there. There's no decoder. There's no pixel anywhere in the loss. Line 7 is the only "prediction" and it outputs a vector of numbers, not an image. Line 8 compares two vectors. And line 9 — the regularizer — is load-bearing in a way that isn't obvious yet: delete it and there's a degenerate shortcut that drives line 8's loss straight to zero while the model learns <em>nothing</em>. Spotting that shortcut, and the trick that kills it, is the entire next section.</P>
              <P><span style={{color:C.textDim}}>(One unfamiliar line: <code style={{ color: C.cyan, background: C.ink3, padding: "1px 5px", borderRadius: 4 }}>stop_gradient</code> on line 5 just means "during backprop, treat these numbers as constants" — no gradient flows back into the teacher encoder. Why that matters is the whole next section; for now, read it as "the teacher doesn't learn from this step.")</span></P>
            </div>
          </Reveal>
        </Section>

        {/* ---------------- 03 ARCHITECTURE ---------------- */}
        <Section id="build">
          <Heading id="build" num="03" eyebrow="The architecture"
            title={<>Where do the targets come from?</>}
            intro="The predictor needs something to chase. The obvious answer hides a trap — find it, and the strange shape of every real JEPA explains itself." />
          <Reveal>
            <Instructor label="first — what's a Vision Transformer?">
              <p className="mb-2">Every diagram and lab below rests on one building block, so let's pin it down. A <B>Vision Transformer (ViT)</B> chops an image into a grid of small square <Hi>patches</Hi> — say 14×14 pixels each — turns every patch into a vector (a "token"), and processes the set the way a language transformer processes words.</p>
              <p>You don't need the internals. Just hold one picture: <B>image → grid of patch-tokens → one vector per patch</B> (or one summary vector for the whole image). So when the next sections say "encode the visible patches," they mean: run the ViT on just the patches we didn't hide, and read off their vectors. That's the entire prerequisite.</p>
            </Instructor>
          </Reveal>
          <GuessGate
            onResolved={() => mark("g-build")}
            question="The predictor needs targets to chase. Why not just use a second copy of the same trainable encoder to produce them?"
            options={[
              "No reason — an identical trainable encoder for the targets works fine",
              "The two encoders could collude — drift together until every embedding is identical and the loss is trivially zero",
              "It would simply be too slow to run two identical networks",
            ]}
            correct={1}
            explanation={<>That's the collapse loophole sneaking in early. To shut it, the target branch is made deliberately <em>different</em> — a stop-gradient, and a slow-moving copy of the student's weights. The lopsidedness you're about to see in the diagram <em>is</em> that fix. Watch it happen below.</>}
          />

          <CollusionCollapseLab />

          <Reveal>
            <div>
              <P>That's the discovery: with gradients flowing to <em>both</em> branches, the cheapest move is for prediction and target to slide toward each other and meet at a single point — the cloud dies, the loss looks great, the model has learned nothing. Flip the stop-gradient on and the target becomes a fixed goalpost the student must actually reach. <Hi>That asymmetry — not the EMA specifically — is the fix.</Hi> Everything in the diagram below is built around it.</P>
            </div>
          </Reveal>

          <Reveal><ArchitectureDiagram /></Reveal>
          <MaskingLab />
          <Reveal>
            <div>
              <H3>1 · Context encoder (the student)</H3>
              <P>The network you keep. It maps the visible input to a representation <Hi>sx</Hi> and learns by backpropagation. In every published JEPA it's a Vision Transformer. After training, this is your feature extractor.</P>
              <H3>2 · Target encoder (the teacher)</H3>
              <P>Encodes the <Hi c={C.violet}>full</Hi> input to produce the targets the predictor chases — but it's <B>not trained directly</B>. Its weights are an exponential moving average of the student's, with a <B>stop-gradient</B> blocking learning signal. Why? Because if the targets are learned too, the model could win by making every representation identical. The slow, gradient-free teacher gives stable targets the student can't trivially game.</P>
              <P><span style={{color:C.textDim}}><B>Intuition first:</B> if gradients reached the teacher, the cheapest way to shrink the loss would be to slide <em>both</em> sides to the same constant at once — predictor and target meeting in the middle. The stop-gradient removes that escape: the target is a fixed goalpost this step, so the only way to win is to predict it better. Worth separating two ideas that often get blurred: the <B>stop-gradient</B> breaks the learning-signal symmetry, while the <B>EMA</B> just makes the teacher a slow-moving copy. <B>SimSiam</B> later showed you can drop the EMA/momentum encoder <em>entirely</em> and still avoid collapse with just a stop-gradient and a predictor head — evidence that the <em>asymmetry</em>, more than the EMA, is doing the work (though exactly <em>why</em> a stop-gradient fully prevents collapse is still debated). An <em>exponential moving average</em> is just a running blend: each step the teacher = 99.6% of its old weights + 0.4% of the student's — it eases toward the student like a thermostat instead of snapping to match it (the rate τ is typically <em>scheduled</em> toward 1.0 over training). Slow on purpose, so the two encoders can't move in lockstep and collude.</span></P>
            </div>
            <EmaLagLab />
            <div>
              <H3>3 · Predictor (the bridge)</H3>
              <P>A narrow network that takes <Hi>sx</Hi> plus the <B>position of the target</B> and outputs a predicted embedding. In video and robotics it also takes the latent <Hi c={C.violet}>z</Hi> or an action — "if I do this, the representation moves like so." This is the module that becomes a <B>world model</B>.</P>
            </div>
            <Aside tag="The asymmetry is the point">
              Autoencoders are symmetric: encode, decode, compare. JEPA is deliberately <B>lopsided</B> — different encoders, a predictor on one branch, a stop-gradient on the other. That broken symmetry is exactly what lets it learn predictive structure without reconstructing pixels or collapsing to a constant.
            </Aside>
          </Reveal>
        </Section>

        {/* ---------------- 04 COLLAPSE ---------------- */}
        <Section id="collapse">
          <Heading id="collapse" num="04" eyebrow="The central problem"
            title={<>If you grade yourself on predicting your own targets, cheating is easy</>}
            intro="This failure mode defines JEPA research. Understand it and every design choice in the family suddenly makes sense." />
          <Reveal>
            <div>
              <P>You already saw the crudest version in <Xref to="build">§03</Xref>: with no stop-gradient, two encoders collude until every embedding piles onto a single point. That was a taste — this lecture goes deeper, because collapse takes more than one shape. The danger is built in. A JEPA is scored on predicting its <em>own</em> learned embeddings — the targets <Hi>sy</Hi> come from a network we are also training. That self-referential setup leaves a loophole a lazy optimizer will find instantly. First, recall what it is:</P>
            </div>
          </Reveal>

          <GuessGate
            tag="Recall"
            onResolved={() => mark("g2")}
            question="A JEPA is graded on predicting its own learned targets. What's the laziest way for the encoder to drive that loss to zero?"
            options={[
              "Predict each target as accurately as possible",
              "Map every input to the same embedding, so prediction is trivial",
              "Use a bigger, more powerful predictor",
            ]}
            correct={1}
            explanation={<>That's <Hi>representation collapse</Hi>: if every embedding is the same vector, "predict sy from sx" is solved by emitting that one vector forever. Loss → 0, knowledge → 0 — the point-collapse you watched in §03. But that's only the <em>crudest</em> shape. Make it happen below, then meet its subtler cousin — and watch the defenses stop both:</>}
          />

          <CollapseLabT />

          <Reveal>
            <Instructor label="why this one shortcut explains the whole family">
              <p className="mb-2">Here's the intuition worth keeping. When you train a normal model, you and it want the same thing — low loss means good predictions. But a JEPA <em>writes its own exam</em>: the targets are produced by a network we're also training. So it can do what any student would love — <B>make the exam trivial.</B></p>
              <p>That's why almost everything that looks like a weird design choice — the frozen teacher, the moving-average weights, the extra regularizer term — exists for <Hi>one reason</Hi>: stop the model from cheating its own test. And the cheat has two shapes, both of which you just produced. <B>Complete</B> collapse maps every input to one point. The sneakier <B>dimensional</B> collapse is subtler: picture a 1024-number embedding where 1000 of the numbers barely move from input to input — the vectors aren't identical, so it <em>looks</em> healthy, but the model is really using only a handful of dimensions and has thrown away almost all its capacity.</p>
              <p>It's not just the stop-gradient, either: <B>SimSiam</B> showed the <em>predictor head itself</em> is load-bearing — remove the predictor and the model collapses <em>even with</em> a stop-gradient. The asymmetry that actually prevents collapse is <Hi>predictor-on-one-side + stop-grad-on-the-other</Hi>, working together.</p>
            </Instructor>
          </Reveal>

          <Reveal>
            <Aside tag="Hold this thought" color={C.cyan}>
              The defenses you just toggled were the state of the art for <em>years</em> — a bag of tricks, each patching a different way to cheat. In 2025 a single result proved you could replace the whole bag with <Hi>one</Hi> principled term. We'll earn exactly how in Lecture 06.
            </Aside>
          </Reveal>

          <GuessGate
            onResolved={() => mark("g2")}
            question="You add EMA + stop-gradient and your training loss looks great. Are you safe from collapse?"
            options={[
              "Yes — EMA mathematically guarantees a non-trivial solution",
              "No — EMA breaks the worst symmetry but dimensional collapse can still happen",
              "Only if you also reconstruct pixels as a backup",
            ]}
            correct={1}
            explanation={<>Exactly. Later analysis showed EMA alone doesn't <em>guarantee</em> a good solution — with a poor masking strategy or an over-powered predictor, embeddings can still collapse onto a subspace (a thin slice of the space — the dimensional collapse you just saw). (BYOL's success with this asymmetry alone was itself called "surprising"; precisely <em>why</em> it helps as much as it does still isn't fully understood.) That's why variance/covariance regularizers (VICReg, and later SIGReg) were added as a safety net.</>}
          />

          <Reveal>
            <div>
              <P>So JEPA's history is largely a history of <B>anti-collapse techniques</B>: architectural asymmetry (EMA + stop-gradient), contrastive negatives (effective but expensive), and variance–covariance regularization. <B>VICReg</B> (Bardes, Ponce &amp; LeCun, 2022) is the canonical example — it has three terms: <Hi>variance</Hi> (a hinge loss keeping each dimension's spread above a threshold — kills complete collapse), <Hi>covariance</Hi> (drives off-diagonal correlations to zero — kills dimensional collapse), and <Hi>invariance</Hi> (pulls the two views together). Modern models mix these, and in 2025 LeJEPA replaced the whole toolkit with one provably-optimal regularizer.</P>
            </div>
          </Reveal>
        </Section>

        {/* ---------------- 05 UNDER THE HOOD ---------------- */}
        <Section id="depth">
          <Heading id="depth" num="05" eyebrow="Under the hood"
            title={<>The math and mechanics a researcher actually needs</>}
            intro="You've seen that collapse can be stopped. Now we earn how — and it comes down to one question: what keeps low energy rare?" />

          <GuessGate
            onResolved={() => mark("r-depth")}
            tag="Recall" hint="pull it from memory before the math starts" accent={C.cyan}
            question="Before the rigor — in one line, what makes an energy landscape useless?"
            options={[
              "Energy is high everywhere",
              "Energy is low everywhere — not reserved for compatible pairs",
              "The energy is exactly zero for the single correct answer",
            ]}
            correct={1}
            explanation={<>That's collapse, restated in energy terms. Everything below is one job: shape the landscape so <em>low energy stays rare</em>.</>}
          />

          <Reveal>
            <div>
              <H3>JEPA as an energy-based model, precisely</H3>
              <P>You met the energy view informally in <Xref to="why">§02</Xref> — low energy = compatible, no normalization. Here's the precise version. A JEPA is an <B>energy-based model</B> (EBM): a scalar <Hi>energy</Hi> <code style={{color:C.cyan,background:C.ink3,padding:"1px 5px",borderRadius:4}}>E(x, y)</code>, low when <em>x</em> and <em>y</em> are compatible. The one piece §02 glossed: the energy carries a <em>latent variable</em>, and minimizing over it is what lets a single context explain many futures. That's the formalization that matters.</P>
              <P>For a JEPA the energy is the prediction error <em>between learned representations</em>, with a latent variable <code style={{color:C.violet,background:C.ink3,padding:"1px 5px",borderRadius:4}}>z</code> absorbing the part of <em>y</em> that <em>x</em> can't determine:</P>
            </div>
            <div className="my-6 rounded-xl border p-5 font-mono text-[14px] leading-[1.9] overflow-x-auto"
                 style={{ borderColor: C.line, background: C.ink2, color: C.textHi }}>
              <span style={{ color: C.textFaint }}># energy = how badly the predictor misses, in embedding space</span><br/>
              E(x, y) = min<sub style={{color:C.violet}}>z</sub> ‖ <Hi>Pred</Hi>( <Hi>Enc</Hi>(x), <Hi c={C.violet}>z</Hi> ) − <Hi>Enc</Hi>(y) ‖²<br/><br/>
              <span style={{ color: C.textFaint }}># minimizing over z = "pick the explanation of y that fits best"</span><br/>
              <span style={{ color: C.textFaint }}># this is what lets ONE context have MANY valid futures</span>
            </div>
            <MinOverZLab />
            <div>
              <P><span style={{color:C.textDim}}>Operationally: for each (context, actual-future) pair you <em>search</em> over candidate <Hi c={C.violet}>z</Hi> and keep the one whose prediction best matches what actually happened — you're not given <Hi c={C.violet}>z</Hi> and you don't learn one fixed <Hi c={C.violet}>z</Hi>; you hand the model a free variable and let it use whichever best explains the real outcome.</span></P>
              <P><span style={{color:C.textDim}}>One honest caveat: in practice the <em>released</em> JEPAs (I-JEPA, V-JEPA, V-JEPA 2) use a deterministic predictor and don't run an inner min-over-<Hi c={C.violet}>z</Hi> search at all — the latent variable <Hi c={C.violet}>z</Hi> is the principled EBM device from LeCun's position paper, a conceptual tool more than a training-time loop.</span></P>
              <P>The deep problem: an EBM is only useful if low energy is <Hi>rare</Hi> — reserved for compatible pairs. If energy is low <em>everywhere</em>, the model knows nothing. That's collapse, stated in EBM terms. There are exactly two ways to prevent it, and the entire field splits along this line.</P>
            </div>
          </Reveal>

          <GuessGate
            question="One way to keep low energy rare is to push energy UP at sampled wrong answers (negatives). Why does that get hard as embeddings get high-dimensional?"
            options={[
              "It doesn't — more dimensions make covering the space easier",
              "You'd need an exponential number of negatives to cover the space, so most of it stays un-pushed",
              "High-dimensional vectors can't be subtracted on a GPU",
            ]}
            correct={1}
            explanation={<>Right — the curse of dimensionality. So the other camp never samples at all: it constrains the <Hi>statistics</Hi> of the embeddings so the low-energy region simply can't spread. Flip between the two below.</>}
          />

          <Reveal>
            <H3>The two ways to shape an energy landscape</H3>
            <EnergyLandscapeLab />
            <div>
              <P>LeCun's argument for JEPA leans hard on the second column. Contrastive methods need to push up energy at <em>sampled</em> negative points, and in high dimensions you'd need an exponential number of negatives to cover the space — the curse of dimensionality. Regularized methods sidestep sampling entirely: they constrain the <Hi>statistics</Hi> of the embeddings so the low-energy region simply can't expand to fill space. This is why JEPA's lineage runs through VICReg and SIGReg, not InfoNCE <span style={{color:C.textDim}}>(InfoNCE being the standard contrastive loss — the one that needs all those negatives)</span>.</P>
            </div>
            <ForcesLab />
          </Reveal>

          <Reveal>
            <div>
              <P>"Exponentially many negatives" is easy to say. Let's make it bite: pick a dimension, fix your budget of negatives, and watch how much of the space you actually manage to cover.</P>
            </div>
            <GuessGate
              question="As the embedding dimension grows, what happens to the number of negatives you'd need to keep energy high everywhere?"
              options={[
                "It grows slowly — a few more negatives per extra dimension",
                "It explodes exponentially — coverage craters for any fixed budget",
                "It stays flat — dimension doesn't affect how many negatives you need",
              ]}
              correct={1}
              explanation={<>Right — the regions to cover multiply exponentially with D, so a fixed pile of negatives reaches almost none of the space. Crank D below and watch coverage collapse no matter how many you throw at it:</>}
            />
            <CurseDimLab />
          </Reveal>

          <GuessGate
            tag="Predict first"
            question="You've watched the embedding cloud collapse two ways: everything piling onto one point, and everything flattening onto a line. If you had to design a fix from scratch, how many separate things must it enforce?"
            options={[
              "One — just keep the vectors from being identical",
              "Two — stop the collapse to a point AND stop the collapse to a line",
              "Three or more — every dimension needs its own rule",
            ]}
            correct={1}
            explanation={<>Two failure modes → at least two guards. VICReg's <Hi>variance</Hi> term keeps the cloud from caving to a point; its <Hi>covariance</Hi> term keeps it from flattening onto a subspace; a third <Hi>invariance</Hi> term pulls matching views together. You predicted the shape of the solution before seeing the code.</>}
          />

          <Reveal>
            <div>
              <H3>VICReg, for real — the three terms in code</H3>
              <P>Earlier you toggled "variance–covariance regularization" as a black box. Here is what those words actually compute. Given a batch of embeddings <code style={{color:C.cyan,background:C.ink3,padding:"1px 5px",borderRadius:4}}>Z</code> (N samples × D dims), VICReg is three terms. The coefficients <Hi>λ=μ=25, ν=1</Hi> are the paper's ImageNet values — not universal constants; they're tuned per dataset, batch size, and embedding dimension (the paper's design rule is λ=μ with ν smaller, not arbitrary):</P>
              <P><span style={{color:C.textDim}}>One term below builds a <B>covariance matrix</B> — if that's unfamiliar, picture a D×D grid where entry (i, j) measures whether dimension i and dimension j move <em>together</em> across the batch. The diagonal is each dimension's own spread (the variance term handles that); the off-diagonals are <em>redundancy</em> between dimensions. We want the off-diagonals at zero, so every dimension carries something the others don't.</span></P>
            </div>
            <CodeBlock title="vicreg.py — the loss that prevents collapse without negatives"
              lines={[
                "def vicreg(Z, Z2, lam=25, mu=25, nu=1, gamma=1):",
                "    # 1. INVARIANCE — two views of the same input should match",
                "    inv = mse(Z, Z2)",
                "",
                "    # 2. VARIANCE — hinge: keep each dim's std above gamma (=1)",
                "    std = sqrt(Z.var(dim=0) + 1e-4)",
                "    var = mean(relu(gamma - std))",
                "",
                "    # 3. COVARIANCE — push off-diagonal correlations to zero",
                "    Zc = Z - Z.mean(dim=0)",
                "    cov = (Zc.T @ Zc) / (N - 1)",
                "    cov_loss = off_diagonal(cov).pow(2).sum() / D",
                "",
                "    return lam*inv + mu*var + nu*cov_loss",
              ]} />
            <div>
              <P>Two things worth internalizing. First, the variance term is a <Hi>hinge</Hi> — <code style={{color:C.cyan,background:C.ink3,padding:"1px 5px",borderRadius:4}}>relu(γ − std)</code> — not a penalty on the std itself; once a dimension is spread enough, it's left alone. (The paper notes you must hinge the <em>standard deviation</em>, not the variance: near zero, the gradient of √ blows up — so a dimension whose spread is dying gets a huge corrective shove back to life exactly when it needs it; penalize the variance directly and that shove <em>vanishes</em> near zero, letting the dimension die.) Second, the covariance term is closely related to Barlow Twins' redundancy reduction (VICReg decorrelates one branch's covariance; Barlow drives the <em>cross</em>-correlation between two views to identity — same spirit, not identical), and there's a beautiful information-theoretic reading: decorrelating dimensions <Hi>maximizes the information</Hi> the embedding carries per dimension. VICReg is, in disguise, an information-maximization objective.</P>
            </div>
          </Reveal>

          <GuessGate
            question="You delete the variance term (#2) and keep the other two. Which collapse comes back?"
            options={[
              "Complete — the whole cloud caves onto a single point",
              "Dimensional — the cloud flattens onto a thin line or plane",
              "Neither — the covariance term covers for it",
            ]}
            correct={0}
            explanation={<>Variance guards each dimension's <em>spread</em>, so without it nothing stops everything piling onto one point. Covariance guards the <em>off-diagonals</em> — kill that instead and you get dimensional collapse. Turn each one off below and confirm which failure you summoned.</>}
          />
          <Reveal>
            <P>Don't take the three terms on faith — turn each one off and watch the space die in exactly the way it was preventing:</P>
            <VICRegIsolatorLab />
          </Reveal>

          <Reveal>
            <div>
              <H3>The masking strategy is a design decision, not a detail</H3>
              <P>I-JEPA's results hinge on <em>how</em> you choose context and targets. Predicting single scattered patches just tests local texture interpolation; the model learns nothing semantic. The fix — <B>multi-block masking</B> — is specific and worth knowing by the numbers:</P>
            </div>
            <MaskingDifficultyLab />
            <div>
              <P>Two subtleties that trip people up. The targets are masked at the <Hi>output of the target encoder</Hi>, not the input — the teacher sees the whole image, then you select which of its representations to predict. And context–target <Hi>overlap is removed</Hi>, so the predictor can't cheat by copying a region it already sees. These are the choices that make the task semantic rather than trivial.</P>
            </div>
            <Aside tag="Next" color={C.cyan}>
              Notice how much machinery we've stacked up just to keep <B>collapse</B> at bay — EMA, stop-gradient, two regularizer terms, careful masking. It works, but it's a bag of tricks. What if a single principle could replace almost all of it? That's the next lecture.
            </Aside>
          </Reveal>

        </Section>

        {/* ---------------- 06 FRONTIER & EVAL ---------------- */}
        <Section id="depth2">
          <Heading id="depth2" num="06" eyebrow="The frontier & how it's measured"
            title={<>The provable rewrite — and how you judge a representation at all</>}
            intro="Remember the bag of tricks from Lectures 04–05 — EMA, stop-gradient, VICReg's three terms, each patching a different way the model could cheat? This is the lecture where one result makes almost all of it unnecessary. Here's how it was earned." />
          <Reveal>
            <div>
              <H3>SIGReg: how LeJEPA replaced the whole toolkit</H3>
              <P><span style={{color:C.textDim}}>In plain words: an <Hi>isotropic Gaussian</Hi> is the most boring possible cloud — round, evenly spread in every direction, no direction correlated with another (𝒩(0, I) is its name). LeJEPA's surprising result: if you don't know which downstream task you'll face, that maximally-spread blob is the <em>safest</em> shape — best guarantee against the worst case.</span></P>
              <P>LeJEPA's claim is sharp — though worth stating with its assumptions: <Hi>for linear downstream probes with standard Gaussian priors</Hi>, the <Hi>isotropic Gaussian</Hi> 𝒩(0, I) is the embedding distribution that minimizes worst-case prediction risk. (It need not be optimal for arbitrary nonlinear fine-tuning.) So instead of EMA, stop-gradients, and VICReg's three terms, just push the embeddings toward that one distribution. The trick is doing it cheaply in high dimensions — you can't directly match a 1024-dim density.</P>
            </div>

            <GuessGate
              tag="Predict first"
              question="You want to force a cloud of 1024-dimensional embeddings to look like a perfectly round Gaussian — but comparing two distributions directly in 1024-D is hopelessly expensive. What's the cheapest thing you could check instead?"
              options={[
                "Just check that the average of all the vectors is zero",
                "Check that many random 1-D shadows of the cloud each look like a simple bell curve",
                "Train a second network to classify 'round vs not round'",
              ]}
              correct={1}
              explanation={<>This is the whole trick (<B>Cramér–Wold</B>): a cloud is a round Gaussian if and only if <Hi>every</Hi> 1-D shadow it casts is a 1-D bell curve — like proving a shape is a sphere by checking every shadow is a circle. Test a few hundred random shadows and you've checked the whole thing, in linear time. That's <B>SIGReg</B>.</>}
            />

            <div>
              <P><B>SIGReg</B> (Sketched Isotropic Gaussian Regularization) turns that shadow test into a loss. The <Hi>sketching</Hi> part: you don't measure all the shadows, you sample a few hundred random projection directions, and on each run a fast univariate normality test (Epps–Pulley) — penalizing any shadow that isn't a clean bell curve. Cost is roughly O(P · batch) for P projections, one hyperparameter (λ), and it needs no teacher, no stop-gradient, no negatives.</P>
            </div>
            <div className="my-6 rounded-xl border p-5 font-mono text-[14px] leading-[1.9] overflow-x-auto"
                 style={{ borderColor: C.line, background: C.ink2, color: C.textHi }}>
              <span style={{ color: C.textFaint }}># SIGReg: match an isotropic Gaussian via random 1-D sketches</span><br/>
              ℛ(Z) = (1/P) Σ<sub style={{color:C.cyan}}>p</sub> &nbsp;<Hi>Gaussianity</Hi>( Z · ξ<sub style={{color:C.violet}}>p</sub> )&nbsp;&nbsp;<span style={{color:C.textFaint}}>ξ ~ 𝒩(0, I)</span><br/><br/>
              <span style={{ color: C.textFaint }}># Gaussianity = Epps–Pulley test statistic (linear cost)</span><br/>
              <span style={{ color: C.textFaint }}># Cramér–Wold: all 1-D projections Gaussian ⟺ joint is Gaussian</span>
            </div>
          </Reveal>

          <Reveal>
            <P>What does that isotropic-Gaussian target actually <em>look</em> like? Flip between the shapes and watch the statistics — round and uncorrelated is the goal; a point, a line, or an ellipse all waste the space:</P>
            <LatentGeometryLab />
          </Reveal>

          <Reveal>
            <div>
              <H3>How do you even evaluate a representation?</H3>
              <P>Your encoder is trained. It outputs vectors — not labels, not pixels. So how would <em>you</em> prove it learned anything useful, without training it further? (The answer is the family of frozen-feature probes below.)</P>
              <P>A researcher's reflexive question. Since JEPA produces embeddings, not labels or pixels, you measure quality by how useful the <Hi>frozen</Hi> features are downstream. The logic behind every protocol below: <em>if a dumb readout — a single linear layer, or even a nearest-neighbor lookup — can recover the labels straight off the frozen embeddings, then the embeddings already encode the meaning.</em> The hard work happened during self-supervised training. The standard protocols, in increasing permissiveness:</P>
              <ul className="my-4 space-y-2.5">
                <li className="text-[15px] pl-5 relative" style={{ color: C.text }}><span className="absolute left-0" style={{color:C.cyan}}>›</span><B>Linear probing</B> — freeze the backbone, train only a linear classifier on top. The cleanest test of "is the information linearly accessible?" This is the headline I-JEPA number (e.g. ViT-H/14 on ImageNet).</li>
                <li className="text-[15px] pl-5 relative" style={{ color: C.text }}><span className="absolute left-0" style={{color:C.cyan}}>›</span><B>Attentive / k-NN probing</B> — a small attention head or nearest-neighbor lookup; tests information that's present but not linearly separable.</li>
                <li className="text-[15px] pl-5 relative" style={{ color: C.text }}><span className="absolute left-0" style={{color:C.cyan}}>›</span><B>Low-shot</B> — linear probe on 1% of ImageNet labels; tests data efficiency, JEPA's claimed strength.</li>
                <li className="text-[15px] pl-5 relative" style={{ color: C.text }}><span className="absolute left-0" style={{color:C.cyan}}>›</span><B>Full fine-tuning</B> — unfreeze everything; highest ceiling but no longer measures the frozen representation.</li>
              </ul>
              <P><span style={{color:C.textDim}}>Why <em>linear</em> specifically? A linear layer can't learn complex structure on its own, so if a single linear layer can read the labels off the frozen embeddings, the encoder must have already arranged the space so meaning lies along straight directions. Linear-probe accuracy is thus a clean proxy for "how well-organized is the representation."</span></P>
              <P>For world models the metric shifts from classification to <Hi>control</Hi>: planning success rate on held-out tasks, planning wall-clock time, and — increasingly — <B>violation-of-expectation</B> probes, where a good world model should assign higher "surprise" (prediction error) to physically impossible events than to plausible ones. Watch for these terms in any JEPA paper; they're how the claims are actually substantiated.</P>
            </div>
            <Aside tag="Researcher's reading checklist" color={C.violet}>
              When you read the next JEPA paper, the questions that matter: <B>What's the collapse-prevention mechanism?</B> (EMA / VICReg / SIGReg / frozen encoder) · <B>What's masked, and at what scale?</B> · <B>Frozen or end-to-end encoder?</B> · <B>What's the evaluation protocol</B> (linear probe vs fine-tune vs control)? · <B>What's the energy / loss, exactly?</B> Answer those five and you understand the contribution.
            </Aside>
          </Reveal>

          <Reveal>
            <div>
              <P>Here's the violation-of-expectation probe made concrete. Morph an event from possible to impossible and watch whether the model's surprise tracks the physics.</P>
            </div>
            <GuessGate
              question="A good world model is shown two clips: a ball that rolls off a table and falls, and a ball that rolls off and hovers in mid-air. Which should it find MORE surprising?"
              options={[
                "The ball that falls — motion is always harder to predict",
                "The ball that hovers — it violates the physics the model internalized, so its prediction error spikes",
                "Neither — a world model has no notion of surprise",
              ]}
              correct={1}
              explanation={<>Exactly — surprise <em>is</em> the eval. A model that learned physics assigns low energy to the fall and high energy to the impossible hover. Slide "weirdness" up and watch the surprise meter climb:</>}
            />
            <ViolationLab />
          </Reveal>

          <Reveal>
            <Aside tag="Next" color={C.cyan}>
              You now have the full anti-<B>collapse</B> story and the tools to judge a representation. Time to step back: how does this whole approach actually stack up against the two families it's competing with — pixel-reconstructing generative models, and contrastive learning?
            </Aside>
          </Reveal>
          <Reveal><MathAppendix /></Reveal>
        </Section>

        {/* ---------------- 07 COMPARE ---------------- */}
        <Section id="compare">
          <Heading id="compare" num="07" eyebrow="Versus everything else"
            title={<>Generative, contrastive, JEPA — what each really optimizes</>}
            intro="Tap through the three families. The thing to watch is where each one computes its loss." />
          <GuessGate
            onResolved={() => mark("r-compare")}
            tag="Recall" hint="pull it from memory — retrieval beats re-reading" accent={C.cyan}
            question="From earlier: why is a generative model forced to 'waste' capacity that a JEPA isn't?"
            options={[
              "Its loss lives in pixel space, so it's penalized for failing to reproduce unpredictable detail",
              "It always has more parameters than a JEPA",
              "It can't run on a GPU efficiently",
            ]}
            correct={0}
            explanation={<>That's the <Hi>reconstruction tax</Hi> from <Xref to="why">§02</Xref>. A JEPA moves the loss into embedding space, so the encoder is free to discard detail it can't predict.</>}
          />
          <GuessGate
            tag="Predict first"
            question="Three ways to learn without labels: reconstruct the pixels (generative), pull-similar/push-different (contrastive), or predict one embedding from another (JEPA). Which one is forced to keep a big batch of unrelated images on hand at all times — and why?"
            options={[
              "Generative — it needs many images to reconstruct",
              "Contrastive — it needs negatives to push apart, and you need lots of them",
              "JEPA — it compares against many targets",
            ]}
            correct={1}
            explanation={<>Contrastive learning's whole apparatus — positives, negatives, big batches, hand-designed augmentations — exists to have enough "push-apart" examples. That pile is exactly what JEPA throws away. Tap through below and watch <Hi>where each one computes its loss.</Hi></>}
          />
          <Reveal>
            <Instructor label="quick vocabulary: negatives & augmentations">
              <p className="mb-2">Two words to pin down, since they're the crux of that middle column. <B>Contrastive</B> learning works with <em>pairs</em>: a <Hi>positive</Hi> pair is two altered views of the <em>same</em> image (crop it, recolor it — those distortions are the <Hi>augmentations</Hi>) that should land <em>near</em> each other; the <Hi>negatives</Hi> are other, unrelated images that should land <em>far</em> apart.</p>
              <p>Gathering enough negatives is exactly what forces the big batches and the hand-designed augmentations — the machinery you just predicted JEPA does without.</p>
            </Instructor>
          </Reveal>
          <ApproachCompare />
          <Reveal>
            <div>
              <P>The contrast LeCun presses hardest is with <B>LLMs</B>: an autoregressive model predicts the next token in data space and, in his view, only manipulates the statistics of human text — no grounded model of reality, weak long-horizon planning, error accumulating token by token. JEPA is his proposed alternative substrate: learn how the world <Hi>behaves</Hi> in abstract space, then plan against it.</P>
            </div>
            <div className="my-10 text-center">
              <p className="text-[clamp(20px,3.2vw,28px)] leading-snug italic mx-auto"
                 style={{ fontFamily: "var(--font-display)", color: C.textHi, maxWidth: "24ch" }}>
                "Generative methods try to fill in every bit of missing information, even though the world is inherently unpredictable."
              </p>
              <span className="font-mono text-[12px] tracking-wider uppercase mt-4 inline-block" style={{ color: C.cyan }}>
                — the recurring argument behind JEPA
              </span>
            </div>
            <Aside tag="Stay honest" color={C.amber}>
              This is a <B>research bet, not a settled result</B>. LLMs and diffusion models are far more capable at language and image generation today, and critics note JEPA is in some ways a refined Siamese/contrastive design, with embedding-space targets that are harder to evaluate than pixels. The interesting claim is about the long-run path to grounded, planning-capable machines — not this year's benchmarks.
            </Aside>

            <H3>Open questions worth knowing</H3>
            <P>And bluntly: on pure ImageNet linear-probe, JEPA's win is mostly <Hi>efficiency</Hi>, not beating the strongest self-supervised baselines (e.g. DINOv2) outright — the deeper bet is the world-model / planning path, not this year's benchmark table.</P>
            <P>A serious understanding includes the unresolved parts. None of these are fatal — they're the live research frontier.</P>
            <div className="grid sm:grid-cols-2 gap-3 my-5">
              {[
                ["Is it really a clean break from contrastive learning?", "JEPA shares the two-encoder Siamese skeleton and still needs anti-collapse machinery. Some argue it's an elegant refinement of joint-embedding SSL rather than a new paradigm."],
                ["How do you evaluate a learned target?", "Pixel reconstruction has an obvious ground truth. When both the prediction and the target are learned embeddings, debugging and measuring 'good' representations is genuinely harder."],
                ["Does it learn a complete world model?", "Philosophical critiques (e.g. comparing Sora and V-JEPA) argue current video models capture correlation and short-horizon dynamics, not full causal physical understanding."],
                ["Will it scale to language and reasoning?", "JEPA's wins are in perception and control. Whether latent-prediction substrates can match or replace autoregressive LLMs for language and abstract reasoning is open."],
              ].map(([q, a]) => (
                <div key={q} className="rounded-xl p-4" style={{ background: C.ink2, border: `1px solid ${C.line}` }}>
                  <div className="font-semibold text-[15px] mb-1.5" style={{ color: C.textHi }}>{q}</div>
                  <div className="text-[13.5px] leading-relaxed" style={{ color: C.textDim }}>{a}</div>
                </div>
              ))}
            </div>

            <H3>A concrete failure mode: slow features &amp; distractors</H3>
            <P>One weakness is worth singling out because it's specific and instructive. A JEPA's only instruction is "make the
            predicted embedding match the target embedding." The cheapest way to do that is to encode whatever is <Hi>easiest to
            predict</Hi> — and in many scenes that's the <B>slow-changing or static background</B>, not the fast, task-relevant motion.
            Left unchecked, the encoder can latch onto these "slow features" and a moving <B>distractor</B> can dominate the
            representation while the thing you actually care about gets ignored.</P>
            <Aside tag="Why it matters for design" color={C.amber}>
              This is the flip side of "predict the representation": the objective rewards predictability, and predictability isn't the
              same as usefulness. It's exactly why <B>target construction and masking strategy</B> carry so much weight in practice —
              you have to make the <em>useful</em> structure the thing that's worth predicting. It's an active research concern, not a solved one.
            </Aside>
            <div>
              <P>This is subtle enough to be worth feeling directly. Drive the masking strength and watch what the encoder chooses to pay attention to — and what that does to a "loss looks great" reading.</P>
            </div>
            <GuessGate
              question="A JEPA reports a beautifully LOW prediction loss. Does that guarantee it learned a USEFUL representation?"
              options={[
                "Yes — low loss means it predicted the important content well",
                "No — it can win by predicting an easy, slow background and ignoring the task object entirely",
                "Only if the model is large enough",
              ]}
              correct={1}
              explanation={<>Right — predictability isn't usefulness. The lowest loss can come from latching onto a trivial background. Watch loss stay low while usefulness sits near zero — until masking forces the encoder onto the object:</>}
            />
            <SlowFeaturesLab />
          </Reveal>
        </Section>

        {/* ---------------- 08 HISTORY ---------------- */}
        <Section id="history">
          <Heading id="history" num="08" eyebrow="How it came to be"
            title={<>A lineage that makes JEPA feel inevitable</>}
            intro="Four threads LeCun pulled on for decades — energy-based models, Siamese networks, self-supervised learning, and predictive world models — converge here." />
          <Reveal>
            <P>Those open questions you just saw weren't obvious from the start — they surfaced one fix at a time. So before the frontier, the lineage that exposed them: how each idea became almost <em>inevitable</em> given the problem the one before it left behind. <span style={{color:C.textDim}}>(One thread above to pin down: a <Hi>Siamese network</Hi> is two weight-sharing encoder branches that each process one input so the two can be compared in embedding space — JEPA's context/target two-branch design is a direct descendant.)</span></P>
          </Reveal>
          <GuessGate
            onResolved={() => mark("r-history")}
            tag="Recall" hint="pull it from memory — retrieval beats re-reading" accent={C.cyan}
            question="From earlier: what's the lazy shortcut that drives a JEPA's loss to zero while it learns nothing?"
            options={[
              "Lowering the learning rate to zero",
              "Making every embedding identical — representation collapse",
              "Adding more attention heads",
            ]}
            correct={1}
            explanation={<><Hi>Representation collapse</Hi> (<Xref to="collapse">§04</Xref>). Preventing it — EMA + stop-gradient, then variance/covariance and later SIGReg — is what most of this history is reacting to.</>}
          />
          <DiscoveryTimeline />
          <Reveal>
            <div>
              <H3>The six-module brain JEPA was built to power</H3>
              <P>Crucial context for where this is all heading: JEPA was never meant as a standalone vision model. In the 2022 paper it's one component of a proposed autonomous agent with six differentiable modules — <B>configurator</B> (executive control), <B>perception</B> (current state), <B>world model</B> (fill in missing state, predict futures — where JEPA lives), <B>cost</B> (a scalar "discomfort" to minimize), <B>actor</B> (propose action sequences), and <B>short-term memory</B>.</P>
              <P>Planning works by the actor proposing actions, the world model predicting their consequences <Hi>in latent space</Hi>, and gradients of the cost flowing back through the whole differentiable chain. The <B>hierarchical</B> version (H-JEPA) stacks world models at multiple abstraction levels: detailed representations for short-horizon prediction, abstract ones for long-horizon planning. Both levels train with the same predict-the-representation objective and anti-collapse machinery; the new part is that the abstract level's predictions act as <Hi>subgoals</Hi> the detailed level steers toward — long-horizon plans get made where the future is actually predictable. V-JEPA 2's robotics work begins to make this real.</P>
            </div>
          </Reveal>
          <Reveal><HJepaDiagram /></Reveal>
          <HJepaHorizonLab />
        </Section>

        {/* ---------------- 09 MODELS ---------------- */}
        <Section id="models">
          <Heading id="models" num="09" eyebrow="The family, in depth"
            title={<>From one image to a robot planning in a lab it's never seen</>}
            intro="Each model takes the same core idea into a new domain or fixes a known weakness. Explore what actually changed each time." />
          <Reveal>
            <P>Read it as one question repeated: <em>what was still missing?</em> Each model adds exactly one thing the last one lacked — a new domain, a proof, or a simpler recipe.</P>
            <div className="my-6 flex flex-wrap items-center gap-1.5">
              {[["2023", "I-JEPA", "images"], ["2024", "V-JEPA", "+ time"], ["Jun 2025", "V-JEPA 2", "world model"], ["Nov 2025", "LeJEPA", "provable"], ["Mar 2026", "LeWM", "end-to-end"]].map(([yr, name, add], i, arr) => (
                <React.Fragment key={name}>
                  <span className="rounded-lg px-2.5 py-1.5 font-mono text-[11px]" style={{ border: `1px solid ${C.line}`, background: C.ink2 }}>
                    <span style={{ color: C.textFaint }}>{yr}</span>{" "}<B>{name}</B>{" "}<span style={{ color: C.cyan }}>{add}</span>
                  </span>
                  {i < arr.length - 1 && <span style={{ color: C.textFaint }}>→</span>}
                </React.Fragment>
              ))}
            </div>
          </Reveal>
          <ModelExplorer />
          <Reveal><TwoStageTraining /></Reveal>
          <Reveal>
            <Aside tag="Quick jargon decoder">
              <B>7-DoF</B> = the arm moves 7 independent ways · <B>Franka</B> is a common research arm · <B>DROID</B> is a public robot-video dataset · <B>ViT-Tiny / H / g</B> are size labels (Tiny ~5M params → g &gt;1B). None of these change the idea — they're just the hardware and model sizes the papers happen to use.
            </Aside>
          </Reveal>
          <GuessGate
            onResolved={() => mark("g3")}
            question="Before you try the lab below — why can V-JEPA 2 plan a reported ~15× faster than a diffusion world model like Cosmos?"
            options={[
              "It uses a bigger GPU cluster at inference time",
              "It scores imagined plans by comparing embeddings, while Cosmos must render full pixel frames for each candidate",
              "It memorizes the solution to each task in advance",
            ]}
            correct={1}
            explanation={<>Right. Both use the same Cross-Entropy Method search, but Cosmos generates full-resolution pixel predictions for every candidate plan (a reported ~4 min/action), while V-JEPA 2 compares short embedding vectors (~16 sec/action). Predicting in representation space isn't just cleaner — it's what makes real-time planning affordable. Watch a search converge below, then we'll dissect the loop.</>}
          />

          <Reveal>
            <LatentPlanningLabT />
          </Reveal>

          <Reveal>
            <Instructor label="so what was that search, exactly?">
              <p className="mb-2">You just watched a cloud of guessed plans narrow onto the goal. Let's name what ran. The robot wants to reach a goal and you hand it a single <Hi>photo</Hi> of it (block in the box). (Remember <Hi c={C.violet}>z</Hi> from "Why Latent" — the part of the future the context couldn't pin down? In a controllable world model that slot <em>is</em> the action: "if I do <Hi>this</Hi>, the latent state moves like so.")</p>
              <p className="mb-2">"Plan" here means the <B>Cross-Entropy Method</B> (CEM) — there's no trained policy, just a search that repeats five steps. (Confusingly, the <em>Cross-Entropy Method</em> is NOT the cross-entropy loss from classification — it's an unrelated black-box search: smart guess-and-refine.) Two ideas are stacked: <B>MPC</B> is the outer habit — only trust your plan one step, then look again and re-plan from what you actually see, so errors can't compound. <B>CEM</B> is the inner search that finds the plan each step. MPC is the loop; CEM runs inside it.</p>
              <ol className="mb-3" style={{ margin: "0 0 12px 20px" }}>
                <li className="mb-1"><B>Sample</B> a few hundred action sequences from a Gaussian over "good plans."</li>
                <li className="mb-1"><B>Roll out</B> each one through the predictor to see where it lands in latent space.</li>
                <li className="mb-1"><B>Score</B> each by distance to the goal <em>embedding</em> (not goal pixels). <span style={{color:C.textDim}}>(The training loss uses squared-L2; for <em>scoring</em> candidate plans here the distance is L1 — sum of absolute differences — which is just more robust to outliers; either works.)</span></li>
                <li className="mb-1"><B>Keep the elites</B> — the best ~10% — and refit: move the Gaussian's center to their average and shrink it, so next round you sample closer to what worked.</li>
                <li><B>Execute one action</B> (the first of the best plan), then look again and replan.</li>
              </ol>
              <p className="mb-2">Written out, it's just that loop:</p>
              <CodeBlockInline />
              <p className="mt-3">That's model-predictive control, and notice the key move on the scoring line: it compares <Hi>imagined embedding</Hi> to <Hi>goal embedding</Hi> — two short vectors — not imagined pixels to goal pixels. The same "do everything in representation space" trick from the very first section is what makes planning cheap enough to run on a real arm. <B>It's the same idea the whole way down.</B></p>
            </Instructor>
          </Reveal>
          <Reveal>
            <div>
              <P><span style={{color:C.textDim}}>The template has also been ported to tabular data (T-JEPA), graphs, audio, EEG, and multimodal text–image–video (TI-JEPA, VL-JEPA). The recurring lesson: JEPA is powerful but <em>not automatic</em> — success hinges on target construction, masking strategy, and collapse prevention.</span></P>
            </div>
          </Reveal>
        </Section>

        {/* ---------------- 10 WORLD MODELS ---------------- */}
        <Section id="worldmodels">
          <Heading id="worldmodels" num="10" eyebrow="The destination"
            title={<>All of this was building toward a <Hi>world model</Hi></>}
            intro="Every piece so far — latent prediction, the predictor, collapse prevention, action conditioning — exists to make one thing possible: a machine that learns how the world works and plans inside that understanding." />

          <GuessGate
            onResolved={() => mark("r-worldmodels")}
            tag="Recall" hint="pull it from memory — retrieval beats re-reading" accent={C.cyan}
            question="From earlier: what does the JEPA predictor become once it's conditioned on an action?"
            options={[
              "A pixel decoder",
              "A contrastive loss term",
              "A world model you can plan against",
            ]}
            correct={2}
            explanation={<>The action-conditioned predictor <em>is</em> the world model — "if I take this action, the latent state moves like so" — which is exactly what V-JEPA 2-AC searches when it plans.</>}
          />

          <Reveal>
            <div>
              <P><Xref to="models">§09</Xref> walked the family model by model. Now zoom out to the <em>idea</em> they were all building toward. A <B>world model</B> is an internal simulator: encode what you observe into a latent state, predict how that state evolves (optionally given your actions), and then <Hi>plan by searching that prediction</Hi> instead of acting blindly in the real world. This was the centerpiece of LeCun's 2022 manifesto — the most complex of the six modules — and everything in the JEPA family is, in the end, a run at building it.</P>
              <P>The recurring obstacle has a name you now know well: <B>collapse</B>. Training a world model end-to-end from raw pixels is fragile, because the encoder can cheat by mapping every frame to nearly the same embedding — prediction becomes trivial and the representation dies. The recent history of JEPA world models is essentially a set of different answers to "how do we get end-to-end training without collapse?"</P>
            </div>
          </Reveal>

          <GuessGate
            question="You want a world model trained end-to-end from pixels (so it can shape its own features). What's the price you pay versus freezing a pretrained encoder?"
            options={[
              "No price — end-to-end is strictly better",
              "It can collapse — the encoder can cheat by mapping every frame to the same embedding",
              "It's always less accurate than a frozen encoder",
            ]}
            correct={1}
            explanation={<>Exactly — end-to-end power reintroduces the collapse risk a frozen encoder sidesteps for free. The four models below are four different answers to that one tension. Explore them, <em>then</em> we'll sort them.</>}
          />

          <Reveal>
            <H3>The world-model landscape</H3>
            <P>Explore the four models that define the current frontier. Watch the same two questions — <em>frozen or end-to-end?</em> and <em>how do you stop collapse?</em> — separate them.</P>
            <WorldModelLandscape />
          </Reveal>

          <Reveal>
            <Instructor label="so how do the four sort out?">
              <p className="mb-2">If you watched the two axes, the field collapses into three families of answer:</p>
              <p className="mb-2"><B>1 · Don't train the encoder at all.</B> <span style={{color:C.violet}}>DINO-WM</span> freezes a pretrained DINOv2 encoder (a strong off-the-shelf self-supervised image encoder) and only learns the predictor. Can't collapse if you never update it — but you're stuck with whatever those frozen features happen to encode. Frozen DINOv2 works as a planning encoder because of its <em>emergent</em> properties — it learns segmentation- and correspondence-like structure without labels — which is why off-the-shelf frozen features are already good enough to plan on.</p>
              <p className="mb-2"><B>2 · Train end-to-end, pile on regularizers.</B> <span style={{color:C.amber}}>PLDM</span> trains from pixels but needs a seven-term VICReg-style loss with a painful coefficient search to stay stable.</p>
              <p><B>3 · Train end-to-end, with one principled regularizer.</B> <span style={{color:C.green}}>LeWorldModel</span> uses just next-embedding prediction + SIGReg — the provably-optimal Gaussian target from LeJEPA — and the fragility largely goes away. That's the synthesis the whole field was reaching for, and exactly where we land next.</p>
            </Instructor>
          </Reveal>

          <Reveal>
            <div>
              <P>That table is really a set of tradeoffs. Pick a recipe below and watch what you pay for it — then look for the one mode that refuses to make you choose.</P>
            </div>
            <GuessGate
              question="Of these recipes for training a world model end-to-end, which gets you BOTH high training stability AND high feature quality?"
              options={[
                "A frozen encoder — perfectly stable, so quality must be high too",
                "Many regularizer terms (PLDM) — more terms means more of everything",
                "SIGReg (LeWM) — the others force a tradeoff; SIGReg lands top-right on both",
              ]}
              correct={2}
              explanation={<>Right — frozen is stable but capped; multi-term is powerful but fragile; only SIGReg gets both. Flip between the modes and watch where each lands on the two meters:</>}
            />
            <StabilityDialLab />
          </Reveal>

          <Reveal>
            <div>
              <H3>LeWorldModel: the recipe gets small and clean</H3>
              <P><B>LeWorldModel (LeWM)</B>, from LeCun, Balestriero and collaborators in March 2026, is the clearest statement of the thesis so far. It learns an action-conditioned world model <Hi>directly from raw pixels</Hi> — no pixel reconstruction, no reward, no frozen pretrained encoder, and crucially <Hi>no EMA or stop-gradient</Hi>. Just an encoder and a predictor, trained jointly, with a two-term objective.</P>
            </div>
            <div className="my-6 rounded-xl border p-5 font-mono text-[14px] leading-[1.9] overflow-x-auto"
                 style={{ borderColor: C.line, background: C.ink2, color: C.textHi }}>
              <span style={{ color: C.textFaint }}># the entire LeWM objective</span><br/>
              ℒ = <Hi>ℒ_pred</Hi>( predict(z_t, action), z_<span style={{fontSize:"0.8em"}}>t+1</span> ) &nbsp;+&nbsp; <Hi c={C.green}>λ · SIGReg</Hi>(Z)<br/><br/>
              <span style={{ color: C.textFaint }}># ℒ_pred: predict the NEXT embedding from the current one + action</span><br/>
              <span style={{ color: C.textFaint }}># SIGReg: keep the embedding cloud an isotropic Gaussian → no collapse</span><br/>
              <span style={{ color: C.textFaint }}># λ is effectively the ONLY hyperparameter to tune</span>
            </div>
            <div>
              <P>The payoff is startling in its modesty. The encoder is a <B>ViT-Tiny</B> (~5 million parameters; about <Hi>15 million</Hi> for the whole model including the predictor), trainable on a single GPU in a few hours. Each frame becomes one 192-dimensional token (a reported ~200× fewer than DINO-WM), so planning with the Cross-Entropy Method — encode a start and goal image, search action sequences whose predicted final embedding lands nearest the goal — finishes in about <Hi>one second</Hi>, a reported <Hi>~48× faster</Hi> than DINO-WM-class world models. It reportedly beats PLDM by ~18% on the Push-T task and stays competitive with DINO-WM even when DINO-WM is handed extra information.</P>
            </div>
            <Aside tag="Stay honest" color={C.amber}>
              LeWM is not a clean win everywhere. On the <em>simplest</em> environment tested (Two-Room) it underperforms — the authors note SIGReg's isotropic-Gaussian target can be <B>too strong a prior</B> for low-dimensional environments. And like all these methods it still needs offline data with good action coverage. The honest claim is "easier, faster, and more stable," not "universally best."
            </Aside>
          </Reveal>

          <Reveal>
            <H3>Why this is the moment — AMI Labs</H3>
            <div>
              <P>This research isn't staying in the lab. In late 2025 LeCun left Meta after ~12 years leading FAIR, and in December 2025 co-founded <B>AMI Labs</B> — Advanced Machine Intelligence (and "ami," French for <em>friend</em>) — a Paris-based company built explicitly on the bet that <Hi>world models, not bigger LLMs</Hi>, are the path to machine intelligence that understands the physical world, holds persistent memory, and plans. It raised a ~$1B seed in early 2026, among the largest ever, with LeCun as executive chairman.</P>
              <P>That is the throughline this entire course has been tracing. The argument from the very first section — <Hi>predict the representation, not the pixels</Hi> — is no longer just a paper. It's a research program with a billion dollars behind it, a string of models from I-JEPA to LeWM making it concrete, and an open question at its heart: can a machine that learns the world by watching, the way a child does, get to intelligence that scaling text never will? Nobody knows yet. That's what makes it worth understanding deeply.</P>
            </div>
            <Aside tag="The arc, in one line" color={C.cyan}>
              Predict in latent space (I-JEPA) → add time (V-JEPA) → make it a controllable world model at web scale (V-JEPA 2) → give it a provable training objective (LeJEPA) → collapse the whole recipe into a stable end-to-end world model from pixels (LeWorldModel) → build a company around it (AMI Labs). <B>One idea, followed all the way down.</B>
            </Aside>
          </Reveal>
        </Section>

        {/* ---------------- 11 RECAP ---------------- */}
        <Section id="recap">
          <Heading id="recap" num="11" eyebrow="Lock it in"
            title={<>Retrieve everything — this is where it sticks</>}
            intro="One last pass. Recalling under mild effort beats re-reading every time — so test yourself before you move on." />
          <Checkpoint
            onComplete={() => mark("quiz")}
            items={[
              { q: "What is JEPA's single defining design choice?",
                options: ["Using transformers instead of CNNs", "Computing prediction loss in embedding space, not data space", "Training without any unlabeled data"],
                correct: 1,
                why: "Everything else follows from relocating the loss to representation space — it's what lets the encoder discard unpredictable detail." },
              { q: "Why is the target encoder updated by EMA with a stop-gradient?",
                options: ["To save memory during training", "To provide stable targets the student can't trivially game, breaking the symmetry that allows collapse", "To make the model generate sharper pixels"],
                correct: 1,
                why: "It's the asymmetry — stop-gradient + predictor — that does the work; EMA is just one (optional) way to get a stable target. SimSiam avoids collapse with no EMA at all." },
              { q: "What does the latent variable z represent?",
                options: ["The learning rate schedule", "Information about the target not present in the context — i.e. residual uncertainty / multiple valid futures", "The number of masked patches"],
                correct: 1,
                why: "Varying z sweeps out plausible continuations, giving JEPA a principled way to model uncertainty." },
              { q: "In V-JEPA 2-AC, how does a predictor become a controller?",
                options: ["It's fine-tuned with reinforcement learning on each new robot", "Model-Predictive Control: imagine latent consequences of actions, score by distance to a goal embedding, execute, replan", "It generates a video of the plan and a human follows it"],
                correct: 1,
                why: "Planning happens entirely in latent space against a goal image — zero-shot, no task-specific reward." },
              { q: "Why does LeJEPA matter beyond being 'another variant'?",
                options: ["It's the first JEPA to use pixels again", "It proves an isotropic Gaussian is the optimal embedding distribution and enforces it with one regularizer — removing EMA/stop-gradient heuristics", "It only works on tabular data"],
                correct: 1,
                why: "It turns JEPA from an empirical recipe into a method with provable guarantees." },
              { q: "What makes LeWorldModel the 'synthesis' of the JEPA program?",
                options: ["It abandons latent prediction in favor of pixel reconstruction", "It trains a world model end-to-end from pixels and stays stable using just prediction + SIGReg — no frozen encoder, no EMA, no stop-gradient", "It's the largest JEPA model ever trained"],
                correct: 1,
                why: "It combines end-to-end training (powerful) with one principled anti-collapse term (stable) — the best of the frozen-encoder and multi-loss approaches, and the bet AMI Labs is built on." },
            ]}
          />
          <Reveal>
            <Instructor label="one last thing — how to make this stick">
              <p className="mb-2">If you got some of those wrong, good — that's the part that's actually working. Learning is supposed to feel a little effortful; the friction is the signal that you're encoding something, not just recognizing it.</p>
              <p>Two things that beat re-watching or re-reading every time. First, <B>teach it back</B>: close this page and explain to a friend (or a wall) why JEPA computes loss in embedding space and why that forces the collapse problem. If you stumble, you've found exactly what to revisit. Second, <B>build the smallest version</B>: take the 9-line <code style={{color:C.cyan,background:C.ink3,padding:"1px 5px",borderRadius:4}}>jepa_step</code> from earlier and try to type it from memory. The goal isn't to impress anyone — it's to measure today's understanding against yesterday's.</p>
            </Instructor>
          </Reveal>

          <Reveal>
            <H3>Appendix — I-JEPA in ~40 lines</H3>
            <P>The 9-line <code style={{color:C.cyan,background:C.ink3,padding:"1px 5px",borderRadius:4}}>jepa_step</code> showed the heart of it. Here is the fuller picture: multi-block masking, the EMA teacher, the narrow predictor, and the loss — the whole training step, with nothing hidden. Read it once; the copy button is there if you want to pull it apart yourself.</P>
            <CodeBlock title="i_jepa.py — a minimal, faithful training step"
              lines={[
                "# Minimal I-JEPA: predict the EMBEDDINGS of masked target blocks",
                "# from a visible context block. No pixels in the loss, no negatives.",
                "# Collapse is prevented architecturally: an EMA teacher + stop-grad.",
                "import torch, copy",
                "",
                "context_encoder = ViT()                       # the student we keep",
                "target_encoder  = copy.deepcopy(context_encoder)   # the EMA teacher",
                "predictor       = NarrowViT()                 # context -> target embeddings",
                "opt = torch.optim.AdamW(",
                "    list(context_encoder.parameters()) + list(predictor.parameters()), lr=1e-3)",
                "",
                "def sample_blocks():",
                "    # 1 big context block, 4 smaller target blocks (I-JEPA scales)",
                "    ctx     = block(scale=(0.85, 1.0), aspect=1.0)",
                "    targets = [block(scale=(0.15, 0.2), aspect=(0.75, 1.5)) for _ in range(4)]",
                "    ctx = remove_overlap(ctx, targets)        # keep the task non-trivial",
                "    return ctx, targets",
                "",
                "def train_step(image):",
                "    patches = patchify(image, patch=14)        # ViT-H/14 tokenization",
                "    ctx_idx, tgt_blocks = sample_blocks()",
                "",
                "    s_ctx = context_encoder(patches[ctx_idx])  # encode visible context only",
                "",
                "    with torch.no_grad():                      # teacher gets no gradient",
                "        s_full  = target_encoder(patches)      # encode the FULL image",
                "        targets = [s_full[b] for b in tgt_blocks]   # mask at the OUTPUT",
                "",
                "    loss = 0.0",
                "    for b, tgt in zip(tgt_blocks, targets):",
                "        pred = predictor(s_ctx, target_pos=b)  # predict that block's embeddings",
                "        loss = loss + mse(pred, tgt)           # error lives in latent space",
                "    loss = loss / len(targets)",
                "",
                "    opt.zero_grad(); loss.backward(); opt.step()",
                "",
                "    # EMA update: teacher slowly trails the student, no backprop",
                "    with torch.no_grad():",
                "        for ps, pt in zip(context_encoder.parameters(),",
                "                          target_encoder.parameters()):",
                "            pt.mul_(0.996).add_(ps, alpha=0.004)   # tau = 0.996",
                "",
                "    return loss.item()",
              ]} />
            <Instructor label="read it with me — three lines carry the whole idea">
              <p className="mb-2">Don't read it as 40 equal lines. Three moments are the entire architecture; the rest is plumbing:</p>
              <ul style={{ margin: "0 0 8px 20px" }}>
                <li className="mb-1"><B>The <code style={{ color: C.cyan, background: C.ink3, padding: "1px 5px", borderRadius: 4 }}>with torch.no_grad()</code> block</B> — the teacher gets no gradient and its targets are read off the <em>full</em> image. That stop-gradient is a key anti-collapse mechanism.</li>
                <li className="mb-1"><B>The <code style={{ color: C.cyan, background: C.ink3, padding: "1px 5px", borderRadius: 4 }}>sample_blocks()</code> scales</B> — one big context, four large targets. Shrink the targets to single patches and the task becomes texture-copying; the semantics die.</li>
                <li><B>The <code style={{ color: C.cyan, background: C.ink3, padding: "1px 5px", borderRadius: 4 }}>mse(pred, tgt)</code> + EMA update</B> — the loss lives in embedding space, and the teacher only ever trails the student by 0.4% a step. No pixels, no negatives.</li>
              </ul>
              <p>If you change one thing first, make it the target scale — it's the line that most changes what the model learns.</p>
            </Instructor>
          </Reveal>

          <Reveal>
            <H3>Final review</H3>
            <P>One core question from every lecture, shuffled into a single graded deck. This is the spaced-retrieval payoff — answer from memory; if one stings, jump straight back to that lecture.</P>
            <ReviewDeck />
          </Reveal>

          <Reveal>
            <H3>Key terms, one tap away</H3>
            <P>A quick-reference glossary — tap any term to expand it. Skim it now, then use it whenever a word stops feeling solid.</P>
            <Glossary />
          </Reveal>

          <Reveal>
            <div className="my-8 text-center">
              <p className="text-[clamp(19px,3vw,26px)] leading-snug mx-auto"
                 style={{ fontFamily: "var(--font-display)", color: C.textHi, maxWidth: "26ch" }}>
                Predict the representation, regularize the geometry, plan in latent space.
              </p>
              <span className="font-mono text-[12px] tracking-wider uppercase mt-4 inline-block" style={{ color: C.cyan }}>
                the whole program in nine words
              </span>
            </div>
          </Reveal>
        </Section>
            <SourcesFooter />
          </div>
        </main>
      </div>
    </PageContext.Provider>
  );
}
