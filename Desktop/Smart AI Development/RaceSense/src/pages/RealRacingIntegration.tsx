import React from "react";
import { RacingButton } from "@/components/RacingButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RacingStatusIndicator,
  PerformanceMetric,
  RacingProgressBar,
} from "@/components/LoadingStates";
import { notify } from "@/components/RacingNotifications";
import {
  racingCommandCenterService,
  LiveRacingSession,
  LiveTelemetryStream,
  WeatherConditions,
  CommandCenterAlert,
  RaceStrategy,
  VoiceCommand,
} from "@/services/RacingCommandCenterService";
import {
  Command,
  Play,
  Square,
  Globe,
  Target,
  AlertTriangle,
  Mic,
  Brain,
  Headphones,
  Radio,
  Flame,
  Users,
  Eye,
  Gauge,
  Activity,
  TrendingUp,
  Timer,
  MapPin,
  Car,
  Bluetooth,
  Usb,
  Settings,
  Thermometer,
  Zap,
  Circle,
  Sun,
  Moon,
  Trophy,
  CheckCircle,
  X,
  ChevronRight,
  Cloud,
  MicOff,
  Volume2,
  VolumeX,
  Cpu,
  Fuel,
} from "lucide-react";

interface CommandCenterState {
  // Core session state
  currentSession: LiveRacingSession | null;
  isSessionActive: boolean;
  selectedSessionType: "practice" | "qualifying" | "race" | "test";

  // Live data streams
  liveTelemetry: LiveTelemetryStream | null;
  weather: WeatherConditions | null;
  activeAlerts: CommandCenterAlert[];
  strategy: RaceStrategy | null;

  // Voice and communication
  isVoiceActive: boolean;
  voiceSupported: boolean;
  recentCommands: VoiceCommand[];
  announcementsEnabled: boolean;

  // UI state
  selectedView: "overview" | "telemetry" | "strategy" | "alerts" | "voice";
  multiScreenMode: boolean;
  compactMode: boolean;

  // Session configuration
  targetLapTime: string;
  targetLaps: string;
  fuelTarget: string;
}

class RealRacingCommandCenter extends React.Component<{}, CommandCenterState> {
  private sessionUnsubscribe: (() => void) | null = null;
  private telemetryUnsubscribe: (() => void) | null = null;
  private weatherUnsubscribe: (() => void) | null = null;
  private alertUnsubscribe: (() => void) | null = null;
  private strategyUnsubscribe: (() => void) | null = null;
  private voiceUnsubscribe: (() => void) | null = null;
  private audioContext: AudioContext | null = null;

  constructor(props: {}) {
    super(props);
    this.state = {
      currentSession: null,
      isSessionActive: false,
      selectedSessionType: "practice",
      liveTelemetry: null,
      weather: null,
      activeAlerts: [],
      strategy: null,
      isVoiceActive: false,
      voiceSupported: racingCommandCenterService.isVoiceSupported(),
      recentCommands: [],
      announcementsEnabled: true,
      selectedView: "overview",
      multiScreenMode: false,
      compactMode: false,
      targetLapTime: "83.500",
      targetLaps: "20",
      fuelTarget: "100",
    };
  }

  componentDidMount() {
    this.setupServiceSubscriptions();
    this.initializeAudioContext();
  }

  componentWillUnmount() {
    this.cleanupSubscriptions();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  private setupServiceSubscriptions(): void {
    // Session updates
    this.sessionUnsubscribe = racingCommandCenterService.onSessionUpdate(
      (session) => {
        this.setState({
          currentSession: session,
          isSessionActive: session?.isActive || false,
        });
      },
    );

    // Live telemetry stream
    this.telemetryUnsubscribe = racingCommandCenterService.onTelemetryUpdate(
      (telemetry) => {
        this.setState({ liveTelemetry: telemetry });
      },
    );

    // Weather updates
    this.weatherUnsubscribe = racingCommandCenterService.onWeatherUpdate(
      (weather) => {
        this.setState({ weather });
      },
    );

    // Alert system
    this.alertUnsubscribe = racingCommandCenterService.onAlert((alert) => {
      this.setState((prev) => ({
        activeAlerts: [alert, ...prev.activeAlerts.slice(0, 9)],
      }));

      // Show notification for critical alerts
      if (alert.priority === "critical") {
        notify.error(alert.title, alert.message, {
          duration: 10000,
          actions: [
            {
              label: "Acknowledge",
              action: () => this.acknowledgeAlert(alert.id),
              style: "destructive",
            },
          ],
        });
      } else if (alert.priority === "high") {
        notify.warning(alert.title, alert.message, { duration: 6000 });
      }
    });

    // Strategy updates
    this.strategyUnsubscribe = racingCommandCenterService.onStrategyUpdate(
      (strategy) => {
        this.setState({ strategy });
      },
    );

    // Voice commands
    this.voiceUnsubscribe = racingCommandCenterService.onVoiceCommand(
      (command) => {
        this.setState((prev) => ({
          recentCommands: [command, ...prev.recentCommands.slice(0, 9)],
        }));
      },
    );
  }

  private cleanupSubscriptions(): void {
    if (this.sessionUnsubscribe) this.sessionUnsubscribe();
    if (this.telemetryUnsubscribe) this.telemetryUnsubscribe();
    if (this.weatherUnsubscribe) this.weatherUnsubscribe();
    if (this.alertUnsubscribe) this.alertUnsubscribe();
    if (this.strategyUnsubscribe) this.strategyUnsubscribe();
    if (this.voiceUnsubscribe) this.voiceUnsubscribe();
  }

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn("Audio context not available:", error);
    }
  }

  // Session Control
  private startSession = (): void => {
    const { selectedSessionType, targetLapTime, targetLaps, fuelTarget } =
      this.state;

    const options = {
      targetLapTime: parseFloat(targetLapTime) * 1000,
      targetLaps: parseInt(targetLaps),
      fuelTarget: parseFloat(fuelTarget),
    };

    const sessionId = racingCommandCenterService.startCommandCenterSession(
      selectedSessionType,
      options,
    );

    notify.success(
      "Command Center Activated",
      `${selectedSessionType.toUpperCase()} session started`,
      { duration: 4000 },
    );
  };

  private stopSession = (): void => {
    racingCommandCenterService.stopCommandCenterSession();
    notify.info("Session Complete", "Command Center deactivated", {
      duration: 3000,
    });
  };

  // Voice Control
  private toggleVoiceRecognition = (): void => {
    if (this.state.isVoiceActive) {
      racingCommandCenterService.stopVoiceRecognition();
      this.setState({ isVoiceActive: false });
      notify.info("Voice Recognition", "Voice commands disabled");
    } else {
      const success = racingCommandCenterService.startVoiceRecognition();
      if (success) {
        this.setState({ isVoiceActive: true });
        notify.success("Voice Recognition", "Voice commands active");
      } else {
        notify.error("Voice Recognition", "Failed to start voice recognition");
      }
    }
  };

  private toggleAnnouncements = (): void => {
    this.setState((prev) => ({
      announcementsEnabled: !prev.announcementsEnabled,
    }));
  };

  // Alert Management
  private acknowledgeAlert = (alertId: string): void => {
    racingCommandCenterService.acknowledgeAlert(alertId);
    this.setState((prev) => ({
      activeAlerts: prev.activeAlerts.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert,
      ),
    }));
  };

  private clearAllAlerts = (): void => {
    this.setState({ activeAlerts: [] });
  };

  // Utility methods
  private formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(3);
    return `${minutes}:${seconds.padStart(6, "0")}`;
  };

  private formatDuration = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  private getAlertIcon = (type: CommandCenterAlert["type"]) => {
    switch (type) {
      case "performance":
        return TrendingUp;
      case "mechanical":
        return Settings;
      case "weather":
        return Cloud;
      case "strategy":
        return Target;
      case "safety":
        return AlertTriangle;
      default:
        return AlertTriangle;
    }
  };

  private getAlertColor = (priority: CommandCenterAlert["priority"]) => {
    switch (priority) {
      case "critical":
        return "text-racing-red border-racing-red bg-racing-red/10";
      case "high":
        return "text-racing-orange border-racing-orange bg-racing-orange/10";
      case "medium":
        return "text-racing-yellow border-racing-yellow bg-racing-yellow/10";
      default:
        return "text-racing-blue border-racing-blue bg-racing-blue/10";
    }
  };

  // Render methods for different views
  private renderOverview(): React.ReactNode {
    const { currentSession, liveTelemetry, weather, strategy } = this.state;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Telemetry Display */}
        <div className="lg:col-span-8 space-y-6">
          {/* Primary Gauges */}
          <Card className="p-6 bg-black/90 border-racing-orange/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Speed */}
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="w-32 h-32 mx-auto border-4 border-racing-red/30 rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-racing-red">
                        {liveTelemetry ? Math.round(liveTelemetry.speed) : "--"}
                      </div>
                      <div className="text-sm text-racing-red/70">KM/H</div>
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  SPEED
                </div>
              </div>

              {/* RPM */}
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="w-32 h-32 mx-auto border-4 border-racing-orange/30 rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-racing-orange">
                        {liveTelemetry
                          ? Math.round(liveTelemetry.rpm / 100) / 10
                          : "--"}
                      </div>
                      <div className="text-sm text-racing-orange/70">x1000</div>
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  RPM
                </div>
              </div>

              {/* Gear */}
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="w-32 h-32 mx-auto border-4 border-racing-blue/30 rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-racing-blue">
                        {liveTelemetry ? liveTelemetry.gear : "-"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  GEAR
                </div>
              </div>
            </div>
          </Card>

          {/* G-Force and Performance */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-racing-green" />
              G-Force & Performance
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <PerformanceMetric
                label="Lateral G"
                value={liveTelemetry?.lateralG || 0}
                unit="G"
                format="decimal"
                color="purple"
              />
              <PerformanceMetric
                label="Longitudinal G"
                value={liveTelemetry?.longitudinalG || 0}
                unit="G"
                format="decimal"
                color="orange"
              />
              <PerformanceMetric
                label="Throttle"
                value={liveTelemetry?.throttle || 0}
                unit="%"
                color="green"
              />
              <PerformanceMetric
                label="Brake"
                value={liveTelemetry?.brake || 0}
                unit="%"
                color="red"
              />
            </div>
          </Card>

          {/* Session Progress */}
          {currentSession && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Timer className="h-5 w-5 text-racing-blue" />
                Session Progress
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <PerformanceMetric
                    label="Current Lap"
                    value={currentSession.currentLap}
                    color="blue"
                  />
                  <PerformanceMetric
                    label="Session Time"
                    value={this.formatDuration(currentSession.duration)}
                    color="purple"
                  />
                  <PerformanceMetric
                    label="Best Lap"
                    value={
                      currentSession.bestLapTime
                        ? this.formatTime(currentSession.bestLapTime)
                        : "--:--.---"
                    }
                    color="green"
                  />
                  <PerformanceMetric
                    label="Progress"
                    value={
                      currentSession.targetLaps
                        ? Math.round(
                            (currentSession.currentLap /
                              currentSession.targetLaps) *
                              100,
                          )
                        : liveTelemetry?.lapProgress
                          ? Math.round(liveTelemetry.lapProgress * 100)
                          : 0
                    }
                    unit="%"
                    color="yellow"
                  />
                </div>
                {liveTelemetry && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Lap Progress</span>
                      <span>
                        Sector {liveTelemetry.sector || 1} -{" "}
                        {Math.round(liveTelemetry.lapProgress * 100)}%
                      </span>
                    </div>
                    <RacingProgressBar
                      progress={liveTelemetry.lapProgress * 100}
                      color="blue"
                      animated={true}
                    />
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Side Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Weather Conditions */}
          {weather && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Cloud className="h-5 w-5 text-racing-green" />
                Track Conditions
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-racing-orange">
                      {weather.temperature.toFixed(0)}°C
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Air Temp
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-racing-red">
                      {weather.trackTemperature.toFixed(0)}°C
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Track Temp
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <Badge
                    variant="secondary"
                    className={`${
                      weather.condition === "dry"
                        ? "bg-racing-green/20 text-racing-green"
                        : weather.condition === "damp"
                          ? "bg-racing-yellow/20 text-racing-yellow"
                          : "bg-racing-blue/20 text-racing-blue"
                    }`}
                  >
                    {weather.condition.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-xs text-center text-muted-foreground">
                  Humidity: {weather.humidity.toFixed(0)}% • Wind:{" "}
                  {weather.windSpeed.toFixed(1)} m/s
                </div>
              </div>
            </Card>
          )}

          {/* Fuel & Strategy */}
          {strategy && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-racing-purple" />
                Race Strategy
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Fuel Level</span>
                    <span>{strategy.fuelStrategy.currentFuel.toFixed(1)}%</span>
                  </div>
                  <RacingProgressBar
                    progress={strategy.fuelStrategy.currentFuel}
                    color={
                      strategy.fuelStrategy.currentFuel > 25
                        ? "green"
                        : strategy.fuelStrategy.currentFuel > 15
                          ? "yellow"
                          : "red"
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Laps Remaining
                    </span>
                    <div className="font-bold">
                      {strategy.fuelStrategy.lapsRemaining}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Consumption</span>
                    <div className="font-bold">
                      {strategy.fuelStrategy.targetConsumption.toFixed(1)}%/lap
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Tire Strategy
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {strategy.tireStrategy.currentCompound.toUpperCase()}
                    </Badge>
                    <span className="text-sm">
                      {strategy.tireStrategy.currentAge} laps
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Voice Commands */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Mic className="h-5 w-5 text-racing-blue" />
              Voice Control
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <RacingButton
                  variant={this.state.isVoiceActive ? "racing" : "outline"}
                  racing="blue"
                  size="sm"
                  icon={this.state.isVoiceActive ? Mic : MicOff}
                  onClick={this.toggleVoiceRecognition}
                  disabled={!this.state.voiceSupported}
                  className="flex-1"
                >
                  {this.state.isVoiceActive ? "Voice On" : "Voice Off"}
                </RacingButton>
                <RacingButton
                  variant={
                    this.state.announcementsEnabled ? "racing" : "outline"
                  }
                  racing="green"
                  size="sm"
                  icon={this.state.announcementsEnabled ? Volume2 : VolumeX}
                  onClick={this.toggleAnnouncements}
                  className="flex-1"
                >
                  Audio
                </RacingButton>
              </div>
              {!this.state.voiceSupported && (
                <div className="text-xs text-muted-foreground">
                  Voice recognition not supported in this browser
                </div>
              )}
              {this.state.recentCommands.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Recent Commands:</div>
                  {this.state.recentCommands.slice(0, 3).map((cmd, index) => (
                    <div
                      key={index}
                      className="text-xs p-2 bg-muted/20 rounded"
                    >
                      "{cmd.command}"
                      <span className="text-muted-foreground ml-2">
                        ({(cmd.confidence * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  private renderTelemetryView(): React.ReactNode {
    const { liveTelemetry } = this.state;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engine Telemetry */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-racing-red" />
            Engine Data
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <PerformanceMetric
                label="Engine RPM"
                value={liveTelemetry?.rpm || 0}
                target={6000}
                color="red"
              />
              <PerformanceMetric
                label="Engine Temp"
                value={liveTelemetry?.engineTemp || 0}
                unit="°C"
                target={90}
                color="orange"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Throttle Position</span>
                <span>{liveTelemetry?.throttle.toFixed(1) || 0}%</span>
              </div>
              <RacingProgressBar
                progress={liveTelemetry?.throttle || 0}
                color="green"
                animated={true}
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Brake Pressure</span>
                <span>{liveTelemetry?.brake.toFixed(1) || 0}%</span>
              </div>
              <RacingProgressBar
                progress={liveTelemetry?.brake || 0}
                color="red"
                animated={true}
              />
            </div>
          </div>
        </Card>

        {/* Vehicle Dynamics */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-racing-blue" />
            Vehicle Dynamics
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <PerformanceMetric
                label="Speed"
                value={liveTelemetry?.speed || 0}
                unit="km/h"
                color="blue"
              />
              <PerformanceMetric
                label="Gear"
                value={liveTelemetry?.gear || 0}
                color="purple"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <PerformanceMetric
                label="Lateral G"
                value={liveTelemetry?.lateralG || 0}
                unit="G"
                format="decimal"
                color="orange"
              />
              <PerformanceMetric
                label="Longitudinal G"
                value={liveTelemetry?.longitudinalG || 0}
                unit="G"
                format="decimal"
                color="yellow"
              />
            </div>
          </div>
        </Card>

        {/* Tire Data */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Gauge className="h-5 w-5 text-racing-green" />
            Tire Pressures
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-racing-blue">
                  {liveTelemetry?.tirePressures.fl.toFixed(1) || "--"}
                </div>
                <div className="text-xs text-muted-foreground">Front Left</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-racing-red">
                  {liveTelemetry?.tirePressures.fr.toFixed(1) || "--"}
                </div>
                <div className="text-xs text-muted-foreground">Front Right</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-racing-green">
                  {liveTelemetry?.tirePressures.rl.toFixed(1) || "--"}
                </div>
                <div className="text-xs text-muted-foreground">Rear Left</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-racing-yellow">
                  {liveTelemetry?.tirePressures.rr.toFixed(1) || "--"}
                </div>
                <div className="text-xs text-muted-foreground">Rear Right</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Fuel System */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Fuel className="h-5 w-5 text-racing-yellow" />
            Fuel System
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Fuel Level</span>
                <span>{liveTelemetry?.fuelLevel.toFixed(1) || 0}%</span>
              </div>
              <RacingProgressBar
                progress={liveTelemetry?.fuelLevel || 0}
                color={
                  (liveTelemetry?.fuelLevel || 0) > 25
                    ? "green"
                    : (liveTelemetry?.fuelLevel || 0) > 15
                      ? "yellow"
                      : "red"
                }
              />
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                {liveTelemetry?.fuelLevel
                  ? Math.round((liveTelemetry.fuelLevel / 2.5) * 10) / 10
                  : "--"}
              </div>
              <div className="text-xs text-muted-foreground">
                Estimated laps remaining
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  private renderAlertsView(): React.ReactNode {
    const { activeAlerts } = this.state;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-racing-orange" />
            Active Alerts ({activeAlerts.length})
          </h3>
          <RacingButton
            variant="outline"
            size="sm"
            onClick={this.clearAllAlerts}
            disabled={activeAlerts.length === 0}
          >
            Clear All
          </RacingButton>
        </div>

        {activeAlerts.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-racing-green mb-4" />
            <p className="text-lg font-medium">All Systems Normal</p>
            <p className="text-muted-foreground">No active alerts</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alert) => {
              const IconComponent = this.getAlertIcon(alert.type);
              const colorClasses = this.getAlertColor(alert.priority);

              return (
                <Card
                  key={alert.id}
                  className={`p-4 border ${colorClasses} ${
                    alert.acknowledged ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <IconComponent className="h-5 w-5 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {alert.priority.toUpperCase()}
                          </Badge>
                          {alert.acknowledged && (
                            <Badge variant="outline" className="text-xs">
                              ACKNOWLEDGED
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        {alert.suggestedActions && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium">
                              Suggested Actions:
                            </div>
                            {alert.suggestedActions.map((action, index) => (
                              <div
                                key={index}
                                className="text-xs text-muted-foreground"
                              >
                                • {action}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                      {!alert.acknowledged && (
                        <RacingButton
                          variant="outline"
                          size="xs"
                          onClick={() => this.acknowledgeAlert(alert.id)}
                        >
                          ACK
                        </RacingButton>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  render() {
    const {
      isSessionActive,
      selectedSessionType,
      selectedView,
      targetLapTime,
      targetLaps,
      fuelTarget,
      currentSession,
      multiScreenMode,
      compactMode,
    } = this.state;

    return (
      <div className="space-y-6">
        {/* Command Center Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Command className="h-8 w-8 text-racing-orange" />
                <div
                  className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                    isSessionActive
                      ? "bg-racing-green animate-pulse"
                      : "bg-gray-500"
                  }`}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Racing Command Center</h1>
                <p className="text-muted-foreground">
                  Live mission control for professional racing
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <RacingButton
              variant="outline"
              size="sm"
              icon={multiScreenMode ? Eye : Users}
              onClick={() =>
                this.setState({ multiScreenMode: !multiScreenMode })
              }
            >
              {multiScreenMode ? "Single" : "Multi"} Screen
            </RacingButton>
            <RacingButton
              variant="outline"
              size="sm"
              icon={compactMode ? Globe : Target}
              onClick={() => this.setState({ compactMode: !compactMode })}
            >
              {compactMode ? "Full" : "Compact"} View
            </RacingButton>
          </div>
        </div>

        {/* Session Control Panel */}
        <Card className="p-6 bg-black/90 border-racing-orange/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-racing-orange">
              Mission Control
            </h3>
            <div className="flex items-center gap-2">
              <RacingStatusIndicator
                status={isSessionActive ? "online" : "offline"}
                text={
                  isSessionActive
                    ? `${selectedSessionType.toUpperCase()} ACTIVE`
                    : "STANDBY"
                }
                size="lg"
              />
            </div>
          </div>

          {!isSessionActive ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Session Type
                </label>
                <select
                  value={selectedSessionType}
                  onChange={(e) =>
                    this.setState({
                      selectedSessionType: e.target.value as any,
                    })
                  }
                  className="w-full p-2 bg-black border border-racing-orange/30 rounded text-white"
                >
                  <option value="practice">Practice</option>
                  <option value="qualifying">Qualifying</option>
                  <option value="race">Race</option>
                  <option value="test">Test</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Target Lap (s)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={targetLapTime}
                  onChange={(e) =>
                    this.setState({ targetLapTime: e.target.value })
                  }
                  className="w-full p-2 bg-black border border-racing-orange/30 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Target Laps
                </label>
                <input
                  type="number"
                  value={targetLaps}
                  onChange={(e) =>
                    this.setState({ targetLaps: e.target.value })
                  }
                  className="w-full p-2 bg-black border border-racing-orange/30 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Fuel (%)
                </label>
                <input
                  type="number"
                  value={fuelTarget}
                  onChange={(e) =>
                    this.setState({ fuelTarget: e.target.value })
                  }
                  className="w-full p-2 bg-black border border-racing-orange/30 rounded text-white"
                />
              </div>
              <RacingButton
                variant="racing"
                racing="green"
                icon={Play}
                onClick={this.startSession}
                className="h-10"
              >
                ACTIVATE
              </RacingButton>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-racing-green">
                    {currentSession?.currentLap || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    CURRENT LAP
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-racing-blue">
                    {currentSession
                      ? this.formatDuration(currentSession.duration)
                      : "00:00"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    SESSION TIME
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-racing-yellow">
                    {currentSession?.bestLapTime
                      ? this.formatTime(currentSession.bestLapTime)
                      : "--:--.---"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    BEST LAP
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-racing-purple">
                    {selectedSessionType.toUpperCase()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    SESSION TYPE
                  </div>
                </div>
              </div>
              <RacingButton
                variant="racing"
                racing="red"
                icon={Square}
                onClick={this.stopSession}
              >
                DEACTIVATE
              </RacingButton>
            </div>
          )}
        </Card>

        {/* View Navigation */}
        {isSessionActive && (
          <div className="flex gap-2">
            {[
              { key: "overview", label: "Overview", icon: Globe },
              { key: "telemetry", label: "Telemetry", icon: Gauge },
              { key: "strategy", label: "Strategy", icon: Target },
              { key: "alerts", label: "Alerts", icon: AlertTriangle },
              { key: "voice", label: "Voice", icon: Mic },
            ].map((view) => (
              <RacingButton
                key={view.key}
                variant={selectedView === view.key ? "racing" : "outline"}
                racing="orange"
                size="sm"
                icon={view.icon}
                onClick={() =>
                  this.setState({ selectedView: view.key as any })
                }
              >
                {view.label}
              </RacingButton>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        {isSessionActive && (
          <div className="min-h-[600px]">
            {selectedView === "overview" && this.renderOverview()}
            {selectedView === "telemetry" && this.renderTelemetryView()}
            {selectedView === "alerts" && this.renderAlertsView()}
            {selectedView === "strategy" && (
              <div className="text-center py-20">
                <Brain className="h-16 w-16 mx-auto text-racing-purple mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Strategy Analysis
                </h3>
                <p className="text-muted-foreground">
                  Advanced race strategy tools coming soon
                </p>
              </div>
            )}
            {selectedView === "voice" && (
              <div className="text-center py-20">
                <Headphones className="h-16 w-16 mx-auto text-racing-blue mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Voice Command Center
                </h3>
                <p className="text-muted-foreground">
                  Advanced voice control interface coming soon
                </p>
              </div>
            )}
          </div>
        )}

        {!isSessionActive && (
          <Card className="p-12 text-center">
            <Flame className="h-20 w-20 mx-auto text-racing-orange mb-6" />
            <h2 className="text-2xl font-bold mb-4">Command Center Ready</h2>
            <p className="text-muted-foreground text-lg mb-6">
              Configure your session parameters above and click ACTIVATE to
              begin live mission control
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="p-4 bg-racing-blue/10 border border-racing-blue/30 rounded-lg">
                <Gauge className="h-8 w-8 mx-auto text-racing-blue mb-2" />
                <div className="font-medium">Live Telemetry</div>
                <div className="text-xs text-muted-foreground">
                  Real-time vehicle data
                </div>
              </div>
              <div className="p-4 bg-racing-green/10 border border-racing-green/30 rounded-lg">
                <Brain className="h-8 w-8 mx-auto text-racing-green mb-2" />
                <div className="font-medium">AI Coaching</div>
                <div className="text-xs text-muted-foreground">
                  Intelligent performance tips
                </div>
              </div>
              <div className="p-4 bg-racing-purple/10 border border-racing-purple/30 rounded-lg">
                <Radio className="h-8 w-8 mx-auto text-racing-purple mb-2" />
                <div className="font-medium">Voice Control</div>
                <div className="text-xs text-muted-foreground">
                  Hands-free operation
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }
}

export default function RealRacingIntegration() {
  return <RealRacingCommandCenter />;
}
