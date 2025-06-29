interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  showInstallPrompt: boolean;
  deferredPrompt: PWAInstallPrompt | null;
}

type PWAListener = (state: PWAState) => void;

class PWAManager {
  private state: PWAState = {
    isInstallable: false,
    isInstalled: false,
    isOffline: !navigator.onLine,
    showInstallPrompt: false,
    deferredPrompt: null,
  };

  private listeners: PWAListener[] = [];
  private initialized = false;
  private promptTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;

    // Check if app is already installed
    this.checkIfInstalled();

    // Listen for beforeinstallprompt event
    window.addEventListener(
      "beforeinstallprompt",
      this.handleBeforeInstallPrompt,
    );

    // Listen for app installed event
    window.addEventListener("appinstalled", this.handleAppInstalled);

    // Listen for online/offline events
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);

    // Register service worker
    this.registerServiceWorker();
  }

  private checkIfInstalled = () => {
    try {
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;
      const isNavigatorStandalone =
        (window.navigator as any)?.standalone === true;
      const newInstalled = isStandalone || isNavigatorStandalone;

      if (newInstalled !== this.state.isInstalled) {
        this.updateState({ isInstalled: newInstalled });
      }
    } catch (error) {
      console.warn("[PWA] Error checking install status:", error);
    }
  };

  private handleBeforeInstallPrompt = (e: Event) => {
    console.log("[PWA] beforeinstallprompt fired");
    e.preventDefault();

    this.updateState({
      deferredPrompt: e as PWAInstallPrompt,
      isInstallable: true,
    });

    // Show install prompt after 3 seconds if not installed
    if (this.promptTimeout) {
      clearTimeout(this.promptTimeout);
    }

    this.promptTimeout = setTimeout(() => {
      if (!this.state.isInstalled) {
        this.updateState({ showInstallPrompt: true });
      }
    }, 3000);
  };

  private handleAppInstalled = () => {
    console.log("[PWA] App was installed");
    this.updateState({
      isInstalled: true,
      isInstallable: false,
      showInstallPrompt: false,
      deferredPrompt: null,
    });
  };

  private handleOnline = () => {
    this.updateState({ isOffline: false });
  };

  private handleOffline = () => {
    this.updateState({ isOffline: true });
  };

  private registerServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("[PWA] Service Worker registered:", registration);

        // Check for updates
        registration.addEventListener("updatefound", () => {
          console.log("[PWA] Service Worker update found");
        });
      } catch (error) {
        console.error("[PWA] Service Worker registration failed:", error);
      }
    }
  };

  private updateState = (newState: Partial<PWAState>) => {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  };

  private notifyListeners = () => {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (error) {
        console.warn("[PWA] Listener error:", error);
      }
    });
  };

  public getState = (): PWAState => {
    return { ...this.state };
  };

  public subscribe = (listener: PWAListener): (() => void) => {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.state);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  };

  public installApp = async (): Promise<void> => {
    if (!this.state.deferredPrompt) {
      console.log("[PWA] No install prompt available");
      return;
    }

    try {
      await this.state.deferredPrompt.prompt();
      const choiceResult = await this.state.deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        console.log("[PWA] User accepted install prompt");
      } else {
        console.log("[PWA] User dismissed install prompt");
      }

      this.updateState({
        deferredPrompt: null,
        isInstallable: false,
        showInstallPrompt: false,
      });
    } catch (error) {
      console.error("[PWA] Install failed:", error);
    }
  };

  public hideInstallPrompt = () => {
    this.updateState({ showInstallPrompt: false });
  };

  public destroy = () => {
    if (typeof window === "undefined") return;

    window.removeEventListener(
      "beforeinstallprompt",
      this.handleBeforeInstallPrompt,
    );
    window.removeEventListener("appinstalled", this.handleAppInstalled);
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);

    if (this.promptTimeout) {
      clearTimeout(this.promptTimeout);
    }

    this.listeners = [];
    this.initialized = false;
  };
}

// Global PWA manager instance
export const pwaManager = new PWAManager();

// Hook-free PWA usage for class components
export function usePWAManager() {
  return {
    getState: pwaManager.getState,
    subscribe: pwaManager.subscribe,
    installApp: pwaManager.installApp,
    hideInstallPrompt: pwaManager.hideInstallPrompt,
  };
}

// Legacy hook for backward compatibility (but it will cause errors)
export function usePWA() {
  throw new Error("usePWA hook is disabled. Use PWA class components instead.");
}
