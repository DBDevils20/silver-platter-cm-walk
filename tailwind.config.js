/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: 'var(--bg-void)',
        deck: 'var(--bg-deck)',
        panel: 'var(--bg-panel)',
        'panel-2': 'var(--bg-panel-2)',
        'panel-3': 'var(--bg-panel-3)',
        line: 'rgba(201,169,97,0.16)',
        'line-strong': 'rgba(201,169,97,0.32)',
        'line-cold': 'rgba(140,160,200,0.10)',
        'ink-1': 'var(--ink-1)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        'ink-4': 'var(--ink-4)',
        brass: 'var(--brass)',
        'brass-bright': 'var(--brass-bright)',
        'brass-deep': 'var(--brass-deep)',
        ok: 'var(--ok)',
        warn: 'var(--warn)',
        alert: 'var(--alert)',
        info: 'var(--info)'
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        serif: ['"EB Garamond"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      },
      borderRadius: {
        s: '4px',
        DEFAULT: '8px',
        l: '14px'
      }
    }
  },
  plugins: []
};
