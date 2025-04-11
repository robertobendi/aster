/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ffffff",
        secondary: "#666666",
        accent: "#ffffff",
        background: "#000000",
        surface: "#111111",
        text: {
          primary: "#ffffff",
          secondary: "#999999",
          accent: "#cccccc"
        },
        border: {
          primary: "#222222",
          secondary: "#333333"
        },
        status: {
          success: "#40F99B",
          error: "#FF3333",
          warning: "#F5A623"
        },
        overlay: {
          modal: "rgba(0, 0, 0, 0.85)",
          dropdown: "rgba(0, 0, 0, 0.95)"
        }
      },
      fontFamily: {
        sans: [
          "'Inter'",
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif'
        ],
        mono: [
          "'SF Mono'",
          'Menlo',
          'monospace'
        ]
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem'
      },
      lineHeight: {
        'tight': '1.2',
        'normal': '1.5',
        'relaxed': '1.7'
      },
      letterSpacing: {
        'tight': '-0.02em',
        'normal': '0',
        'wide': '0.05em'
      },
      borderRadius: {
        'sm': '2px',
        'DEFAULT': '3px',
        'lg': '4px',
        'xl': '6px'
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.1)',
        'DEFAULT': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'lg': '0 4px 8px rgba(0, 0, 0, 0.1)'
      },
      transitionProperty: {
        'DEFAULT': 'all',
      },
      transitionDuration: {
        'DEFAULT': '200ms',
        'fast': '100ms',
        'slow': '300ms'
      },
      transitionTimingFunction: {
        'DEFAULT': 'ease',
      },
      maxWidth: {
        'container': '1440px',
      },
      padding: {
        'container-default': '1.5rem',
        'container-sm': '2rem',
        'container-lg': '3rem'
      },
      gap: {
        'grid': '1.5rem'
      },
      columnGap: {
        'grid': '2rem'
      },
      backdropBlur: {
        'DEFAULT': '8px',
        'strong': '16px'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle at 50% 50%, var(--tw-gradient-stops))',
      }
    }
  },
  plugins: [],
}