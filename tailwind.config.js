/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6B2515",    
        dark: "#0f172a",        
      },
    },
  },
  plugins: [require("@tailwindcss/line-clamp")],
};
