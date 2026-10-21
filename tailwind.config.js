/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        paper: '#FFFFFF',
        cream: '#FFF8EE',
        // Accent ramp — pastel → punchy for each hue
        pink: {
          soft: '#FFE0EC',
          DEFAULT: '#FFC9DE',
          bold: '#FF8FB8',
        },
        purple: {
          soft: '#EBE3FF',
          DEFAULT: '#C9B6FF',
          bold: '#A586FF',
        },
        sky: {
          soft: '#E0F1FF',
          DEFAULT: '#A8D8FF',
          bold: '#6EC1FF',
        },
        aqua: '#BDEDE6',
      },
      fontFamily: {
        display: ['Fredoka', 'system-ui', 'sans-serif'],
        round: ['"Quicksand"', 'Fredoka', 'system-ui', 'sans-serif'],
        doodle: ['"Childhood"', '"Gochi Hand"', 'cursive'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
        marker: ['"Caveat"', 'cursive'],
      },
      fontWeight: {
        400: '400',
        500: '500',
        600: '600',
        700: '700',
        800: '800',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(17,17,17,0.18)',
        pop: '0 6px 0 0 #111111',
        'pop-sm': '0 4px 0 0 #111111',
        glow: '0 0 0 4px rgba(255,201,222,0.6)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        twinkle: {
          '0%,100%': { opacity: '0.2', transform: 'scale(0.7)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        rise: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '0' },
          '15%': { opacity: '0.9' },
          '100%': { transform: 'translateY(-120px) scale(1.3)', opacity: '0' },
        },
        wiggle: {
          '0%,100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        twinkle: 'twinkle 2.4s ease-in-out infinite',
        wiggle: 'wiggle 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
