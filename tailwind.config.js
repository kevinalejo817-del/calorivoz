/** Misma configuración de tema que el HTML original de CaloriVoz. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      colors: {
        canvas: '#F8FAFC',
        emeraldBrand: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          800: '#065F46',
          900: '#064E3B',
        },
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        glow: '0 0 0 8px rgba(16, 185, 129, 0.15)',
      },
    },
  },
  plugins: [],
};
