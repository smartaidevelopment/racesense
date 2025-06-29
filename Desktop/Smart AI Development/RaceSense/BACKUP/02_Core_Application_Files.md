# Core Application Files Backup

## index.html

```html
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, viewport-fit=cover"
    />
    <title>RaceSense - Racing Telemetry & Performance</title>

    <!-- Cache busting meta tags -->
    <meta
      http-equiv="Cache-Control"
      content="no-cache, no-store, must-revalidate"
    />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />

    <!-- PWA Meta Tags -->
    <meta
      name="description"
      content="Professional racing telemetry and performance analysis. Track every moment, improve every lap, master every turn."
    />
    <meta
      name="keywords"
      content="racing, telemetry, performance, lap times, motorsport, drift, track, automotive"
    />
    <meta name="author" content="RaceSense" />

    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json" />

    <!-- PWA Theme -->
    <meta name="theme-color" content="#ef4444" />
    <meta name="background-color" content="#0a0a0a" />

    <!-- PWA Icons -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link
      rel="apple-touch-icon"
      href="https://cdn.builder.io/api/v1/image/assets%2F470759060b1c4b0b916b5f9ea82a1d3c%2Fcc591e09ecaf40208de8f7e8e6da8afd"
    />

    <!-- iOS PWA -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta
      name="apple-mobile-web-app-status-bar-style"
      content="black-translucent"
    />
    <meta name="apple-mobile-web-app-title" content="RaceSense" />

    <!-- Android PWA -->
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="application-name" content="RaceSense" />

    <!-- Microsoft -->
    <meta name="msapplication-TileColor" content="#ef4444" />
    <meta name="msapplication-tap-highlight" content="no" />

    <!-- Social Media / SEO -->
    <meta
      property="og:title"
      content="RaceSense - Racing Telemetry & Performance"
    />
    <meta
      property="og:description"
      content="Professional racing telemetry and performance analysis. Track every moment, improve every lap, master every turn."
    />
    <meta
      property="og:image"
      content="https://cdn.builder.io/api/v1/image/assets%2F470759060b1c4b0b916b5f9ea82a1d3c%2Fcc591e09ecaf40208de8f7e8e6da8afd"
    />
    <meta property="og:url" content="/" />
    <meta property="og:type" content="website" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta
      name="twitter:title"
      content="RaceSense - Racing Telemetry & Performance"
    />
    <meta
      name="twitter:description"
      content="Professional racing telemetry and performance analysis."
    />
    <meta
      name="twitter:image"
      content="https://cdn.builder.io/api/v1/image/assets%2F470759060b1c4b0b916b5f9ea82a1d3c%2Fcc591e09ecaf40208de8f7e8e6da8afd"
    />
  </head>

  <body>
    <div id="root"></div>

    <script type="module" src="/src/main.tsx?v=no-hooks-final-2024"></script>
  </body>
</html>
```

## src/main.tsx

```typescript
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

## src/App.tsx

```typescript
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SimpleThemeProvider } from "@/components/SimpleThemeProvider";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { RacingNotifications } from "@/components/RacingNotifications";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { errorTracker } from "@/utils/errorTracking";
import Home from "./pages/Home";
import ModeSelection from "./pages/ModeSelection";
import TelemetryDashboard from "./pages/TelemetryDashboard";
import RealRacingIntegration from "./pages/RealRacingIntegration";
import AdvancedRacingAnalysis from "./pages/AdvancedRacingAnalysis";
import VehicleSetup from "./pages/VehicleSetup";
import SessionAnalysis from "./pages/SessionAnalysis";
import DataManagement from "./pages/DataManagement";
import AdvancedVisualization from "./pages/AdvancedVisualization";
import HardwareConfiguration from "./pages/HardwareConfiguration";
import DriftFeedback from "./pages/DriftFeedback";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Enhanced Error Boundary Component with production-ready error tracking
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorId?: string; lastError?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      lastError: error,
      errorId: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track error with our enhanced error tracking system
    errorTracker.trackError(error, errorInfo, {
      errorBoundary: "App-ErrorBoundary",
      errorId: this.state.errorId,
      props: Object.keys(this.props),
      timestamp: Date.now(),
    });

    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      errorId: undefined,
      lastError: undefined,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReportBug = () => {
    const bugReport = {
      errorId: this.state.errorId,
      error: this.state.lastError?.message,
      stack: this.state.lastError?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // Copy error details to clipboard
    navigator.clipboard
      .writeText(JSON.stringify(bugReport, null, 2))
      .then(() => {
        alert(
          "Error details copied to clipboard. Please send this to support.",
        );
      });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-racing-dark text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto bg-racing-red/20 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-racing-red"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            {/* Error Message */}
            <div>
              <h1 className="text-2xl font-bold text-racing-red mb-2">
                Something went wrong
              </h1>
              <p className="text-muted-foreground mb-1">
                We've encountered an unexpected error in the application.
              </p>
              {this.state.errorId && (
                <p className="text-xs text-gray-500 font-mono">
                  Error ID: {this.state.errorId}
                </p>
              )}
            </div>

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === "development" && this.state.lastError && (
              <div className="text-left bg-gray-800 p-3 rounded text-xs overflow-auto max-h-32">
                <p className="text-racing-red font-medium mb-1">
                  Error Details:
                </p>
                <p className="text-gray-300">{this.state.lastError.message}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-racing-blue hover:bg-racing-blue/80 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Try Again
              </button>

              <div className="flex gap-2">
                <button
                  onClick={this.handleReload}
                  className="flex-1 bg-racing-red hover:bg-racing-red/80 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Reload Page
                </button>

                <button
                  onClick={this.handleReportBug}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Report Bug
                </button>
              </div>
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-500">
              If this problem persists, please contact support with the error ID
              above.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Create QueryClient outside component to avoid hook issues
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SimpleThemeProvider>
          {/* Racing notifications system - hook-free */}
          <RacingNotifications />
          <OfflineIndicator />
          <PWAInstallPrompt />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/mode-selection" element={<ModeSelection />} />
              <Route
                path="/telemetry-dashboard"
                element={<TelemetryDashboard />}
              />
              <Route path="/real-racing" element={<RealRacingIntegration />} />
              <Route
                path="/advanced-analysis"
                element={<AdvancedRacingAnalysis />}
              />
              <Route path="/vehicle-setup" element={<VehicleSetup />} />
              <Route path="/session-analysis" element={<SessionAnalysis />} />
              <Route path="/data-management" element={<DataManagement />} />
              <Route
                path="/advanced-visualization"
                element={<AdvancedVisualization />}
              />
              <Route
                path="/hardware-configuration"
                element={<HardwareConfiguration />}
              />
              <Route path="/drift-feedback" element={<DriftFeedback />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen bg-racing-dark text-white flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-racing-red mb-4">
                        404 - Page Not Found
                      </h1>
                      <p className="text-white/80 mb-8">
                        The page you're looking for doesn't exist.
                      </p>
                      <a
                        href="/"
                        className="bg-racing-red/20 hover:bg-racing-red/30 border border-racing-red/30 rounded-lg px-6 py-3 transition-colors text-racing-red font-semibold"
                      >
                        Back to Home
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>
          </BrowserRouter>
        </SimpleThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
```
