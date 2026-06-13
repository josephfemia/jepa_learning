/** @type {import('tailwindcss').Config} */
export default {
  // The course component leans on Tailwind core utility classes plus a handful
  // of arbitrary values (e.g. max-w-[1080px], text-[15px]). The JIT engine picks
  // these up from the source automatically as long as the paths below are scanned.
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
