/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'qwen-primary': '#4f46e5',
        'qwen-secondary': '#06b6d4',
        'qwen-accent': '#f59e0b',
        'qwen-dark': '#1e1b4b',
        'qwen-light': '#f8fafc',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}