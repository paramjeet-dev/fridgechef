/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        cyan: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        accent: {
          50:  '#fffbeb',
          100: '#fef3c7',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        dark: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
        surface: {
          DEFAULT: 'rgba(255,255,255,0.08)',
          card:    'rgba(255,255,255,0.06)',
          glass:   'rgba(255,255,255,0.1)',
          overlay: 'rgba(15,23,42,0.6)',
        },
        text: {
          primary:   '#f8fafc',
          secondary: '#cbd5e1',
          muted:     '#64748b',
          inverted:  '#0f172a',
        },
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },

      backgroundImage: {
        'gradient-primary':  'linear-gradient(135deg, #7c3aed, #06b6d4)',
        'gradient-warm':     'linear-gradient(135deg, #ec4899, #f97316)',
        'gradient-dark':     'linear-gradient(135deg, #0f172a, #1e293b)',
        'gradient-card':     'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.1))',
        'gradient-hero':     'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      },

      boxShadow: {
        'glow-violet': '0 0 20px rgba(124,58,237,0.4), 0 0 40px rgba(124,58,237,0.2)',
        'glow-cyan':   '0 0 20px rgba(6,182,212,0.4), 0 0 40px rgba(6,182,212,0.2)',
        'glow-sm':     '0 0 10px rgba(124,58,237,0.3)',
        'card':        '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        'card-hover':  '0 8px 40px rgba(0,0,0,0.4), 0 0 20px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
        'glass':       '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        'modal':       '0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(124,58,237,0.2)',
      },

      backdropBlur: {
        xs: '2px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
      },

      borderRadius: {
        xl:   '0.75rem',
        '2xl':'1rem',
        '3xl':'1.5rem',
      },

      animation: {
        'float':        'float 6s ease-in-out infinite',
        'float-slow':   'float 8s ease-in-out infinite',
        'float-delay':  'float 6s ease-in-out 2s infinite',
        'pulse-glow':   'pulseGlow 2s ease-in-out infinite',
        'shimmer':      'shimmer 1.8s infinite',
        'blob':         'blob 8s ease-in-out infinite',
        'blob-delay':   'blob 8s ease-in-out 3s infinite',
        'fade-up':      'fadeUp 0.5s ease-out',
        'spin-slow':    'spin 8s linear infinite',
      },

      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-16px)' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 10px rgba(124,58,237,0.3)' },
          '50%':     { boxShadow: '0 0 30px rgba(124,58,237,0.7), 0 0 60px rgba(6,182,212,0.3)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        blob: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%':     { transform: 'translate(40px,-60px) scale(1.1)' },
          '66%':     { transform: 'translate(-30px,40px) scale(0.9)' },
        },
        fadeUp: {
          '0%':   { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};