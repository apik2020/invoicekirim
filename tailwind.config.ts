import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        snow: "#FAFAFA",
        "arctic-blue": "#0EA5E9",
        "cyan-bright": "#22D3EE",
        charcoal: "#1E293B",
        "text-slate": "#1E293B",
        "bg-slate": "#F3F4F6",
        "teal-light": "#14B8A6",
        grapefruit: "#FF6B6B",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "float": "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};

export default config;
