import React from "react";

// Simple theme management without hooks
class ThemeManager {
  private theme: "dark" | "light" = "dark";
  private listeners: Array<(theme: "dark" | "light") => void> = [];

  constructor() {
    this.clearOldCache();
    this.initializeTheme();
  }

  private clearOldCache() {
    // Clear any old cached data that might be causing issues
    try {
      if (typeof window !== "undefined") {
        // Clear localStorage entries that might reference old modules
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.includes("vite") ||
              key.includes("radix") ||
              key.includes("tooltip"))
          ) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));

        // Force reload if browser is loading old cached modules
        if (window.performance && window.performance.navigation.type === 1) {
          console.log("[RaceSense] Cache cleared, hard refresh recommended");
        }
      }
    } catch (error) {
      console.warn("Cache clearing failed:", error);
    }
  }

  private initializeTheme() {
    // Apply default theme immediately
    this.applyTheme("dark");

    // Try to load saved theme asynchronously
    setTimeout(() => {
      try {
        if (typeof window !== "undefined") {
          const savedTheme = localStorage.getItem("racesense-theme") as
            | "dark"
            | "light";
          if (savedTheme && (savedTheme === "dark" || savedTheme === "light")) {
            this.setTheme(savedTheme);
          }
        }
      } catch (error) {
        console.warn("Failed to load theme from localStorage:", error);
      }
    }, 0);
  }

  private applyTheme(theme: "dark" | "light") {
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(theme);
    }
  }

  setTheme(theme: "dark" | "light") {
    this.theme = theme;
    this.applyTheme(theme);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("racesense-theme", theme);
      }
    } catch (error) {
      console.warn("Failed to save theme to localStorage:", error);
    }

    // Notify listeners
    this.listeners.forEach((listener) => {
      try {
        listener(theme);
      } catch (error) {
        console.warn("Theme listener error:", error);
      }
    });
  }

  getTheme(): "dark" | "light" {
    return this.theme;
  }

  toggleTheme() {
    const newTheme = this.theme === "dark" ? "light" : "dark";
    this.setTheme(newTheme);
  }

  subscribe(listener: (theme: "dark" | "light") => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

// Global theme manager instance
const themeManager = new ThemeManager();

// Export for use in components that need theme
export { themeManager };

// Simple provider that just renders children
export function SimpleThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

// Hook-free theme usage
export function useSimpleTheme() {
  return {
    theme: themeManager.getTheme(),
    setTheme: (theme: "dark" | "light") => themeManager.setTheme(theme),
    toggleTheme: () => themeManager.toggleTheme(),
  };
}
