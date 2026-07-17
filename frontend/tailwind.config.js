/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        ink: {
          900: '#0b1220',
          800: '#111a2e',
          700: '#182238',
          600: '#243350',
        },
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(11, 18, 32, 0.25)',
        glow: '0 0 0 1px rgba(249, 115, 22, 0.15), 0 8px 24px -8px rgba(249, 115, 22, 0.35)',
      },
      backgroundImage: {
        'hero-grid':
          'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)',
      },
    },
  },
  plugins: [],
};
