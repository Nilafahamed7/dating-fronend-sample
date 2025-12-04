/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        velora: {
          primary: '#FFCB2B',
          secondary: '#FFD700',
          accent: '#FFF9C4',
          yellow: '#FFCB2B',
          black: '#000000',
          white: '#FFFFFF',
          gray: '#F5F5F5',
          darkGray: '#333333',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

