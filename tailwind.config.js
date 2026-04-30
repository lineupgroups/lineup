/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-acid': '#CCFF00',
        'brand-orange': '#FF5B00',
        'brand-black': '#0A0A0A',
        'brand-white': '#FFFFFF',
      },
      screens: {
        'xs': '475px',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
      }
    },
  },
  plugins: [],
};

