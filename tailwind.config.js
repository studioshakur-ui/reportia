/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html","./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand:  '#6d4aff',
        brand2: '#8f6bff'
      },
      boxShadow: {
        card: '0 10px 30px -10px rgba(0,0,0,0.3)'
      },
      borderRadius: { '2xl': '1rem' },
      fontFamily: {
        sans: ['Inter','ui-sans-serif','system-ui','-apple-system','"Segoe UI"','Roboto','"Helvetica Neue"','Arial']
      }
    }
  },
  plugins: []
}
