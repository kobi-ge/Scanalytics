/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // הצבע הכחול העמוק מהרקע/לוגו שביקשת קודם
        'brand-navy': '#0d2d50',
        
        // צבע הזהב היוקרתי מהלוגו
        'brand-gold': '#c7ae75',
        
        // ניתן להוסיף וריאציה בהירה יותר של הזהב לשימוש ב-Hover
        'brand-gold-light': '#d9c596',
      },
    },
  },
  plugins: [],
}