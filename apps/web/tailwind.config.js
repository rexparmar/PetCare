/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        pine: {
          50: "#effaf6",
          100: "#d9f3e8",
          200: "#b6e6d4",
          300: "#86d2b8",
          400: "#53b796",
          500: "#309a78",
          600: "#217d61",
          700: "#1d644f",
          800: "#1b5041",
          900: "#174237",
        },
        ink: "#16332a",
        cream: "#f8faf7",
      },
      boxShadow: {
        card: "0 12px 34px -18px rgba(19, 70, 54, 0.24)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: [
          "Manrope",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
