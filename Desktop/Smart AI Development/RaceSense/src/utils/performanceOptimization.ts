// Performance optimization utilities for production deployment

import { errorTracker } from "./errorTracking";

// Code splitting utilities
export function loadChunkWithRetry(
  chunkLoader: () => Promise<any>,
  retries = 3,
): Promise<any> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const attemptLoad = async () => {
      try {
        const chunk = await chunkLoader();
        resolve(chunk);
      } catch (error) {
        attempts++;

        if (attempts >= retries) {
          errorTracker.trackError(
            error as Error,
            {
              componentStack: "ChunkLoader",
            },
            { attempts, retries },
          );
          reject(error);
        } else {
          // Exponential backoff
          setTimeout(attemptLoad, Math.pow(2, attempts) * 1000);
        }
      }
    };

    attemptLoad();
  });
}

// Memory management utilities
export class MemoryManager {
  private static observers: Map<string, IntersectionObserver> = new Map();
  private static timers: Map<string, NodeJS.Timeout> = new Map();

  // Clean up resources when components unmount
  static cleanup(componentId: string) {
    const observer = this.observers.get(componentId);
    if (observer) {
      observer.disconnect();
      this.observers.delete(componentId);
    }

    const timer = this.timers.get(componentId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(componentId);
    }
  }

  // Register cleanup for component
  static registerComponent(componentId: string, cleanupFn: () => void) {
    return () => {
      cleanupFn();
      this.cleanup(componentId);
    };
  }

  // Debounce expensive operations
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    componentId: string,
  ): T {
    return ((...args: Parameters<T>) => {
      const existingTimer = this.timers.get(componentId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        func(...args);
        this.timers.delete(componentId);
      }, delay);

      this.timers.set(componentId, timer);
    }) as T;
  }

  // Throttle high-frequency events
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number,
  ): T {
    let inThrottle: boolean;

    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    }) as T;
  }
}

// Virtual scrolling utilities
interface VirtualScrollOptions {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export class VirtualScrollManager {
  private scrollTop = 0;
  private options: VirtualScrollOptions;

  constructor(options: VirtualScrollOptions) {
    this.options = options;
  }

  updateScroll(scrollTop: number) {
    this.scrollTop = scrollTop;
  }

  getVisibleRange() {
    const { itemHeight, containerHeight, overscan = 5 } = this.options;

    const startIndex = Math.max(
      0,
      Math.floor(this.scrollTop / itemHeight) - overscan,
    );
    const endIndex = Math.min(
      this.options.items.length - 1,
      Math.ceil((this.scrollTop + containerHeight) / itemHeight) + overscan,
    );

    return { startIndex, endIndex };
  }

  getVisibleItems() {
    const { startIndex, endIndex } = this.getVisibleRange();
    return {
      items: this.options.items.slice(startIndex, endIndex + 1),
      startIndex,
      endIndex,
      totalHeight: this.options.items.length * this.options.itemHeight,
      offsetY: startIndex * this.options.itemHeight,
    };
  }
}

// Bundle size analysis utilities
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === "development") {
    // Track dynamic import performance
    const originalImport = (window as any).__webpack_require__;
    if (originalImport) {
      (window as any).__webpack_require__ = function (...args: any[]) {
        const startTime = performance.now();
        const result = originalImport.apply(this, args);
        const loadTime = performance.now() - startTime;

        errorTracker.trackPerformance({
          name: "chunk-load",
          value: loadTime,
          category: "resource",
          metadata: { args: args[0] },
        });

        return result;
      };
    }
  }
}

// Service Worker utilities for caching
export function registerServiceWorker(swUrl: string) {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register(swUrl);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New version available
                if (confirm("New version available! Reload to update?")) {
                  window.location.reload();
                }
              }
            });
          }
        });

        console.log("Service Worker registered successfully");
      } catch (error) {
        console.error("Service Worker registration failed:", error);
        errorTracker.trackError(error as Error, {
          componentStack: "ServiceWorker",
        });
      }
    });
  }
}

// Critical resource hints
export function addResourceHints(
  resources: Array<{
    url: string;
    type: "preload" | "prefetch" | "preconnect";
  }>,
) {
  resources.forEach(({ url, type }) => {
    const link = document.createElement("link");
    link.rel = type;
    link.href = url;

    if (type === "preload") {
      link.as = "script"; // or 'style', 'font', etc.
    }

    document.head.appendChild(link);
  });
}

// Image optimization utilities
export class ImageOptimizer {
  private static loadedImages = new Set<string>();
  private static observers = new Map<Element, IntersectionObserver>();

  static lazyLoad(img: HTMLImageElement, src: string) {
    if (this.loadedImages.has(src)) {
      img.src = src;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          img.src = src;
          this.loadedImages.add(src);
          observer.disconnect();
          this.observers.delete(img);
        }
      },
      { threshold: 0.1, rootMargin: "50px" },
    );

    observer.observe(img);
    this.observers.set(img, observer);
  }

  static cleanup(img: HTMLImageElement) {
    const observer = this.observers.get(img);
    if (observer) {
      observer.disconnect();
      this.observers.delete(img);
    }
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  static startTiming(label: string) {
    return {
      end: () => {
        const duration = performance.now();

        if (!this.metrics.has(label)) {
          this.metrics.set(label, []);
        }

        this.metrics.get(label)!.push(duration);

        errorTracker.trackPerformance({
          name: label,
          value: duration,
          category: "interaction",
        });

        return duration;
      },
    };
  }

  static getAverageTime(label: string): number {
    const times = this.metrics.get(label);
    if (!times || times.length === 0) return 0;

    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  static clearMetrics() {
    this.metrics.clear();
  }
}

// Export for global initialization
export function initializePerformanceOptimizations() {
  analyzeBundleSize();

  // Add critical resource hints
  addResourceHints([
    { url: "/api", type: "preconnect" },
    { url: "https://fonts.googleapis.com", type: "preconnect" },
  ]);

  // Register service worker in production
  if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
    registerServiceWorker("/sw.js");
  }

  // Monitor long tasks
  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            // Tasks longer than 50ms
            errorTracker.trackPerformance({
              name: "long-task",
              value: entry.duration,
              category: "interaction",
              metadata: {
                startTime: entry.startTime,
                name: entry.name,
              },
            });
          }
        });
      });

      observer.observe({ entryTypes: ["longtask"] });
    } catch (e) {
      // PerformanceObserver not supported
    }
  }
}

// Data management utilities
export class DataManager {
  private static cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();

  static set(key: string, data: any, ttl = 5 * 60 * 1000) {
    // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  static get(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  static clear() {
    this.cache.clear();
  }

  static size() {
    return this.cache.size;
  }
}
