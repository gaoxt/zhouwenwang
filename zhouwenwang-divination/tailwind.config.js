/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-black': '#000000',
        'brand-white': '#FFFFFF',
        'brand-gray': '#CCCCCC',
        'brand-orange': '#FF9900',
      },
    },
  },
  plugins: [],
} 