/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a8a', // 深蓝色主色调
        secondary: '#f8fafc', // 浅灰色辅助色
      },
    },
  },
  plugins: [],
}