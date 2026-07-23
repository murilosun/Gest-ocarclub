/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF3E6',
          100: '#FFE2C2',
          200: '#FFC588',
          300: '#FFA847',
          400: '#FF8A1F',
          500: '#FF6A00',
          600: '#E55A00',
          700: '#B34700',
          800: '#803300',
          900: '#4D2000',
        },
        ink: {
          50: '#F6F7F9',
          100: '#EDEEF1',
          200: '#D8DBE0',
          300: '#B6BBC4',
          400: '#8A91A0',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#0B0F16',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
