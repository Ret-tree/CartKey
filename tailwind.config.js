/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: { 50: '#EEF3EC', 100: '#D5E2D0', 500: '#2D6A4F', 600: '#1B4332', 700: '#14332A', 800: '#0D2419', 900: '#1A1F16' },
        brass: { 50: '#FBF6E6', 100: '#F5E6B8', 200: '#E8D48A', 400: '#C9A227', 500: '#B08D1F', 600: '#8B6F18' },
        warm: { 50: '#FAFAF5', 100: '#F4F3ED', 200: '#E8E7DF' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
