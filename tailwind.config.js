/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F1F8EB',
          100: '#E6F2DD',
          200: '#CDE5BA',
          300: '#A8D085',
          400: '#7DB350',
          500: '#5A8F29',
          600: '#2F6B1E',
          700: '#235416',
          800: '#1A3F10',
          900: '#0F5132',
        },
        ink: {
          DEFAULT: '#0E1411',
          muted: '#5B6760',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F7F9F5',
          dark: '#0E1411',
          'dark-alt': '#16201A',
        },
        line: {
          DEFAULT: '#E3E7DF',
          dark: '#243028',
        },
        band: {
          pass: '#2F6B1E',
          review: '#B26B00',
          fail: '#A4262C',
        },
      },
      fontFamily: {
        sans: ['"Source Sans 3"', '"Source Sans Pro"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(14, 20, 17, 0.04), 0 4px 12px rgba(14, 20, 17, 0.04)',
        pop: '0 8px 24px rgba(14, 20, 17, 0.08)',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};
