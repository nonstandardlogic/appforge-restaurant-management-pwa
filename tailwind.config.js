/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      // Breakpoints: base=mobile (320px+), md=tablet (768px), xl=desktop (1280px)
      // Tailwind defaults already cover these: sm:640, md:768, lg:1024, xl:1280
    },
  },
  plugins: [],
};
