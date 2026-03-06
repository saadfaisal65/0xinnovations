import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0510',
        foreground: '#ededed',
        accent: {
          fuchsia: 'rgba(134, 25, 143, 0.35)',
          purple: 'rgba(88, 28, 135, 0.3)',
          pink: 'rgba(157, 23, 77, 0.2)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderColor: {
        neutral: {
          900: '#171717',
        }
      }
    },
  },
  plugins: [],
};
export default config;
