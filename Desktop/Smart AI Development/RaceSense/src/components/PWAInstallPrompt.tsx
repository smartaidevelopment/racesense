import React from "react";
import { pwaManager } from "@/hooks/usePWA";
import { RacingButton } from "./RacingButton";
import { Card } from "./ui/card";
import { X, Download, Smartphone } from "lucide-react";

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  showInstallPrompt: boolean;
  deferredPrompt: any;
}

class PWAInstallPromptClass extends React.Component<{}, PWAState> {
  private unsubscribe: (() => void) | null = null;

  constructor(props: {}) {
    super(props);
    this.state = pwaManager.getState();
  }

  componentDidMount() {
    // Subscribe to PWA manager state changes
    this.unsubscribe = pwaManager.subscribe((newState) => {
      this.setState(newState);
    });
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  handleInstallApp = () => {
    pwaManager.installApp();
  };

  handleHidePrompt = () => {
    pwaManager.hideInstallPrompt();
  };

  render() {
    const { showInstallPrompt, isOffline } = this.state;

    if (!showInstallPrompt) return null;

    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
        <Card className="p-4 bg-racing-gradient border-racing-red/30 shadow-xl backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-racing-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-5 w-5 text-racing-red" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm mb-1">
                Install RaceSense
              </h3>
              <p className="text-xs text-white/70 mb-3">
                Install for faster access and offline telemetry data
              </p>

              <div className="flex gap-2">
                <RacingButton
                  size="sm"
                  variant="racing"
                  racing="red"
                  onClick={this.handleInstallApp}
                  icon={Download}
                  className="text-xs px-3 py-1.5"
                >
                  Install
                </RacingButton>
                <RacingButton
                  size="sm"
                  variant="outline"
                  onClick={this.handleHidePrompt}
                  className="text-xs px-3 py-1.5 border-white/30 text-white/70 hover:text-white"
                >
                  Later
                </RacingButton>
              </div>
            </div>

            <button
              onClick={this.handleHidePrompt}
              className="text-white/50 hover:text-white transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isOffline && (
            <div className="mt-3 p-2 bg-racing-yellow/20 rounded text-xs text-racing-yellow border border-racing-yellow/30">
              ⚡ Offline mode active - Install for better offline experience
            </div>
          )}
        </Card>
      </div>
    );
  }
}

export function PWAInstallPrompt() {
  return <PWAInstallPromptClass />;
}
