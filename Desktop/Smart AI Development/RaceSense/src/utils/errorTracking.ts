// Production-ready error tracking and performance monitoring
// Non-React utility - does not use React hooks

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: "navigation" | "resource" | "paint" | "interaction";
  metadata?: Record<string, any>;
}

class ErrorTracker {
  private sessionId: string;
  private errors: ErrorInfo[] = [];
  private metrics: PerformanceMetric[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupPerformanceMonitoring();
    this.setupUnhandledErrorTracking();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  trackError(
    error: Error,
    errorInfo: { componentStack: string },
    context?: Record<string, any>,
  ) {
    const errorData: ErrorInfo = {
      componentStack: errorInfo.componentStack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      ...context,
    };

    this.errors.push(errorData);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.group("🔴 Error Tracked");
      console.error("Error:", error);
      console.error("Component Stack:", errorInfo.componentStack);
      console.error("Context:", context);
      console.groupEnd();
    }

    // In production, send to error tracking service
    this.sendErrorToService(error, errorData);
  }

  trackPerformance(metric: Omit<PerformanceMetric, "timestamp">) {
    const performanceData: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    this.metrics.push(performanceData);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`⚡ Performance: ${metric.name} = ${metric.value}ms`);
    }
  }

  private setupPerformanceMonitoring() {
    // Monitor page load performance
    if (typeof window !== "undefined" && "performance" in window) {
      window.addEventListener("load", () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType(
            "navigation",
          )[0] as PerformanceNavigationTiming;

          if (navigation) {
            this.trackPerformance({
              name: "page-load",
              value: navigation.loadEventEnd - navigation.fetchStart,
              category: "navigation",
            });

            this.trackPerformance({
              name: "dom-content-loaded",
              value:
                navigation.domContentLoadedEventEnd - navigation.fetchStart,
              category: "navigation",
            });
          }

          // Monitor paint metrics
          const paintEntries = performance.getEntriesByType("paint");
          paintEntries.forEach((entry) => {
            this.trackPerformance({
              name: entry.name,
              value: entry.startTime,
              category: "paint",
            });
          });
        }, 100);
      });

      // Monitor resource loading
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === "resource") {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.trackPerformance({
              name: "resource-load",
              value: resourceEntry.responseEnd - resourceEntry.fetchStart,
              category: "resource",
              metadata: {
                name: resourceEntry.name,
                type: resourceEntry.initiatorType,
              },
            });
          }
        });
      });

      observer.observe({ entryTypes: ["resource"] });
    }
  }

  private setupUnhandledErrorTracking() {
    if (typeof window !== "undefined") {
      // Track unhandled JavaScript errors
      window.addEventListener("error", (event) => {
        this.trackError(
          new Error(event.message),
          {
            componentStack: `at ${event.filename}:${event.lineno}:${event.colno}`,
          },
          {
            type: "unhandled-error",
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        );
      });

      // Track unhandled promise rejections
      window.addEventListener("unhandledrejection", (event) => {
        this.trackError(
          new Error(event.reason),
          {
            componentStack: "Promise rejection",
          },
          {
            type: "unhandled-promise-rejection",
            reason: event.reason,
          },
        );
      });
    }
  }

  private async sendErrorToService(error: Error, errorData: ErrorInfo) {
    // In production, integrate with error tracking services like:
    // - Sentry
    // - LogRocket
    // - Bugsnag
    // - Custom analytics endpoint

    try {
      // Example implementation for custom endpoint
      if (
        process.env.NODE_ENV === "production" &&
        process.env.REACT_APP_ERROR_ENDPOINT
      ) {
        await fetch(process.env.REACT_APP_ERROR_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: error.message,
            stack: error.stack,
            ...errorData,
          }),
        });
      }
    } catch (sendError) {
      console.warn("Failed to send error to tracking service:", sendError);
    }
  }

  getSessionMetrics() {
    return {
      sessionId: this.sessionId,
      errors: this.errors,
      metrics: this.metrics,
      summary: {
        totalErrors: this.errors.length,
        averagePageLoad: this.calculateAverageMetric("page-load"),
        averageResourceLoad: this.calculateAverageMetric("resource-load"),
      },
    };
  }

  private calculateAverageMetric(name: string): number {
    const values = this.metrics
      .filter((m) => m.name === name)
      .map((m) => m.value);

    return values.length > 0
      ? values.reduce((sum, val) => sum + val, 0) / values.length
      : 0;
  }

  // Utility for measuring component render performance
  measureComponentRender<T>(componentName: string, renderFn: () => T): T {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();

    this.trackPerformance({
      name: "component-render",
      value: endTime - startTime,
      category: "interaction",
      metadata: { component: componentName },
    });

    return result;
  }
}

// Global instance
export const errorTracker = new ErrorTracker();

// React HOC for performance monitoring (requires React to be imported)
export function withPerformanceTracking<P extends object>(
  WrappedComponent: any,
  componentName: string,
) {
  return function PerformanceTrackedComponent(props: P) {
    return errorTracker.measureComponentRender(componentName, () => {
      const React = require("react");
      return React.createElement(WrappedComponent, props);
    });
  };
}

// Non-hook function for tracking user interactions
export function trackInteraction(name: string, metadata?: Record<string, any>) {
  errorTracker.trackPerformance({
    name: `interaction-${name}`,
    value: performance.now(),
    category: "interaction",
    metadata,
  });
}
