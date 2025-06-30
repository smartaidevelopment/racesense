import React from "react";
import { DataCard } from "@/components/DataCard";
import { RacingButton } from "@/components/RacingButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { themeManager } from "@/components/SimpleThemeProvider";
import {
  RacingStatusIndicator,
  PerformanceMetric,
} from "@/components/LoadingStates";
import { notify } from "@/components/RacingNotifications";
import {
  lapTimingService,
  LiveSession,
  LapData,
  RacingTrack,
  GPSError,
  GPSPermissionStatus,
} from "@/services/LapTimingService";
import {
  obdIntegrationService,
  LiveOBDData,
  VehicleInfo,
  OBDParameter,
} from "@/services/OBDIntegrationService";
import {
  ArrowLeft,
  Activity,
  Gauge,
  Thermometer,
  Zap,
  Circle,
  Play,
  Square,
  Sun,
  Moon,
  AlertTriangle,
  Wifi,
  WifiOff,
  TrendingUp,
  MapPin,
  Timer,
  Trophy,
  Target,
  Bluetooth,
  Usb,
  Car,
  Settings,
  CheckCircle,
} from "lucide-react";

interface TelemetryData {
  speed: number;
  rpm: number;
  coolantTemp: number;
  oilTemp: number;
  throttle: number;
  tirePressureFL: number;
  tirePressureFR: number;
  tirePressureRL: number;
  tirePressureRR: number;
}

interface TelemetryState {
  isLive: boolean;
  showWarning: boolean;
  telemetryData: TelemetryData;
  theme: "dark" | "light";
  // Lap timing integration
  liveSession: LiveSession | null;
  isRecording: boolean;
  selectedTrack: string | null;
  availableTracks: RacingTrack[];
  currentLapTime: number;
  bestLapTime: number | null;
  lastLap: LapData | null;
  // GPS error handling
  gpsError: GPSError | null;
  gpsPermissionStatus: GPSPermissionStatus | null;
  showGPSErrorDialog: boolean;
  // OBD-II integration
  obdConnected: boolean;
  obdData: LiveOBDData | null;
  vehicleInfo: VehicleInfo | null;
  showOBDConnectionDialog: boolean;
  useRealTelemetry: boolean;
  obdError: string | null;
  isConnecting: boolean;
  connectError: string | null;
}

class TelemetryDashboardPage extends React.Component<{}, TelemetryState> {
  private telemetryInterval: NodeJS.Timeout | null = null;
  private themeUnsubscribe: (() => void) | null = null;
  private gpsErrorUnsubscribe: (() => void) | null = null;
  private obdDataUnsubscribe: (() => void) | null = null;
  private obdConnectionUnsubscribe: (() => void) | null = null;
  private obdErrorUnsubscribe: (() => void) | null = null;
  private bluetoothAbortController: AbortController | null = null;
  private serialAbortController: AbortController | null = null;
  private modalRef = React.createRef<HTMLDivElement>();
  private lastActiveElement: HTMLElement | null = null;
  private autoReopenTimeout: NodeJS.Timeout | null = null;

  constructor(props: {}) {
    super(props);
    this.state = {
      isLive: true,
      showWarning: false,
      theme: themeManager.getTheme(),
      telemetryData: {
        speed: 98,
        rpm: 5300,
        coolantTemp: 91,
        oilTemp: 104,
        throttle: 74,
        tirePressureFL: 1.9,
        tirePressureFR: 1.9,
        tirePressureRL: 2.0,
        tirePressureRR: 1.9,
      },
      // Lap timing state
      liveSession: null,
      isRecording: false,
      selectedTrack: null,
      availableTracks: lapTimingService.getKnownTracks(),
      currentLapTime: 0,
      bestLapTime: null,
      lastLap: null,
      // GPS error handling
      gpsError: null,
      gpsPermissionStatus: null,
      showGPSErrorDialog: false,
      // OBD-II integration
      obdConnected: false,
      obdData: null,
      vehicleInfo: null,
      showOBDConnectionDialog: false,
      useRealTelemetry: false,
      obdError: null,
      isConnecting: false,
      connectError: null,
    };
  }

  componentDidMount() {
    // Subscribe to theme changes
    this.themeUnsubscribe = themeManager.subscribe((theme) => {
      this.setState({ theme });
    });

    // Subscribe to GPS errors
    this.gpsErrorUnsubscribe = lapTimingService.onGPSError((error) => {
      this.setState({
        gpsError: error,
        showGPSErrorDialog: true,
      });

      notify.error("GPS Error", error.userMessage, { duration: 8000 });
    });

    // Subscribe to OBD data updates
    this.obdDataUnsubscribe = obdIntegrationService.onDataUpdate((obdData) => {
      this.setState({
        obdData,
        useRealTelemetry: true,
        telemetryData: {
          speed: obdData.speed,
          rpm: obdData.rpm,
          coolantTemp: obdData.coolantTemp,
          oilTemp: obdData.oilTemp || 90,
          throttle: obdData.throttlePosition,
          tirePressureFL: this.state.telemetryData.tirePressureFL, // Keep simulated tire pressure
          tirePressureFR: this.state.telemetryData.tirePressureFR,
          tirePressureRL: this.state.telemetryData.tirePressureRL,
          tirePressureRR: this.state.telemetryData.tirePressureRR,
        },
      });
    });

    // Subscribe to OBD connection status
    this.obdConnectionUnsubscribe = obdIntegrationService.onConnectionChange(
      (connected) => {
        this.handleOBDConnectionChange(connected);
      },
    );

    // Subscribe to OBD errors
    this.obdErrorUnsubscribe = obdIntegrationService.onError((error) => {
      this.setState({ obdError: error });
      notify.error("OBD Connection Error", error, { duration: 6000 });
    });

    // Focus trap for modal
    document.addEventListener("keydown", this.handleKeyDown);
  }

  componentWillUnmount() {
    if (this.themeUnsubscribe) {
      this.themeUnsubscribe();
    }
    if (this.gpsErrorUnsubscribe) {
      this.gpsErrorUnsubscribe();
    }
    if (this.obdDataUnsubscribe) {
      this.obdDataUnsubscribe();
    }
    if (this.obdConnectionUnsubscribe) {
      this.obdConnectionUnsubscribe();
    }
    if (this.obdErrorUnsubscribe) {
      this.obdErrorUnsubscribe();
    }
    this.stopTelemetryUpdates();
    document.removeEventListener("keydown", this.handleKeyDown);
    if (this.autoReopenTimeout) clearTimeout(this.autoReopenTimeout);
  }

  startTelemetryUpdates = () => {
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
    }

    if (!this.state.isLive) return;

    this.telemetryInterval = setInterval(() => {
      // Only update simulated data if not using real OBD telemetry
      if (!this.state.useRealTelemetry) {
        this.setState((prev) => ({
          telemetryData: {
            speed: Math.max(
              0,
              prev.telemetryData.speed + (Math.random() - 0.5) * 10,
            ),
            rpm: Math.max(
              800,
              Math.min(
                7000,
                prev.telemetryData.rpm + (Math.random() - 0.5) * 500,
              ),
            ),
            coolantTemp: Math.max(
              80,
              Math.min(
                110,
                prev.telemetryData.coolantTemp + (Math.random() - 0.5) * 2,
              ),
            ),
            oilTemp: Math.max(
              90,
              Math.min(
                130,
                prev.telemetryData.oilTemp + (Math.random() - 0.5) * 3,
              ),
            ),
            throttle: Math.max(
              0,
              Math.min(
                100,
                prev.telemetryData.throttle + (Math.random() - 0.5) * 20,
              ),
            ),
            tirePressureFL: Math.max(
              1.5,
              Math.min(
                2.5,
                prev.telemetryData.tirePressureFL + (Math.random() - 0.5) * 0.1,
              ),
            ),
            tirePressureFR: Math.max(
              1.5,
              Math.min(
                2.5,
                prev.telemetryData.tirePressureFR + (Math.random() - 0.5) * 0.1,
              ),
            ),
            tirePressureRL: Math.max(
              1.5,
              Math.min(
                2.5,
                prev.telemetryData.tirePressureRL + (Math.random() - 0.5) * 0.1,
              ),
            ),
            tirePressureRR: Math.max(
              1.5,
              Math.min(
                2.5,
                prev.telemetryData.tirePressureRR + (Math.random() - 0.5) * 0.1,
              ),
            ),
          },
        }));
      } else {
        // Just update tire pressures for real telemetry mode (OBD doesn't provide tire pressure)
        this.setState((prev) => ({
          telemetryData: {
            ...prev.telemetryData,
            tirePressureFL: Math.max(
              1.5,
              Math.min(
                2.5,
                prev.telemetryData.tirePressureFL + (Math.random() - 0.5) * 0.1,
              ),
            ),
            tirePressureFR: Math.max(
              1.5,
              Math.min(
                2.5,
                prev.telemetryData.tirePressureFR + (Math.random() - 0.5) * 0.1,
              ),
            ),
            tirePressureRL: Math.max(
              1.5,
              Math.min(
                2.5,
                prev.telemetryData.tirePressureRL + (Math.random() - 0.5) * 0.1,
              ),
            ),
            tirePressureRR: Math.max(
              1.5,
              Math.min(
                2.5,
                prev.telemetryData.tirePressureRR + (Math.random() - 0.5) * 0.1,
              ),
            ),
          },
        }));
      }
    }, 1000);
  };

  stopTelemetryUpdates = () => {
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
      this.telemetryInterval = null;
    }
  };

  toggleLiveMode = () => {
    this.setState(
      (prev) => ({ isLive: !prev.isLive }),
      () => {
        if (this.state.isLive) {
          this.startTelemetryUpdates();
          notify.success(
            "Live Telemetry Started",
            "Real-time data streaming active",
            { duration: 3000 },
          );
        } else {
          this.stopTelemetryUpdates();
          notify.info("Telemetry Paused", "Data recording has been stopped", {
            duration: 3000,
          });
        }
      },
    );
  };

  toggleTheme = () => {
    themeManager.toggleTheme();
  };

  handleNavigation = (path: string) => {
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  // Lap timing methods
  startRecording = async () => {
    try {
      // Check GPS permission first
      const permissionStatus = await lapTimingService.checkGPSPermission();
      this.setState({ gpsPermissionStatus: permissionStatus });

      if (permissionStatus.state === "denied") {
        this.setState({ showGPSErrorDialog: true });
        notify.error(
          "GPS Permission Required",
          "Please enable location permissions in your browser settings to use lap timing.",
          { duration: 10000 },
        );
        return;
      }

      if (
        permissionStatus.state === "prompt" ||
        permissionStatus.state === "unknown"
      ) {
        notify.info(
          "GPS Permission Request",
          "Please allow location access when prompted for lap timing to work.",
          { duration: 5000 },
        );

        const granted = await lapTimingService.requestGPSPermission();
        if (!granted) {
          return; // Error already handled by GPS error listener
        }
      }

      const sessionId = await lapTimingService.startSession(
        this.state.selectedTrack || undefined,
      );

      // Set up event listeners
      const sessionUnsubscribe = lapTimingService.onSessionUpdate((session) => {
        this.setState({
          liveSession: session,
          gpsPermissionStatus: session.gpsPermissionStatus || null,
          currentLapTime:
            session.currentGPSPoints.length > 0
              ? Date.now() - session.lastCrossedStartFinish
              : 0,
        });
      });

      const lapUnsubscribe = lapTimingService.onLapComplete((lap) => {
        this.setState((prev) => ({
          lastLap: lap,
          bestLapTime:
            !prev.bestLapTime || lap.lapTime < prev.bestLapTime
              ? lap.lapTime
              : prev.bestLapTime,
        }));

        notify.success(
          `Lap ${lap.lapNumber} Complete!`,
          `Time: ${(lap.lapTime / 1000).toFixed(3)}s`,
          { duration: 5000 },
        );
      });

      this.setState({
        isRecording: true,
        liveSession: lapTimingService.getCurrentSession(),
        gpsError: null,
        showGPSErrorDialog: false,
      });

      notify.success(
        "Recording Started",
        this.state.selectedTrack
          ? `Recording session at ${lapTimingService.getTrack(this.state.selectedTrack)?.name}`
          : "GPS lap timing active - track will be auto-detected",
        { duration: 4000 },
      );
    } catch (error) {
      notify.error(
        "Recording Failed",
        `Could not start GPS recording: ${error}`,
        { duration: 6000 },
      );
    }
  };

  stopRecording = () => {
    const session = lapTimingService.stopSession();

    this.setState({
      isRecording: false,
      liveSession: null,
      currentLapTime: 0,
    });

    if (session && session.laps.length > 0) {
      notify.success(
        "Session Complete",
        `Recorded ${session.laps.length} laps. Best: ${(session.bestLap?.lapTime || 0 / 1000).toFixed(3)}s`,
        { duration: 6000 },
      );
    } else {
      notify.info("Recording Stopped", "No laps were recorded", {
        duration: 3000,
      });
    }
  };

  selectTrack = (trackId: string) => {
    this.setState({ selectedTrack: trackId });

    const track = lapTimingService.getTrack(trackId);
    if (track) {
      notify.info(
        "Track Selected",
        `${track.name} - ${track.metadata.length}m`,
        { duration: 3000 },
      );
    }
  };

  formatLapTime = (milliseconds: number): string => {
    if (milliseconds === 0) return "--:--.---";

    const totalSeconds = milliseconds / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toFixed(3).padStart(6, "0")}`;
  };

  handleGPSPermissionRequest = async () => {
    try {
      // Show loading state
      notify.info(
        "Requesting GPS Permission",
        "Please allow location access when prompted...",
        { duration: 3000 },
      );

      const granted = await lapTimingService.requestGPSPermission();
      if (granted) {
        this.setState({ showGPSErrorDialog: false, gpsError: null });
        notify.success(
          "GPS Permission Granted",
          "You can now start recording lap times!",
          { duration: 4000 },
        );
      }
    } catch (error) {
      notify.error(
        "Permission Request Failed",
        "Please try enabling GPS manually in your browser settings.",
        { duration: 6000 },
      );
    }
  };

  retryGPSAccess = async () => {
    // Clear previous error state
    this.setState({ gpsError: null });

    // Check permission status again
    const permissionStatus = await lapTimingService.checkGPSPermission();
    this.setState({ gpsPermissionStatus: permissionStatus });

    if (permissionStatus.state === "granted") {
      this.setState({ showGPSErrorDialog: false });
      notify.success(
        "GPS Permission Enabled",
        "Location access is now working! You can start recording.",
        { duration: 4000 },
      );
    } else if (permissionStatus.state === "denied") {
      notify.warning(
        "GPS Still Denied",
        "Please enable location permissions in your browser settings and click 'Try Again'.",
        { duration: 6000 },
      );
    } else {
      // Try requesting permission again
      await this.handleGPSPermissionRequest();
    }
  };

  dismissGPSError = () => {
    this.setState({ showGPSErrorDialog: false });
  };

  openBrowserSettings = () => {
    const userAgent = navigator.userAgent;
    let browserInstructions =
      "Look for a location icon in your browser's address bar or check privacy settings.";

    if (userAgent.includes("Chrome")) {
      browserInstructions =
        "Click the location icon 🌍 in the address bar, or go to Chrome Settings → Privacy → Site Settings → Location.";
    } else if (userAgent.includes("Firefox")) {
      browserInstructions =
        "Click the shield icon in the address bar, or go to Firefox Settings → Privacy & Security → Permissions → Location.";
    } else if (userAgent.includes("Safari")) {
      browserInstructions =
        "Go to Safari → Preferences → Websites → Location, or check the address bar for a location prompt.";
    } else if (userAgent.includes("Edge")) {
      browserInstructions =
        "Click the location icon in the address bar, or go to Edge Settings → Cookies and site permissions → Location.";
    }

    notify.info("Enable GPS in Browser", browserInstructions, {
      duration: 10000,
    });
  };

  // Focus trap and Esc to close
  handleKeyDown = (e: KeyboardEvent) => {
    if (this.state.showOBDConnectionDialog) {
      if (e.key === "Escape") {
        this.dismissOBDDialog();
      } else if (e.key === "Tab" && this.modalRef.current) {
        const focusable = this.modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    }
  };

  // Browser capability check
  getBluetoothSupport() {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }
  getSerialSupport() {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  // Abort logic for OBD connection attempts
  connectOBDBluetooth = async () => {
    if (!this.getBluetoothSupport()) {
      this.setState({ connectError: "Web Bluetooth is not supported in this browser." });
      return;
    }
    this.setState({ isConnecting: true, connectError: null });
    this.bluetoothAbortController = new AbortController();
    try {
      const connected = await obdIntegrationService.connectBluetooth();
      if (connected) {
        this.setState({ isConnecting: false, connectError: null });
      } else {
        this.setState({ isConnecting: false, connectError: "Failed to connect to Bluetooth OBD adapter." });
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        this.setState({ isConnecting: false, connectError: "Bluetooth connection was cancelled." });
      } else {
        this.setState({ isConnecting: false, connectError: String(error) });
      }
    }
  };

  connectOBDSerial = async () => {
    if (!this.getSerialSupport()) {
      this.setState({ connectError: "Web Serial is not supported in this browser." });
      return;
    }
    this.setState({ isConnecting: true, connectError: null });
    this.serialAbortController = new AbortController();
    try {
      const connected = await obdIntegrationService.connectSerial();
      if (connected) {
        this.setState({ isConnecting: false, connectError: null });
      } else {
        this.setState({ isConnecting: false, connectError: "Failed to connect to USB/Serial OBD adapter." });
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        this.setState({ isConnecting: false, connectError: "Serial connection was cancelled." });
      } else {
        this.setState({ isConnecting: false, connectError: String(error) });
      }
    }
  };

  disconnectOBD = async () => {
    await obdIntegrationService.disconnect();
    this.setState({
      obdConnected: false,
      useRealTelemetry: false,
      obdData: null,
      vehicleInfo: null,
    });
    if (this.autoReopenTimeout) clearTimeout(this.autoReopenTimeout);
  };

  showOBDConnectionDialog = () => {
    this.lastActiveElement = document.activeElement as HTMLElement;
    this.setState({ showOBDConnectionDialog: true }, () => {
      setTimeout(() => {
        if (this.modalRef.current) {
          const focusable = this.modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length) focusable[0].focus();
        }
      }, 0);
    });
  };

  dismissOBDDialog = () => {
    if (this.bluetoothAbortController) this.bluetoothAbortController.abort();
    if (this.serialAbortController) this.serialAbortController.abort();
    this.setState({ showOBDConnectionDialog: false, isConnecting: false });
    if (this.lastActiveElement) this.lastActiveElement.focus();
  };

  // Auto-reopen dialog on disconnect
  handleOBDConnectionChange = (connected: boolean) => {
    this.setState({ obdConnected: connected, isConnecting: false });
    if (connected && this.state.showOBDConnectionDialog) {
      setTimeout(() => this.setState({ showOBDConnectionDialog: false }), 1200);
    }
    if (connected) {
      notify.success(
        "OBD-II Connected",
        "Real vehicle telemetry is now active!",
        { duration: 4000 },
      );
    } else {
      notify.info(
        "OBD-II Disconnected",
        "Switched back to simulated telemetry data",
        { duration: 3000 },
      );
      this.setState({ useRealTelemetry: false });
      // Auto-reopen dialog after disconnect
      if (!this.state.showOBDConnectionDialog) {
        this.autoReopenTimeout = setTimeout(() => {
          this.showOBDConnectionDialog();
        }, 1000);
      }
    }
  };

  render() {
    const {
      isLive,
      telemetryData,
      theme,
      liveSession,
      isRecording,
      selectedTrack,
      availableTracks,
      currentLapTime,
      bestLapTime,
      lastLap,
      gpsError,
      gpsPermissionStatus,
      showGPSErrorDialog,
      obdConnected,
      obdData,
      vehicleInfo,
      showOBDConnectionDialog,
      useRealTelemetry,
      obdError,
      isConnecting,
      connectError,
    } = this.state;

    // Browser support warnings
    const bluetoothSupported = this.getBluetoothSupport();
    const serialSupported = this.getSerialSupport();

    // If not connected, show a message and disable telemetry
    if (!obdConnected) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-2xl font-bold mb-4">No Vehicle Connected</div>
          <div className="text-muted-foreground mb-6">Connect an OBD-II device to view telemetry.</div>
          <div className="flex gap-4">
            <RacingButton
              variant="racing"
              racing="blue"
              onClick={this.showOBDConnectionDialog}
            >
              Connect Vehicle
            </RacingButton>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <RacingButton
              variant="outline"
              size="icon"
              onClick={() => this.handleNavigation("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </RacingButton>
            <div>
              <h1 className="text-2xl font-bold mb-2">Live Telemetry</h1>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`${
                    isLive
                      ? "bg-racing-green/20 text-racing-green border-racing-green/30"
                      : "bg-muted/20 text-muted-foreground border-border/30"
                  }`}
                >
                  <Circle
                    className={`h-2 w-2 mr-1 ${
                      isLive
                        ? "fill-racing-green animate-pulse"
                        : "fill-muted-foreground"
                    }`}
                  />
                  {isLive ? "LIVE" : "PAUSED"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Session: Silverstone GP
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <RacingButton
              variant="outline"
              icon={theme === "dark" ? Sun : Moon}
              onClick={this.toggleTheme}
              className="border-racing-purple/30 text-racing-purple hover:bg-racing-purple/10"
            >
              Switch to {theme === "dark" ? "Light" : "Dark"} Mode
            </RacingButton>
            <RacingButton
              variant={this.state.obdConnected ? "racing" : "outline"}
              racing={this.state.obdConnected ? "blue" : undefined}
              icon={this.state.obdConnected ? Car : Bluetooth}
              onClick={
                this.state.obdConnected
                  ? this.disconnectOBD
                  : this.showOBDConnectionDialog
              }
              className={
                this.state.obdConnected
                  ? ""
                  : "border-racing-blue/30 text-racing-blue hover:bg-racing-blue/10"
              }
            >
              {this.state.obdConnected ? "OBD Connected" : "Connect Vehicle"}
            </RacingButton>
            <RacingButton
              variant="racing"
              racing={isLive ? "red" : "green"}
              icon={isLive ? Square : Play}
              onClick={this.toggleLiveMode}
            >
              {isLive ? "Stop" : "Start"} Session
            </RacingButton>
          </div>
        </div>

        {/* Professional Racing Dashboard */}
        <Card className="p-8 modern-panel rounded-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-racing-red/5 via-transparent to-racing-blue/5" />
          <div className="space-y-8">
            {/* Status LED Bar */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((led) => {
                  const colors = [
                    "#22c55e",
                    "#22c55e",
                    "#3b82f6",
                    "#3b82f6",
                    "#ef4444",
                    "#ef4444",
                    "#ef4444",
                  ];
                  return (
                    <div
                      key={led}
                      className="w-3 h-3 rounded-full animate-pulse"
                      style={{ backgroundColor: colors[led - 1] }}
                    />
                  );
                })}
              </div>
              <div className="flex items-center">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F470759060b1c4b0b916b5f9ea82a1d3c%2Fcc591e09ecaf40208de8f7e8e6da8afd"
                  alt="RaceSense Logo"
                  className="h-16 object-contain"
                />
              </div>
            </div>

            {/* Main Dashboard Layout */}
            <div className="grid grid-cols-3 gap-8 items-center">
              {/* Left Column - Temperature Data */}
              <div className="space-y-6">
                {/* Coolant Temperature */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-racing-orange" />
                    <span className="text-sm font-medium text-white/70 uppercase tracking-wide">
                      COOLANT
                    </span>
                  </div>
                  <div className="text-4xl font-bold text-white">
                    {Math.round(telemetryData.coolantTemp)}°C
                  </div>
                </div>

                {/* Oil Temperature */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-racing-orange"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    <span className="text-sm font-medium text-white/70 uppercase tracking-wide">
                      OIL TEMP
                    </span>
                  </div>
                  <div className="text-4xl font-bold text-white">
                    {Math.round(telemetryData.oilTemp)}°C
                  </div>
                </div>
              </div>

              {/* Center Column - Speed Display */}
              <div className="text-center">
                <div className="space-y-2">
                  <div className="text-8xl font-bold text-white leading-none">
                    {Math.round(telemetryData.speed)}
                  </div>
                  <div className="text-2xl font-medium text-white/70 tracking-widest">
                    KM/H
                  </div>
                </div>
              </div>

              {/* Right Column - RPM and Gear */}
              <div className="space-y-6 text-right">
                {/* RPM */}
                <div className="space-y-1">
                  <div className="text-xl font-medium text-white/70 uppercase tracking-wide">
                    RPM
                  </div>
                  <div className="text-5xl font-bold text-white">
                    {Math.round(telemetryData.rpm)}
                  </div>
                </div>

                {/* Gear */}
                <div className="space-y-1">
                  <div className="text-xl font-medium text-white/70 uppercase tracking-wide">
                    GEAR
                  </div>
                  <div className="text-6xl font-bold text-white">3</div>
                </div>
              </div>
            </div>

            {/* Bottom Row - Tire Pressure */}
            <div className="pt-4 border-t border-white/10">
              <div className="text-center mb-6">
                <div className="text-sm font-medium text-white/70 uppercase tracking-wide">
                  TIRE PRESSURE
                </div>
              </div>

              {/* Car Tire Pressure Diagram */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {/* Car Body SVG */}
                  <svg
                    width="200"
                    height="120"
                    viewBox="0 0 200 120"
                    className="drop-shadow-lg"
                  >
                    {/* Car body outline */}
                    <rect
                      x="40"
                      y="30"
                      width="120"
                      height="60"
                      rx="8"
                      fill="#1a1a1a"
                      stroke="#333"
                      strokeWidth="2"
                    />

                    {/* Car windows */}
                    <rect
                      x="50"
                      y="40"
                      width="100"
                      height="40"
                      rx="4"
                      fill="#0a0a0a"
                      stroke="#444"
                      strokeWidth="1"
                    />

                    {/* Front grille */}
                    <rect
                      x="160"
                      y="50"
                      width="10"
                      height="20"
                      rx="2"
                      fill="#333"
                    />
                  </svg>

                  {/* Tire Pressure Labels */}
                  <div className="absolute -top-6 left-8 text-sm font-bold text-racing-blue">
                    FL: {telemetryData.tirePressureFL.toFixed(1)}
                  </div>
                  <div className="absolute -top-6 right-8 text-sm font-bold text-racing-red">
                    FR: {telemetryData.tirePressureFR.toFixed(1)}
                  </div>
                  <div className="absolute -bottom-6 left-8 text-sm font-bold text-racing-green">
                    RL: {telemetryData.tirePressureRL.toFixed(1)}
                  </div>
                  <div className="absolute -bottom-6 right-8 text-sm font-bold text-racing-yellow">
                    RR: {telemetryData.tirePressureRR.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Throttle and Performance Bar */}
              <div className="flex justify-center">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-white/70 uppercase tracking-wide">
                    THROTTLE
                  </span>
                  <div className="w-40 h-4 bg-black/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-racing-green via-racing-yellow to-racing-red transition-all duration-300"
                      style={{ width: `${telemetryData.throttle}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white">
                    {Math.round(telemetryData.throttle)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Data Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataCard
            label="Speed"
            value={Math.round(telemetryData.speed)}
            unit="km/h"
            icon={Gauge}
            color="blue"
            trend="up"
          />
          <DataCard
            label="RPM"
            value={Math.round(telemetryData.rpm)}
            icon={Activity}
            color="red"
            trend="neutral"
          />
          <DataCard
            label="Coolant Temp"
            value={Math.round(telemetryData.coolantTemp)}
            unit="°C"
            icon={Thermometer}
            color="orange"
            trend="up"
          />
          <DataCard
            label="Throttle"
            value={Math.round(telemetryData.throttle)}
            unit="%"
            icon={Zap}
            color="green"
            trend="neutral"
          />
        </div>

        {/* System Status */}
        <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-racing-blue" />
            System Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-3">
              <RacingStatusIndicator
                status={isLive ? "online" : "offline"}
                text={isLive ? "Live Data" : "Paused"}
                size="md"
              />
            </div>
            <div className="flex items-center gap-3">
              <RacingStatusIndicator
                status={
                  gpsPermissionStatus?.state === "granted"
                    ? "online"
                    : gpsPermissionStatus?.state === "denied"
                      ? "offline"
                      : "warning"
                }
                text={
                  gpsPermissionStatus?.state === "granted"
                    ? "GPS Ready"
                    : gpsPermissionStatus?.state === "denied"
                      ? "GPS Denied"
                      : "GPS Pending"
                }
                size="md"
              />
              {gpsPermissionStatus?.state === "denied" && (
                <RacingButton
                  variant="outline"
                  size="sm"
                  onClick={this.retryGPSAccess}
                  className="text-xs py-1 px-2 h-6"
                >
                  Retry
                </RacingButton>
              )}
            </div>
            <div className="flex items-center gap-3">
              <RacingStatusIndicator
                status={this.state.obdConnected ? "online" : "offline"}
                text={
                  this.state.obdConnected
                    ? "OBD Connected"
                    : "OBD Disconnected"
                }
                size="md"
              />
              {!this.state.obdConnected && (
                <RacingButton
                  variant="outline"
                  size="sm"
                  onClick={this.showOBDConnectionDialog}
                  className="text-xs py-1 px-2 h-6"
                >
                  Connect
                </RacingButton>
              )}
            </div>
            <div className="flex items-center gap-3">
              <RacingStatusIndicator
                status="online"
                text="Sensors"
                size="md"
              />
            </div>
            <div className="flex items-center gap-3">
              <RacingStatusIndicator
                status={
                  telemetryData.coolantTemp > 100 ? "warning" : "online"
                }
                text="Engine"
                size="md"
              />
            </div>
          </div>
        </Card>

        {/* Performance Metrics */}
        <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-racing-green" />
            Performance Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <PerformanceMetric
              label="Lap Time"
              value={83.456}
              target={82.0}
              format="time"
              color="red"
            />
            <PerformanceMetric
              label="Efficiency"
              value={94.2}
              target={95.0}
              format="percentage"
              color="green"
            />
            <PerformanceMetric
              label="Consistency"
              value={97.8}
              target={95.0}
              format="percentage"
              color="blue"
            />
            <PerformanceMetric
              label="Top Speed"
              value={312}
              unit="km/h"
              target={315}
              color="purple"
            />
          </div>
        </Card>

        {/* Live Lap Timing Dashboard */}
        <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold flex items-center gap-2">
              <Timer className="h-5 w-5 text-racing-blue" />
              Live Lap Timing
            </h3>
            <div className="flex items-center gap-3">
              {this.state.isRecording ? (
                <RacingButton
                  variant="racing"
                  racing="red"
                  size="sm"
                  onClick={this.stopRecording}
                  icon={Square}
                >
                  Stop Recording
                </RacingButton>
              ) : (
                <RacingButton
                  variant="racing"
                  racing="green"
                  size="sm"
                  onClick={this.startRecording}
                  icon={Play}
                >
                  Start Recording
                </RacingButton>
              )}
            </div>
          </div>

          {/* Track Selection */}
          {!this.state.isRecording && (
            <div className="mb-6 p-4 bg-muted/20 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-racing-yellow" />
                Select Track (Optional)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  onClick={() => this.selectTrack("")}
                  className={`p-3 rounded-lg border transition-colors text-left ${
                    !this.state.selectedTrack
                      ? "border-racing-blue bg-racing-blue/20 text-racing-blue"
                      : "border-border hover:border-racing-blue/50"
                  }`}
                >
                  <div className="font-medium">Auto-Detect</div>
                  <div className="text-xs text-muted-foreground">
                    Let GPS detect the track
                  </div>
                </button>
                {this.state.availableTracks.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => this.selectTrack(track.id)}
                    className={`p-3 rounded-lg border transition-colors text-left ${
                      this.state.selectedTrack === track.id
                        ? "border-racing-blue bg-racing-blue/20 text-racing-blue"
                        : "border-border hover:border-racing-blue/50"
                    }`}
                  >
                    <div className="font-medium">{track.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {track.country} •{" "}
                      {(track.metadata.length / 1000).toFixed(1)}km
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Timing Display */}
          {this.state.isRecording ? (
            <div className="space-y-6">
              {/* Current Lap Information */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Current Lap
                  </div>
                  <div className="text-2xl font-bold text-racing-blue">
                    {this.state.liveSession?.currentLap || 0}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Lap Time
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">
                    {this.formatLapTime(this.state.currentLapTime)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Best Lap
                  </div>
                  <div className="text-2xl font-bold text-racing-green font-mono">
                    {this.formatLapTime(this.state.bestLapTime || 0)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Track
                  </div>
                  <div className="text-sm font-medium text-white">
                    {this.state.liveSession?.trackId
                      ? lapTimingService.getTrack(
                          this.state.liveSession.trackId,
                        )?.name || "Unknown"
                      : "Detecting..."}
                  </div>
                </div>
              </div>

              {/* Last Lap Performance */}
              {this.state.lastLap && (
                <div className="p-4 bg-racing-green/10 border border-racing-green/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-4 w-4 text-racing-green" />
                    <span className="font-medium text-racing-green">
                      Last Lap Complete
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Lap {this.state.lastLap.lapNumber}:{" "}
                      </span>
                      <span className="font-mono font-bold text-racing-green">
                        {this.formatLapTime(this.state.lastLap.lapTime)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Max Speed:{" "}
                      </span>
                      <span className="font-bold text-white">
                        {this.state.lastLap.maxSpeed.toFixed(1)} km/h
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Avg Speed:{" "}
                      </span>
                      <span className="font-bold text-white">
                        {this.state.lastLap.averageSpeed.toFixed(1)} km/h
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sectors: </span>
                      <span className="font-mono text-xs text-white">
                        {this.state.lastLap.sectors
                          .map((s) => (s.time / 1000).toFixed(1))
                          .join(" / ")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Session Summary */}
              {this.state.liveSession && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <div className="text-muted-foreground mb-1">
                      Total Laps
                    </div>
                    <div className="text-xl font-bold text-white">
                      {this.state.liveSession.laps.length}
                    </div>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <div className="text-muted-foreground mb-1">
                      Session Time
                    </div>
                    <div className="text-xl font-bold text-white">
                      {Math.floor(
                        (Date.now() - this.state.liveSession.startTime) /
                          60000,
                      )}
                      m
                    </div>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <div className="text-muted-foreground mb-1">
                      GPS Points
                    </div>
                    <div className="text-xl font-bold text-white">
                      {this.state.liveSession.currentGPSPoints.length}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Start GPS recording to begin lap timing</p>
                <p className="text-xs mt-1">
                  High-accuracy GPS required for best results
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Session Info */}
        <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Current Session</h3>
              <p className="text-sm text-muted-foreground">
                Track:{" "}
                {this.state.liveSession?.trackId
                  ? lapTimingService.getTrack(this.state.liveSession.trackId)
                      ?.name || "Unknown Track"
                  : "No track selected"}
              </p>
              <p className="text-sm text-muted-foreground">
                Status: {this.state.isRecording ? "Recording" : "Standby"}
              </p>
              <p className="text-sm text-muted-foreground">
                GPS:{" "}
                {!navigator.geolocation
                  ? "Not Available"
                  : gpsPermissionStatus?.state === "granted"
                    ? "Enabled"
                    : gpsPermissionStatus?.state === "denied"
                      ? "Permission Denied"
                      : "Permission Required"}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Vehicle Telemetry</h3>
              <p className="text-sm text-muted-foreground">
                Data Source: {useRealTelemetry ? "Real OBD-II" : "Simulated"}
              </p>
              <p className="text-sm text-muted-foreground">
                Speed: {Math.round(telemetryData.speed)} km/h
              </p>
              <p className="text-sm text-muted-foreground">
                RPM: {Math.round(telemetryData.rpm)}
              </p>
              <p className="text-sm text-muted-foreground">
                Throttle: {Math.round(telemetryData.throttle)}%
              </p>
              {obdData && (
                <p className="text-sm text-muted-foreground">
                  Engine Load: {Math.round(obdData.engineLoad)}%
                </p>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Performance</h3>
              <p className="text-sm text-muted-foreground">
                Best Lap: {this.formatLapTime(this.state.bestLapTime || 0)}
              </p>
              <p className="text-sm text-muted-foreground">
                Total Laps: {this.state.liveSession?.laps.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Current: Lap {this.state.liveSession?.currentLap || 0}
              </p>
            </div>
          </div>
        </Card>

        {/* GPS Permission/Error Dialog */}
        {showGPSErrorDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-lg w-full p-6 border-racing-red/30">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <AlertTriangle className="h-12 w-12 text-racing-red" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-racing-red rounded-full animate-ping" />
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2">
                    GPS Access Required
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {gpsError
                      ? gpsError.userMessage
                      : "Location access is needed for automatic lap timing and track detection."}
                  </p>
                </div>

                {gpsPermissionStatus?.state === "denied" ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-racing-yellow/10 border border-racing-yellow/30 rounded-lg">
                      <p className="text-xs text-racing-yellow font-medium mb-2">
                        🔒 GPS Access Blocked
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Location permission was denied. Please enable it in
                        your browser settings, then click "Try Again".
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <RacingButton
                        variant="racing"
                        racing="green"
                        size="sm"
                        onClick={this.retryGPSAccess}
                        icon={Play}
                        className="w-full"
                      >
                        Try Again
                      </RacingButton>

                      <div className="grid grid-cols-2 gap-2">
                        <RacingButton
                          variant="outline"
                          size="sm"
                          onClick={this.openBrowserSettings}
                          icon={MapPin}
                        >
                          Settings Help
                        </RacingButton>
                        <RacingButton
                          variant="racing"
                          racing="blue"
                          size="sm"
                          onClick={this.dismissGPSError}
                        >
                          Continue Without
                        </RacingButton>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-racing-blue/10 border border-racing-blue/30 rounded-lg">
                      <p className="text-xs text-racing-blue font-medium mb-1">
                        📍 Permission Request
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click "Allow" when your browser asks for location
                        access.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <RacingButton
                        variant="outline"
                        size="sm"
                        onClick={this.dismissGPSError}
                        className="flex-1"
                      >
                        Cancel
                      </RacingButton>
                      <RacingButton
                        variant="racing"
                        racing="green"
                        size="sm"
                        onClick={this.handleGPSPermissionRequest}
                        className="flex-1"
                        icon={Play}
                      >
                        Request Permission
                      </RacingButton>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border/30">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>
                      Location data is processed locally and used only for lap
                      timing
                    </span>
                  </div>
                </div>

                {/* What works without GPS */}
                <details className="text-left">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    What works without GPS? ▼
                  </summary>
                  <div className="mt-2 p-3 bg-muted/20 rounded-lg text-xs text-muted-foreground">
                    <div className="grid grid-cols-2 gap-2">
                      <div>✅ Speed monitoring</div>
                      <div>✅ RPM tracking</div>
                      <div>✅ Temperature sensors</div>
                      <div>✅ Performance metrics</div>
                      <div>❌ Automatic lap timing</div>
                      <div>❌ Track detection</div>
                    </div>
                  </div>
                </details>
              </div>
            </Card>
          </div>
        )}

        {/* OBD-II Connection Dialog */}
        {showOBDConnectionDialog && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="obd-dialog-title"
            ref={this.modalRef}
          >
            <Card className="max-w-2xl w-full p-6 border-racing-blue/30">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <Car className="h-12 w-12 text-racing-blue" />
                  </div>
                  <h3 id="obd-dialog-title" className="font-bold text-xl mb-2">
                    Connect Vehicle Telemetry
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your vehicle's OBD-II port for real engine telemetry data
                  </p>
                </div>
                {/* Browser support warnings */}
                {(!bluetoothSupported || !serialSupported) && (
                  <div className="p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm text-center mb-2">
                    { !bluetoothSupported && <div>⚠️ Web Bluetooth is not supported in this browser.</div> }
                    { !serialSupported && <div>⚠️ Web Serial is not supported in this browser.</div> }
                    <div>Try Chrome or Edge on desktop for best compatibility.</div>
                  </div>
                )}
                {this.state.connectError && (
                  <div className="p-2 bg-racing-red/10 border border-racing-red/30 rounded text-racing-red text-sm text-center mb-2">
                    {this.state.connectError}
                    <div className="mt-2">
                      <RacingButton
                        variant="outline"
                        onClick={this.state.isConnecting ? undefined : () => {
                          if (this.state.connectError?.includes('Bluetooth')) this.connectOBDBluetooth();
                          else if (this.state.connectError?.includes('Serial')) this.connectOBDSerial();
                        }}
                        disabled={this.state.isConnecting}
                      >
                        Retry
                      </RacingButton>
                    </div>
                  </div>
                )}
                {this.state.obdConnected && !this.state.isConnecting && (
                  <div className="flex flex-col items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-racing-green flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-racing-green font-medium">OBD-II Connected!</span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Bluetooth Connection */}
                  <Card
                    className={`p-4 border-racing-blue/20 hover:border-racing-blue/40 transition-colors cursor-pointer ${this.state.isConnecting ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={this.connectOBDBluetooth}
                  >
                    <div className="text-center space-y-3">
                      <div className="flex justify-center">
                        <Bluetooth className="h-8 w-8 text-racing-blue" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-racing-blue">
                          Bluetooth OBD
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          ELM327 Bluetooth adapter
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div>✓ Wireless connection</div>
                        <div>✓ Most common adapter</div>
                        <div>✓ Works with phones/tablets</div>
                      </div>
                    </div>
                  </Card>

                  {/* USB/Serial Connection */}
                  <Card
                    className={`p-4 border-racing-green/20 hover:border-racing-green/40 transition-colors cursor-pointer ${this.state.isConnecting ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={this.connectOBDSerial}
                  >
                    <div className="text-center space-y-3">
                      <div className="flex justify-center">
                        <Usb className="h-8 w-8 text-racing-green" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-racing-green">
                          USB OBD
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          USB/Serial OBD adapter
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div>✓ Stable connection</div>
                        <div>✓ Faster data rates</div>
                        <div>✓ No pairing required</div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* What you'll get */}
                <div className="bg-muted/20 rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-racing-blue" />
                    Real Vehicle Telemetry Data
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-racing-green rounded-full" />
                      <span>Engine RPM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-racing-blue rounded-full" />
                      <span>Vehicle Speed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-racing-red rounded-full" />
                      <span>Coolant Temperature</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-racing-yellow rounded-full" />
                      <span>Throttle Position</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-racing-purple rounded-full" />
                      <span>Engine Load</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-racing-orange rounded-full" />
                      <span>Fuel Level</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-racing-cyan rounded-full" />
                      <span>Air Flow Rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-racing-pink rounded-full" />
                      <span>Manifold Pressure</span>
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                    Hardware Requirements ▼
                  </summary>
                  <div className="mt-3 p-3 bg-muted/10 rounded-lg text-xs text-muted-foreground space-y-2">
                    <div>
                      <strong>For Bluetooth:</strong> ELM327 Bluetooth OBD-II
                      adapter (~$10-30)
                    </div>
                    <div>
                      <strong>For USB:</strong> ELM327 USB OBD-II adapter
                      (~$15-40)
                    </div>
                    <div>
                      <strong>Vehicle:</strong> Most cars 1996+ (OBD-II
                      compatible)
                    </div>
                    <div>
                      <strong>Browser:</strong> Chrome/Edge (Web
                      Bluetooth/Serial API support)
                    </div>
                  </div>
                </details>

                <div className="flex justify-center">
                  <RacingButton
                    variant="outline"
                    onClick={this.dismissOBDDialog}
                    className="px-8"
                  >
                    Cancel
                  </RacingButton>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }
}

export default function TelemetryDashboard() {
  return <TelemetryDashboardPage />;
}
