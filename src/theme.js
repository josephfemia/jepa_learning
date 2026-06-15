import React from "react";

/* ----------------------------- design tokens -----------------------------
   "Editorial Apple": calm, warm-neutral, near-monochrome, with ONE restrained
   accent. Grounded in learning/perception research:
   • Low overall saturation + neutral-dominant surfaces reduce visual fatigue and
     extraneous cognitive load over long reading sessions (cognitive-load theory).
   • A single calm BLUE accent carries focus/links/"the signal" — blue is the most
     consistently evidenced hue for sustained concentration and calm.
   • High text-to-background contrast (AA+) is the biggest lever on readability.
   • Semantic coding is preserved but de-saturated to gentle TINTS, not neon:
     blue = signal/latent, green = correct, amber = the "pixel/generative" foil,
     violet = energy (used rarely). Restraint reads as elegant; rainbows read as noise.
   • Warm (not cold-gray) neutrals + soft hairlines + real (not glowing) shadows
     feel human and physical rather than synthetic. glow≈0 on purpose.
   Token NAMES are stable (components read C.cyan etc.); only the VALUES changed. */
export const LIGHT = {
  cyan: "#2f6df0", cyanDeep: "#1c50c8",     // the single accent: a calm, focused blue
  amber: "#b06a1c", amberDeep: "#8a5212",   // the "pixel/generative" foil — muted ochre
  violet: "#6a5bd0",                          // energy/abstraction — used sparingly
  green: "#2f9469", greenDeep: "#1f7a54",    // correct / healthy
  ink: "#faf9f6", ink2: "#ffffff", ink3: "#f1efea", line: "#e6e3dc",   // warm paper neutrals
  text: "#322f2a", textHi: "#1a1814", textDim: "#6c675e", textFaint: "#a09a8e",
  codeBg: "#1b1a18", codeBar: "#232220", glow: 0, isDark: false,        // code stays warm-dark
  okBg: "#e8f1ec", warnBg: "#f4ecdd",
};
export const DARK = {
  cyan: "#6ea2ff", cyanDeep: "#9ec0ff",     // accent lifted for dark surfaces
  amber: "#dca766", amberDeep: "#e7bd86",
  violet: "#a99ff0",
  green: "#69c79c", greenDeep: "#8ad9b5",
  ink: "#15140f", ink2: "#1c1b16", ink3: "#26241e", line: "#322f28",    // warm near-black
  text: "#e7e3d9", textHi: "#fbfaf5", textDim: "#a39d8f", textFaint: "#6f6a5e",
  codeBg: "#100f0d", codeBar: "#1a1916", glow: 0, isDark: true,
  okBg: "#19281f", warnBg: "#2b2517",
};

export const ThemeContext = React.createContext(LIGHT);
export const useTheme = () => React.useContext(ThemeContext);
