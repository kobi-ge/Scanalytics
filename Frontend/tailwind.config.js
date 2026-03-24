export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0f1924",
        gold: "#c7ae75",
        lightBlue: "#e2e8f0", // כחלחל עדין לרקעים
      },
      fontFamily: {
        sans: ["Assistant", "sans-serif"], // Assistant הוא פונט מעולה לעברית מודרנית
        heading: ["Montserrat", "sans-serif"], // פונט נוסף לכותרות אם תרצה
      },
    },
  },
  plugins: [],
};
