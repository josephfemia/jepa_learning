import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
// `base` controls the public path. Locally it stays "/" (npm run dev / build).
// On GitHub Pages the deploy workflow sets VITE_BASE to "/<repo>/" so asset and
// notebook URLs resolve under the project-page subpath.
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
});
