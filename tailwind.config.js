/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF3366',
        'primary-light': '#FF6B98',
        'primary-dark': '#BE185D',
        secondary: '#831843',
        accent: '#F472B6',
        foreground: '#333333',
        muted: '#666666',
        'muted-foreground': '#999999',
        border: '#FFE5EA',
        green: '#4CAF50',
        orange: '#FF982A',
        pink: {
          50: '#FFF0F3',
          100: '#FFE5EA',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
          900: '#881337',
          950: '#4C0519',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}