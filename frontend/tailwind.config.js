/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        stellar: {
          50: "#f0f4ff",
          100: "#e0e9ff",
          500: "#3b5bdb",
          600: "#364fc7",
          700: "#2f44b0",
        },
      },
    },
  },
  plugins: [],
};
