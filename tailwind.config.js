/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { blue: "#008AD1", navy: "#1F4E78" },
      },
    },
  },
  plugins: [],
};
