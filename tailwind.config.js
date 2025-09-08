/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // ← très important pour Netlify
  ],
  theme: { extend: {} },
  plugins: [],
};
