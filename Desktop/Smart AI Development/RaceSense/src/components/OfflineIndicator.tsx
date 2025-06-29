import React from "react";
import { pwaManager } from "@/hooks/usePWA";
import { Badge } from "./ui/badge";
import { WifiOff, Wifi } from "lucide-react";

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  showInstallPrompt: boolean;
  deferredPrompt: any;
}

class OfflineIndicatorClass extends React.Component<
  {},
  { isOffline: boolean }
> {
  private unsubscribe: (() => void) | null = null;

  constructor(props: {}) {
    super(props);
    this.state = {
      isOffline: pwaManager.getState().isOffline,
    };
  }

  componentDidMount() {
    // Subscribe to PWA manager state changes
    this.unsubscribe = pwaManager.subscribe((newState) => {
      this.setState({ isOffline: newState.isOffline });
    });
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  render() {
    const { isOffline } = this.state;

    return (
      <div className="fixed top-4 right-4 z-40">
        <Badge
          variant="secondary"
          className={`transition-all duration-300 ${
            isOffline
              ? "bg-racing-red/20 text-racing-red border-racing-red/30 animate-pulse"
              : "bg-racing-green/20 text-racing-green border-racing-green/30 opacity-0 pointer-events-none"
          }`}
        >
          {isOffline ? (
            <>
              <WifiOff className="h-3 w-3 mr-1" />
              Offline Mode
            </>
          ) : (
            <>
              <Wifi className="h-3 w-3 mr-1" />
              Online
            </>
          )}
        </Badge>
      </div>
    );
  }
}

export function OfflineIndicator() {
  return <OfflineIndicatorClass />;
}
