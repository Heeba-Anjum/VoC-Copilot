export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0E1420', panel: '#141B2B', border: '#232C40' },
        signal: { amber: '#F2A65A', blue: '#5B8DEF', green: '#4FBF8B' },
        mutedInk: '#8A93A6',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}