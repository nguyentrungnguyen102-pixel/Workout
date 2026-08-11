/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand accents stay fixed across themes — only surface/text/border
        // tokens below vary, via CSS vars flipped by the `dark` class on
        // <html> (see index.css :root / .dark and src/lib/theme.ts).
        primary: '#FF5400',
        'primary-dark': '#E04A00',
        success: '#1DAA60',
        danger: '#E53935',
        'primary-light': 'rgb(var(--color-primary-light) / <alpha-value>)',
        background: 'rgb(var(--color-background) / <alpha-value>)',
        card: 'rgb(var(--color-card) / <alpha-value>)',
        'card-2': 'rgb(var(--color-card-2) / <alpha-value>)',
        'text-main': 'rgb(var(--color-text-main) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        'success-light': 'rgb(var(--color-success-light) / <alpha-value>)',
        'danger-light': 'rgb(var(--color-danger-light) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
