// Production Monitoring Service
// Handles error tracking, performance monitoring, and analytics

export interface PerformanceMetrics {
  pageLoadTime: number;
  renderTime: number;
  apiResponseTimes: Record<string, number>;
  memoryUsage: number;
  bundleSize: number;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  lineNumber?: number;
  columnNumber?: number;
  userAgent: string;
  timestamp: string;
  userId?: string;
  sessionId: string;
  context?: Record<string, any>;
}

export interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  customDimensions?: Record<string, string>;
  timestamp: string;
}

class ProductionMonitoringService {
  private isProduction: boolean;
  private sessionId: string;
  private userId?: string;
  private performanceObserver?: PerformanceObserver;
  private errorQueue: ErrorReport[] = [];
  private analyticsQueue: AnalyticsEvent[] = [];

  constructor() {
    this.isProduction = import.meta.env.VITE_APP_ENVIRONMENT === "production";
    this.sessionId = this.generateSessionId();

    if (this.isProduction) {
      this.initializeMonitoring();
    }
  }

  // Initialize production monitoring
  private initializeMonitoring(): void {
    this.setupErrorTracking();
    this.setupPerformanceMonitoring();
    this.setupAnalytics();
    this.setupUnloadHandler();
  }

  // Error Tracking
  private setupErrorTracking(): void {
    // Global error handler
    window.addEventListener("error", (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        userId: this.userId,
      });
    });

    // Unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        userId: this.userId,
        context: { type: "unhandledrejection" },
      });
    });
  }

  // Performance Monitoring
  private setupPerformanceMonitoring(): void {
    // Performance Observer for Core Web Vitals
    if ("PerformanceObserver" in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.reportPerformanceMetric(entry);
        }
      });

      // Observe various performance metrics
      try {
        this.performanceObserver.observe({
          entryTypes: [
            "navigation",
            "paint",
            "largest-contentful-paint",
            "first-input",
            "layout-shift",
          ],
        });
      } catch (e) {
        console.warn("Performance Observer not fully supported");
      }
    }

    // Memory usage monitoring
    this.monitorMemoryUsage();
  }

  // Analytics Setup
  private setupAnalytics(): void {
    // Google Analytics 4
    if (import.meta.env.VITE_ANALYTICS_ID) {
      this.loadGoogleAnalytics();
    }

    // Custom analytics events
    this.trackPageView();
  }

  // Report Error
  reportError(error: ErrorReport): void {
    if (!this.isProduction) return;

    this.errorQueue.push(error);

    // Send to Sentry if configured
    if (import.meta.env.VITE_SENTRY_DSN) {
      this.sendToSentry(error);
    }

    // Send to custom error tracking
    this.sendErrorBatch();
  }

  // Report Performance Metric
  private reportPerformanceMetric(entry: PerformanceEntry): void {
    const metric = {
      name: entry.name,
      value: entry.duration || (entry as any).value,
      type: entry.entryType,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };

    // Send Core Web Vitals to analytics
    if (
      [
        "largest-contentful-paint",
        "first-input-delay",
        "cumulative-layout-shift",
      ].includes(entry.entryType)
    ) {
      this.trackEvent({
        event: "core_web_vital",
        category: "performance",
        action: entry.entryType,
        value: Math.round(metric.value),
        timestamp: metric.timestamp,
      });
    }
  }

  // Track Analytics Event
  trackEvent(event: AnalyticsEvent): void {
    if (!this.isProduction) return;

    this.analyticsQueue.push(event);

    // Send to Google Analytics
    if (window.gtag) {
      window.gtag("event", event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        custom_map: event.customDimensions,
      });
    }

    // Batch send custom analytics
    this.sendAnalyticsBatch();
  }

  // Track Page View
  trackPageView(page?: string): void {
    const pageUrl = page || window.location.pathname;

    this.trackEvent({
      event: "page_view",
      category: "navigation",
      action: "page_view",
      label: pageUrl,
      timestamp: new Date().toISOString(),
    });
  }

  // Track Racing Session
  trackRacingSession(data: {
    sessionType: string;
    trackName: string;
    duration: number;
    lapCount: number;
  }): void {
    this.trackEvent({
      event: "racing_session",
      category: "racing",
      action: "session_complete",
      label: data.trackName,
      value: data.duration,
      customDimensions: {
        session_type: data.sessionType,
        lap_count: data.lapCount.toString(),
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Track Feature Usage
  trackFeatureUsage(feature: string, action: string, value?: number): void {
    this.trackEvent({
      event: "feature_usage",
      category: "features",
      action: action,
      label: feature,
      value: value,
      timestamp: new Date().toISOString(),
    });
  }

  // Monitor Memory Usage
  private monitorMemoryUsage(): void {
    if ("memory" in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const metrics: PerformanceMetrics = {
          pageLoadTime: performance.now(),
          renderTime: 0,
          apiResponseTimes: {},
          memoryUsage: memory.usedJSHeapSize / 1048576, // MB
          bundleSize: 0,
        };

        // Report if memory usage is high
        if (metrics.memoryUsage > 100) {
          // > 100MB
          this.trackEvent({
            event: "high_memory_usage",
            category: "performance",
            action: "memory_warning",
            value: Math.round(metrics.memoryUsage),
            timestamp: new Date().toISOString(),
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  // Send Error Batch
  private sendErrorBatch(): void {
    if (this.errorQueue.length === 0) return;

    // Debounce error sending
    setTimeout(() => {
      if (this.errorQueue.length > 0) {
        fetch("/api/errors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            errors: this.errorQueue.splice(0, 10), // Send max 10 at a time
            sessionId: this.sessionId,
          }),
        }).catch(() => {
          // Silent fail for error reporting
        });
      }
    }, 1000);
  }

  // Send Analytics Batch
  private sendAnalyticsBatch(): void {
    if (this.analyticsQueue.length === 0) return;

    // Debounce analytics sending
    setTimeout(() => {
      if (this.analyticsQueue.length > 0) {
        fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            events: this.analyticsQueue.splice(0, 20), // Send max 20 at a time
            sessionId: this.sessionId,
          }),
        }).catch(() => {
          // Silent fail for analytics
        });
      }
    }, 2000);
  }

  // Send to Sentry
  private sendToSentry(error: ErrorReport): void {
    // Basic Sentry implementation
    fetch(
      `https://sentry.io/api/0/projects/${import.meta.env.VITE_SENTRY_DSN}/store/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: error.message,
          level: "error",
          platform: "javascript",
          sdk: { name: "racesense", version: "1.2.0" },
          exception: {
            values: [
              {
                type: "Error",
                value: error.message,
                stacktrace: error.stack,
              },
            ],
          },
          user: { id: this.userId },
          tags: {
            session_id: this.sessionId,
            url: error.url,
          },
        }),
      },
    ).catch(() => {
      // Silent fail
    });
  }

  // Load Google Analytics
  private loadGoogleAnalytics(): void {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_ANALYTICS_ID}`;
    document.head.appendChild(script);

    script.onload = () => {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag("js", new Date());
      window.gtag("config", import.meta.env.VITE_ANALYTICS_ID, {
        page_title: "RaceSense",
        page_location: window.location.href,
        send_page_view: true,
      });
    };
  }

  // Setup Unload Handler
  private setupUnloadHandler(): void {
    window.addEventListener("beforeunload", () => {
      // Send any remaining data
      if (this.errorQueue.length > 0 || this.analyticsQueue.length > 0) {
        navigator.sendBeacon(
          "/api/final-batch",
          JSON.stringify({
            errors: this.errorQueue,
            analytics: this.analyticsQueue,
            sessionId: this.sessionId,
          }),
        );
      }
    });
  }

  // Generate Session ID
  private generateSessionId(): string {
    return `rs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set User ID
  setUserId(userId: string): void {
    this.userId = userId;
  }

  // Get Performance Report
  getPerformanceReport(): Promise<PerformanceMetrics> {
    return new Promise((resolve) => {
      const metrics: PerformanceMetrics = {
        pageLoadTime: performance.now(),
        renderTime: 0,
        apiResponseTimes: {},
        memoryUsage: 0,
        bundleSize: 0,
      };

      // Get navigation timing
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        metrics.pageLoadTime =
          navigation.loadEventEnd - navigation.navigationStart;
        metrics.renderTime =
          navigation.domContentLoadedEventEnd - navigation.navigationStart;
      }

      // Get memory usage
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        metrics.memoryUsage = memory.usedJSHeapSize / 1048576; // MB
      }

      resolve(metrics);
    });
  }
}

// Global monitoring instance
export const productionMonitoring = new ProductionMonitoringService();

// TypeScript global declarations
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export default ProductionMonitoringService;
