/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Specific exact palette from tennis swatch:
        // #ffe5f4: Pink Lace | #5e8d66: Russian Green | #f1a6bc: Metallic Pink | #022414: Dark Green
        palette: {
          pinkLace: '#ffe5f4',
          russianGreen: '#5e8d66',
          metallicPink: '#f1a6bc',
          darkGreen: '#022414',
        },
        // Tennis Court Russian Green scale (#5e8d66)
        court: {
          50: '#f3f8f5',
          100: '#e3efe6',
          200: '#cadfcf',
          300: '#a7c6af',
          400: '#7fa988',
          500: '#5e8d66', // Russian Green
          600: '#4a7552',
          700: '#3c5d42',
          800: '#324b37',
          900: '#1c3324',
          950: '#022414', // Dark Green
        },
        // Primary scale mapped to Russian Green for full site consistency
        primary: {
          50: '#f3f8f5',
          100: '#e3efe6',
          200: '#cadfcf',
          300: '#a7c6af',
          400: '#7fa988',
          500: '#5e8d66', // Russian Green (#5e8d66)
          600: '#4a7552',
          700: '#3c5d42',
          800: '#324b37',
          900: '#1c3324',
          950: '#022414', // Dark Green (#022414)
        },
        // Tennis Ball Pink scale (Metallic Pink #f1a6bc & Pink Lace #ffe5f4)
        tennisPink: {
          50: '#fff8fc',
          100: '#ffe5f4', // Pink Lace
          200: '#fecdde',
          300: '#fab3c9',
          400: '#f1a6bc', // Metallic Pink
          500: '#e57a9b',
          600: '#cc577b',
          700: '#aa3d5f',
          800: '#8c3550',
          900: '#753046',
          950: '#441423',
        },
        // Tailored Slate with deep dark green tones (#022414) for dark mode
        slate: {
          50: '#fbfdfc',
          100: '#f1f6f2',
          200: '#dfebdf',
          300: '#c5d8ca',
          400: '#88a38f',
          500: '#5f7c67',
          600: '#47624f',
          700: '#364d3d',
          750: '#23442f',
          800: '#0e3822', // elevated card/modal in dark mode
          850: '#0a301c',
          900: '#052917', // elevated surfaces in dark mode
          950: '#022414', // exact Dark Green (#022414) for page background in dark mode
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-up': 'fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-up': 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float-slow': 'float 4s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleUp: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.65' },
        },
      },
      boxShadow: {
        'soft-xs': '0 1px 2px 0 rgba(2, 36, 20, 0.04)',
        'soft-sm': '0 2px 6px 0 rgba(2, 36, 20, 0.06)',
        'soft-md': '0 6px 16px -2px rgba(2, 36, 20, 0.08), 0 2px 6px -1px rgba(2, 36, 20, 0.04)',
        'soft-lg': '0 12px 28px -4px rgba(2, 36, 20, 0.1), 0 4px 10px -2px rgba(2, 36, 20, 0.04)',
        'soft-xl': '0 20px 38px -6px rgba(2, 36, 20, 0.14), 0 8px 16px -4px rgba(2, 36, 20, 0.06)',
        'pink-glow': '0 0 24px -2px rgba(241, 166, 188, 0.45)',
        'court-glow': '0 0 24px -2px rgba(94, 141, 102, 0.4)',
      },
    },
  },
  plugins: [],
};
