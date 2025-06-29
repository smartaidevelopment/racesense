// Real-Time Racing Command Center Service
// Advanced mission control system for live racing sessions

import { lapTimingService, LiveSession, LapData } from "./LapTimingService";
import { obdIntegrationService, LiveOBDData } from "./OBDIntegrationService";
import { aiPerformanceService, AICoachingTip } from "./AIPerformanceService";

interface LiveRacingSession {
  sessionId: string;
  sessionType: "practice" | "qualifying" | "race" | "test";
  startTime: number;
  duration: number;
  isActive: boolean;
  currentLap: number;
  targetLapTime?: number;
  bestLapTime?: number;
  targetLaps?: number;
  fuelTarget?: number;
  strategy: "conservative" | "aggressive" | "optimal";
}

interface LiveTelemetryStream {
  timestamp: number;
  speed: number;
  rpm: number;
  throttle: number;
  brake: number;
  gear: number;
  lateralG: number;
  longitudinalG: number;
  engineTemp: number;
  fuelLevel: number;
  tirePressures: {
    fl: number;
    fr: number;
    rl: number;
    rr: number;
  };
  gps: {
    latitude: number;
    longitude: number;
    accuracy: number;
    heading: number;
  };
  sector?: number;
  lapProgress: number; // 0-1
}

interface WeatherConditions {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  trackTemperature: number;
  condition: "dry" | "damp" | "wet" | "rain";
  visibility: number;
  rainfall: number;
  forecast: {
    next15min: string;
    next30min: string;
    next60min: string;
  };
}

interface TrafficAlert {
  id: string;
  type: "approaching" | "overtaking" | "blue_flag" | "yellow_flag" | "red_flag";
  severity: "info" | "warning" | "critical";
  message: string;
  distance?: number;
  relativeSpeed?: number;
  timestamp: number;
}

interface RaceStrategy {
  fuelStrategy: {
    currentFuel: number;
    targetConsumption: number;
    lapsRemaining: number;
    fuelRequired: number;
    margin: number;
  };
  tireStrategy: {
    currentCompound: "soft" | "medium" | "hard" | "intermediate" | "wet";
    currentAge: number; // laps
    degradation: number; // percentage
    recommendedChange?: number; // lap number
    targetCompound?: string;
  };
  lapStrategy: {
    currentPace: number;
    targetPace: number;
    pushLaps: number[];
    conserveLaps: number[];
    pitWindow: { start: number; end: number };
  };
}

interface VoiceCommand {
  command: string;
  parameters?: Record<string, any>;
  confidence: number;
  timestamp: number;
}

interface CommandCenterAlert {
  id: string;
  type: "performance" | "mechanical" | "weather" | "strategy" | "safety";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  actionRequired: boolean;
  suggestedActions?: string[];
  timestamp: number;
  acknowledged: boolean;
}

class RacingCommandCenterService {
  private currentSession: LiveRacingSession | null = null;
  private telemetryStream: LiveTelemetryStream | null = null;
  private weatherConditions: WeatherConditions | null = null;
  private trafficAlerts: TrafficAlert[] = [];
  private activeAlerts: CommandCenterAlert[] = [];
  private strategy: RaceStrategy | null = null;
  private voiceCommands: VoiceCommand[] = [];

  // Event listeners
  private sessionListeners: Set<(session: LiveRacingSession | null) => void> =
    new Set();
  private telemetryListeners: Set<(telemetry: LiveTelemetryStream) => void> =
    new Set();
  private weatherListeners: Set<(weather: WeatherConditions) => void> =
    new Set();
  private alertListeners: Set<(alert: CommandCenterAlert) => void> = new Set();
  private strategyListeners: Set<(strategy: RaceStrategy) => void> = new Set();
  private voiceListeners: Set<(command: VoiceCommand) => void> = new Set();

  // Voice synthesis and recognition
  private speechSynthesis: SpeechSynthesis | null = null;
  private speechRecognition: any = null;
  private isVoiceActive: boolean = false;

  // Data streaming
  private streamingInterval: NodeJS.Timeout | null = null;
  private weatherInterval: NodeJS.Timeout | null = null;
  private alertsInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeVoiceCapabilities();
    this.setupServiceIntegrations();
  }

  private initializeVoiceCapabilities(): void {
    // Initialize speech synthesis
    if ("speechSynthesis" in window) {
      this.speechSynthesis = window.speechSynthesis;
    }

    // Initialize speech recognition
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = "en-US";

      this.speechRecognition.onresult = (event: any) => {
        const transcript =
          event.results[event.results.length - 1][0].transcript;
        const confidence =
          event.results[event.results.length - 1][0].confidence;

        if (event.results[event.results.length - 1].isFinal) {
          this.processVoiceCommand(transcript, confidence);
        }
      };
    }
  }

  private setupServiceIntegrations(): void {
    // Integrate with existing services
    lapTimingService.onSessionUpdate((session) => {
      if (session && this.currentSession) {
        this.updateSessionFromLapTiming(session);
      }
    });

    lapTimingService.onLapComplete((lap) => {
      this.handleLapCompletion(lap);
    });

    // Listen for OBD data
    obdIntegrationService.onDataUpdate((obdData) => {
      this.updateTelemetryFromOBD(obdData);
    });
  }

  // Session Management
  startCommandCenterSession(
    sessionType: LiveRacingSession["sessionType"],
    options: {
      targetLapTime?: number;
      targetLaps?: number;
      fuelTarget?: number;
      strategy?: RaceStrategy["lapStrategy"]["currentPace"];
    } = {},
  ): string {
    const sessionId = `command-${Date.now()}`;

    this.currentSession = {
      sessionId,
      sessionType,
      startTime: Date.now(),
      duration: 0,
      isActive: true,
      currentLap: 0,
      targetLapTime: options.targetLapTime,
      targetLaps: options.targetLaps,
      fuelTarget: options.fuelTarget,
      strategy: "optimal",
    };

    // Start all monitoring systems
    this.startTelemetryStreaming();
    this.startWeatherMonitoring();
    this.startAlertSystem();
    this.initializeStrategy();

    // Start voice coaching if available
    if (this.speechSynthesis) {
      this.announceMessage(
        "Command Center activated. Session started.",
        "info",
      );
    }

    this.notifySessionListeners();
    return sessionId;
  }

  stopCommandCenterSession(): void {
    if (!this.currentSession) return;

    this.currentSession.isActive = false;
    this.currentSession.duration = Date.now() - this.currentSession.startTime;

    // Stop monitoring systems
    this.stopTelemetryStreaming();
    this.stopWeatherMonitoring();
    this.stopAlertSystem();

    if (this.speechSynthesis) {
      this.announceMessage(
        "Session complete. Command Center deactivated.",
        "info",
      );
    }

    this.notifySessionListeners();
    this.currentSession = null;
  }

  // Telemetry Streaming
  private startTelemetryStreaming(): void {
    if (this.streamingInterval) {
      clearInterval(this.streamingInterval);
    }

    this.streamingInterval = setInterval(() => {
      if (!this.currentSession?.isActive) return;

      // Generate realistic telemetry data
      const telemetry = this.generateLiveTelemetry();
      this.telemetryStream = telemetry;

      // Check for performance alerts
      this.checkPerformanceAlerts(telemetry);

      this.notifyTelemetryListeners(telemetry);
    }, 100); // 10Hz updates
  }

  private stopTelemetryStreaming(): void {
    if (this.streamingInterval) {
      clearInterval(this.streamingInterval);
      this.streamingInterval = null;
    }
  }

  private generateLiveTelemetry(): LiveTelemetryStream {
    const now = Date.now();
    const sessionTime = this.currentSession
      ? (now - this.currentSession.startTime) / 1000
      : 0;

    // Simulate realistic racing telemetry
    const lapProgress = (sessionTime % 90) / 90; // 90-second laps
    const speed =
      60 + Math.sin(lapProgress * Math.PI * 4) * 40 + Math.random() * 10;
    const rpm = 3000 + speed * 30 + Math.random() * 500;
    const throttle = Math.max(
      0,
      Math.min(100, speed * 1.2 + Math.random() * 20),
    );

    return {
      timestamp: now,
      speed,
      rpm,
      throttle,
      brake: throttle < 30 ? Math.random() * 50 : 0,
      gear: Math.floor(speed / 25) + 1,
      lateralG:
        (Math.sin(lapProgress * Math.PI * 8) + Math.random() * 0.5) * 1.5,
      longitudinalG:
        (Math.cos(lapProgress * Math.PI * 6) + Math.random() * 0.3) * 1.2,
      engineTemp: 85 + Math.random() * 10,
      fuelLevel: Math.max(0, 100 - sessionTime * 0.1),
      tirePressures: {
        fl: 2.2 + Math.random() * 0.1,
        fr: 2.2 + Math.random() * 0.1,
        rl: 2.3 + Math.random() * 0.1,
        rr: 2.3 + Math.random() * 0.1,
      },
      gps: {
        latitude: 52.0786 + Math.sin(lapProgress * Math.PI * 2) * 0.01,
        longitude: -1.0169 + Math.cos(lapProgress * Math.PI * 2) * 0.01,
        accuracy: 3 + Math.random() * 2,
        heading: lapProgress * 360,
      },
      sector: Math.floor(lapProgress * 3) + 1,
      lapProgress,
    };
  }

  // Weather Monitoring
  private startWeatherMonitoring(): void {
    if (this.weatherInterval) {
      clearInterval(this.weatherInterval);
    }

    // Initial weather
    this.updateWeatherConditions();

    // Update every 5 minutes
    this.weatherInterval = setInterval(() => {
      this.updateWeatherConditions();
    }, 300000);
  }

  private stopWeatherMonitoring(): void {
    if (this.weatherInterval) {
      clearInterval(this.weatherInterval);
      this.weatherInterval = null;
    }
  }

  private updateWeatherConditions(): void {
    // Simulate weather conditions
    const weather: WeatherConditions = {
      temperature: 20 + Math.random() * 10,
      humidity: 40 + Math.random() * 40,
      pressure: 1010 + Math.random() * 20,
      windSpeed: Math.random() * 15,
      windDirection: Math.random() * 360,
      trackTemperature: 25 + Math.random() * 20,
      condition: Math.random() > 0.8 ? "damp" : "dry",
      visibility: 8 + Math.random() * 2,
      rainfall: Math.random() > 0.9 ? Math.random() * 5 : 0,
      forecast: {
        next15min: "Stable conditions expected",
        next30min: "Slight temperature rise possible",
        next60min: "Conditions remaining favorable",
      },
    };

    this.weatherConditions = weather;
    this.notifyWeatherListeners(weather);

    // Check for weather alerts
    this.checkWeatherAlerts(weather);
  }

  // Alert System
  private startAlertSystem(): void {
    if (this.alertsInterval) {
      clearInterval(this.alertsInterval);
    }

    this.alertsInterval = setInterval(() => {
      this.checkSystemAlerts();
    }, 5000); // Check every 5 seconds
  }

  private stopAlertSystem(): void {
    if (this.alertsInterval) {
      clearInterval(this.alertsInterval);
      this.alertsInterval = null;
    }
  }

  private checkPerformanceAlerts(telemetry: LiveTelemetryStream): void {
    // Engine temperature alert
    if (telemetry.engineTemp > 95) {
      this.createAlert({
        type: "mechanical",
        priority: "high",
        title: "High Engine Temperature",
        message: `Engine temperature at ${telemetry.engineTemp.toFixed(1)}°C`,
        actionRequired: true,
        suggestedActions: ["Reduce engine load", "Check cooling system"],
      });
    }

    // Low fuel alert
    if (telemetry.fuelLevel < 15) {
      this.createAlert({
        type: "strategy",
        priority: "medium",
        title: "Low Fuel Level",
        message: `Fuel level at ${telemetry.fuelLevel.toFixed(1)}%`,
        actionRequired: false,
        suggestedActions: ["Plan fuel strategy", "Consider pit stop"],
      });
    }

    // High G-force alert
    const totalG = Math.sqrt(
      telemetry.lateralG ** 2 + telemetry.longitudinalG ** 2,
    );
    if (totalG > 3.0) {
      this.createAlert({
        type: "performance",
        priority: "low",
        title: "High G-Force Detected",
        message: `Total G-force: ${totalG.toFixed(2)}G`,
        actionRequired: false,
      });
    }
  }

  private checkWeatherAlerts(weather: WeatherConditions): void {
    if (weather.condition !== "dry") {
      this.createAlert({
        type: "weather",
        priority: "high",
        title: "Track Conditions Changed",
        message: `Track is now ${weather.condition}`,
        actionRequired: true,
        suggestedActions: ["Consider tire change", "Adjust driving style"],
      });
    }

    if (weather.rainfall > 2) {
      this.createAlert({
        type: "weather",
        priority: "critical",
        title: "Heavy Rainfall",
        message: `Rainfall rate: ${weather.rainfall.toFixed(1)}mm/h`,
        actionRequired: true,
        suggestedActions: ["Switch to wet tires", "Reduce speed"],
      });
    }
  }

  private checkSystemAlerts(): void {
    // Check various system conditions
    if (this.telemetryStream && this.currentSession) {
      const sessionTime =
        (Date.now() - this.currentSession.startTime) / 1000 / 60; // minutes

      // Session duration alerts
      if (sessionTime > 30 && !this.hasAlertType("session_duration")) {
        this.createAlert({
          type: "strategy",
          priority: "low",
          title: "Long Session Duration",
          message: `Session running for ${sessionTime.toFixed(0)} minutes`,
          actionRequired: false,
        });
      }
    }
  }

  private createAlert(
    alertData: Omit<CommandCenterAlert, "id" | "timestamp" | "acknowledged">,
  ): void {
    const alert: CommandCenterAlert = {
      ...alertData,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      acknowledged: false,
    };

    this.activeAlerts.unshift(alert);
    this.activeAlerts = this.activeAlerts.slice(0, 50); // Keep last 50 alerts

    // Voice announcement for critical alerts
    if (alert.priority === "critical" && this.speechSynthesis) {
      this.announceMessage(alert.message, "critical");
    }

    this.notifyAlertListeners(alert);
  }

  // Voice System
  private processVoiceCommand(transcript: string, confidence: number): void {
    const command: VoiceCommand = {
      command: transcript.toLowerCase().trim(),
      confidence,
      timestamp: Date.now(),
    };

    this.voiceCommands.unshift(command);
    this.voiceCommands = this.voiceCommands.slice(0, 20); // Keep last 20 commands

    // Process specific commands
    if (confidence > 0.7) {
      this.handleVoiceCommand(command);
    }

    this.notifyVoiceListeners(command);
  }

  private handleVoiceCommand(command: VoiceCommand): void {
    const cmd = command.command;

    if (cmd.includes("status") || cmd.includes("report")) {
      this.giveStatusReport();
    } else if (cmd.includes("lap time")) {
      this.announceLapTime();
    } else if (cmd.includes("fuel")) {
      this.announceFuelStatus();
    } else if (cmd.includes("temperature")) {
      this.announceTemperatureStatus();
    } else if (cmd.includes("weather")) {
      this.announceWeatherStatus();
    } else if (cmd.includes("strategy")) {
      this.announceStrategy();
    }
  }

  private announceMessage(
    message: string,
    priority: "info" | "warning" | "critical",
  ): void {
    if (!this.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = priority === "critical" ? 1.2 : 1.0;
    utterance.pitch = priority === "critical" ? 1.2 : 1.0;
    utterance.volume = priority === "critical" ? 1.0 : 0.8;

    this.speechSynthesis.speak(utterance);
  }

  private giveStatusReport(): void {
    if (!this.telemetryStream || !this.currentSession) return;

    const speed = this.telemetryStream.speed.toFixed(0);
    const rpm = this.telemetryStream.rpm.toFixed(0);
    const fuel = this.telemetryStream.fuelLevel.toFixed(0);

    this.announceMessage(
      `Status report: Speed ${speed} kilometers per hour, RPM ${rpm}, fuel ${fuel} percent`,
      "info",
    );
  }

  private announceLapTime(): void {
    if (!this.currentSession?.bestLapTime) {
      this.announceMessage("No lap time available", "info");
      return;
    }

    const minutes = Math.floor(this.currentSession.bestLapTime / 60000);
    const seconds = ((this.currentSession.bestLapTime % 60000) / 1000).toFixed(
      3,
    );

    this.announceMessage(
      `Best lap time: ${minutes} minutes ${seconds} seconds`,
      "info",
    );
  }

  private announceFuelStatus(): void {
    if (!this.telemetryStream) return;

    const fuel = this.telemetryStream.fuelLevel.toFixed(0);
    this.announceMessage(`Fuel level: ${fuel} percent`, "info");
  }

  private announceTemperatureStatus(): void {
    if (!this.telemetryStream) return;

    const temp = this.telemetryStream.engineTemp.toFixed(0);
    this.announceMessage(`Engine temperature: ${temp} degrees celsius`, "info");
  }

  private announceWeatherStatus(): void {
    if (!this.weatherConditions) return;

    const temp = this.weatherConditions.temperature.toFixed(0);
    const condition = this.weatherConditions.condition;

    this.announceMessage(
      `Weather: ${temp} degrees, track is ${condition}`,
      "info",
    );
  }

  private announceStrategy(): void {
    if (!this.strategy) return;

    const fuelLaps = this.strategy.fuelStrategy.lapsRemaining;
    this.announceMessage(`Fuel remaining for ${fuelLaps} laps`, "info");
  }

  // Strategy Management
  private initializeStrategy(): void {
    if (!this.currentSession) return;

    this.strategy = {
      fuelStrategy: {
        currentFuel: 100,
        targetConsumption: 2.5, // per lap
        lapsRemaining: 40,
        fuelRequired: 100,
        margin: 5,
      },
      tireStrategy: {
        currentCompound: "medium",
        currentAge: 0,
        degradation: 0,
        recommendedChange: 25,
        targetCompound: "soft",
      },
      lapStrategy: {
        currentPace: 85000, // milliseconds
        targetPace: 83000,
        pushLaps: [5, 10, 15],
        conserveLaps: [20, 25, 30],
        pitWindow: { start: 15, end: 25 },
      },
    };

    this.notifyStrategyListeners(this.strategy);
  }

  // Voice Control
  startVoiceRecognition(): boolean {
    if (!this.speechRecognition) return false;

    try {
      this.speechRecognition.start();
      this.isVoiceActive = true;
      return true;
    } catch (error) {
      console.error("Voice recognition error:", error);
      return false;
    }
  }

  stopVoiceRecognition(): void {
    if (this.speechRecognition && this.isVoiceActive) {
      this.speechRecognition.stop();
      this.isVoiceActive = false;
    }
  }

  // Utility methods
  private updateSessionFromLapTiming(session: any): void {
    if (!this.currentSession) return;

    this.currentSession.currentLap = session.currentLap;
    this.currentSession.bestLapTime = session.bestLap?.lapTime;
    this.currentSession.duration = Date.now() - this.currentSession.startTime;

    this.notifySessionListeners();
  }

  private updateTelemetryFromOBD(obdData: LiveOBDData): void {
    if (!this.telemetryStream) return;

    // Update telemetry with real OBD data
    this.telemetryStream.speed = obdData.speed;
    this.telemetryStream.rpm = obdData.rpm;
    this.telemetryStream.throttle = obdData.throttlePosition;
    this.telemetryStream.engineTemp = obdData.coolantTemp;
    this.telemetryStream.fuelLevel =
      obdData.fuelLevel || this.telemetryStream.fuelLevel;

    this.notifyTelemetryListeners(this.telemetryStream);
  }

  private handleLapCompletion(lap: LapData): void {
    if (!this.currentSession) return;

    // Update best lap time
    if (
      !this.currentSession.bestLapTime ||
      lap.lapTime < this.currentSession.bestLapTime
    ) {
      this.currentSession.bestLapTime = lap.lapTime;

      if (this.speechSynthesis) {
        const minutes = Math.floor(lap.lapTime / 60000);
        const seconds = ((lap.lapTime % 60000) / 1000).toFixed(3);
        this.announceMessage(
          `New best lap: ${minutes} minutes ${seconds} seconds`,
          "info",
        );
      }
    }

    this.notifySessionListeners();
  }

  private hasAlertType(type: string): boolean {
    return this.activeAlerts.some((alert) =>
      alert.title.toLowerCase().includes(type),
    );
  }

  // Event listener management
  private notifySessionListeners(): void {
    this.sessionListeners.forEach((listener) => {
      try {
        listener(this.currentSession);
      } catch (error) {
        console.error("Session listener error:", error);
      }
    });
  }

  private notifyTelemetryListeners(telemetry: LiveTelemetryStream): void {
    this.telemetryListeners.forEach((listener) => {
      try {
        listener(telemetry);
      } catch (error) {
        console.error("Telemetry listener error:", error);
      }
    });
  }

  private notifyWeatherListeners(weather: WeatherConditions): void {
    this.weatherListeners.forEach((listener) => {
      try {
        listener(weather);
      } catch (error) {
        console.error("Weather listener error:", error);
      }
    });
  }

  private notifyAlertListeners(alert: CommandCenterAlert): void {
    this.alertListeners.forEach((listener) => {
      try {
        listener(alert);
      } catch (error) {
        console.error("Alert listener error:", error);
      }
    });
  }

  private notifyStrategyListeners(strategy: RaceStrategy): void {
    this.strategyListeners.forEach((listener) => {
      try {
        listener(strategy);
      } catch (error) {
        console.error("Strategy listener error:", error);
      }
    });
  }

  private notifyVoiceListeners(command: VoiceCommand): void {
    this.voiceListeners.forEach((listener) => {
      try {
        listener(command);
      } catch (error) {
        console.error("Voice listener error:", error);
      }
    });
  }

  // Public API
  getCurrentSession(): LiveRacingSession | null {
    return this.currentSession;
  }

  getCurrentTelemetry(): LiveTelemetryStream | null {
    return this.telemetryStream;
  }

  getCurrentWeather(): WeatherConditions | null {
    return this.weatherConditions;
  }

  getActiveAlerts(): CommandCenterAlert[] {
    return [...this.activeAlerts];
  }

  getCurrentStrategy(): RaceStrategy | null {
    return this.strategy;
  }

  getRecentVoiceCommands(): VoiceCommand[] {
    return [...this.voiceCommands];
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  isVoiceRecognitionActive(): boolean {
    return this.isVoiceActive;
  }

  isVoiceSupported(): boolean {
    return !!(this.speechSynthesis && this.speechRecognition);
  }

  // Event subscriptions
  onSessionUpdate(
    callback: (session: LiveRacingSession | null) => void,
  ): () => void {
    this.sessionListeners.add(callback);
    return () => this.sessionListeners.delete(callback);
  }

  onTelemetryUpdate(
    callback: (telemetry: LiveTelemetryStream) => void,
  ): () => void {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  onWeatherUpdate(callback: (weather: WeatherConditions) => void): () => void {
    this.weatherListeners.add(callback);
    return () => this.weatherListeners.delete(callback);
  }

  onAlert(callback: (alert: CommandCenterAlert) => void): () => void {
    this.alertListeners.add(callback);
    return () => this.alertListeners.delete(callback);
  }

  onStrategyUpdate(callback: (strategy: RaceStrategy) => void): () => void {
    this.strategyListeners.add(callback);
    return () => this.strategyListeners.delete(callback);
  }

  onVoiceCommand(callback: (command: VoiceCommand) => void): () => void {
    this.voiceListeners.add(callback);
    return () => this.voiceListeners.delete(callback);
  }
}

// Global instance
export const racingCommandCenterService = new RacingCommandCenterService();

// Export types
export type {
  LiveRacingSession,
  LiveTelemetryStream,
  WeatherConditions,
  TrafficAlert,
  RaceStrategy,
  VoiceCommand,
  CommandCenterAlert,
};
