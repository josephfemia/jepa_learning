import React from "react";

/* ----------------------------- design tokens -----------------------------
   Palette is grounded in color-and-learning research:
   • Blue/teal is the most consistently evidenced color for sustained focus,
     calm, and problem-solving — so it's our PRIMARY (cyan = the "signal" /
     latent space, the thing we want you concentrating on).
   • Green aids retention and reads as success — it's our dedicated CORRECT/OK
     signal (kept distinct from the teal brand accent).
   • Warm amber is used sparingly for arousal/attention and to mark the "pixel /
     generative world" foil; red is avoided (raises anxiety).
   • Semantic color-coding is consistent throughout (cyan=latent, amber=pixel,
     violet=energy/abstraction, green=correct) because congruent color-coding
     measurably improves recall. The legend in the hero makes this explicit.
   Two palettes (dark default + light); surfaces/text flip, hues stay congruent. */
export const DARK = {
  cyan: "#3ee0d4", cyanDeep: "#15b3a8",   // focus/latent (blue-teal)
  amber: "#f2ad52", amberDeep: "#c4801f", // attention/pixel-world (sparing)
  violet: "#a394ff",                       // energy/abstraction
  green: "#5fd99a", greenDeep: "#2fae74",  // correct/success (retention-friendly)
  ink: "#0b1020", ink2: "#11172a", ink3: "#18203a", line: "#27314d",
  text: "#dde2ef", textHi: "#f5f8ff", textDim: "#97a1b8", textFaint: "#65708c",
  codeBg: "#0a0f1c", codeBar: "#0e1424", glow: 0.9, isDark: true,
  okBg: "#16352e", warnBg: "#2c2415",
};
export const LIGHT = {
  // hues deepened for AA contrast on light surfaces; same semantic roles
  cyan: "#0e8d82", cyanDeep: "#0b6b62",
  amber: "#b56a09", amberDeep: "#8f5207",
  violet: "#6450c8",
  green: "#1f9d63", greenDeep: "#157a4c",
  ink: "#f6f8fc", ink2: "#ffffff", ink3: "#eef2f8", line: "#d6deea",
  text: "#28303f", textHi: "#0b1220", textDim: "#4f5a6c", textFaint: "#79839a",
  codeBg: "#0e1424", codeBar: "#0a0f1c", glow: 0.35, isDark: false,
  okBg: "#dcf4ea", warnBg: "#fbeed5",
};

export const ThemeContext = React.createContext(DARK);
export const useTheme = () => React.useContext(ThemeContext);
