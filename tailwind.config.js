/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Background hierarchy (dark-mode-first)
        background: {
          primary: '#0a0a0a',
          secondary: '#121212',
          tertiary: '#1a1a1a',
          elevated: '#242424',
        },
        // Text hierarchy
        foreground: {
          primary: '#f5f5f5',
          secondary: '#d4d4d4',
          tertiary: '#a3a3a3',
          inverse: '#0a0a0a',
        },
        // Semantic colors (calm, non-alarming)
        success: {
          DEFAULT: '#10b981',
          hover: '#059669',
        },
        info: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
        },
        warning: {
          DEFAULT: '#f59e0b',
          hover: '#d97706',
        },
        error: {
          DEFAULT: '#ef4444',
          hover: '#dc2626',
        },
        // Interactive states
        primary: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          active: '#1d4ed8',
        },
        secondary: {
          DEFAULT: '#4b5563',
          hover: '#6b7280',
          active: '#374151',
        },
        // Borders and dividers
        border: {
          DEFAULT: '#2a2a2a',
          hover: '#3a3a3a',
          focus: '#3b82f6',
          divider: '#1a1a1a',
        },
        // Card colors
        card: {
          DEFAULT: '#121212',
          foreground: '#f5f5f5',
        },
        // Input colors
        input: {
          DEFAULT: '#2a2a2a',
          hover: '#3a3a3a',
        },
        // Ring (focus rings)
        ring: {
          DEFAULT: '#3b82f6',
          error: '#ef4444',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.5' }],
        sm: ['0.875rem', { lineHeight: '1.5' }],
        base: ['1rem', { lineHeight: '1.5' }],
        lg: ['1.125rem', { lineHeight: '1.75' }],
        xl: ['1.25rem', { lineHeight: '1.5' }],
        '2xl': ['1.5rem', { lineHeight: '1.25' }],
        '3xl': ['1.875rem', { lineHeight: '1.25' }],
        '4xl': ['2.25rem', { lineHeight: '1.25' }],
      },
      spacing: {
        // 4px base unit system
        0: '0',
        1: '0.25rem',   // 4px
        2: '0.5rem',    // 8px
        3: '0.75rem',   // 12px
        4: '1rem',      // 16px
        5: '1.25rem',   // 20px
        6: '1.5rem',    // 24px
        8: '2rem',      // 32px
        10: '2.5rem',   // 40px
        12: '3rem',     // 48px
        16: '4rem',     // 64px
        20: '5rem',     // 80px
        24: '6rem',     // 96px
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        DEFAULT: '0 2px 4px 0 rgba(0, 0, 0, 0.4)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.6)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.7)',
        focus: '0 0 0 3px rgba(59, 130, 246, 0.5)',
        'focus-error': '0 0 0 3px rgba(239, 68, 68, 0.5)',
      },
      transitionDuration: {
        fast: '150ms',
        DEFAULT: '200ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

