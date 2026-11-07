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
        // Official ZTennis Brand Identity Palette (Figma Brand Guide)
        brand: {
          rose: '#E0749A',
          ink: '#1A1118',
          courtGreen: '#1F7A5A',
        },
        // Specific exact 5-color palette:
        // #337357: Dark spring green | #6D9F71: Asparagus | #FFDBE5: Mimi Pink | #EA9AB2: Amaranth pink | #E27396: Rose Pompadour
        palette: {
          darkSpringGreen: '#337357',
          asparagus: '#6D9F71',
          mimiPink: '#FFDBE5',
          amaranthPink: '#EA9AB2',
          rosePompadour: '#E27396',
        },
        // Primary scale mapped to Rose Pompadour (#E27396) & Amaranth Pink (#EA9AB2) - PINK DOMINANT!
        primary: {
          50: '#fff5f8',
          100: '#FFDBE5', // Mimi Pink
          200: '#fcc5d7',
          300: '#f79fbe',
          400: '#EA9AB2', // Amaranth pink
          500: '#E27396', // Rose Pompadour (Dominant Pink)
          600: '#cf5479',
          700: '#b03d60',
          800: '#92334f',
          900: '#7a2d43',
          950: '#481323',
        },
        // Court scale for tennis accents (#6D9F71 Asparagus & #337357 Dark Spring Green)
        court: {
          50: '#f2f7f4',
          100: '#e1ede6',
          200: '#c5dcd0',
          300: '#9ec4b1',
          400: '#6D9F71', // Asparagus
          500: '#548762',
          600: '#406f4e',
          700: '#337357', // Dark Spring Green
          800: '#2b5c46',
          900: '#244c3a',
          950: '#11291f',
        },
        // Tennis Pink alias scale for backward compatibility
        tennisPink: {
          50: '#fff5f8',
          100: '#FFDBE5', // Mimi Pink
          200: '#fcc5d7',
          300: '#f79fbe',
          400: '#EA9AB2', // Amaranth pink
          500: '#E27396', // Rose Pompadour
          600: '#cf5479',
          700: '#b03d60',
          800: '#92334f',
          900: '#7a2d43',
          950: '#481323',
        },
        // Tailored Slate with deep rose-berry undertones for rich dark mode
        slate: {
          50: '#fdf8fa',
          100: '#fbf0f4',
          200: '#f5e1eb',
          300: '#e6c8d7',
          400: '#a38496',
          500: '#735768',
          600: '#543b4b',
          700: '#3b2533',
          750: '#2b1824',
          800: '#20101a', // elevated card/modal in dark mode
          850: '#190a14',
          900: '#14060f', // elevated surfaces in dark mode
          950: '#0d0309', // deep dark page background in dark mode
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
        'soft-xs': '0 1px 3px 0 rgba(72, 19, 35, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'soft-sm': '0 3px 8px -1px rgba(72, 19, 35, 0.06), 0 1px 4px -1px rgba(0, 0, 0, 0.03)',
        'soft-md': '0 8px 24px -4px rgba(72, 19, 35, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'soft-lg': '0 16px 36px -6px rgba(72, 19, 35, 0.1), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        'soft-xl': '0 24px 48px -8px rgba(72, 19, 35, 0.14), 0 8px 18px -4px rgba(0, 0, 0, 0.05)',
        'pink-glow': '0 8px 24px -2px rgba(226, 115, 150, 0.35)',
        'court-glow': '0 8px 24px -2px rgba(109, 159, 113, 0.3)',
      },
    },
  },
  plugins: [],
};