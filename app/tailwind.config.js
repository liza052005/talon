/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Базовая палитра по ТЗ (можешь поменять)
        primary: '#2563eb', // синий
        secondary: '#f59e0b', // оранжевый
        danger: '#ef4444', // красный
        success: '#10b981', // зеленый
      }
    },
  },
  plugins: [],
}