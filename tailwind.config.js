/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce6ff',
          500: '#3b6ef6',
          600: '#2d5ce8',
          700: '#2248cc',
          900: '#111d4a',
        },
      },
    },
  },
  plugins: [],
}
