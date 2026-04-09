import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0f0f0f',
          1: '#1a1a1a',
          2: '#242424',
          3: '#2e2e2e',
        },
        brand: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
          light: '#a5b4fc',
        },
      },
    },
  },
  plugins: [],
};

export default config;
