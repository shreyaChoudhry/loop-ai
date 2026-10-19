import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cosmic: {
          950: "#070814",
          900: "#0B1026",
          850: "#0F1433",
          800: "#141B43",
          750: "#182050",
          700: "#1E275C",
          600: "#2B3778",
        },
        neon: {
          violet: "#8B2CFC",
          purple: "#A855F7",
          magenta: "#D946EF",
          cyan: "#22D3EE",
          sky: "#38BDF8",
          emerald: "#10B981",
        },
      },
      boxShadow: {
        "glow-sm": "0 0 15px -3px rgba(139, 44, 252, 0.25)",
        "glow-md": "0 0 25px -4px rgba(139, 44, 252, 0.4)",
        "glow-lg": "0 0 40px -5px rgba(139, 44, 252, 0.5)",
        "glow-magenta": "0 0 30px -4px rgba(217, 70, 239, 0.35)",
        "glow-cyan": "0 0 30px -4px rgba(34, 211, 238, 0.35)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      backgroundImage: {
        "cosmic-gradient": "linear-gradient(135deg, #070814 0%, #0B1026 50%, #150A2E 100%)",
        "neon-gradient": "linear-gradient(135deg, #8B2CFC 0%, #D946EF 100%)",
        "cyan-gradient": "linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
