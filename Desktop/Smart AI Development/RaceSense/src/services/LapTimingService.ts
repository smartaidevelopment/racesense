// Advanced GPS lap timing with automatic track detection
// Real-world racing integration for live session recording

interface GPSPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number; // km/h
  accuracy: number;
  heading?: number;
}

interface TrackPoint {
  lat: number;
  lng: number;
}

interface RacingTrack {
  id: string;
  name: string;
  country: string;
  type: "circuit" | "autocross" | "hillclimb" | "drag" | "rally";
  startFinishLine: {
    point1: TrackPoint;
    point2: TrackPoint;
  };
  sectors?: TrackPoint[][];
  trackMap: TrackPoint[];
  metadata: {
    length: number; // meters
    elevation: number; // meters
    surface: "asphalt" | "concrete" | "gravel" | "mixed";
    direction: "clockwise" | "counterclockwise" | "point-to-point";
  };
}

interface LapData {
  lapNumber: number;
  startTime: number;
  endTime: number;
  lapTime: number; // milliseconds
  maxSpeed: number;
  averageSpeed: number;
  sectors: {
    time: number;
    maxSpeed: number;
  }[];
  gpsPoints: GPSPoint[];
  trackId: string;
  isValidLap: boolean;
}

interface GPSError {
  code: number;
  message: string;
  userMessage: string;
  timestamp: number;
}

interface GPSPermissionStatus {
  state: "granted" | "denied" | "prompt" | "unknown";
  canRequest: boolean;
}

interface LiveSession {
  sessionId: string;
  trackId?: string;
  startTime: number;
  currentLap: number;
  laps: LapData[];
  isRecording: boolean;
  currentGPSPoints: GPSPoint[];
  lastCrossedStartFinish: number;
  bestLap?: LapData;
  gpsPermissionStatus?: GPSPermissionStatus;
  lastGPSError?: GPSError;
}

class LapTimingService {
  private knownTracks: Map<string, RacingTrack> = new Map();
  private currentSession: LiveSession | null = null;
  private gpsWatchId: number | null = null;
  private lastGPSPoint: GPSPoint | null = null;
  private sessionListeners: Set<(session: LiveSession) => void> = new Set();
  private lapListeners: Set<(lap: LapData) => void> = new Set();
  private gpsErrorListeners: Set<(error: GPSError) => void> = new Set();

  constructor() {
    this.initializeKnownTracks();
  }

  private initializeKnownTracks() {
    // Famous racing circuits with GPS coordinates
    const tracks: RacingTrack[] = [
      {
        id: "silverstone-gp",
        name: "Silverstone Grand Prix Circuit",
        country: "United Kingdom",
        type: "circuit",
        startFinishLine: {
          point1: { lat: 52.0786, lng: -1.0169 },
          point2: { lat: 52.0784, lng: -1.0165 },
        },
        trackMap: this.generateSilverstoneTrackMap(),
        metadata: {
          length: 5891,
          elevation: 15,
          surface: "asphalt",
          direction: "clockwise",
        },
      },
      {
        id: "nurburgring-gp",
        name: "Nürburgring Grand Prix Circuit",
        country: "Germany",
        type: "circuit",
        startFinishLine: {
          point1: { lat: 50.3356, lng: 6.9475 },
          point2: { lat: 50.3354, lng: 6.9471 },
        },
        trackMap: this.generateNurburgringTrackMap(),
        metadata: {
          length: 5148,
          elevation: 45,
          surface: "asphalt",
          direction: "clockwise",
        },
      },
      {
        id: "spa-francorchamps",
        name: "Circuit de Spa-Francorchamps",
        country: "Belgium",
        type: "circuit",
        startFinishLine: {
          point1: { lat: 50.4372, lng: 5.9714 },
          point2: { lat: 50.437, lng: 5.971 },
        },
        trackMap: this.generateSpaTrackMap(),
        metadata: {
          length: 7004,
          elevation: 100,
          surface: "asphalt",
          direction: "clockwise",
        },
      },
      // Generic autocross/local track template
      {
        id: "autocross-generic",
        name: "Local Autocross Course",
        country: "Various",
        type: "autocross",
        startFinishLine: {
          point1: { lat: 0, lng: 0 }, // Will be auto-detected
          point2: { lat: 0, lng: 0 },
        },
        trackMap: [],
        metadata: {
          length: 800,
          elevation: 5,
          surface: "asphalt",
          direction: "clockwise",
        },
      },
    ];

    tracks.forEach((track) => {
      this.knownTracks.set(track.id, track);
    });
  }

  // Start a new racing session
  async startSession(trackId?: string): Promise<string> {
    // Check GPS permission first
    const permissionStatus = await this.checkGPSPermission();

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.currentSession = {
      sessionId,
      trackId,
      startTime: Date.now(),
      currentLap: 0,
      laps: [],
      isRecording: true,
      currentGPSPoints: [],
      lastCrossedStartFinish: 0,
      gpsPermissionStatus: permissionStatus,
    };

    // Start GPS tracking with high accuracy
    await this.startGPSTracking();

    return sessionId;
  }

  // Stop current session
  stopSession(): LiveSession | null {
    if (this.gpsWatchId) {
      navigator.geolocation.clearWatch(this.gpsWatchId);
      this.gpsWatchId = null;
    }

    if (this.currentSession) {
      this.currentSession.isRecording = false;

      // Complete current lap if in progress
      if (this.currentSession.currentGPSPoints.length > 0) {
        this.completeLap();
      }
    }

    const session = this.currentSession;
    this.currentSession = null;
    return session;
  }

  private async startGPSTracking(): Promise<void> {
    if (!navigator.geolocation) {
      throw new Error("GPS not available on this device");
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000,
    };

    this.gpsWatchId = navigator.geolocation.watchPosition(
      (position) => this.handleGPSUpdate(position),
      (error) => this.handleGPSError(error),
      options,
    );
  }

  private handleGPSUpdate(position: GeolocationPosition) {
    if (!this.currentSession?.isRecording) return;

    const gpsPoint: GPSPoint = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: Date.now(),
      speed: (position.coords.speed || 0) * 3.6, // Convert m/s to km/h
      accuracy: position.coords.accuracy,
      heading: position.coords.heading || undefined,
    };

    this.currentSession.currentGPSPoints.push(gpsPoint);

    // Auto-detect track if not specified
    if (!this.currentSession.trackId) {
      this.detectTrack(gpsPoint);
    }

    // Check for start/finish line crossing
    if (this.currentSession.trackId) {
      this.checkStartFinishCrossing(gpsPoint);
    }

    this.lastGPSPoint = gpsPoint;
    this.notifySessionUpdate();
  }

  private detectTrack(gpsPoint: GPSPoint): void {
    for (const [trackId, track] of this.knownTracks) {
      if (this.isNearTrack(gpsPoint, track)) {
        this.currentSession!.trackId = trackId;
        console.log(`Track detected: ${track.name}`);
        break;
      }
    }
  }

  private isNearTrack(gpsPoint: GPSPoint, track: RacingTrack): boolean {
    const threshold = 200; // meters

    // Check if GPS point is near start/finish line
    const distanceToStart = this.calculateDistance(
      gpsPoint.latitude,
      gpsPoint.longitude,
      track.startFinishLine.point1.lat,
      track.startFinishLine.point1.lng,
    );

    return distanceToStart < threshold;
  }

  private checkStartFinishCrossing(gpsPoint: GPSPoint): void {
    if (!this.currentSession?.trackId || !this.lastGPSPoint) return;

    const track = this.knownTracks.get(this.currentSession.trackId);
    if (!track) return;

    const currentDistance = this.distanceToStartFinishLine(gpsPoint, track);
    const lastDistance = this.distanceToStartFinishLine(
      this.lastGPSPoint,
      track,
    );

    // Detect crossing (distance decreased significantly)
    if (lastDistance > 50 && currentDistance < 20 && gpsPoint.speed > 10) {
      this.handleStartFinishCrossing();
    }
  }

  private handleStartFinishCrossing(): void {
    if (!this.currentSession) return;

    const now = Date.now();

    // Complete current lap if it's not the first crossing
    if (this.currentSession.currentLap > 0) {
      this.completeLap();
    }

    // Start new lap
    this.currentSession.currentLap++;
    this.currentSession.lastCrossedStartFinish = now;
    this.currentSession.currentGPSPoints = []; // Reset GPS points for new lap

    console.log(`Starting lap ${this.currentSession.currentLap}`);
  }

  private completeLap(): void {
    if (
      !this.currentSession ||
      this.currentSession.currentGPSPoints.length < 10
    )
      return;

    const lapData = this.calculateLapData();
    this.currentSession.laps.push(lapData);

    // Update best lap
    if (
      !this.currentSession.bestLap ||
      lapData.lapTime < this.currentSession.bestLap.lapTime
    ) {
      this.currentSession.bestLap = lapData;
    }

    this.notifyLapComplete(lapData);
    console.log(
      `Lap ${lapData.lapNumber} completed: ${(lapData.lapTime / 1000).toFixed(3)}s`,
    );
  }

  private calculateLapData(): LapData {
    const points = this.currentSession!.currentGPSPoints;
    const startTime = points[0].timestamp;
    const endTime = points[points.length - 1].timestamp;

    const speeds = points.map((p) => p.speed).filter((s) => s > 0);
    const maxSpeed = Math.max(...speeds);
    const averageSpeed =
      speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;

    return {
      lapNumber: this.currentSession!.currentLap,
      startTime,
      endTime,
      lapTime: endTime - startTime,
      maxSpeed,
      averageSpeed,
      sectors: this.calculateSectorTimes(points),
      gpsPoints: [...points],
      trackId: this.currentSession!.trackId || "unknown",
      isValidLap: this.validateLap(points),
    };
  }

  private calculateSectorTimes(
    points: GPSPoint[],
  ): { time: number; maxSpeed: number }[] {
    // Simple 3-sector split for now
    const sectorSize = Math.floor(points.length / 3);
    const sectors = [];

    for (let i = 0; i < 3; i++) {
      const start = i * sectorSize;
      const end = i === 2 ? points.length : (i + 1) * sectorSize;
      const sectorPoints = points.slice(start, end);

      if (sectorPoints.length > 0) {
        const sectorTime =
          sectorPoints[sectorPoints.length - 1].timestamp -
          sectorPoints[0].timestamp;
        const maxSpeed = Math.max(...sectorPoints.map((p) => p.speed));

        sectors.push({ time: sectorTime, maxSpeed });
      }
    }

    return sectors;
  }

  private validateLap(points: GPSPoint[]): boolean {
    if (points.length < 10) return false; // Too few GPS points

    const lapTime = points[points.length - 1].timestamp - points[0].timestamp;
    if (lapTime < 30000) return false; // Less than 30 seconds (likely invalid)

    const maxSpeed = Math.max(...points.map((p) => p.speed));
    if (maxSpeed < 20) return false; // Too slow (likely walking pace)

    return true;
  }

  private distanceToStartFinishLine(
    point: GPSPoint,
    track: RacingTrack,
  ): number {
    return this.calculateDistance(
      point.latitude,
      point.longitude,
      track.startFinishLine.point1.lat,
      track.startFinishLine.point1.lng,
    );
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private handleGPSError(error: GeolocationPositionError) {
    let userMessage = "";
    let technicalMessage = error.message;

    switch (error.code) {
      case GeolocationPositionError.PERMISSION_DENIED:
        userMessage =
          "GPS access was denied. Please enable location permissions for lap timing to work.";
        break;
      case GeolocationPositionError.POSITION_UNAVAILABLE:
        userMessage =
          "GPS position unavailable. Please ensure you're in an area with GPS signal.";
        break;
      case GeolocationPositionError.TIMEOUT:
        userMessage = "GPS timeout. Trying to reconnect...";
        break;
      default:
        userMessage = "GPS error occurred. Please check your device settings.";
    }

    // Notify error listeners
    this.gpsErrorListeners.forEach((callback) => {
      try {
        callback({
          code: error.code,
          message: technicalMessage,
          userMessage,
          timestamp: Date.now(),
        });
      } catch (callbackError) {
        console.error("GPS error callback failed:", callbackError);
      }
    });

    console.error("GPS Error:", technicalMessage, "User message:", userMessage);

    // Stop current session if GPS fails
    if (this.currentSession?.isRecording) {
      this.currentSession.isRecording = false;
      this.notifySessionUpdate();
    }
  }

  // GPS Permission Management
  async checkGPSPermission(): Promise<GPSPermissionStatus> {
    if (!navigator.geolocation) {
      return { state: "unknown", canRequest: false };
    }

    // Check if Permissions API is available
    if ("permissions" in navigator) {
      try {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        return {
          state: permission.state as "granted" | "denied" | "prompt",
          canRequest: permission.state !== "denied",
        };
      } catch (error) {
        console.warn("Permissions API not fully supported:", error);
      }
    }

    // Fallback: assume we can request
    return { state: "unknown", canRequest: true };
  }

  async requestGPSPermission(): Promise<boolean> {
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            maximumAge: 300000,
            enableHighAccuracy: false, // Use low accuracy for permission test
          });
        },
      );

      return true;
    } catch (error) {
      const gpsError = error as GeolocationPositionError;
      this.handleGPSError(gpsError);
      return false;
    }
  }

  // Event listeners
  onSessionUpdate(callback: (session: LiveSession) => void): () => void {
    this.sessionListeners.add(callback);
    return () => this.sessionListeners.delete(callback);
  }

  onLapComplete(callback: (lap: LapData) => void): () => void {
    this.lapListeners.add(callback);
    return () => this.lapListeners.delete(callback);
  }

  onGPSError(callback: (error: GPSError) => void): () => void {
    this.gpsErrorListeners.add(callback);
    return () => this.gpsErrorListeners.delete(callback);
  }

  private notifySessionUpdate() {
    if (this.currentSession) {
      this.sessionListeners.forEach((callback) => {
        try {
          callback(this.currentSession!);
        } catch (error) {
          console.error("Session update callback error:", error);
        }
      });
    }
  }

  private notifyLapComplete(lap: LapData) {
    this.lapListeners.forEach((callback) => {
      try {
        callback(lap);
      } catch (error) {
        console.error("Lap complete callback error:", error);
      }
    });
  }

  // Public getters
  getCurrentSession(): LiveSession | null {
    return this.currentSession;
  }

  getKnownTracks(): RacingTrack[] {
    return Array.from(this.knownTracks.values());
  }

  getTrack(trackId: string): RacingTrack | undefined {
    return this.knownTracks.get(trackId);
  }

  // Track map generators (simplified for demo)
  private generateSilverstoneTrackMap(): TrackPoint[] {
    // Simplified Silverstone outline
    return [
      { lat: 52.0786, lng: -1.0169 }, // Start/Finish
      { lat: 52.0795, lng: -1.0145 }, // Turn 1
      { lat: 52.081, lng: -1.0125 }, // Turn 2
      { lat: 52.0825, lng: -1.014 }, // Turn 3
      { lat: 52.0835, lng: -1.018 }, // Turn 4
      { lat: 52.082, lng: -1.022 }, // Turn 5
      { lat: 52.08, lng: -1.024 }, // Turn 6
      { lat: 52.078, lng: -1.022 }, // Turn 7
      { lat: 52.077, lng: -1.019 }, // Turn 8
      { lat: 52.0786, lng: -1.0169 }, // Back to start
    ];
  }

  private generateNurburgringTrackMap(): TrackPoint[] {
    // Simplified Nürburgring GP outline
    return [
      { lat: 50.3356, lng: 6.9475 }, // Start/Finish
      { lat: 50.3365, lng: 6.949 }, // Turn 1
      { lat: 50.3375, lng: 6.951 }, // Turn 2
      { lat: 50.338, lng: 6.9535 }, // Turn 3
      { lat: 50.337, lng: 6.9555 }, // Turn 4
      { lat: 50.335, lng: 6.9565 }, // Turn 5
      { lat: 50.333, lng: 6.955 }, // Turn 6
      { lat: 50.332, lng: 6.952 }, // Turn 7
      { lat: 50.3335, lng: 6.949 }, // Turn 8
      { lat: 50.3356, lng: 6.9475 }, // Back to start
    ];
  }

  private generateSpaTrackMap(): TrackPoint[] {
    // Simplified Spa-Francorchamps outline
    return [
      { lat: 50.4372, lng: 5.9714 }, // Start/Finish
      { lat: 50.4385, lng: 5.973 }, // Turn 1 (La Source)
      { lat: 50.4405, lng: 5.976 }, // Eau Rouge
      { lat: 50.4425, lng: 5.979 }, // Raidillon
      { lat: 50.4445, lng: 5.982 }, // Kemmel Straight
      { lat: 50.4425, lng: 5.985 }, // Les Combes
      { lat: 50.4395, lng: 5.982 }, // Malmedy
      { lat: 50.4375, lng: 5.978 }, // Rivage
      { lat: 50.436, lng: 5.974 }, // Pouhon
      { lat: 50.4372, lng: 5.9714 }, // Back to start
    ];
  }
}

// Global instance
export const lapTimingService = new LapTimingService();

// Export types for use in components
export type {
  GPSPoint,
  RacingTrack,
  LapData,
  LiveSession,
  GPSError,
  GPSPermissionStatus,
};
