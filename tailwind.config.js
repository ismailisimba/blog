import defaultTheme from 'tailwindcss/defaultTheme'; // Import default theme

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/views/**/*.ejs"],
  theme: {
    extend: {
      fontFamily: {
        // Set 'Inter' as the default sans-serif font
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Define our custom color palette
        'background': '#f8f7f4',
        'text-main': '#1a1a1a',
        'primary': '#6d5d6e',
        'accent': '#a78295',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
