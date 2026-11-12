/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ember:   '#ff6436',
        onyx:    '#161616',
        graphite:'#3c3a3e',
        stone:   '#7b7a7c',
        ash:     '#a2a2a2',
        mist:    '#c9c7cc',
        fog:     '#f1f1f1',
        paper:   '#f8f8f8',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
