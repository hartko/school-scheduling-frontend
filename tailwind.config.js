/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'ui-sans-serif'],
        display: ['var(--font-display)', 'ui-serif'],
        mono: ['var(--font-mono)', 'ui-monospace'],
      },
      colors: {
        ink: {
          50:  '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#333333',
          950: '#1a1a1a',
        },
        accent: {
          DEFAULT: '#e91e8c',
          light: '#f06292',
          dark: '#c2185b',
        },
        jade: {
          DEFAULT: '#ad1457',
          light: '#e91e8c',
          dark: '#880e4f',
        },
      },
      boxShadow: {
        'crisp':    '2px 2px 0px 0px rgba(194,24,91,0.12)',
        'crisp-md': '4px 4px 0px 0px rgba(194,24,91,0.10)',
        'crisp-lg': '0 8px 32px 0 rgba(194,24,91,0.10)',
      },
    },
  },
  plugins: [],
};
