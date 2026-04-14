/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        display: ["Syne", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      colors: {
        amber: { DEFAULT: "#FFB400", dim: "rgba(255,180,0,0.7)", glow: "rgba(255,180,0,0.15)" },
        surface: { DEFAULT: "#0D0D14", elevated: "#13131F" },
        risk: { critical: "#FF3B3B", high: "#FF7A00", medium: "#FFD700", low: "#00CC88" },
      },
      animation: {
        "ticker": "ticker 40s linear infinite",
        "pulse-amber": "pulse-amber 2s infinite",
        "fade-up": "fadeInUp 0.4s ease forwards",
      },
    },
  },
  plugins: [],
};
