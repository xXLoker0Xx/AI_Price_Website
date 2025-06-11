/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
      },
      colors: {
        dark: "#0d0d0d",
        light: "#f9f9f9",
        accent: "#3b82f6",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,0.05)",
      },
      borderRadius: {
        '2xl': '1rem',
      },
    },
  },

  plugins: [],
}