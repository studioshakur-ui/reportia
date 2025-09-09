// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',           // tema gestito aggiungendo la classe 'dark' su <html>
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand:  '#6d4aff',
        brand2: '#8f6bff',
      },
      borderRadius: {
        '2xl': '1rem',
      },
      boxShadow: {
        'card': '0 10px 30px -10px rgba(0,0,0,0.3)',
      },
      container: {
        center: true,
        padding: { DEFAULT: '1rem', md: '1.5rem', lg: '2rem' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial'],
      }
    },
  },
  plugins: [], // niente plugin extra per evitare problemi in build
}
