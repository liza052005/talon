/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Основные цвета по ТЗ
        primary:   '#FAFAFA',  // белый (Primary) — основной фон
        secondary: '#F2F2F7',  // белый (Secondary) — вторичные поверхности
        black:     '#0D0C0C',  // черный — основной текст
        gray:      '#979797',  // серый — вторичный текст, placeholder, разделители
        accent:    '#88FF00',  // зеленый (Accent) — CTA, активные состояния

        // Стопы радиального градиента (для использования через arbitrary values)
        flame:  '#FF6600',  // step 0%
        sun:    '#FFCC00',  // step 36%
        berry:  '#FF0055',  // step 75%
      },
    },
  },
  plugins: [],
}