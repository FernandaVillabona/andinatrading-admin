/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4f46e5",   // Morado principal
        secondary: "#312e81", // Morado oscuro
        accent: "#8b5cf6",    // Acento suave
        light: "#f5f5f7",     // Fondo claro
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        smooth: "0 4px 14px rgba(0,0,0,0.1)",
      },
    },
  },
  plugins: [],
}