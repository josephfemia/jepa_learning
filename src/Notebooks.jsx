import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "./theme.js";

const SunIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

/* ==========================================================================
   "From-scratch labs" — a separate page that renders the executed Jupyter
   notebooks (jepa-from-scratch/*.ipynb, copied to /public/notebooks) inline:
   markdown, code, and embedded outputs (text + plot images). No deps — a small
   markdown renderer + an ipynb cell renderer, themed to match the course.
   ========================================================================== */

const NOTEBOOKS = [
  { file: "01_i-jepa_images_cifar10.ipynb",        n: "01", title: "I-JEPA",            sub: "images · CIFAR-10" },
  { file: "02_v-jepa_video_panning_cifar.ipynb",   n: "02", title: "V-JEPA",            sub: "video · 3D tubelets" },
  { file: "03_distributed_training_ddp_fsdp.ipynb",n: "03", title: "Distributed",       sub: "multi-GPU · DDP & FSDP" },
  { file: "04_efficient_video_data_pipelines.ipynb",n:"04", title: "Data pipelines",    sub: "video · streaming" },
];

/* ----------------------------- markdown ---------------------------------- */
function inline(s, C) {
  const out = []; let k = 0, last = 0, m;
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(\[[^\]]+\]\([^)]+\))/g;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const t = m[0];
    if (t[0] === "`")
      out.push(<code key={k++} style={{ fontFamily: "var(--font-mono)", fontSize: "0.88em", background: C.ink3, color: C.cyanDeep, padding: "1px 5px", borderRadius: 5 }}>{t.slice(1, -1)}</code>);
    else if (t.startsWith("**")) out.push(<strong key={k++} style={{ color: C.textHi, fontWeight: 600 }}>{t.slice(2, -2)}</strong>);
    else if (t[0] === "*") out.push(<em key={k++}>{t.slice(1, -1)}</em>);
    else { const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(t); out.push(<a key={k++} href={mm[2]} target="_blank" rel="noreferrer" style={{ color: C.cyan, textDecoration: "none", borderBottom: `1px solid ${C.cyan}55` }}>{mm[1]}</a>); }
    last = re.lastIndex;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

function Markdown({ source }) {
  const C = useTheme();
  const lines = source.split("\n");
  const blocks = []; let i = 0;
  const blockStart = (l) => /^(#{1,6}\s|```|\s*>|\s*([-*+]|\d+\.)\s|\s*(---|\*\*\*|___)\s*$)/.test(l);
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) { const buf = []; i++; while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]); i++; blocks.push({ t: "code", v: buf.join("\n") }); continue; }
    if (/^\s*$/.test(line)) { i++; continue; }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) { blocks.push({ t: "h", level: h[1].length, v: h[2] }); i++; continue; }
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) { blocks.push({ t: "hr" }); i++; continue; }
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line); const items = [];
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*+]|\d+\.)\s+/, ""));
      blocks.push({ t: "list", ordered, items }); continue;
    }
    if (/^\s*>\s?/.test(line)) { const buf = []; while (i < lines.length && /^\s*>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, "")); blocks.push({ t: "quote", v: buf.join(" ") }); continue; }
    const buf = [line]; i++;
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !blockStart(lines[i])) buf.push(lines[i++]);
    blocks.push({ t: "p", v: buf.join(" ") });
  }
  const serif = "Fraunces, Georgia, serif";
  return (
    <div style={{ color: C.text }}>
      {blocks.map((b, idx) => {
        if (b.t === "h") {
          const sz = { 1: 30, 2: 24, 3: 19, 4: 17, 5: 15, 6: 14 }[b.level];
          return <h3 key={idx} style={{ fontFamily: serif, fontWeight: b.level <= 2 ? 560 : 600, color: C.textHi, fontSize: sz, lineHeight: 1.25, letterSpacing: "-0.01em", margin: b.level <= 2 ? "1.9em 0 0.5em" : "1.4em 0 0.4em" }}>{inline(b.v, C)}</h3>;
        }
        if (b.t === "p")   return <p key={idx} style={{ fontSize: 16.5, lineHeight: 1.72, margin: "0 0 1em" }}>{inline(b.v, C)}</p>;
        if (b.t === "hr")  return <hr key={idx} style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "2em 0" }} />;
        if (b.t === "quote") return <blockquote key={idx} style={{ borderLeft: `2px solid ${C.cyan}`, margin: "1.2em 0", padding: "0.2em 0 0.2em 1.1em", color: C.textDim, fontSize: 16 }}>{inline(b.v, C)}</blockquote>;
        if (b.t === "list") {
          const Tag = b.ordered ? "ol" : "ul";
          return <Tag key={idx} style={{ margin: "0 0 1em", paddingLeft: 22, fontSize: 16.5, lineHeight: 1.7 }}>{b.items.map((it, j) => <li key={j} style={{ margin: "0.25em 0" }}>{inline(it, C)}</li>)}</Tag>;
        }
        if (b.t === "code") return <CodeBox key={idx} text={b.v} />;
        return null;
      })}
    </div>
  );
}

function CodeBox({ text }) {
  const C = useTheme();
  return (
    <pre style={{ background: C.codeBg, color: "#e8e6e1", borderRadius: 12, padding: "16px 18px", overflowX: "auto", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.7, margin: "1.2em 0", border: `1px solid ${C.line}` }}>
      {text.split("\n").map((ln, i) => (
        <div key={i} style={{ color: ln.trimStart().startsWith("#") ? "#7e8aa0" : "#e8e6e1", whiteSpace: "pre" }}>{ln || " "}</div>
      ))}
    </pre>
  );
}

/* ----------------------------- ipynb cells ------------------------------- */
const src = (c) => Array.isArray(c.source) ? c.source.join("") : (c.source || "");

function Outputs({ outputs }) {
  const C = useTheme();
  if (!outputs || !outputs.length) return null;
  return (
    <div style={{ margin: "2px 0 4px" }}>
      {outputs.map((o, i) => {
        const png = o.data && o.data["image/png"];
        if (png) return <img key={i} alt="notebook output" src={`data:image/png;base64,${Array.isArray(png) ? png.join("") : png}`} style={{ maxWidth: "100%", borderRadius: 8, margin: "8px 0", background: "#fff", padding: 6, border: `1px solid ${C.line}` }} />;
        const txt = o.text ? (Array.isArray(o.text) ? o.text.join("") : o.text)
          : (o.data && o.data["text/plain"] ? (Array.isArray(o.data["text/plain"]) ? o.data["text/plain"].join("") : o.data["text/plain"]) : null);
        if (o.output_type === "error") return <pre key={i} style={{ color: C.amberDeep, fontFamily: "var(--font-mono)", fontSize: 12.5, whiteSpace: "pre-wrap", margin: "4px 0" }}>{(o.traceback || []).join("\n").replace(/\[[0-9;]*m/g, "")}</pre>;
        if (txt) return <pre key={i} style={{ background: C.ink3, color: C.textDim, borderRadius: 8, padding: "10px 12px", overflowX: "auto", fontFamily: "var(--font-mono)", fontSize: 12.5, lineHeight: 1.6, margin: "6px 0", whiteSpace: "pre-wrap" }}>{txt}</pre>;
        return null;
      })}
    </div>
  );
}

function NotebookViewer({ file }) {
  const C = useTheme();
  const [cells, setCells] = useState(null);
  const [err, setErr] = useState(null);
  const top = useRef(null);
  useEffect(() => {
    setCells(null); setErr(null);
    fetch(`${import.meta.env.BASE_URL}notebooks/${file}`)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((nb) => setCells(nb.cells || []))
      .catch((e) => setErr(String(e)));
    if (top.current) top.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [file]);

  if (err) return <p style={{ color: C.textDim }}>Couldn't load the notebook ({err}). Run <code>npm run build</code> so <code>/notebooks</code> is served.</p>;
  if (!cells) return <p style={{ color: C.textFaint }}>Loading notebook…</p>;
  return (
    <div ref={top}>
      {cells.map((c, i) => {
        if (c.cell_type === "markdown") return <Markdown key={i} source={src(c)} />;
        if (c.cell_type === "code") {
          const code = src(c).replace(/\n$/, "");
          return (
            <div key={i} style={{ margin: "1.4em 0" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: -2, top: 14, fontFamily: "var(--font-mono)", fontSize: 10, color: C.textFaint, transform: "translateX(-100%)", paddingRight: 10, userSelect: "none" }}>In</span>
                {code && <CodeBox text={code} />}
              </div>
              <Outputs outputs={c.outputs} />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

/* ----------------------------- the page ---------------------------------- */
export default function NotebooksPage({ dark, setDark }) {
  const C = useTheme();
  const [active, setActive] = useState(NOTEBOOKS[0].file);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const navBg = dark ? "rgba(21,20,15,.82)" : "rgba(250,249,246,.85)";
  return (
    <div style={{ background: C.ink, color: C.text, fontFamily: "var(--font-sans)", minHeight: "100vh" }}>
      {/* top bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b" style={{ background: navBg, borderColor: C.line }}>
        <div className="max-w-[1100px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-2.5 shrink-0" style={{ textDecoration: "none" }}>
            <span style={{ color: C.cyan, fontSize: 18 }}>←</span>
            <span className="font-medium text-[14px]" style={{ color: C.textHi }}>Back to the course</span>
          </a>
          <button onClick={() => setDark((v) => !v)} aria-label="Toggle light or dark mode"
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0"
            style={{ border: `1px solid ${C.line}`, background: C.ink3, color: C.cyan }}>
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </nav>

      <main className="max-w-[820px] mx-auto px-6 pt-28 pb-24">
        <div className="font-mono text-xs tracking-[0.18em] uppercase mb-4" style={{ color: C.cyan }}>From-scratch labs</div>
        <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 560, fontSize: "clamp(34px,6vw,52px)", lineHeight: 1.05, letterSpacing: "-0.02em", color: C.textHi, maxWidth: "18ch" }}>
          JEPA, in runnable code
        </h1>
        <p className="mt-5 text-[18px] leading-relaxed" style={{ color: C.textDim, maxWidth: "60ch" }}>
          The course explains the ideas; these four notebooks build them — real PyTorch, trained on real
          GPUs, with the outputs you'd actually see. Read them here, or run them yourself from
          <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.86em", background: C.ink3, padding: "1px 6px", borderRadius: 5, margin: "0 4px", color: C.cyanDeep }}>jepa-from-scratch/</code>.
        </p>

        {/* notebook switcher */}
        <div className="flex flex-wrap gap-2 mt-9 mb-2">
          {NOTEBOOKS.map((nb) => {
            const on = nb.file === active;
            return (
              <button key={nb.file} onClick={() => setActive(nb.file)}
                className="text-left rounded-2xl px-4 py-3 transition-all"
                style={{ background: on ? C.ink2 : "transparent", border: `1px solid ${on ? C.cyan : C.line}`, minWidth: 150, flex: "1 1 150px", boxShadow: on ? `0 1px 0 ${C.cyan}22` : "none" }}>
                <div className="font-mono text-[11px]" style={{ color: on ? C.cyan : C.textFaint }}>{nb.n}</div>
                <div className="font-medium text-[15px] mt-0.5" style={{ color: C.textHi, fontFamily: "Fraunces, Georgia, serif" }}>{nb.title}</div>
                <div className="text-[12px] mt-0.5" style={{ color: C.textDim }}>{nb.sub}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
          <NotebookViewer file={active} />
        </div>

        <div className="mt-16 pt-6 text-[13px]" style={{ borderTop: `1px solid ${C.line}`, color: C.textFaint }}>
          Notebooks executed end-to-end on an RTX 4090 + RTX 3060. Outputs (loss curves, plots, probe
          results) are embedded as produced. <a href="#" style={{ color: C.cyan, textDecoration: "none" }}>← Back to the course</a>
        </div>
      </main>
    </div>
  );
}
