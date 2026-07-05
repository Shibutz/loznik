/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
        },
        teal: { 500: '#14b8a6', 600: '#0d9488' },
        sky:  { 500: '#0ea5e9' },
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  safelist: [
    // Dynamic layer/category colors from DB defaults (emerald kept for data)
    'bg-emerald-100', 'text-emerald-800', 'dark:bg-emerald-900',
    'bg-blue-100', 'text-blue-800', 'dark:bg-blue-900',
    'bg-violet-100', 'text-violet-800', 'dark:bg-violet-900',
    'bg-amber-100', 'text-amber-800', 'dark:bg-amber-900',
    'bg-rose-100', 'text-rose-800', 'dark:bg-rose-900',
    'bg-indigo-100', 'text-indigo-800', 'dark:bg-indigo-900',
    'bg-red-100', 'text-red-800',
    'bg-orange-100', 'text-orange-800',
    'bg-green-100', 'text-green-800',
    'bg-purple-100', 'text-purple-800',
    'bg-sky-100', 'text-sky-800',
    'bg-teal-100', 'text-teal-800',
  ],
}
