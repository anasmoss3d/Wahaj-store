import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
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
          clay: "#b9735c",
          pearl: "#fbfaf6",
          ink: "#191614"
        }
      },
      boxShadow: {
        soft: "0 18px 60px rgba(25, 22, 20, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
