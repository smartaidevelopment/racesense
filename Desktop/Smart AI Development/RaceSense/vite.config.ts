import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Production optimization
    target: "esnext",
    minify: "terser",
    sourcemap: mode === "production" ? false : true,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // Vendor libraries
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            ) {
              return "vendor-react";
            }
            if (id.includes("@radix-ui")) {
              return "vendor-ui";
            }
            if (id.includes("chart.js") || id.includes("recharts")) {
              return "vendor-charts";
            }
            if (id.includes("three") || id.includes("@react-three")) {
              return "vendor-3d";
            }
            if (
              id.includes("clsx") ||
              id.includes("tailwind-merge") ||
              id.includes("date-fns") ||
              id.includes("zod")
            ) {
              return "vendor-utils";
            }
            return "vendor";
          }

          // RaceSense modules
          if (
            id.includes("/services/") &&
            (id.includes("TelemetryService") ||
              id.includes("DataManagementService") ||
              id.includes("PerformanceAnalysisService"))
          ) {
            return "racesense-core";
          }

          if (
            id.includes("/services/") &&
            (id.includes("OBDIntegrationService") ||
              id.includes("GPSService") ||
              id.includes("EnhancedHardwareService"))
          ) {
            return "racesense-hardware";
          }

          if (
            id.includes("/services/") &&
            (id.includes("AdvancedAIService") ||
              id.includes("MobileRacingService") ||
              id.includes("CommercialRacingService"))
          ) {
            return "racesense-ai";
          }
        },
      },
    },
    // Performance budgets
    chunkSizeWarningLimit: 600,
    // Compression
    reportCompressedSize: true,
    // Asset inlining threshold
    assetsInlineLimit: 4096,
  },
  // Production environment variables
  define:
    mode === "production"
      ? {
          "process.env.NODE_ENV": '"production"',
          __DEV__: false,
        }
      : {},
  // Production optimizations
  ...(mode === "production" && {
    esbuild: {
      drop: ["console", "debugger"],
    },
  }),
}));
