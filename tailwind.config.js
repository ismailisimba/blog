/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ejs}', // Scan JS and EJS files for Tailwind classes
  ],
  theme: {
    extend: {
      // Custom styles for the typography plugin
      typography: (theme) => ({
        DEFAULT: {
          css: {
            // -- General styles --
            'h1, h2, h3, h4, h5, h6': {
              fontWeight: '700',
              marginTop: '1.5em',
              marginBottom: '0.5em',
            },
            blockquote: {
              fontWeight: '500',
              fontStyle: 'italic',
              color: theme('colors.gray.600'),
              borderLeftWidth: '0.25rem',
              borderLeftColor: theme('colors.gray.300'),
              paddingLeft: '1em',
              quotes: '"\\201C""\\201D""\\2018""\\2019"',
            },
            'blockquote p:first-of-type::before': { content: 'none' }, // Remove default quotes
            'blockquote p:last-of-type::after': { content: 'none' },
            'code::before': { content: 'none' }, // Remove default backticks around inline code
            'code::after': { content: 'none' },
            code: {
              backgroundColor: theme('colors.gray.100'),
              color: theme('colors.gray.800'),
              borderRadius: '0.25rem',
              padding: '0.2em 0.4em',
              fontWeight: '400',
            },
            hr: {
              borderColor: theme('colors.gray.200'),
              marginTop: '3em',
              marginBottom: '3em',
            },
            // -- Dark mode overrides --
            '--tw-prose-invert-body': theme('colors.gray.300'),
            '--tw-prose-invert-headings': theme('colors.white'),
            '--tw-prose-invert-lead': theme('colors.gray.400'),
            '--tw-prose-invert-links': theme('colors.blue.400'),
            '--tw-prose-invert-bold': theme('colors.white'),
            '--tw-prose-invert-counters': theme('colors.gray.400'),
            '--tw-prose-invert-bullets': theme('colors.gray.600'),
            '--tw-prose-invert-hr': theme('colors.gray.700'),
            '--tw-prose-invert-quotes': theme('colors.gray.100'),
            '--tw-prose-invert-quote-borders': theme('colors.gray.700'),
            '--tw-prose-invert-captions': theme('colors.gray.400'),
            '--tw-prose-invert-code': theme('colors.white'),
            '--tw-prose-invert-pre-code': theme('colors.gray.300'),
            '--tw-prose-invert-pre-bg': 'rgb(0 0 0 / 50%)',
            '--tw-prose-invert-th-borders': theme('colors.gray.600'),
            '--tw-prose-invert-td-borders': theme('colors.gray.700'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // This plugin gives us the `prose` class
  ],
};
