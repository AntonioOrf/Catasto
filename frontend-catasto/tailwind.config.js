/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        skin: {
          fill: 'var(--color-bg-main)',
          sidebar: 'var(--color-bg-sidebar)',
          'sidebar-header': 'var(--color-bg-sidebar-header)',
          header: 'var(--color-bg-header)',
          'header-accent': 'var(--color-bg-header-accent)',
          'header-border': 'var(--color-bg-header-border)',

          text: 'var(--color-text-main)',
          'text-inverted': 'var(--color-text-inverted)',
          'text-accent': 'var(--color-text-accent)',

          border: 'var(--color-border)',
          'border-dark': 'var(--color-border-dark)',

          hover: 'var(--color-item-hover)',
          selected: 'var(--color-item-selected)',
        }
      }
    },
  },
  plugins: [],
}