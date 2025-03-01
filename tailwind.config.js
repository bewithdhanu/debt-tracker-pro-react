/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0A0A0F',
          900: '#121218',
          850: '#18181F',
          800: '#1E1E2A',
          750: '#25253A',
          700: '#2D2D3A',
        },
        blue: {
          600: '#3B82F6',
          500: '#4B91F7',
          400: '#60A5FA',
        }
      }
    },
  },
  plugins: [],
};