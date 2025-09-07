/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      colors: {
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",   // primaire (violet)
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        surface: {
          50: "#f8fafc",    // fond gris très clair
          100: "#f1f5f9",
          200: "#e2e8f0",
        },
        success: { 500: "#22c55e" },
        danger:  { 500: "#ef4444" },
      },
      boxShadow: {
        soft: "0 6px 20px rgba(0,0,0,.06)",
      },
      borderRadius: {
        xl2: "1.25rem",
      }
    },
  },
  plugins: [],
};
