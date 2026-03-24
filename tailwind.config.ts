import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-jetbrains-mono)', 'monospace'],
        display: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        /* Design tokens */
        bg:             'var(--bg)',
        surface:        'var(--surface)',
        'surface-muted':'var(--surface-muted)',
        border:         'var(--border)',
        text:           'var(--text)',
        'text-muted':   'var(--text-muted)',
        accent:         'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-subtle':'var(--accent-subtle)',
        success:        'var(--success)',
        changed:        'var(--changed)',
        destructive:    'var(--destructive)',
        /* Shadcn compat */
        background:     'var(--bg)',
        foreground:     'var(--text)',
        card: {
          DEFAULT:      'var(--surface)',
          foreground:   'var(--text)',
        },
        popover: {
          DEFAULT:      'var(--surface)',
          foreground:   'var(--text)',
        },
        primary: {
          DEFAULT:      'var(--accent)',
          foreground:   '#ffffff',
        },
        secondary: {
          DEFAULT:      'var(--surface-muted)',
          foreground:   'var(--text)',
        },
        muted: {
          DEFAULT:      'var(--surface-muted)',
          foreground:   'var(--text-muted)',
        },
        input:          'var(--border)',
        ring:           'var(--accent)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
