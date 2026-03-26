/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#0a0a0f',
          secondary: '#111118',
          card: '#16161f',
          hover: '#1e1e2a',
        },
        border: {
          DEFAULT: '#2a2a3a',
          light: '#3a3a4a',
        },
        text: {
          primary: '#f0f0ff',
          secondary: '#a0a0b8',
          muted: '#606078',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'spin-slow': 'spin 0.7s linear infinite',
        'bounce-typing': 'typingBounce 1.2s infinite',
        'fade-in': 'fadeIn 0.3s ease forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
        'gradient-accent-hover': 'linear-gradient(135deg, #7c3aed, #2563eb)',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139,92,246,.15), transparent)',
        'auth-glow': 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139,92,246,.1), transparent)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(139,92,246,.15)',
        'glow-hover': '0 0 40px rgba(139,92,246,.3)',
      },
    },
  },
  plugins: [],
};