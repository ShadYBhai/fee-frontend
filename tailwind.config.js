const forms = require('@tailwindcss/forms');

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: '#4f46e5',
          600: '#4338ca',
          700: '#3730a3',
        },
        paid: { light: '#dcfce7', DEFAULT: '#16a34a', dark: '#14532d' },
        partial: { light: '#fef9c3', DEFAULT: '#ca8a04', dark: '#713f12' },
        pending: { light: '#fee2e2', DEFAULT: '#dc2626', dark: '#7f1d1d' },
        surface: {
          50:  '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          400: '#9ca3af',
          700: '#374151',
          900: '#111827',
        },
      },
      fontSize: {
        'xs':   ['0.875rem', { lineHeight: '1.25rem' }],
        'sm':   ['1rem',     { lineHeight: '1.5rem' }],
        'base': ['1.125rem', { lineHeight: '1.75rem' }],
        'lg':   ['1.25rem',  { lineHeight: '1.75rem' }],
        'xl':   ['1.5rem',   { lineHeight: '2rem' }],
        '2xl':  ['1.875rem', { lineHeight: '2.25rem' }],
        '3xl':  ['2.25rem',  { lineHeight: '2.5rem' }],
      },
      minHeight: {
        'tap':    '3rem',
        'tap-lg': '3.5rem',
      },
    },
  },
  plugins: [forms],
};

