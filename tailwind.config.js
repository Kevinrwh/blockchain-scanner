/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-accent',
    'text-accent',
    'border-accent',
    'bg-accent/10',
    'bg-accent/90',
    'border-accent/50',
    'hover:bg-accent/90',
    'focus:border-accent',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:     ['Share Tech Mono', 'monospace'],
        mono:     ['Share Tech Mono', 'monospace'],
        display:  ['Orbitron', 'sans-serif'],
      },
      colors: {
        accent: '#22c55e',
        terminal: {
          bg:     '#0c0c0c',
          panel:  '#0f0f0f',
          border: '#2a2a2a',
          dim:    '#1a1a1a',
          text:   '#e8e8e8',
          muted:  '#555555',
          sub:    '#888888',
        },
      },
    },
  },
  plugins: [],
}
