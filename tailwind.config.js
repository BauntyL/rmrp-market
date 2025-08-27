/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          'scrollbar-color': '#cbd5e1 transparent',
        },
        '.scrollbar-thin::-webkit-scrollbar': {
          width: '8px',
        },
        '.scrollbar-thin::-webkit-scrollbar-track': {
          background: 'rgba(0, 0, 0, 0.05)',
          'border-radius': '4px',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb': {
          background: 'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)',
          'border-radius': '4px',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb:hover': {
          background: 'linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)',
          'border-color': 'rgba(0, 0, 0, 0.2)',
        },
        '.dark .scrollbar-thin': {
          'scrollbar-color': '#4b5563 rgba(255, 255, 255, 0.05)',
        },
        '.dark .scrollbar-thin::-webkit-scrollbar-track': {
          background: 'rgba(255, 255, 255, 0.05)',
        },
        '.dark .scrollbar-thin::-webkit-scrollbar-thumb': {
          background: 'linear-gradient(180deg, #4b5563 0%, #374151 100%)',
          'border-color': 'rgba(255, 255, 255, 0.1)',
        },
        '.dark .scrollbar-thin::-webkit-scrollbar-thumb:hover': {
          background: 'linear-gradient(180deg, #6b7280 0%, #4b5563 100%)',
          'border-color': 'rgba(255, 255, 255, 0.2)',
        },
      })
    }
  ],
}