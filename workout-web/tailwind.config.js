/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF5400',
        'primary-light': '#FFF0EC',
        'primary-dark': '#E04A00',
        background: '#FAF9F6',
        card: '#FFFFFF',
        'card-2': '#F3F2EE',
        'text-main': '#111111',
        'text-secondary': '#8A8A8A',
        'text-muted': '#C8C7C2',
        border: '#E8E7E2',
        success: '#1DAA60',
        'success-light': '#E8F9F0',
        danger: '#E53935',
        'danger-light': '#FFEBEE',
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
