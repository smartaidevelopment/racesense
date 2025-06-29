import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Racing theme colors
        racing: {
          red: "hsl(var(--racing-red))",
          "red-foreground": "hsl(var(--racing-red-foreground))",
          orange: "hsl(var(--racing-orange))",
          "orange-foreground": "hsl(var(--racing-orange-foreground))",
          yellow: "hsl(var(--racing-yellow))",
          "yellow-foreground": "hsl(var(--racing-yellow-foreground))",
          green: "hsl(var(--racing-green))",
          "green-foreground": "hsl(var(--racing-green-foreground))",
          blue: "hsl(var(--racing-blue))",
          "blue-foreground": "hsl(var(--racing-blue-foreground))",
          purple: "hsl(var(--racing-purple))",
          "purple-foreground": "hsl(var(--racing-purple-foreground))",
          dark: "hsl(var(--racing-dark))",
          "dark-foreground": "hsl(var(--racing-dark-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 5px hsl(var(--racing-yellow))",
          },
          "50%": {
            boxShadow:
              "0 0 20px hsl(var(--racing-yellow)), 0 0 30px hsl(var(--racing-yellow))",
          },
        },
        "speed-lines": {
          "0%": {
            transform: "translateX(-100%)",
          },
          "100%": {
            transform: "translateX(100%)",
          },
        },
        fadeIn: {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "speed-lines": "speed-lines 1.5s ease-in-out infinite",
        fadeIn: "fadeIn 1s ease-in-out",
      },
      backgroundImage: {
        "racing-gradient":
          "linear-gradient(135deg, hsl(var(--racing-dark)) 0%, hsl(var(--racing-red)) 100%)",
        "carbon-fiber":
          "radial-gradient(circle at 25% 25%, #333 0%, #111 50%, #000 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
