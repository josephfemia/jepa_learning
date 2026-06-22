import React from "react";

/* ----------------------------- design tokens -----------------------------
   Shared design language with the "Robot Learning" companion
   (/Frontend/robotic_learning): a clean, editorial, GitHub-influenced light
   theme — warm-neutral paper, ONE saturated cobalt accent, an orange "signal"
   for emphasis/action, muted semantic tints, hairline borders. Light-mode only.

   The token NAMES are stable — every component reads C.cyan / C.amber / C.ink
   etc. via the useTheme() hook — so the entire UI reskins from this one file.
   The semantic mapping onto the robotic_learning palette:

     cyan   → cobalt   (#2742CC)  the single accent: links, signal, "latent"
     amber  → signal   (#E8590C)  emphasis / action / the "pixel" foil
     violet → violet               energy / abstraction (used sparingly)
     green  → right    (#1B7F4D)  correct / healthy
     ink*   → paper / panel surfaces (light)
     text*  → ink / muted text
     code*  → the always-dark code surface

   The exact hex values live in src/styles.css as CSS custom properties
   (--cobalt, --signal, --paper, …); this object mirrors them for the inline
   styles and the canvas/SVG widgets that need JS color values.

   LIGHT and DARK are intentionally IDENTICAL — the app is light-only, but the
   two exports are kept so the (now no-op) theme plumbing in JepaCourse keeps
   compiling until the shell is rebuilt. */
export const LIGHT = {
  cyan: "#2742CC", cyanDeep: "#1D33A3",      // cobalt — the single accent
  amber: "#E8590C", amberDeep: "#C0490A",    // signal orange — emphasis / "pixel" foil
  violet: "#6A4FD0",                          // energy / abstraction (sparing)
  green: "#1B7F4D", greenDeep: "#14633B",    // correct / healthy
  ink: "#FAFBFC", ink2: "#FFFFFF", ink3: "#F0F3F8", line: "#D9DFE7",  // paper + panel surfaces
  text: "#161B22", textHi: "#0D1117", textDim: "#5B6572", textFaint: "#8A93A3",
  codeBg: "#10151E", codeBar: "#1B2230", glow: 0, isDark: false,      // always-dark code surface
  okBg: "#E5F4EC", warnBg: "#FDEDE3",        // correct / signal tints
};
export const DARK = LIGHT;   // light-only app; alias kept so existing plumbing compiles

export const ThemeContext = React.createContext(LIGHT);
export const useTheme = () => React.useContext(ThemeContext);
