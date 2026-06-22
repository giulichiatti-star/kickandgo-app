/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        negro: '#16161c',
        card: '#202028',
        borde: '#33333c',
        muted: '#a1a1aa',
        blanco: '#ffffff',
        cyan: { DEFAULT: '#2dd4bf', dark: '#14b8a6', neon: '#5eead4' },
        dorado: '#f59e0b',
        rojo: '#ef4444',
        azul: '#3b82f6',
        morado: '#8b5cf6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
