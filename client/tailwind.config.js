/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // Primary — fresh green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        accent: {
          50:  '#fff7ed',
          100: '#ffedd5',
          300: '#fdba74',
          400: '#fb923c',  // Warm orange — appetite-stimulating
          500: '#f97316',
          600: '#ea580c',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted:   '#f8fafc',
          card:    '#ffffff',
          overlay: 'rgba(0, 0, 0, 0.4)',
        },
        text: {
          primary:   '#0f172a',
          secondary: '#475569',
          muted:     '#94a3b8',
          inverted:  '#ffffff',
        },
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'], // Recipe titles
      },

      boxShadow: {
        card:   '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.12)',
        modal:  '0 25px 60px rgba(0,0,0,0.18)',
      },

      borderRadius: {
        xl:  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },

      animation: {
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':    'shimmer 1.5s infinite',
      },

      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%':      { opacity: 0.6 },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
