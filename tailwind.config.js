/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Civic Pavilion design system
        primary: {
          DEFAULT: '#00450d',
          container: '#1b5e20',
          fixed: '#a5d6a7',       // soft glow behind primary icons
        },
        on: {
          surface: '#1a1c1c',
          'surface-variant': '#41493e',
          'primary-container': '#ffffff',
        },
        surface: {
          DEFAULT: '#f9f9f9',
          'container-lowest': '#ffffff',
          'container-low': '#f3f3f3',
          container: '#eeeeee',
          'container-high': '#e8e8e8',
          'container-highest': '#e1e1e1',
          tint: 'rgba(0, 69, 13, 0.06)',
          variant: '#c4c8bb',
        },
        outline: {
          DEFAULT: '#717a6d',
          variant: '#c0c9bb',
        },
        'surface-tint': '#2a6b2c',
        tertiary: {
          DEFAULT: '#7c000a',
        },
      },
      fontFamily: {
        display: ['Manrope', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'headline-lg': ['1.75rem', { lineHeight: '2.25rem', fontWeight: '700', letterSpacing: '-0.02em' }],
        'headline-sm': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '700', letterSpacing: '-0.01em' }],
        'label-lg': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '600' }],
        'label-md': ['0.8125rem', { lineHeight: '1.125rem', fontWeight: '500' }],
        'label-sm': ['0.6875rem', { lineHeight: '1rem', fontWeight: '500' }],
      },
      boxShadow: {
        ambient: '0 4px 24px rgba(26, 28, 28, 0.04)',
        'ambient-lg': '0 8px 32px rgba(26, 28, 28, 0.06)',
      },
      borderRadius: {
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      spacing: {
        18: '4.5rem',
        20: '5rem',
      },
    },
  },
  plugins: [],
}
