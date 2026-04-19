/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          base: 'var(--color-bg-base)',
          alt: 'var(--color-surface-alt)',
          DEFAULT: 'var(--color-bg-base)',
        },
        surface: {
          base: 'var(--color-surface-base)',
          alt: 'var(--color-surface-alt)',
          hover: 'var(--color-surface-hover)',
          DEFAULT: 'var(--color-surface-base)',
        },
        primary: {
          base: 'var(--color-primary-base)',
          hover: 'var(--color-primary-hover)',
          DEFAULT: 'var(--color-primary-base)',
        },
        secondary: {
          base: 'var(--color-secondary-base)',
          hover: 'var(--color-secondary-hover)',
          DEFAULT: 'var(--color-secondary-base)',
        },
        accent: {
          base: 'var(--color-accent-base)',
          hover: 'var(--color-accent-hover)',
          DEFAULT: 'var(--color-accent-base)',
        },
        danger: {
          base: 'var(--color-danger-base)',
          hover: 'var(--color-danger-hover)',
          DEFAULT: 'var(--color-danger-base)',
        },
        success: {
          base: 'var(--color-success-base)',
          DEFAULT: 'var(--color-success-base)',
        },
        warning: {
          base: 'var(--color-warning-base)',
          DEFAULT: 'var(--color-warning-base)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },
        border: {
          base: 'var(--color-border-base)',
          subtle: 'var(--color-border-subtle)',
          DEFAULT: 'var(--color-border-base)',
        },
      },
      boxShadow: {
        level1: 'var(--shadow-level-1)',
        level2: 'var(--shadow-level-2)',
        level3: 'var(--shadow-level-3)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
        body: ['Inter', 'sans-serif'],
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
      }
    },
  },
  plugins: [],
}
