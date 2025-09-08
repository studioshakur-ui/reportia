/** @type {import('tailwindcss').Config} */
export default {
  // Mode sombre activé par classe (à poser sur <html class="dark">)
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette accessible (AA) — violets + gris
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',  // principal
          800: '#5b21b6',
          900: '#4c1d95',
        },
        text: {
          DEFAULT: '#1a1a1a',   // texte principal light
          muted:   '#4a4a4a',   // secondaire light
          light:   '#f3f4f6',   // texte clair dark
        },
        surface: {
          DEFAULT: '#ffffff',   // fond light
          muted:   '#f8fafc',   // panneaux light
          dark:    '#111827',   // fond dark
          dark2:   '#0b1220',   // header dark
          line:    '#e5e7eb',   // séparateurs
        },
        success: '#16a34a',
        danger:  '#dc2626',
        warn:    '#f59e0b',
      },
      boxShadow: {
        soft: '0 6px 20px rgba(0,0,0,0.08)',
        ring: '0 0 0 4px rgba(109,40,217,0.15)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
