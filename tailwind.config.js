/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: { DEFAULT: '#0B0F14', 2: '#3A4250', 3: '#5F6978', 4: '#8892A0' },
        paper: { DEFAULT: '#F6F7F4', card: '#FFFFFF', line: '#E7E9E4' },
        mint: { DEFAULT: '#00B386', dark: '#008F6B', soft: '#E3F6EF' },
        amber: { DEFAULT: '#F2A93B', soft: '#FDF1DE' },
        coral: { DEFAULT: '#EF5B4C', soft: '#FDE8E5' },
        violet: { DEFAULT: '#5367FF', soft: '#E9ECFF' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,15,20,0.04), 0 4px 16px rgba(11,15,20,0.04)',
        lift: '0 8px 30px rgba(11,15,20,0.12)',
      },
      keyframes: {
        rise: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
        sheet: { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'none' } },
        fade: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        pop: { '0%': { opacity: 0, transform: 'translate(-50%, -8px) scale(.96)' }, '100%': { opacity: 1, transform: 'translate(-50%,0) scale(1)' } },
      },
      animation: {
        rise: 'rise .45s cubic-bezier(.2,.7,.2,1) both',
        sheet: 'sheet .35s cubic-bezier(.2,.8,.2,1) both',
        fade: 'fade .25s ease both',
        pop: 'pop .3s cubic-bezier(.2,.8,.2,1) both',
      },
    },
  },
  plugins: [],
}
