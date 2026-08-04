/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          950: '#090a10',
          900: '#0d0e17',
          850: '#121420',
          800: '#16192b',
          750: '#1b1f35',
          700: '#212642',
          600: '#2a3154',
          500: '#343c68',
        },
        income:  '#10b981',
        expense: '#f43f5e',
        warning: '#f59e0b',
        info:    '#3b82f6',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 25px -5px rgba(99, 102, 241, 0.4)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.4)',
        'glow-rose':    '0 0 25px -5px rgba(244, 63, 94, 0.4)',
        'glow-amber':   '0 0 25px -5px rgba(245, 158, 11, 0.4)',
        'card-hover':   '0 12px 30px -10px rgba(0, 0, 0, 0.5), 0 0 20px 0 rgba(99, 102, 241, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in':    'fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in':   'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 4s infinite ease-in-out',
        'float':      'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0', transform: 'scale(0.98)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        slideIn: { '0%': { opacity: '0', transform: 'translateY(-12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        float:   { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
    },
  },
  plugins: [],
}
