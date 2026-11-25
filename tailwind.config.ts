import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-latin)", "var(--font-thmanyah-sans)", "Thmanyah Sans", "var(--font-arabic)", "Cairo", "Geist", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
        serif: ["var(--font-serif)", "var(--font-thmanyah-serif)", "Thmanyah Serif Display", "var(--font-amiri)", "Amiri", "Cormorant Garamond", "serif"],
        arabic: ["var(--font-thmanyah-sans)", "Thmanyah Sans", "Cairo", "sans-serif"],
        thmanyah: ["var(--font-thmanyah-sans)", "Thmanyah Sans", "sans-serif"],
        "thmanyah-serif": ["var(--font-thmanyah-serif)", "Thmanyah Serif Display", "serif"],
        "thmanyah-extend": ["var(--font-thmanyah-serif)", "Thmanyah Serif Display", "serif"]
      },
      colors: {
        concrete: {
          50: "#f7f5f0",
          100: "#ebe5da",
          200: "#d7ccbd",
          300: "#b9aa99",
          400: "#968573",
          500: "#766858",
          600: "#5d5146",
          700: "#47403a",
          800: "#302d2a",
          900: "#1d1b19"
        },
        wahaj: {
          teal: "#187d6d",
          gold: "#c7924d",
          clay: "#b85a2d",
          pearl: "#fbfaf6",
          ink: "#191614",
          terracotta: "#b85a2d",
          terracottaDark: "#9e4a22",
          cream: "#f7f4ee",
          linen: "#f4efeb",
          sand: "#ede6dc",
          stone: "#e5dfd5",
          espresso: "#161412",
          charcoal: "#1c1917"
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)"
        }
      },
      boxShadow: {
        soft: "0 18px 60px rgba(25, 22, 20, 0.08)",
        card: "0 4px 20px -2px rgba(25, 22, 20, 0.05)",
        pill: "0 8px 24px -4px rgba(184, 90, 45, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;
