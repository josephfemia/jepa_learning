import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { DARK, LIGHT, ThemeContext, useTheme } from "./theme.js";
import { SECTIONS, SECTION_CHECK, TIMELINE, MODELS, GLOSSARY, WORLD_MODELS } from "./data.js";
import { cx, clamp, lerp, scoreQuiz, planCEM } from "./logic.js";

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

/* theme toggle icons */
function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/* Hook: has this element scrolled into view (for reveal animations) */
function useInView(opts = { threshold: 0.15 }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setSeen(true);
        io.disconnect();
      }
    }, opts);
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen];
}

/* Reveal wrapper */
function Reveal({ children, className, delay = 0 }) {
  const [ref, seen] = useInView();
  return (
    <div
      ref={ref}
      className={cx("transition-all duration-700 ease-out", className)}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? "none" : "translateY(24px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ----------------------------- shared UI bits ---------------------------- */
function Eyebrow({ num, children }) {
  const C = useTheme();
  return (
    <div className="font-mono text-xs tracking-[0.18em] uppercase mb-4 flex items-center gap-3"
         style={{ color: C.cyan }}>
      {num && <span style={{ color: C.textFaint }}>{num}</span>}
      <span className="h-px w-8" style={{ background: C.cyan }} />
      {children}
    </div>
  );
}

function Aside({ tag, color, children }) {
  const C = useTheme(); color = color || C.cyan;
  return (
    <div className="my-7 rounded-r-lg pl-5 pr-5 py-4 max-w-[64ch]"
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
         style={{ background: C.isDark ? "#0d1320" : "#f0f3f9", border: `1px solid ${C.line}` }}>
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
  const tint = (ln) => {
    // comments
    if (ln.trimStart().startsWith("#")) return { color: C.textFaint };
    return { color: C.text };
  };
  return (
    <div className="my-6 rounded-xl overflow-hidden border" style={{ borderColor: C.line, background: C.codeBg }}>
      {title && (
        <div className="px-4 py-2 flex items-center gap-2 border-b" style={{ borderColor: C.codeBar, background: C.codeBar }}>
          <span className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#f0a84a" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#38e1d6" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#9d8cff" }} />
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
            <span className="select-none pr-4 text-right" style={{ color: "#2f3a52", minWidth: 28 }}>{i + 1}</span>
            <code style={tint(ln)} dangerouslySetInnerHTML={{ __html: highlightPy(ln) }} />
          </div>
        ))}
      </pre>
    </div>
  );
}
/* minimal python-ish highlighter (keywords, strings, numbers, calls in cyan) */
function highlightPy(ln) {
  if (ln.trimStart().startsWith("#"))
    return `<span style="color:#5d6781">${escapeHtml(ln)}</span>`;
  let s = escapeHtml(ln);
  s = s.replace(/\b(def|return|for|in|with|import|from|as|None|and|not)\b/g, '<span style="color:#9d8cff">$1</span>');
  s = s.replace(/(#.*$)/g, '<span style="color:#5d6781">$1</span>');
  s = s.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#f0a84a">$1</span>');
  s = s.replace(/\b([a-zA-Z_]\w*)(\()/g, '<span style="color:#38e1d6">$1</span>$2');
  return s;
}
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
/*  INTERACTIVE 1 — The cost of predicting pixels (slider reveals the idea)    */
/* ========================================================================== */
function PixelVsLatentLab() {
  const C = useTheme();
  const [detail, setDetail] = useState(80); // how much pixel detail the model is forced to model
  // "wasted effort" rises steeply with detail; "useful signal" saturates early
  const useful = Math.round(100 * (1 - Math.exp(-detail / 22)));
  const wasted = Math.round(detail * 0.9);
  const total = useful + wasted;
  const usefulFrac = total ? useful / total : 0;

  return (
    <div className="my-8 rounded-2xl border overflow-hidden" style={{ borderColor: C.line, background: C.ink2 }}>
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <h4 className="font-semibold text-lg" style={{ color: C.textHi }}>The reconstruction tax</h4>
          <Pill color={C.amber}>interactive</Pill>
        </div>
        <p className="text-sm mb-5" style={{ color: C.textDim }}>
          Drag to set how much raw pixel detail a generative model is forced to reproduce. Watch where its
          effort actually goes.
        </p>

        {/* the two reservoirs */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {[
            { label: "Useful semantic signal", val: useful, color: C.cyan, note: "what helps reasoning" },
            { label: "Effort on unpredictable detail", val: wasted, color: C.amber, note: "texture, noise, lighting" },
          ].map((r) => (
            <div key={r.label}>
              <div className="flex items-end justify-between mb-1">
                <span className="text-xs" style={{ color: C.textDim }}>{r.label}</span>
                <span className="font-mono text-sm" style={{ color: r.color }}>{r.val}</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: C.ink3 }}>
                <div className="h-full rounded-full transition-all duration-300"
                     style={{ width: `${clamp(r.val, 0, 100)}%`, background: r.color }} />
              </div>
              <div className="text-[11px] mt-1" style={{ color: C.textFaint }}>{r.note}</div>
            </div>
          ))}
        </div>

        <input
          type="range" min="5" max="100" value={detail}
          onChange={(e) => setDetail(+e.target.value)}
          className="w-full accent-amber-400"
          style={{ accentColor: C.amber }}
          aria-label="Amount of pixel detail the model must reproduce"
        />
        <div className="flex justify-between font-mono text-[11px] mt-1" style={{ color: C.textFaint }}>
          <span>abstract (JEPA-like)</span>
          <span>pixel-perfect (generative)</span>
        </div>

        <div className="mt-5 rounded-xl p-4 text-[14px] leading-relaxed"
             style={{ background: C.ink3, color: C.text }}>
          {usefulFrac > 0.6 ? (
            <span>Notice: when the model stays abstract, almost all its capacity becomes <span style={{color:C.cyan}}>useful signal</span>. This is the regime JEPA lives in — predict the <em>meaning</em>, skip the noise.</span>
          ) : usefulFrac > 0.35 ? (
            <span>As you demand more detail, effort tilts toward things that don't help downstream tasks. The useful signal has already saturated.</span>
          ) : (
            <span>At pixel-perfect reconstruction, the model pours most of its budget into detail it can't even reliably predict — <span style={{color:C.amber}}>the reconstruction tax</span>. The world is not fully predictable, so this effort is partly wasted.</span>
          )}
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
                    className="aspect-square rounded-md transition-all duration-300"
                    style={{
                      background: isMasked ? (predicted ? C.okBg : C.ink3) : bg,
                      border: isMasked
                        ? `1.5px ${predicted ? "solid" : "dashed"} ${predicted ? C.cyan : C.violet}`
                        : `1px solid ${C.cyan}55`,
                      cursor: phase === "idle" ? "pointer" : "default",
                      boxShadow: predicted ? `0 0 10px ${C.cyan}66` : "none",
                      transform: phase === "encoding" && !isMasked ? "scale(0.92)" : "none",
                    }}
                    aria-label={isMasked ? "masked target patch" : "visible context patch"}
                  />
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
            The predictor never drew a single pixel. It predicted the <span style={{color:C.cyan}}>embeddings</span> of
            the hidden patches from the visible ones. That's the whole trick — and why JEPA can ignore
            unpredictable detail while still learning what the scene <em>means</em>.
          </div>
        )}
      </div>
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
/*  Contrastive vs regularized — the two ways to shape an energy landscape.     */
/* ========================================================================== */
function ContrastiveVsRegularized() {
  const C = useTheme();
  const [mode, setMode] = useState("reg");
  const isReg = mode === "reg";
  const col = isReg ? C.cyan : C.violet;
  return (
    <div className="my-6">
      <div className="flex gap-2 mb-4">
        <button onClick={() => setMode("con")}
          className="flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
          style={{ background: !isReg ? `${C.violet}1f` : C.ink2, border: `1px solid ${!isReg ? C.violet : C.line}`, color: !isReg ? C.textHi : C.textDim }}>
          Contrastive (push up negatives)
        </button>
        <button onClick={() => setMode("reg")}
          className="flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
          style={{ background: isReg ? `${C.cyan}1f` : C.ink2, border: `1px solid ${isReg ? C.cyan : C.line}`, color: isReg ? C.textHi : C.textDim }}>
          Regularized (constrain statistics)
        </button>
      </div>
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: col + "66", background: C.ink2 }}>
        <svg viewBox="0 0 600 200" className="w-full" style={{ display: "block" }}>
          {(() => {
            const pts = [];
            for (let x = 0; x <= 600; x += 6) {
              const u = x / 600;
              const valley = Math.exp(-Math.pow((u - 0.38) / 0.07, 2));
              let e;
              if (isReg) {
                e = Math.min(1, 0.15 + (1 - valley) * 0.8);
              } else {
                e = Math.max(0.1, 1 - valley * 0.9);
              }
              // y grows downward in SVG, so low energy must map to a LARGER y
              // (a valley at the bottom) and high energy to the top (a peak).
              pts.push([x, 160 - e * 130]);
            }
            const d = "M " + pts.map((p) => `${p[0]},${p[1]}`).join(" L ");
            // sit the data marker on the valley floor (energy at u = 0.38)
            const dataE = isReg ? 0.15 : 0.1;
            const dataY = 160 - dataE * 130;
            return (
              <>
                <path d={d} fill="none" stroke={col} strokeWidth="2.5" />
                <circle cx={0.38 * 600} cy={dataY} r="6" fill={C.green} />
                <text x={0.38 * 600} y={dataY + 22} fill={C.green} fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle">data (low E)</text>
                {!isReg ? (
                  <>
                    {/* a single up-arrow: a negative point has its energy pushed up */}
                    <line x1={0.72 * 600} y1={86} x2={0.72 * 600} y2={56} stroke={C.amber} strokeWidth="2.5" strokeLinecap="round" />
                    <path d={`M ${0.72 * 600} 48 L ${0.72 * 600 - 6} 60 L ${0.72 * 600 + 6} 60 Z`} fill={C.amber} />
                    <text x={0.72 * 600} y={102} fill={C.amber} fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle">negative</text>
                  </>
                ) : (
                  <text x={510} y={56} fill={C.cyan} fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle">all else: high</text>
                )}
              </>
            );
          })()}
        </svg>
        <div className="p-5" style={{ borderTop: `1px solid ${C.line}` }}>
          {isReg ? (
            <p className="text-[14.5px] leading-relaxed" style={{ color: C.text }}>
              <B>Regularized methods.</B> Don't sample negatives at all. Instead, constrain the embedding <em>statistics</em> so the
              encoder <Hi>can't collapse</Hi> every input into one tiny low-energy region. They differ in what they constrain:
              <B> VICReg</B> keeps each dimension's variance above a floor and decorrelates dimensions; <B>SIGReg</B> (LeJEPA) goes further
              and matches the <em>whole</em> embedding distribution to an isotropic Gaussian. Cost is linear; no negatives needed.
              <span style={{color:C.cyan}}> This is JEPA's lineage.</span>
            </p>
          ) : (
            <p className="text-[14.5px] leading-relaxed" style={{ color: C.text }}>
              <B>Contrastive methods (SimCLR, MoCo, InfoNCE).</B> Explicitly push energy <Hi>up</Hi> at sampled negative points so
              the valley stays narrow. Effective, but you need many negatives, big batches, and good augmentations —
              and in high dimensions the negatives can't cover the space (the <span style={{color:C.amber}}>curse of dimensionality</span>).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  Masking strategy viz — I-JEPA multi-block, with real numbers.               */
/* ========================================================================== */
function MaskingStrategyViz() {
  const C = useTheme();
  const [seed, setSeed] = useState(0);
  const layout = useMemo(() => {
    const rnd = (a, b) => a + Math.random() * (b - a);
    const targets = Array.from({ length: 4 }, () => {
      const scale = rnd(0.15, 0.2);
      const ar = rnd(0.75, 1.5);
      const w = Math.sqrt(scale * ar), h = Math.sqrt(scale / ar);
      return { x: rnd(0.02, 0.96 - w), y: rnd(0.06, 0.9 - h), w, h };
    });
    return { targets };
  }, [seed]);
  const G = 8;
  return (
    <div className="my-6 rounded-2xl border overflow-hidden" style={{ borderColor: C.line, background: C.ink2 }}>
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h4 className="font-semibold text-[15px]" style={{ color: C.textHi }}>I-JEPA multi-block masking</h4>
          <Pill color={C.cyan}>interactive</Pill>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <div className="shrink-0">
            <svg viewBox="0 0 200 200" width="200" height="200" className="rounded-lg" style={{ background: C.ink3 }}>
              {Array.from({ length: G * G }).map((_, i) => (
                <rect key={i} x={(i % G) * 25} y={Math.floor(i / G) * 25} width="25" height="25"
                  fill="none" stroke={C.line} strokeWidth="0.5" />
              ))}
              <rect x="10" y="10" width="180" height="180" fill={C.cyan} opacity="0.12" stroke={C.cyan} strokeWidth="1.5" rx="3" />
              <text x="16" y="26" fill={C.cyan} fontSize="9" fontFamily="JetBrains Mono">context 85–100%</text>
              {layout.targets.map((t, i) => (
                <rect key={i} x={t.x * 200} y={t.y * 200} width={t.w * 200} height={t.h * 200}
                  fill={C.violet} opacity="0.35" stroke={C.violet} strokeWidth="1.5" rx="2" />
              ))}
              <text x="100" y="196" fill={C.violet} fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">4 targets · 15–20% each</text>
            </svg>
            <button onClick={() => setSeed((s) => s + 1)}
              className="mt-3 w-full rounded-lg px-3 py-2 text-sm font-medium transition-all"
              style={{ background: C.ink3, border: `1px solid ${C.line}`, color: C.cyan }}>
              ↻ Resample masks
            </button>
          </div>
          <div className="flex-1 text-[14px] leading-relaxed" style={{ color: C.text }}>
            <p className="mb-3"><span className="font-mono text-[12px]" style={{color:C.cyan}}>context block</span> — scale (0.85, 1.0), unit aspect ratio. Big and spatially distributed, so there's real information to reason from.</p>
            <p className="mb-3"><span className="font-mono text-[12px]" style={{color:C.violet}}>4 target blocks</span> — scale (0.15, 0.2), aspect ratio (0.75, 1.5). Large enough to be <Hi>semantic</Hi> (an object part), not a single texture patch.</p>
            <p style={{ color: C.textDim }}>Both encoders are ViTs operating on fixed-size image patches (the headline ViT-Huge/14 uses 14×14); the predictor is a <em>narrower</em> ViT. In the paper, that ViT-Huge/14 trains on ImageNet on 16 A100s in &lt;72h.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  INTERACTIVE 3 — Collapse simulator (toggle defenses, watch the space)      */
/* ========================================================================== */
function CollapseLab() {
  const C = useTheme();
  const [ema, setEma] = useState(false);
  const [vic, setVic] = useState(true);   // default to the healthy/defended view, not a dead dot
  const raf = useRef(0);
  const canvasRef = useRef(null);

  // points have a fixed spread "home" layout; live positions x,y animate from there
  const pointsRef = useRef(
    Array.from({ length: 60 }, () => {
      const hx = 0.08 + Math.random() * 0.84, hy = 0.08 + Math.random() * 0.84;
      return { hx, hy, x: hx, y: hy };
    })
  );

  // whenever the defenses change, re-seed from the spread home layout so the
  // animation always starts from a healthy cloud and we can SEE it collapse/recover
  useEffect(() => {
    pointsRef.current.forEach((p) => {
      p.x = p.hx + (Math.random() - 0.5) * 0.04;
      p.y = p.hy + (Math.random() - 0.5) * 0.04;
    });
  }, [ema, vic]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      cv.width = cv.offsetWidth * DPR;
      cv.height = cv.offsetHeight * DPR;
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      const W = cv.width, H = cv.height;
      ctx.clearRect(0, 0, W, H);
      const pts = pointsRef.current;

      // collapse strength depends on defenses
      // none -> strong pull to a single point (complete collapse)
      // ema only -> pull to a line (dimensional collapse), milder
      // vic (variance+cov) -> hold the spread, decorrelate
      const cx = 0.5, cy = 0.5;
      pts.forEach((p) => {
        let tx = p.x, ty = p.y;
        if (!ema && !vic) {
          // everything drifts to one point
          tx = lerp(p.x, cx, 0.05);
          ty = lerp(p.y, cy, 0.05);
        } else if (ema && !vic) {
          // collapse onto the diagonal line y=x (a low-dimensional subspace)
          const m = (p.x + p.y) / 2;
          tx = lerp(p.x, m, 0.06);
          ty = lerp(p.y, m, 0.06);
        } else {
          // VICReg: variance keeps the cloud spread, covariance decorrelates ->
          // gently hold each point near its (spread) home position
          tx = lerp(p.x, p.hx, 0.06);
          ty = lerp(p.y, p.hy, 0.06);
        }
        p.x = tx; p.y = ty;
      });

      // draw
      const healthy = vic; // glow only when fully defended
      const col = (!ema && !vic) ? C.amber : (ema && !vic) ? C.violet : C.green;
      pts.forEach((p) => {
        const px = p.x * W, py = p.y * H;
        ctx.beginPath();
        ctx.arc(px, py, 3.2 * DPR, 0, 7);
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = healthy ? 8 * DPR : 4 * DPR;
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      raf.current = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("resize", resize); };
  }, [ema, vic]);

  const status = (!ema && !vic)
    ? { t: "Complete collapse", c: C.amber, d: "Every embedding is drifting to one point. Prediction error → 0, but the representation has learned nothing." }
    : (ema && !vic)
    ? { t: "Dimensional collapse", c: C.violet, d: "EMA + stop-gradient breaks the worst symmetry, but the points still collapse onto a line — a low-dimensional subspace. A real, documented failure mode." }
    : { t: "Healthy embedding space", c: C.green, d: "Variance regularization keeps each dimension spread; covariance regularization decorrelates them. The space stays full and informative." };

  return (
    <div className="my-8 rounded-2xl border overflow-hidden" style={{ borderColor: C.line, background: C.ink2 }}>
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <h4 className="font-semibold text-lg" style={{ color: C.textHi }}>The collapse simulator</h4>
          <Pill color={C.violet}>interactive</Pill>
        </div>
        <p className="text-sm mb-5" style={{ color: C.textDim }}>
          A JEPA grades itself on predicting its own embeddings — so the lazy solution is to make them all identical.
          You start with a <span style={{color:C.green}}>healthy</span> space. Now switch the defenses <em>off</em> and watch it die — then switch them back and watch it recover.
        </p>

        <div className="flex flex-col sm:flex-row gap-5">
          <canvas ref={canvasRef}
            role="img" aria-label={`Animated latent-space scatter of 60 embeddings. Current state: ${status.t} — ${status.d}`}
            className="rounded-xl w-full sm:w-[300px] h-[240px] shrink-0"
            style={{ background: C.ink, border: `1px solid ${C.line}` }} />

          <div className="flex-1">
            <Toggle label="EMA + stop-gradient" sub="architectural asymmetry (I-JEPA / V-JEPA default)"
              on={ema} onChange={() => setEma((v) => !v)} color={C.violet} />
            <Toggle label="Variance–covariance regularization" sub="VICReg-style — spread + decorrelate"
              on={vic} onChange={() => setVic((v) => !v)} color={C.green} />

            <div className="mt-4 rounded-xl p-4 transition-all duration-300"
                 style={{ background: C.ink3, borderLeft: `3px solid ${status.c}` }}>
              <div className="font-mono text-[11px] uppercase tracking-wider mb-1" style={{ color: status.c }}>
                {status.t}
              </div>
              <div className="text-[14px] leading-relaxed" style={{ color: C.text }}>{status.d}</div>
            </div>
          </div>
        </div>

        <Aside tag="The 2025 punchline" color={C.cyan}>
          LeJEPA later <em style={{color:C.cyan, fontStyle:"normal"}}>proved</em> that the ideal embedding distribution is an isotropic
          Gaussian and enforced it with one regularizer (SIGReg) — removing the need for EMA, stop-gradient,
          and teacher–student tricks entirely. The defenses you just toggled became a single principled term.
        </Aside>
      </div>
    </div>
  );
}
function Toggle({ label, sub, on, onChange, color }) {
  const C = useTheme();
  return (
    <button onClick={onChange}
      className="w-full flex items-center gap-3 rounded-xl px-4 py-3 mb-2 text-left transition-all"
      style={{ background: on ? `${color}18` : C.ink3, border: `1px solid ${on ? color : C.line}` }}>
      <div className="w-10 h-6 rounded-full p-0.5 shrink-0 transition-all"
           style={{ background: on ? color : "#2a3550" }}>
        <div className="w-5 h-5 rounded-full bg-white transition-all"
             style={{ transform: on ? "translateX(16px)" : "none" }} />
      </div>
      <div>
        <div className="text-sm font-medium" style={{ color: on ? C.textHi : C.text }}>{label}</div>
        <div className="text-[11px]" style={{ color: C.textFaint }}>{sub}</div>
      </div>
    </button>
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
      examples: "SimCLR, MoCo, DINO",
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
  return (
    <div className="my-8">
      <p className="text-sm mb-5" style={{ color: C.textDim }}>
        JEPA wasn't invented in one leap. Each step below solved the problem the previous one exposed.
        Click through and watch the idea become <em style={{color:C.cyan, fontStyle:"normal"}}>inevitable</em>.
      </p>
      <div className="relative pl-8">
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5"
             style={{ background: `linear-gradient(${C.violet}, ${C.cyan}, ${C.amber})` }} />
        {TIMELINE.map((it, i) => {
          const active = open === i;
          const ic = C[it.c] || C.cyan;
          return (
            <div key={i} className="relative mb-3">
              <div className="absolute left-[-29px] top-1.5 w-3.5 h-3.5 rounded-full transition-all"
                   style={{ background: active ? ic : C.ink, border: `2px solid ${ic}`,
                            boxShadow: `0 0 0 4px ${C.ink}` }} />
              <button onClick={() => setOpen(active ? -1 : i)}
                className="w-full text-left rounded-xl px-4 py-3 transition-all"
                style={{ background: active ? C.ink2 : "transparent",
                         border: `1px solid ${active ? ic + "66" : "transparent"}` }}>
                <div className="font-mono text-xs mb-0.5" style={{ color: ic }}>{it.yr}</div>
                <div className="font-semibold text-[16px]" style={{ color: C.textHi }}>{it.t}</div>
                <div className="overflow-hidden transition-all duration-400"
                     style={{ maxHeight: active ? 200 : 0, opacity: active ? 1 : 0 }}>
                  <div className="mt-2 text-[14px]" style={{ color: C.textDim }}>
                    <span className="font-mono text-[11px] uppercase tracking-wide" style={{color:C.amber}}>Problem · </span>
                    {it.problem}
                  </div>
                  <div className="mt-1.5 text-[14px]" style={{ color: C.text }}>
                    <span className="font-mono text-[11px] uppercase tracking-wide" style={{color:ic}}>Idea · </span>
                    {it.idea}
                  </div>
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
          <div className="flex gap-5 flex-wrap pt-4 mt-2" style={{ borderTop: `1px solid #1b2436` }}>
            {m.stats.map(([v, l], i) => (
              <div key={i} className="min-w-[110px]">
                <div className="font-bold text-2xl leading-none" style={{ color: C.cyan, fontFamily: "Space Grotesk, sans-serif" }}>{v}</div>
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
        <text x="60" y="70" fill={txt} fontSize="12" fontFamily="JetBrains Mono" textAnchor="middle">context x</text>
        <rect x="24" y="80" width="72" height="46" rx="8" fill={C.ink3} stroke={C.cyan} />
        <text x="60" y="100" fill={C.cyan} fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle">visible</text>
        <text x="60" y="114" fill={C.cyan} fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle">patches</text>

        <line x1="96" y1="103" x2="150" y2="103" stroke={C.textFaint} strokeWidth="1.5" markerEnd="url(#arrowN)" />
        <rect x="150" y="78" width="104" height="50" rx="8" fill={C.ink3} stroke={C.cyan} />
        <text x="202" y="98" fill={C.textHi} fontSize="12" fontFamily="Space Grotesk" textAnchor="middle">Context</text>
        <text x="202" y="113" fill={C.textHi} fontSize="12" fontFamily="Space Grotesk" textAnchor="middle">Encoder</text>
        <text x="202" y="142" fill={sub} fontSize="9.5" fontFamily="JetBrains Mono" textAnchor="middle">trained · ViT</text>

        <line x1="254" y1="103" x2="300" y2="103" stroke={C.textFaint} strokeWidth="1.5" markerEnd="url(#arrowN)" />
        <circle cx="318" cy="103" r="18" fill={C.ink3} stroke={C.cyan} /><text x="318" y="107" fill={C.cyan} fontSize="12" fontFamily="JetBrains Mono" textAnchor="middle">s_x</text>

        {/* predictor */}
        <line x1="336" y1="103" x2="386" y2="103" stroke={C.cyan} strokeWidth="2" markerEnd="url(#arrowC)" />
        <rect x="386" y="78" width="104" height="50" rx="8" fill={C.ink3} stroke={C.cyan} strokeWidth="1.6" />
        <text x="438" y="98" fill={C.textHi} fontSize="12" fontFamily="Space Grotesk" textAnchor="middle">Predictor</text>
        <text x="438" y="113" fill={txt} fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">+ target pos / z</text>
        <text x="438" y="142" fill={sub} fontSize="9.5" fontFamily="JetBrains Mono" textAnchor="middle">narrow ViT</text>

        <line x1="490" y1="103" x2="536" y2="103" stroke={C.cyan} strokeWidth="2" markerEnd="url(#arrowC)" />
        <circle cx="556" cy="103" r="20" fill={C.ink3} stroke={C.cyan} strokeDasharray="3 2" /><text x="556" y="107" fill={C.cyan} fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle">ŝ_y</text>

        {/* target (bottom) branch */}
        <text x="60" y="250" fill={txt} fontSize="12" fontFamily="JetBrains Mono" textAnchor="middle">target y</text>
        <rect x="24" y="258" width="72" height="46" rx="8" fill={C.ink3} stroke={C.violet} />
        <text x="60" y="285" fill={C.violet} fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle">full input</text>

        <line x1="96" y1="281" x2="150" y2="281" stroke={C.textFaint} strokeWidth="1.5" markerEnd="url(#arrowN)" />
        <rect x="150" y="256" width="104" height="50" rx="8" fill={C.ink3} stroke={C.violet} />
        <text x="202" y="276" fill={C.textHi} fontSize="12" fontFamily="Space Grotesk" textAnchor="middle">Target</text>
        <text x="202" y="291" fill={C.textHi} fontSize="12" fontFamily="Space Grotesk" textAnchor="middle">Encoder</text>
        <text x="202" y="320" fill={sub} fontSize="9.5" fontFamily="JetBrains Mono" textAnchor="middle">EMA · stop-grad</text>

        <line x1="254" y1="281" x2="528" y2="281" stroke={C.textFaint} strokeWidth="1.5" markerEnd="url(#arrowN)" />
        <circle cx="556" cy="281" r="20" fill={C.ink3} stroke={C.violet} /><text x="556" y="285" fill={C.violet} fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle">s_y</text>

        {/* EMA weight-copy arrow (context -> target) */}
        <path d="M202,128 C150,165 150,220 202,256" fill="none" stroke={sub} strokeWidth="1.3" strokeDasharray="4 3" markerEnd="url(#arrowN)" />
        <text x="120" y="195" fill={sub} fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">EMA copy</text>

        {/* loss between ŝ_y and s_y */}
        <line x1="556" y1="123" x2="556" y2="261" stroke={C.amber} strokeWidth="1.5" strokeDasharray="3 3" />
        <rect x="600" y="168" width="96" height="48" rx="8" fill={C.ink3} stroke={C.amber} />
        <text x="648" y="188" fill={C.amber} fontSize="11" fontFamily="Space Grotesk" textAnchor="middle">loss</text>
        <text x="648" y="204" fill={txt} fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">‖ŝ_y − s_y‖</text>
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
/*  INTERACTIVE 7 — Latent planning lab (V-JEPA 2 style MPC + CEM)              */
/*  The user places a goal; the "robot" plans by sampling action sequences in   */
/*  a 2D stand-in for latent space, scoring each rollout by L1 distance to the  */
/*  goal embedding, keeping the elite samples (Cross-Entropy Method), executing */
/*  one step, then re-planning. This is exactly V-JEPA 2-AC's control loop,     */
/*  shrunk to 2D so you can watch it think.                                     */
/* ========================================================================== */
function LatentPlanningLab() {
  const C = useTheme();
  const canvasRef = useRef(null);
  const [goal, setGoal] = useState({ x: 0.78, y: 0.28 });
  const [state, setState] = useState({ x: 0.16, y: 0.78 });
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [samples, setSamples] = useState([]); // current CEM candidate rollouts
  const [elites, setElites] = useState([]);
  const [reached, setReached] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const loopRef = useRef(0);

  const HORIZON = 4;      // actions per plan
  const N = 60;           // candidate sequences per CEM iteration
  const ELITE = 10;       // elites kept

  // one CEM plan from current state -> best first action + viz data (see logic.js)
  const planOnce = useCallback(
    (cur, g) => planCEM(cur, g, { horizon: HORIZON, samples: N, elite: ELITE, iters: 2 }),
    []);

  // draw
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    cv.width = cv.offsetWidth * DPR; cv.height = cv.offsetHeight * DPR;
    const W = cv.width, H = cv.height;
    const P = (pt) => [pt.x * W, pt.y * H];

    ctx.clearRect(0, 0, W, H);
    // subtle grid = "latent manifold"
    ctx.strokeStyle = C.isDark ? "rgba(80,98,140,.13)" : "rgba(120,132,160,.16)";
    ctx.lineWidth = DPR;
    for (let i = 1; i < 8; i++) {
      ctx.beginPath(); ctx.moveTo((i / 8) * W, 0); ctx.lineTo((i / 8) * W, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, (i / 8) * H); ctx.lineTo(W, (i / 8) * H); ctx.stroke();
    }
    // candidate rollouts (dim)
    samples.forEach((c) => {
      ctx.beginPath();
      const [sx, sy] = P(stateRef.current); ctx.moveTo(sx, sy);
      c.seq.forEach((pt) => { const [x, y] = P(pt); ctx.lineTo(x, y); });
      ctx.strokeStyle = `rgba(157,140,255,${C.isDark ? 0.12 : 0.16})`;
      ctx.lineWidth = DPR; ctx.stroke();
    });
    // elite rollouts (bright cyan)
    elites.forEach((c) => {
      ctx.beginPath();
      const [sx, sy] = P(stateRef.current); ctx.moveTo(sx, sy);
      c.seq.forEach((pt) => { const [x, y] = P(pt); ctx.lineTo(x, y); });
      ctx.strokeStyle = `rgba(56,225,214,${C.isDark ? 0.5 : 0.6})`;
      ctx.lineWidth = 1.6 * DPR; ctx.stroke();
    });
    // goal (amber ring + crosshair) — "goal image embedding"
    const [gx, gy] = P(goal);
    ctx.strokeStyle = C.amber; ctx.lineWidth = 2 * DPR;
    ctx.beginPath(); ctx.arc(gx, gy, 13 * DPR, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(gx, gy, 4 * DPR, 0, 7); ctx.fillStyle = C.amber; ctx.fill();
    // current state (cyan dot, glowing)
    const [cxp, cyp] = P(state);
    ctx.beginPath(); ctx.arc(cxp, cyp, 7 * DPR, 0, 7);
    ctx.fillStyle = C.cyan; ctx.shadowColor = C.cyan; ctx.shadowBlur = 14 * DPR; ctx.fill();
    ctx.shadowBlur = 0;
  }, [samples, elites, goal, state, C.isDark]);

  // the receding-horizon loop: plan, execute one step, repeat
  useEffect(() => {
    if (!running) return;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const cur = stateRef.current;
      const dist = Math.abs(cur.x - goal.x) + Math.abs(cur.y - goal.y);
      if (dist < 0.06 || step > 40) { setReached(true); setRunning(false); setSamples([]); setElites([]); return; }
      const { cand, elites: el, bestSeq } = planOnce(cur, goal);
      setSamples(cand); setElites(el);
      // execute ONLY the first action of the best plan (receding horizon)
      loopRef.current = setTimeout(() => {
        if (!alive) return;
        if (bestSeq && bestSeq[0]) setState(bestSeq[0]);
        setStep((s) => s + 1);
      }, 420);
    };
    tick();
    return () => { alive = false; clearTimeout(loopRef.current); };
  }, [running, step, goal, planOnce]);

  const start = () => {
    if (running) return;
    setReached(false); setStep(0);
    setState({ x: 0.16, y: 0.78 });
    setRunning(true);
  };
  const stop = () => { setRunning(false); setSamples([]); setElites([]); };
  const placeGoal = (e) => {
    if (running) return;
    const r = canvasRef.current.getBoundingClientRect();
    const x = clamp((e.clientX - r.left) / r.width, 0.05, 0.95);
    const y = clamp((e.clientY - r.top) / r.height, 0.05, 0.95);
    setGoal({ x, y }); setReached(false);
  };

  return (
    <div className="my-8 rounded-2xl border overflow-hidden" style={{ borderColor: C.line, background: C.ink2 }}>
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <h4 className="font-semibold text-lg" style={{ color: C.textHi }}>Plan in latent space (V-JEPA 2's control loop)</h4>
          <Pill color={C.amber}>interactive</Pill>
        </div>
        <p className="text-sm mb-5" style={{ color: C.textDim }}>
          The grid is a 2D stand-in for the latent space. The <span style={{color:C.amber}}>amber ring</span> is the
          goal image's embedding; the <span style={{color:C.cyan}}>cyan dot</span> is the robot's current state.
          Tap anywhere to move the goal, then press plan. Watch it sample action sequences (faint purple),
          keep the <span style={{color:C.cyan}}>elite</span> ones closest to the goal, take a single step, and re-plan.
        </p>

        <div className="flex flex-col lg:flex-row gap-5">
          <canvas ref={canvasRef} onClick={placeGoal}
            role="img"
            aria-label="Interactive 2D latent space. An amber ring marks the goal embedding; a glowing cyan dot is the robot's current state; faint purple lines are sampled action rollouts and bright cyan lines are the elite plans kept by the Cross-Entropy Method. Tap to move the goal, then press Plan & act."
            className="rounded-xl w-full lg:w-[360px] h-[300px] shrink-0"
            style={{ background: C.ink, border: `1px solid ${C.line}`, cursor: running ? "default" : "crosshair" }} />

          <div className="flex-1">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[["horizon", HORIZON, "actions/plan"], ["samples", N, "per iteration"], ["elites", ELITE, "kept (CEM)"]].map(([k,v,l])=>(
                <div key={k} className="rounded-xl p-3 text-center" style={{ background: C.ink3 }}>
                  <div className="font-bold text-xl" style={{ color: C.cyan, fontFamily:"Space Grotesk" }}>{v}</div>
                  <div className="text-[10px] font-mono mt-1" style={{ color: C.textFaint }}>{l}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-4 mb-4 text-[13.5px] leading-relaxed min-h-[78px]"
                 style={{ background: C.ink3, color: C.text }}>
              {reached ? (
                <span><span style={{color:C.cyan}}>Goal reached.</span> Notice it never rendered a single pixel — every rollout was scored by L1 distance between <em>predicted</em> and <em>goal</em> embeddings. That's why this is fast enough to run on a real arm.</span>
              ) : running ? (
                <span>Planning… each faint path is an imagined action sequence rolled out through the predictor. The bright ones are the elites the Cross-Entropy Method keeps to refine its next guess. Step <span style={{color:C.cyan, fontFamily:"JetBrains Mono"}}>{step}</span>.</span>
              ) : (
                <span>Ready. The robot has no policy and no map — only a predictor that answers "if I take these actions, where will my latent state be?" Planning means searching that predictor for actions that land near the goal.</span>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={running ? stop : start}
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                style={{ background: running ? "transparent" : C.cyan, color: running ? C.cyan : C.ink, border: `1px solid ${C.cyan}` }}>
                {running ? "■ Stop" : reached ? "↺ Plan again" : "▶ Plan & act"}
              </button>
            </div>
          </div>
        </div>

        <Aside tag="What's really happening" color={C.cyan}>
          This is <B>model-predictive control</B>. There's no learned policy mapping states to actions — instead the
          world model is <em>searched</em> at every step: imagine many futures, keep the ones closest to the goal,
          commit to one action, look again, repeat. Because the search happens over <Hi>embeddings</Hi> rather than
          predicted pixels, V-JEPA 2-AC plans an action in ~16 seconds where a pixel-generating world model needs minutes.
        </Aside>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  Hero canvas — drifting latent space with a few glowing "signal" nodes      */
/* ========================================================================== */
function HeroCanvas() {
  const C = useTheme();
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = cv.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    // signal nodes use the cyan accent; neutral nodes/links adapt to theme
    const sigRGB = C.isDark ? "56,225,214" : "13,148,136";
    const dimRGB = C.isDark ? "80,98,140" : "150,160,180";
    const dotRGB = C.isDark ? "150,165,200" : "120,132,150";
    let pts = [], raf = 0;
    const init = () => {
      cv.width = cv.offsetWidth * DPR; cv.height = cv.offsetHeight * DPR;
      const n = Math.min(64, Math.floor((cv.width * cv.height) / 26000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * cv.width, y: Math.random() * cv.height,
        vx: (Math.random() - 0.5) * 0.16 * DPR, vy: (Math.random() - 0.5) * 0.16 * DPR,
        r: (Math.random() * 1.5 + 0.6) * DPR, sig: Math.random() < 0.22,
      }));
    };
    const frame = () => {
      const W = cv.width, H = cv.height, R = 150 * DPR;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy);
          if (d < R) {
            const a = (1 - d / R) * 0.5;
            ctx.strokeStyle = (p.sig || q.sig) ? `rgba(${sigRGB},${a * 0.55})` : `rgba(${dimRGB},${a * 0.3})`;
            ctx.lineWidth = DPR * 0.6;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7);
        if (p.sig) { ctx.fillStyle = `rgba(${sigRGB},.95)`; ctx.shadowColor = `rgba(${sigRGB},${C.glow})`; ctx.shadowBlur = 10 * DPR; }
        else { ctx.fillStyle = `rgba(${dotRGB},.5)`; ctx.shadowBlur = 0; }
        ctx.fill(); ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(frame);
    };
    init(); frame();
    if (reduce) cancelAnimationFrame(raf);
    let to; const onR = () => { clearTimeout(to); to = setTimeout(init, 200); };
    window.addEventListener("resize", onR);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onR); };
  }, [C.isDark]);
  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 w-full h-full" style={{ opacity: C.isDark ? 0.55 : 0.7 }} />;
}

/* ========================================================================== */
/*  Hierarchical JEPA (H-JEPA) schematic — two world models at different        */
/*  timescales: a fast detailed level and a slow abstract level that sets       */
/*  subgoals for it. Theme-aware static SVG.                                    */
/* ========================================================================== */
function HJepaDiagram() {
  const C = useTheme();
  const sub = C.textFaint;
  const bottom = [["s_t", 140], ["s_t+1", 300], ["s_t+2", 460], ["s_t+3", 600]];
  return (
    <figure className="my-8 rounded-2xl border overflow-hidden" style={{ borderColor: C.line, background: C.ink2 }}>
      <svg viewBox="0 0 720 300" className="w-full h-auto" role="img"
           aria-label="Hierarchical JEPA: a fast, detailed level predicts the next embedding over short horizons; a slower, more abstract level predicts over long horizons and hands subgoals down to the level below.">
        <defs>
          <marker id="hV" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={C.violet} /></marker>
          <marker id="hC" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={C.cyan} /></marker>
          <marker id="hN" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={C.textFaint} /></marker>
        </defs>

        {/* abstract (top) level */}
        <text x="34" y="58" fill={C.violet} fontSize="11" fontFamily="JetBrains Mono">level 2 · abstract state · long horizon</text>
        <circle cx="220" cy="96" r="20" fill={C.ink3} stroke={C.violet} />
        <text x="220" y="100" fill={C.violet} fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle">a_t</text>
        <line x1="242" y1="96" x2="478" y2="96" stroke={C.violet} strokeWidth="2" markerEnd="url(#hV)" />
        <text x="360" y="88" fill={sub} fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">predict (coarse, few steps)</text>
        <circle cx="500" cy="96" r="20" fill={C.ink3} stroke={C.violet} />
        <text x="500" y="100" fill={C.violet} fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle">a_t+1</text>

        {/* abstraction up + subgoal down */}
        <line x1="150" y1="212" x2="206" y2="116" stroke={C.textFaint} strokeWidth="1.2" strokeDasharray="4 3" markerEnd="url(#hN)" />
        <text x="120" y="165" fill={sub} fontSize="9" fontFamily="JetBrains Mono">abstract ↑</text>
        <line x1="508" y1="116" x2="566" y2="212" stroke={C.violet} strokeWidth="1.2" strokeDasharray="4 3" markerEnd="url(#hV)" />
        <text x="556" y="165" fill={C.violet} fontSize="9" fontFamily="JetBrains Mono">subgoal ↓</text>

        {/* detailed (bottom) level */}
        <text x="34" y="248" fill={C.cyan} fontSize="11" fontFamily="JetBrains Mono">level 1 · detailed state · short horizon</text>
        {bottom.map(([lab, x], i) => (
          <g key={lab}>
            <circle cx={x} cy={228} r="15" fill={C.ink3} stroke={C.cyan} />
            <text x={x} y={232} fill={C.cyan} fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">{lab}</text>
            {i < bottom.length - 1 && (
              <line x1={x + 15} y1={228} x2={bottom[i + 1][1] - 15} y2={228} stroke={C.cyan} strokeWidth="1.8" markerEnd="url(#hC)" />
            )}
          </g>
        ))}
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
        <div className="px-5 pb-6 pt-1 max-w-[64ch]" style={{ borderTop: `1px solid ${C.line}` }}>
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

/* ========================================================================== */
/*  Progress rail + section scaffolding                                        */
/* ========================================================================== */

function useScrollProgress() {
  const [p, setP] = useState(0);
  const [active, setActive] = useState("idea");
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? h.scrollTop / max : 0);
      // active section
      let cur = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) cur = s.id;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return { p, active };
}

function Section({ id, children }) {
  const C = useTheme();
  return <section id={id} className="scroll-mt-20 py-16 sm:py-20 border-t" style={{ borderColor: C.line }}>{children}</section>;
}
function Heading({ num, eyebrow, title, intro }) {
  const C = useTheme();
  return (
    <Reveal>
      <Eyebrow num={num}>{eyebrow}</Eyebrow>
      <h2 className="font-bold tracking-tight mb-5 text-[clamp(28px,5vw,44px)] leading-tight"
          style={{ color: C.textHi, fontFamily: "Space Grotesk, sans-serif", maxWidth: "20ch" }}>
        {title}
      </h2>
      {intro && <p className="text-[19px] leading-relaxed mb-2" style={{ color: C.textDim, maxWidth: "64ch" }}>{intro}</p>}
    </Reveal>
  );
}
function P({ children }) {
  const C = useTheme();
  return <p className="text-[17px] leading-[1.7] mb-4" style={{ color: C.text }}>{children}</p>;
}
function H3({ children }) {
  const C = useTheme();
  return <h3 className="text-[22px] font-semibold mt-10 mb-3" style={{ color: C.textHi, fontFamily: "Space Grotesk, sans-serif" }}>{children}</h3>;
}
const Hi = ({ children, c }) => { const C = useTheme(); return <span style={{ color: c || C.cyan }}>{children}</span>; };
const B = ({ children }) => { const C = useTheme(); return <strong style={{ color: C.textHi, fontWeight: 600 }}>{children}</strong>; };

/* ========================================================================== */
/*  MAIN                                                                       */
/* ========================================================================== */
export default function JepaCourse() {
  // theme state lives at the top; default follows the OS preference (falling back
  // to dark), so first paint matches the user's system theme. Provider wraps
  // everything so every component below reads the live palette via useTheme().
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return true;
    return !window.matchMedia("(prefers-color-scheme: light)").matches;
  });
  const theme = dark ? DARK : LIGHT;
  return (
    <ThemeContext.Provider value={theme}>
      <CourseBody dark={dark} setDark={setDark} />
    </ThemeContext.Provider>
  );
}

function CourseBody({ dark, setDark }) {
  const C = useTheme();
  const { p, active } = useScrollProgress();
  const [done, setDone] = useState({});
  const mark = useCallback((k) => setDone((d) => (d[k] ? d : { ...d, [k]: true })), []);
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  // nav background respects theme (was hardcoded dark rgba before)
  const navBg = dark ? "rgba(10,14,26,.82)" : "rgba(247,248,251,.85)";
  const progressTrack = dark ? "#11192b" : "#e2e7f0";

  return (
    <div style={{ background: C.ink, color: C.text, fontFamily: "Inter, system-ui, sans-serif" }}
         className="min-h-screen w-full overflow-x-hidden transition-colors duration-500">
      {/* font + selection styling */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&family=Newsreader:ital@0;1&display=swap');
        .font-mono{font-family:'JetBrains Mono',monospace}
        ::selection{background:${C.cyan};color:${C.ink}}
        html{scroll-behavior:smooth}
        input[type=range]{accent-color:${C.cyan}}
        @media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
      `}</style>

      {/* top progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[3px]" style={{ background: progressTrack }}>
        <div className="h-full transition-[width] duration-150"
             style={{ width: `${p * 100}%`, background: `linear-gradient(90deg, ${C.violet}, ${C.cyan})` }} />
      </div>

      {/* nav */}
      <nav className="fixed top-[3px] left-0 right-0 z-50 backdrop-blur-md border-b"
           style={{ background: navBg, borderColor: C.line }}>
        <div className="max-w-[1080px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <button onClick={() => go("top")} className="flex items-center gap-2.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: C.cyan, boxShadow: `0 0 12px ${C.cyan}` }} />
            <span className="font-bold text-[14px] tracking-wide" style={{ color: C.textHi, fontFamily: "Space Grotesk" }}>
              PREDICT THE REPRESENTATION
            </span>
          </button>
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex gap-1">
              {SECTIONS.map((s) => (
                <button key={s.id} onClick={() => go(s.id)}
                  className="font-mono text-[11px] tracking-wide uppercase px-2.5 py-1.5 rounded-md transition-all"
                  style={{ color: active === s.id ? C.textHi : C.textDim,
                           background: active === s.id ? C.ink3 : "transparent" }}>
                  {s.label}
                  {done[SECTION_CHECK[s.id]] && <span style={{ color: C.green }}> ✓</span>}
                </button>
              ))}
            </div>
            {/* mobile / tablet sections menu (below the lg breakpoint where the
                inline nav is hidden, so sections stay reachable on small screens) */}
            <div className="lg:hidden relative">
              <button onClick={() => setMenuOpen((o) => !o)} aria-label="Sections menu"
                aria-expanded={menuOpen}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0"
                style={{ border: `1px solid ${C.line}`, background: C.ink3, color: C.cyan }}>
                {menuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 py-1.5 rounded-xl border shadow-xl max-h-[70vh] overflow-y-auto"
                  style={{ background: C.ink2, borderColor: C.line, minWidth: 196 }}>
                  {SECTIONS.map((s, i) => (
                    <button key={s.id} onClick={() => go(s.id)}
                      className="w-full text-left font-mono text-[12px] tracking-wide uppercase px-4 py-2 transition-all flex items-center gap-2"
                      style={{ color: active === s.id ? C.textHi : C.textDim,
                               background: active === s.id ? C.ink3 : "transparent" }}>
                      <span style={{ color: C.textFaint }}>{String(i + 1).padStart(2, "0")}</span>
                      {s.label}
                      {done[SECTION_CHECK[s.id]] && <span className="ml-auto" style={{ color: C.green }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setDark((v) => !v)} aria-label="Toggle light or dark mode"
              className="ml-1 w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0"
              style={{ border: `1px solid ${C.line}`, background: C.ink3, color: C.cyan }}>
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header id="top" className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <HeroCanvas />
        <div className="absolute inset-0 z-[1]"
             style={{ background: `radial-gradient(ellipse 70% 60% at 68% 42%, transparent, ${C.ink} 78%)` }} />
        <div className="relative z-[2] max-w-[1080px] mx-auto px-6 w-full">
          <Eyebrow>An interactive course · Joint-Embedding Predictive Architecture</Eyebrow>
          <h1 className="font-bold tracking-tight text-[clamp(40px,8vw,82px)] leading-[1.02] mb-2"
              style={{ color: C.textHi, fontFamily: "Space Grotesk, sans-serif", maxWidth: "15ch" }}>
            Don't predict the{" "}
            <span style={{ color: C.amber, textDecoration: "line-through", textDecorationThickness: 3, textDecorationColor: C.amber }}>
              pixels
            </span>.<br />Predict the <span style={{ color: C.cyan }}>representation</span>.
          </h1>
          <p className="text-[clamp(17px,2.3vw,21px)] leading-relaxed mt-7" style={{ color: C.textDim, maxWidth: "54ch" }}>
            Yann LeCun's bet on how machines might learn to <B>reason, plan, and understand the physical world</B>.
            You won't just read about it — you'll mask patches, collapse a latent space, and rebuild it, until JEPA
            feels <Hi>inevitable</Hi>.
          </p>
          <p className="text-[15px] leading-relaxed mt-3" style={{ color: C.textFaint, maxWidth: "54ch" }}>
            We'll build the idea up from scratch, one piece at a time. No black boxes — by the end you'll be able to
            write the core loss in a few lines and know exactly why each one is there.
          </p>
          <div className="flex items-center gap-3 mt-9 flex-wrap">
            <button onClick={() => go("idea")}
              className="rounded-xl px-6 py-3.5 font-semibold text-[15px] transition-all hover:opacity-90"
              style={{ background: C.cyan, color: C.ink }}>
              Start learning →
            </button>
            <span className="font-mono text-[12px] tracking-wide" style={{ color: C.textFaint }}>
              ~40 min · 10 interactive labs · builds to researcher depth
            </span>
          </div>
          {/* color legend — colors carry consistent meaning, which aids recall */}
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px]" style={{ color: C.textDim }}>
            <span className="font-mono uppercase tracking-wider text-[11px]" style={{ color: C.textFaint }}>colors mean things →</span>
            {[["latent / signal", C.cyan], ["pixel / generative", C.amber], ["energy / abstraction", C.violet], ["correct", C.green]].map(([l, c]) => (
              <span key={l} className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{l}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-[1080px] mx-auto px-6">

        {/* ---------------- 01 THE IDEA ---------------- */}
        <Section id="idea">
          <Heading num="01" eyebrow="The core idea"
            title={<>A model that predicts what it <Hi>means</Hi>, not what it looks like</>}
            intro="Every modern self-supervised model hides part of its input and predicts the missing part. JEPA's one consequential twist is where that prediction happens." />
          <Reveal>
            <Aside tag="Why anyone is trying this" color={C.violet}>
              A four-year-old learns that an unsupported object falls without seeing a million labeled examples — and a crow solves puzzles, an orca coordinates a hunt. Animals build a <B>model of how the world works</B> from mostly passive observation, then use it to predict and plan. Today's biggest AI does the opposite: it ingests oceans of data yet struggles with the physical common sense a toddler takes for granted (Moravec's paradox). LeCun's wager is that the missing ingredient isn't more scale — it's <Hi>learning a predictive world model in an abstract space</Hi>. That's what JEPA is for.
            </Aside>
          </Reveal>
          <Reveal>
            <div className="max-w-[64ch]">
              <P>Picture a short video of a ball rolling toward the edge of a table. A <B>generative</B> model — the family behind most headline AI — learns by reconstructing the exact missing pixels: every shadow, every reflection, the grain of the wood. To do that it must commit to one precise future, down to detail it can't possibly know.</P>
              <P>A JEPA asks a different question. Not <em>"what will the next frame look like, pixel for pixel?"</em> but <em>"what will it <Hi>mean</Hi>?"</em> It encodes the visible part, encodes the hidden part, and trains a small <B>predictor</B> to jump from one to the other — entirely inside an abstract space. The ball will be roughly <Hi>there</Hi>, moving <Hi>that way</Hi>, about to fall. The wood grain is discarded as noise.</P>
            </div>
          </Reveal>

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
        </Section>

        {/* ---------------- 02 WHY LATENT ---------------- */}
        <Section id="why">
          <Heading num="02" eyebrow="Why it matters"
            title={<>The world isn't fully predictable — so stop trying to predict all of it</>} />
          <Reveal>
            <div className="max-w-[64ch]">
              <P>LeCun's critique of generative pretraining is precise. Forcing a model to reconstruct raw inputs charges it a tax on every pixel, with two costs: <B>wasted capacity on the unpredictable</B> (it's punished for failing to guess things that can't be guessed) and <B>obsession with low-level features</B> (it memorizes texture and lighting instead of semantic structure).</P>
              <P>Predicting in representation space defuses both. The target is itself a <Hi>learned</Hi> embedding, so the encoder can make it abstract and smooth — encode "a ball, here, falling" and drop the rest. See it for yourself:</P>
            </div>
          </Reveal>

          <PixelVsLatentLab />

          <Reveal>
            <div className="max-w-[64ch]">
              <H3>The energy-based framing</H3>
              <P>Formally, a JEPA is an <B>Energy-Based Model</B>. It defines a scalar energy — the prediction error in embedding space — that should be <Hi>low</Hi> for compatible pairs and high for incompatible ones. EBMs sidestep the normalization that makes probabilistic generative models choke in high dimensions: you never integrate over all possible images.</P>
            </div>
            <div className="my-6 rounded-xl border p-5 font-mono text-[14px] leading-[1.9] overflow-x-auto"
                 style={{ borderColor: C.line, background: C.ink2, color: C.textHi }}>
              <span style={{ color: C.textFaint }}># energy = prediction error between learned representations</span><br/>
              E(x, y) = ‖ <Hi>Pred</Hi>( <Hi>Enc</Hi>(x), <Hi c={C.violet}>z</Hi> ) − <Hi>Enc</Hi>(y) ‖²<br/><br/>
              <span style={{ color: C.textFaint }}># train compatible pairs to low energy, regularize so the</span><br/>
              <span style={{ color: C.textFaint }}># encoder can't cheat by collapsing every input to one point</span><br/>
              ℒ = E(x, y) &nbsp;+&nbsp; <Hi c={C.amber}>λ · R</Hi>( <Hi>Enc</Hi>(x), <Hi>Enc</Hi>(y) )
            </div>
            <P><span style={{color:C.textDim}}>The latent variable <Hi c={C.violet}>z</Hi> captures the information about <em>y</em> not present in <em>x</em> — one context can have many valid futures, and varying <Hi c={C.violet}>z</Hi> sweeps them out. That last term <Hi c={C.amber}>R</Hi> is doing more work than it looks: it's the whole subject of the next section.</span></P>
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
            <div className="max-w-[64ch]">
              <P>Look at what's <em>not</em> there. There's no decoder. There's no pixel anywhere in the loss. Line 7 is the only "prediction" and it outputs a vector of numbers, not an image. Line 8 compares two vectors. If you delete line 9 — the regularizer — the cheapest way to make line 8 zero is to make <Hi>every</Hi> embedding identical, and the whole thing quietly dies. That single line is why the next section exists.</P>
            </div>
          </Reveal>
        </Section>

        {/* ---------------- 03 ARCHITECTURE ---------------- */}
        <Section id="build">
          <Heading num="03" eyebrow="The architecture"
            title={<>Three networks, one deliberate asymmetry</>}
            intro="Every concrete JEPA is built from the same three pieces. Build the forward pass yourself and the structure stops being abstract." />
          <Reveal><ArchitectureDiagram /></Reveal>
          <MaskingLab />
          <Reveal>
            <div className="max-w-[64ch]">
              <H3>1 · Context encoder (the student)</H3>
              <P>The network you keep. It maps the visible input to a representation <Hi>sx</Hi> and learns by backpropagation. In every published JEPA it's a Vision Transformer. After training, this is your feature extractor.</P>
              <H3>2 · Target encoder (the teacher)</H3>
              <P>Encodes the <Hi c={C.violet}>full</Hi> input to produce the targets the predictor chases — but it's <B>not trained directly</B>. Its weights are an exponential moving average of the student's, with a <B>stop-gradient</B> blocking learning signal. Why? Because if the targets are learned too, the model could win by making every representation identical. The slow, gradient-free teacher gives stable targets the student can't trivially game.</P>
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
          <Heading num="04" eyebrow="The central problem"
            title={<>If you grade yourself on predicting your own targets, cheating is easy</>}
            intro="This failure mode defines JEPA research. Understand it and every design choice in the family suddenly makes sense." />
          <Reveal>
            <div className="max-w-[64ch]">
              <P>The danger is built in. If the model is scored on predicting its own learned embeddings, there's a shortcut: <B>make all embeddings identical</B>. Error drops to zero; the representation learns nothing. This is <Hi>representation collapse</Hi>, and it comes in two flavors — <B>complete</B> (everything maps to one point) and <B>dimensional</B> (embeddings squeeze into a tiny subspace).</P>
            </div>
          </Reveal>

          <Reveal>
            <Instructor label="here's the catch nobody mentions">
              <p className="mb-2">Remember line 9 from our code? Here's the thing I want you to really feel, because it's the single most important intuition in this whole topic.</p>
              <p className="mb-2">When you train a normal model, you and the model want the same thing — low loss means good predictions. But a JEPA <em>writes its own exam</em>: the targets <Hi>sy</Hi> are produced by a network we're also training. So the model figures out a nasty shortcut a student would love — <B>make the exam trivial.</B> If every embedding is the same vector, then "predict sy from sx" is perfectly solvable by outputting that one vector, forever. Loss → 0. Knowledge → 0.</p>
              <p>So almost everything that looks like a weird design choice in JEPA — the frozen teacher, the moving-average weights, the extra regularizer term — exists for <Hi>one reason</Hi>: stop the model from cheating its own test. Play with the toggles below and watch the cheating happen (and get prevented) in real time.</p>
            </Instructor>
          </Reveal>

          <CollapseLab />

          <GuessGate
            onResolved={() => mark("g2")}
            question="You add EMA + stop-gradient and your training loss looks great. Are you safe from collapse?"
            options={[
              "Yes — EMA mathematically guarantees a non-trivial solution",
              "No — EMA breaks the worst symmetry but dimensional collapse can still happen",
              "Only if you also reconstruct pixels as a backup",
            ]}
            correct={1}
            explanation={<>Exactly. Later analysis showed EMA alone doesn't <em>guarantee</em> a good solution — with a poor masking strategy or an over-powered predictor, embeddings can still collapse onto a subspace. That's why variance/covariance regularizers (VICReg, and later SIGReg) were added as a safety net.</>}
          />

          <Reveal>
            <div className="max-w-[64ch]">
              <P>So JEPA's history is largely a history of <B>anti-collapse techniques</B>: architectural asymmetry (EMA + stop-gradient), contrastive negatives (effective but expensive), and variance–covariance regularization. <B>VICReg</B> (Bardes, Ponce &amp; LeCun, 2022) is the canonical example — it has three terms: <Hi>variance</Hi> (a hinge loss keeping each dimension's spread above a threshold — kills complete collapse), <Hi>covariance</Hi> (drives off-diagonal correlations to zero — kills dimensional collapse), and <Hi>invariance</Hi> (pulls the two views together). Modern models mix these, and in 2025 LeJEPA replaced the whole toolkit with one provably-optimal regularizer.</P>
            </div>
          </Reveal>
        </Section>

        {/* ---------------- 04b UNDER THE HOOD ---------------- */}
        <Section id="depth">
          <Heading num="04½" eyebrow="Under the hood"
            title={<>The math and mechanics a researcher actually needs</>}
            intro="You have the intuition. Now the rigor — the energy formulation, the two ways to train it, the real loss functions, the masking algorithm, and how any of this gets evaluated. This is the section that separates 'I get the idea' from 'I could implement it.'" />

          <Reveal>
            <div className="max-w-[64ch]">
              <H3>JEPA as an energy-based model, precisely</H3>
              <P>Strip away the diagrams and a JEPA is an <B>energy-based model</B> (EBM). An EBM doesn't output a probability — it outputs a scalar <Hi>energy</Hi> <code style={{color:C.cyan,background:C.ink3,padding:"1px 5px",borderRadius:4}}>E(x, y)</code> that should be low when <em>x</em> and <em>y</em> are compatible and high when they aren't. The appeal: you never have to normalize over all possible <em>y</em> (the partition function that makes high-dimensional generative models intractable). You only have to <Hi>shape the landscape</Hi> so the right answers sit in the valleys.</P>
              <P>For a JEPA the energy is the prediction error <em>between learned representations</em>, with a latent variable <code style={{color:C.violet,background:C.ink3,padding:"1px 5px",borderRadius:4}}>z</code> absorbing the part of <em>y</em> that <em>x</em> can't determine:</P>
            </div>
            <div className="my-6 rounded-xl border p-5 font-mono text-[14px] leading-[1.9] overflow-x-auto"
                 style={{ borderColor: C.line, background: C.ink2, color: C.textHi }}>
              <span style={{ color: C.textFaint }}># energy = how badly the predictor misses, in embedding space</span><br/>
              E(x, y) = min<sub style={{color:C.violet}}>z</sub> ‖ <Hi>Pred</Hi>( <Hi>Enc</Hi>(x), <Hi c={C.violet}>z</Hi> ) − <Hi>Enc</Hi>(y) ‖²<br/><br/>
              <span style={{ color: C.textFaint }}># minimizing over z = "pick the explanation of y that fits best"</span><br/>
              <span style={{ color: C.textFaint }}># this is what lets ONE context have MANY valid futures</span>
            </div>
            <div className="max-w-[64ch]">
              <P>The deep problem: an EBM is only useful if low energy is <Hi>rare</Hi> — reserved for compatible pairs. If energy is low <em>everywhere</em>, the model knows nothing. That's collapse, stated in EBM terms. There are exactly two ways to prevent it, and the entire field splits along this line.</P>
            </div>
          </Reveal>

          <Reveal>
            <H3>The two ways to shape an energy landscape</H3>
            <ContrastiveVsRegularized />
            <div className="max-w-[64ch]">
              <P>LeCun's argument for JEPA leans hard on the second column. Contrastive methods need to push up energy at <em>sampled</em> negative points, and in high dimensions you'd need an exponential number of negatives to cover the space — the curse of dimensionality. Regularized methods sidestep sampling entirely: they constrain the <Hi>statistics</Hi> of the embeddings so the low-energy region simply can't expand to fill space. This is why JEPA's lineage runs through VICReg and SIGReg, not InfoNCE.</P>
            </div>
          </Reveal>

          <Reveal>
            <div className="max-w-[64ch]">
              <H3>VICReg, for real — the three terms in code</H3>
              <P>Earlier you toggled "variance–covariance regularization" as a black box. Here is what those words actually compute. Given a batch of embeddings <code style={{color:C.cyan,background:C.ink3,padding:"1px 5px",borderRadius:4}}>Z</code> (N samples × D dims), VICReg is three terms with fixed coefficients λ=μ=25, ν=1:</P>
            </div>
            <CodeBlock title="vicreg.py — the loss that prevents collapse without negatives"
              lines={[
                "def vicreg(Z, Z2, lam=25, mu=25, nu=1, gamma=1):",
                "    # 1. INVARIANCE — two views of the same input should match",
                "    inv = mse(Z, Z2)",
                "",
                "    # 2. VARIANCE — hinge: keep each dim's std above gamma (=1)",
                "    #    this is the term that kills COMPLETE collapse",
                "    std = sqrt(Z.var(dim=0) + 1e-4)",
                "    var = mean(relu(gamma - std))",
                "",
                "    # 3. COVARIANCE — push off-diagonal correlations to zero",
                "    #    this is the term that kills DIMENSIONAL collapse",
                "    Zc = Z - Z.mean(dim=0)",
                "    cov = (Zc.T @ Zc) / (N - 1)",
                "    cov_loss = off_diagonal(cov).pow(2).sum() / D",
                "",
                "    return lam*inv + mu*var + nu*cov_loss",
              ]} />
            <div className="max-w-[64ch]">
              <P>Two things worth internalizing. First, the variance term is a <Hi>hinge</Hi> — <code style={{color:C.cyan,background:C.ink3,padding:"1px 5px",borderRadius:4}}>relu(γ − std)</code> — not a penalty on the std itself; once a dimension is spread enough, it's left alone. (The paper notes you must hinge the <em>standard deviation</em>, not the variance: near zero, the gradient of √ blows up and rescues the dimension, whereas variance's gradient vanishes and lets it die.) Second, the covariance term is exactly Barlow Twins' redundancy reduction, and there's a beautiful information-theoretic reading: decorrelating dimensions <Hi>maximizes the information</Hi> the embedding carries per dimension. VICReg is, in disguise, an information-maximization objective.</P>
            </div>
          </Reveal>

          <Reveal>
            <div className="max-w-[64ch]">
              <H3>The masking strategy is a design decision, not a detail</H3>
              <P>I-JEPA's results hinge on <em>how</em> you choose context and targets. Predicting single scattered patches just tests local texture interpolation; the model learns nothing semantic. The fix — <B>multi-block masking</B> — is specific and worth knowing by the numbers:</P>
            </div>
            <MaskingStrategyViz />
            <div className="max-w-[64ch]">
              <P>Two subtleties that trip people up. The targets are masked at the <Hi>output of the target encoder</Hi>, not the input — the teacher sees the whole image, then you select which of its representations to predict. And context–target <Hi>overlap is removed</Hi>, so the predictor can't cheat by copying a region it already sees. These are the choices that make the task semantic rather than trivial.</P>
            </div>
          </Reveal>

          <Reveal>
            <div className="max-w-[64ch]">
              <H3>SIGReg: how LeJEPA replaced the whole toolkit</H3>
              <P>LeJEPA's claim is sharp: the <Hi>isotropic Gaussian</Hi> 𝒩(0, I) is the unique embedding distribution that minimizes worst-case downstream prediction risk. So instead of EMA, stop-gradients, and VICReg's three terms, just push the embeddings toward that one distribution. The trick is doing it cheaply in high dimensions — you can't directly match a 1024-dim density.</P>
              <P><B>SIGReg</B> (Sketched Isotropic Gaussian Regularization) uses a <Hi>sketching</Hi> idea: a distribution is 𝒩(0, I) if and only if <em>every</em> 1-D projection of it is a standard 1-D Gaussian (the Cramér–Wold theorem). So project the batch onto many random directions and run a univariate normality test (Epps–Pulley) on each. This is linear in dimension and batch size, has one hyperparameter (λ), and needs no teacher, no stop-gradient, no negatives.</P>
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
            <div className="max-w-[64ch]">
              <H3>How do you even evaluate a representation?</H3>
              <P>A researcher's reflexive question. Since JEPA produces embeddings, not labels or pixels, you measure quality by how useful the <Hi>frozen</Hi> features are downstream. The standard protocols, in increasing permissiveness:</P>
              <ul className="my-4 space-y-2.5">
                <li className="text-[15px] pl-5 relative" style={{ color: C.text }}><span className="absolute left-0" style={{color:C.cyan}}>›</span><B>Linear probing</B> — freeze the backbone, train only a linear classifier on top. The cleanest test of "is the information linearly accessible?" This is the headline I-JEPA number (e.g. ViT-H/14 on ImageNet).</li>
                <li className="text-[15px] pl-5 relative" style={{ color: C.text }}><span className="absolute left-0" style={{color:C.cyan}}>›</span><B>Attentive / k-NN probing</B> — a small attention head or nearest-neighbor lookup; tests information that's present but not linearly separable.</li>
                <li className="text-[15px] pl-5 relative" style={{ color: C.text }}><span className="absolute left-0" style={{color:C.cyan}}>›</span><B>Low-shot</B> — linear probe on 1% of ImageNet labels; tests data efficiency, JEPA's claimed strength.</li>
                <li className="text-[15px] pl-5 relative" style={{ color: C.text }}><span className="absolute left-0" style={{color:C.cyan}}>›</span><B>Full fine-tuning</B> — unfreeze everything; highest ceiling but no longer measures the frozen representation.</li>
              </ul>
              <P>For world models the metric shifts from classification to <Hi>control</Hi>: planning success rate on held-out tasks, planning wall-clock time, and — increasingly — <B>violation-of-expectation</B> probes, where a good world model should assign higher "surprise" (prediction error) to physically impossible events than to plausible ones. Watch for these terms in any JEPA paper; they're how the claims are actually substantiated.</P>
            </div>
            <Aside tag="Researcher's reading checklist" color={C.violet}>
              When you read the next JEPA paper, the questions that matter: <B>What's the collapse-prevention mechanism?</B> (EMA / VICReg / SIGReg / frozen encoder) · <B>What's masked, and at what scale?</B> · <B>Frozen or end-to-end encoder?</B> · <B>What's the evaluation protocol</B> (linear probe vs fine-tune vs control)? · <B>What's the energy / loss, exactly?</B> Answer those five and you understand the contribution.
            </Aside>
          </Reveal>
          <Reveal><MathAppendix /></Reveal>
        </Section>

        {/* ---------------- 05 COMPARE ---------------- */}
        <Section id="compare">
          <Heading num="05" eyebrow="Versus everything else"
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
            explanation={<>That's the <Hi>reconstruction tax</Hi> from §02. A JEPA moves the loss into embedding space, so the encoder is free to discard detail it can't predict.</>}
          />
          <ApproachCompare />
          <Reveal>
            <div className="max-w-[64ch]">
              <P>The contrast LeCun presses hardest is with <B>LLMs</B>: an autoregressive model predicts the next token in data space and, in his view, only manipulates the statistics of human text — no grounded model of reality, weak long-horizon planning, error accumulating token by token. JEPA is his proposed alternative substrate: learn how the world <Hi>behaves</Hi> in abstract space, then plan against it.</P>
            </div>
            <div className="my-10 text-center">
              <p className="text-[clamp(20px,3.2vw,28px)] leading-snug italic mx-auto"
                 style={{ fontFamily: "Newsreader, serif", color: C.textHi, maxWidth: "24ch" }}>
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
          </Reveal>
        </Section>

        {/* ---------------- 06 HISTORY ---------------- */}
        <Section id="history">
          <Heading num="06" eyebrow="How it came to be"
            title={<>A lineage that makes JEPA feel inevitable</>}
            intro="Four threads LeCun pulled on for decades — energy-based models, Siamese networks, self-supervised learning, and predictive world models — converge here." />
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
            explanation={<><Hi>Representation collapse</Hi> (§04). Preventing it — EMA + stop-gradient, then variance/covariance and later SIGReg — is what most of this history is reacting to.</>}
          />
          <DiscoveryTimeline />
          <Reveal>
            <div className="max-w-[64ch]">
              <H3>The six-module brain JEPA was built to power</H3>
              <P>Crucial context for where this is all heading: JEPA was never meant as a standalone vision model. In the 2022 paper it's one component of a proposed autonomous agent with six differentiable modules — <B>configurator</B> (executive control), <B>perception</B> (current state), <B>world model</B> (fill in missing state, predict futures — where JEPA lives), <B>cost</B> (a scalar "discomfort" to minimize), <B>actor</B> (propose action sequences), and <B>short-term memory</B>.</P>
              <P>Planning works by the actor proposing actions, the world model predicting their consequences <Hi>in latent space</Hi>, and gradients of the cost flowing back through the whole differentiable chain. The <B>hierarchical</B> version (H-JEPA) stacks world models at multiple abstraction levels: detailed representations for short-horizon prediction, abstract ones for long-horizon planning. V-JEPA 2's robotics work begins to make this real.</P>
            </div>
          </Reveal>
          <Reveal><HJepaDiagram /></Reveal>
        </Section>

        {/* ---------------- 07 MODELS ---------------- */}
        <Section id="models">
          <Heading num="07" eyebrow="The family, in depth"
            title={<>From one image to a robot planning in a lab it's never seen</>}
            intro="Each model takes the same core idea into a new domain or fixes a known weakness. Explore what actually changed each time." />
          <ModelExplorer />
          <Reveal><TwoStageTraining /></Reveal>
          <Reveal>
            <Instructor label="how does it actually plan? walk with me">
              <p className="mb-2">The robotics result sounds like sci-fi — "zero-shot planning in a lab it's never seen" — so let's strip it down until it's obviously not magic. The robot wants to reach a goal, and you hand it a single <Hi>photo</Hi> of the goal (block in the box). Here's the entire loop:</p>
              <CodeBlockInline />
              <p className="mt-3">That's model-predictive control, and notice the key move on the scoring line: it compares <Hi>imagined embedding</Hi> to <Hi>goal embedding</Hi> — two short vectors — not imagined pixels to goal pixels. The same "do everything in representation space" trick from the very first section is what makes planning cheap enough to run on a real arm. <B>It's the same idea the whole way down.</B></p>
            </Instructor>
          </Reveal>

          <GuessGate
            onResolved={() => mark("g3")}
            question="Before you try the lab below — why can V-JEPA 2 plan ~15× faster than a diffusion world model like Cosmos?"
            options={[
              "It uses a bigger GPU cluster at inference time",
              "It scores imagined plans by comparing embeddings, while Cosmos must render full pixel frames for each candidate",
              "It memorizes the solution to each task in advance",
            ]}
            correct={1}
            explanation={<>Right. Both use the same Cross-Entropy Method search, but Cosmos generates full-resolution pixel predictions for every candidate plan (~4 min/action), while V-JEPA 2 compares short embedding vectors (~16 sec/action). Predicting in representation space isn't just cleaner — it's what makes real-time planning affordable.</>}
          />

          <Reveal>
            <LatentPlanningLab />
          </Reveal>
          <Reveal>
            <div className="max-w-[64ch]">
              <P><span style={{color:C.textDim}}>The template has also been ported to tabular data (T-JEPA), graphs, audio, EEG, and multimodal text–image–video (TI-JEPA, VL-JEPA). The recurring lesson: JEPA is powerful but <em>not automatic</em> — success hinges on target construction, masking strategy, and collapse prevention.</span></P>
            </div>
          </Reveal>
        </Section>

        {/* ---------------- 08 WORLD MODELS ---------------- */}
        <Section id="worldmodels">
          <Heading num="08" eyebrow="The destination"
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
            <div className="max-w-[64ch]">
              <P>Step back and look at the whole arc. A <B>world model</B> is an internal simulator: encode what you observe into a latent state, predict how that state evolves (optionally given your actions), and then <Hi>plan by searching that prediction</Hi> instead of acting blindly in the real world. This was the centerpiece of LeCun's 2022 manifesto — the most complex of the six modules — and everything in the JEPA family is, in the end, a run at building it.</P>
              <P>The recurring obstacle has a name you now know well: <B>collapse</B>. Training a world model end-to-end from raw pixels is fragile, because the encoder can cheat by mapping every frame to nearly the same embedding — prediction becomes trivial and the representation dies. The recent history of JEPA world models is essentially a set of different answers to "how do we get end-to-end training without collapse?"</P>
            </div>
          </Reveal>

          <Reveal>
            <Instructor label="the three ways to not collapse — and why it matters">
              <p className="mb-2">There turned out to be three families of answer, and seeing them side by side is the whole story in miniature:</p>
              <p className="mb-2"><B style={{}}>1 · Don't train the encoder at all.</B> <span style={{color:C.violet}}>DINO-WM</span> freezes a pretrained DINOv2 encoder and only learns the predictor. Can't collapse if you never update it — but you're stuck with whatever those frozen features happen to encode.</p>
              <p className="mb-2"><B>2 · Train end-to-end, pile on regularizers.</B> <span style={{color:C.amber}}>PLDM</span> trains from pixels but needs a seven-term VICReg-style loss with a painful coefficient search to stay stable.</p>
              <p><B>3 · Train end-to-end, with one principled regularizer.</B> <span style={{color:C.green}}>LeWorldModel</span> uses just next-embedding prediction + SIGReg — the provably-optimal Gaussian target from LeJEPA — and the fragility largely goes away. This is the synthesis the whole field was reaching for.</p>
            </Instructor>
          </Reveal>

          <Reveal>
            <H3>The world-model landscape</H3>
            <P>Explore the four models that define the current frontier. Watch the same two questions — <em>frozen or end-to-end?</em> and <em>how do you stop collapse?</em> — separate them.</P>
            <WorldModelLandscape />
          </Reveal>

          <Reveal>
            <div className="max-w-[64ch]">
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
            <div className="max-w-[64ch]">
              <P>The payoff is startling in its modesty. The encoder is a <B>ViT-Tiny</B> (~5 million parameters; about <Hi>15 million</Hi> for the whole model including the predictor), trainable on a single GPU in a few hours. Each frame becomes one 192-dimensional token (roughly 200× fewer than DINO-WM), so planning with the Cross-Entropy Method — encode a start and goal image, search action sequences whose predicted final embedding lands nearest the goal — finishes in about <Hi>one second</Hi>, roughly <Hi>48× faster</Hi> than DINO-WM. It beats PLDM by 18% on the Push-T task and stays competitive with DINO-WM even when DINO-WM is handed extra information.</P>
            </div>
            <Aside tag="Stay honest" color={C.amber}>
              LeWM is not a clean win everywhere. On the <em>simplest</em> environment tested (Two-Room) it underperforms — the authors note SIGReg's isotropic-Gaussian target can be <B>too strong a prior</B> for low-dimensional environments. And like all these methods it still needs offline data with good action coverage. The honest claim is "easier, faster, and more stable," not "universally best."
            </Aside>
          </Reveal>

          <Reveal>
            <H3>Why this is the moment — AMI Labs</H3>
            <div className="max-w-[64ch]">
              <P>This research isn't staying in the lab. In late 2025 LeCun left Meta after ~12 years leading FAIR, and in December 2025 co-founded <B>AMI Labs</B> — Advanced Machine Intelligence (and "ami," French for <em>friend</em>) — a Paris-based company built explicitly on the bet that <Hi>world models, not bigger LLMs</Hi>, are the path to machine intelligence that understands the physical world, holds persistent memory, and plans. It raised a ~$1B seed in early 2026, among the largest ever, with LeCun as executive chairman.</P>
              <P>That is the throughline this entire course has been tracing. The argument from the very first section — <Hi>predict the representation, not the pixels</Hi> — is no longer just a paper. It's a research program with a billion dollars behind it, a string of models from I-JEPA to LeWM making it concrete, and an open question at its heart: can a machine that learns the world by watching, the way a child does, get to intelligence that scaling text never will? Nobody knows yet. That's what makes it worth understanding deeply.</P>
            </div>
            <Aside tag="The arc, in one line" color={C.cyan}>
              Predict in latent space (I-JEPA) → add time (V-JEPA) → make it a controllable world model at web scale (V-JEPA 2) → give it a provable training objective (LeJEPA) → collapse the whole recipe into a stable end-to-end world model from pixels (LeWorldModel) → build a company around it (AMI Labs). <B>One idea, followed all the way down.</B>
            </Aside>
          </Reveal>
        </Section>

        {/* ---------------- 09 RECAP ---------------- */}
        <Section id="recap">
          <Heading num="09" eyebrow="Lock it in"
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
                why: "The asymmetry is a first line of defense against representation collapse." },
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
          </Reveal>

          <Reveal>
            <H3>Key terms, one tap away</H3>
            <P>A quick-reference glossary — tap any term to expand it. Skim it now, then use it whenever a word stops feeling solid.</P>
            <Glossary />
          </Reveal>

          <Reveal>
            <div className="my-8 text-center">
              <p className="text-[clamp(19px,3vw,26px)] leading-snug mx-auto"
                 style={{ fontFamily: "Newsreader, serif", color: C.textHi, maxWidth: "26ch" }}>
                Predict the representation, regularize the geometry, plan in latent space.
              </p>
              <span className="font-mono text-[12px] tracking-wider uppercase mt-4 inline-block" style={{ color: C.cyan }}>
                the whole program in nine words
              </span>
            </div>
          </Reveal>
        </Section>
      </main>

      {/* footer */}
      <footer className="border-t py-14" style={{ borderColor: C.line, background: C.ink2 }}>
        <div className="max-w-[1080px] mx-auto px-6 grid md:grid-cols-2 gap-10">
          <div>
            <h4 className="font-semibold text-[16px] mb-3" style={{ color: C.textHi, fontFamily: "Space Grotesk" }}>About this course</h4>
            <p className="text-[14px] leading-relaxed" style={{ color: C.textDim }}>
              A ground-up, interactive walkthrough of Joint-Embedding Predictive Architectures — built to take you
              from surface intuition to design rationale through prediction, manipulation, and retrieval rather than
              passive reading. Diagrams and simulations are original; JEPA is presented as a living research direction.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-[16px] mb-3" style={{ color: C.textHi, fontFamily: "Space Grotesk" }}>Primary sources</h4>
            <ul className="space-y-2 text-[13.5px]" style={{ color: C.textDim }}>
              {[
                ["van den Oord et al. — Contrastive Predictive Coding (2018)", "https://arxiv.org/abs/1807.03748"],
                ["Ha & Schmidhuber — World Models (2018)", "https://arxiv.org/abs/1803.10122"],
                ["Grill et al. — BYOL (2020)", "https://arxiv.org/abs/2006.07733"],
                ["Chen & He — SimSiam (2021)", "https://arxiv.org/abs/2011.10566"],
                ["Bardes, Ponce & LeCun — VICReg (2021)", "https://arxiv.org/abs/2105.04906"],
                ["LeCun — A Path Towards Autonomous Machine Intelligence (2022)", "https://openreview.net/pdf?id=BZ5a1r-kVsf"],
                ["Assran et al. — I-JEPA paper, CVPR (2023)", "https://arxiv.org/abs/2301.08243"],
                ["Meta — I-JEPA blog (2023)", "https://ai.meta.com/blog/yann-lecun-ai-model-i-jepa/"],
                ["Bardes et al. — V-JEPA paper (2024)", "https://arxiv.org/abs/2404.08471"],
                ["Zhou et al. — DINO-WM (2024)", "https://arxiv.org/abs/2411.04983"],
                ["Sobal et al. — PLDM / latent planning (2025)", "https://arxiv.org/abs/2502.14819"],
                ["Assran, Ballas et al. — V-JEPA 2 paper (2025)", "https://arxiv.org/abs/2506.09985"],
                ["Meta — V-JEPA 2 world model & benchmarks (2025)", "https://ai.meta.com/blog/v-jepa-2-world-model-benchmarks/"],
                ["Balestriero & LeCun — LeJEPA (2025)", "https://arxiv.org/abs/2511.08544"],
                ["Maes, …, LeCun & Balestriero — LeWorldModel (2026)", "https://arxiv.org/abs/2603.19312"],
              ].map(([t, h]) => (
                <li key={h}><a href={h} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: C.textDim }}>{t} ↗</a></li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
