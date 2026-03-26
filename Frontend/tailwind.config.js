export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0f1924",
        gold: "#c7ae75",
        lightBlue: "#e2e8f0", // Soft blue for backgrounds
      },
      fontFamily: {
        sans: ["Outfit", "sans-serif"], // Premium modern sans-serif font
        heading: ["Montserrat", "sans-serif"], // Additional font for headings
      },
    },
  },
  plugins: [],
};
