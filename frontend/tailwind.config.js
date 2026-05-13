/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6dfff',
          300: '#b3c2ff',
          400: '#8094ff',
          500: '#5468ff',
          600: '#3d4cf2',
          700: '#2f3bd1',
          800: '#2932a8',
          900: '#262d83',
        },
        ink: {
          50: '#f8f9fb',
          100: '#eef0f4',
          200: '#dde1e9',
          300: '#c0c6d2',
          400: '#929aaa',
          500: '#697080',
          600: '#4b525f',
          700: '#373c47',
          800: '#22262e',
          900: '#13161c',
          950: '#0a0c11',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.06)',
        focus: '0 0 0 3px rgba(84, 104, 255, 0.18)',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
