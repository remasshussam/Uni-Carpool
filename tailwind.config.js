/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy: '#14213D',
        'dark-navy': '#0B2341',
        green: '#00A878',
        'light-green': '#DDF7E8',
        background: '#F7F9FC',
        'primary-text': '#1F2937',
        'secondary-text': '#6B7280',
        border: '#E5E7EB',
        warning: '#F59E0B',
        error: '#EF4444',
        success: '#16A34A',
      },
    },
  },
  plugins: [],
};
