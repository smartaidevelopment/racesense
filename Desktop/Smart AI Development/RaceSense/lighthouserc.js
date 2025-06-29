// Lighthouse CI Configuration for RaceSense
// Performance monitoring and optimization

module.exports = {
  ci: {
    collect: {
      url: [
        "https://racesense.netlify.app",
        "https://racesense.netlify.app/telemetry-dashboard",
        "https://racesense.netlify.app/mode-selection",
        "https://racesense.netlify.app/vehicle-setup",
      ],
      startServerCommand: "npm run preview",
      numberOfRuns: 3,
      settings: {
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
      },
    },
    assert: {
      assertions: {
        // Performance budgets
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.8 }],
        "categories:seo": ["warn", { minScore: 0.8 }],
        "categories:pwa": ["warn", { minScore: 0.8 }],

        // Core Web Vitals
        "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "first-meaningful-paint": ["warn", { maxNumericValue: 2000 }],
        "speed-index": ["warn", { maxNumericValue: 3000 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "max-potential-fid": ["warn", { maxNumericValue: 100 }],

        // Resource loading
        interactive: ["warn", { maxNumericValue: 3500 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],
        "unused-javascript": ["warn", { maxNumericValue: 200000 }],
        "unused-css-rules": ["warn", { maxNumericValue: 50000 }],

        // Bundle size
        "total-byte-weight": ["warn", { maxNumericValue: 2000000 }], // 2MB
        "dom-size": ["warn", { maxNumericValue: 800 }],

        // PWA requirements
        "service-worker": "error",
        "installable-manifest": "error",
        "splash-screen": "warn",
        "themed-omnibox": "warn",

        // Accessibility
        "color-contrast": "error",
        "image-alt": "error",
        label: "error",
        "valid-lang": "error",

        // Best practices
        "uses-https": "error",
        "no-vulnerable-libraries": "error",
        "csp-xss": "warn",

        // Racing-specific performance
        "render-blocking-resources": ["warn", { maxNumericValue: 500 }],
        "efficient-animated-content": "warn",
        "preload-lcp-image": "warn",
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: "sql",
        sqlDialect: "sqlite",
        sqlDatabasePath: "./lighthouse-ci.db",
      },
    },
  },
};
