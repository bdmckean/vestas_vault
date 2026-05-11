/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // VisualizationsPage uses a shared palette object (VIZ) so classes must not be purged
  safelist: [
    'bg-teal-600',
    'bg-amber-500',
    'bg-blue-600',
    'bg-violet-600',
    'bg-slate-500',
    'bg-orange-500',
    'bg-sky-600',
    'bg-red-600',
    'bg-rose-500',
    'bg-lime-300',
    'bg-violet-500',
    'bg-orange-400',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
