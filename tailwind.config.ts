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
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Primary Action Color - Main CTA and urgency elements (10%)
        primary: {
          50: '#FFF1EC',
          100: '#FFE4D9',
          200: '#FFCAB3',
          300: '#FFA882',
          400: '#FF7D4D',
          500: '#EF3F0A', // Bright Orange - Main CTA
          600: '#D63509',
          700: '#B32A08',
          800: '#8F2206',
          900: '#6B1A05',
        },
        // Brand/Professional Color - Header, Sidebar, Navigation (30%)
        brand: {
          50: '#EEF5F6',
          100: '#D5E8EA',
          200: '#B3D4D8',
          300: '#82B9C0',
          400: '#4D9BA4',
          500: '#276874', // Deep Teal - Navigation & Headers
          600: '#215D68',
          700: '#1A4D57',
          800: '#143D45',
          900: '#0F2D33',
        },
        // Success/Growth Color - Paid status & profit indicators
        success: {
          50: '#FBFEE7',
          100: '#F5FCBE',
          200: '#EBF78C',
          300: '#DEF05A',
          400: '#C5E151', // Lime Green - Paid status
          500: '#A8C93E',
          600: '#87A52F',
          700: '#657C23',
          800: '#47591A',
          900: '#2D3A11',
        },
        // Secondary/Soft Color - Supporting elements & badges
        secondary: {
          50: '#F0FAFA',
          100: '#E0F6F6',
          200: '#C2EDED',
          300: '#9DE3E3',
          400: '#82D9D7', // Soft Cyan - Badges & accents
          500: '#5BC7C4',
          600: '#3AABAA',
          700: '#2C8A8A',
          800: '#266E6E',
          900: '#225C5C',
        },
        // Warm Highlight Color - Secondary buttons & warnings
        highlight: {
          50: '#FFF5ED',
          100: '#FFE9D4',
          200: '#FFD4AA',
          300: '#FFBA80',
          400: '#FAAC7B', // Soft Peach - Secondary buttons
          500: '#F58A4D',
          600: '#E56D2E',
          700: '#C2531F',
          800: '#9F431A',
          900: '#833818',
        },
        // Surface/Background Colors
        surface: {
          white: '#FFFFFF',
          light: '#F7F7F7', // Light Grey - Dashboard background
          muted: '#F0F0F0',
          dark: '#E5E5E5',
        },
        // Text Colors
        text: {
          primary: '#1A1A1A',
          secondary: '#4A4A4A',
          muted: '#6B7280',
          light: '#9CA3AF',
        },
        // Status Colors for Invoice
        status: {
          paid: '#C5E151',      // Lime Green
          sent: '#82D9D7',      // Soft Cyan
          overdue: '#EF3F0A',   // Bright Orange
          draft: '#FAAC7B',     // Soft Peach
        },
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        'pulse-soft': {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.02)", opacity: "0.95" },
        },
        'fade-in': {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "float": "float 3s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-out forwards",
      },
      boxShadow: {
        'brand': '0 4px 14px 0 rgba(39, 104, 116, 0.15)',
        'brand-lg': '0 10px 25px 0 rgba(39, 104, 116, 0.2)',
        'primary': '0 4px 14px 0 rgba(239, 63, 10, 0.25)',
        'primary-lg': '0 10px 25px 0 rgba(239, 63, 10, 0.3)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};

export default config;
