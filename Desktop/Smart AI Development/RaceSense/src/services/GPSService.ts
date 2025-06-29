interface GPSPosition {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  speed?: number; // m/s
  heading?: number; // degrees
  timestamp: number;
}

interface GPSLap {
  id: string;
  startTime: number;
  endTime?: number;
  positions: GPSPosition[];
  sectors: GPSSector[];
  bestSpeed: number;
  averageSpeed: number;
  distance: number;
}

interface GPSSector {
  id: number;
  startPosition: GPSPosition;
  endPosition?: GPSPosition;
  time?: number;
  topSpeed: number;
}

interface TrackBoundary {
  name: string;
  startFinishLine: {
    lat: number;
    lng: number;
    bearing: number; // direction perpendicular to start/finish line
  };
  sectors: Array<{
    id: number;
    lat: number;
    lng: number;
    name: string;
  }>;
  trackLength: number; // meters
}

// Real racing track coordinates
const RACING_TRACKS: { [key: string]: TrackBoundary } = {
  silverstone: {
    name: "Silverstone Circuit",
    startFinishLine: {
      lat: 52.0707,
      lng: -1.0174,
      bearing: 180, // degrees
    },
    sectors: [
      { id: 1, lat: 52.0725, lng: -1.0145, name: "Sector 1" },
      { id: 2, lat: 52.0689, lng: -1.0089, name: "Sector 2" },
      { id: 3, lat: 52.0678, lng: -1.0198, name: "Sector 3" },
    ],
    trackLength: 5891, // meters
  },
  spa: {
    name: "Circuit de Spa-Francorchamps",
    startFinishLine: {
      lat: 50.4372,
      lng: 5.9714,
      bearing: 90,
    },
    sectors: [
      { id: 1, lat: 50.4425, lng: 5.9801, name: "Eau Rouge" },
      { id: 2, lat: 50.4321, lng: 6.0089, name: "Les Combes" },
      { id: 3, lat: 50.4298, lng: 5.9867, name: "Stavelot" },
    ],
    trackLength: 7004,
  },
  monza: {
    name: "Autodromo Nazionale di Monza",
    startFinishLine: {
      lat: 45.6156,
      lng: 9.2811,
      bearing: 0,
    },
    sectors: [
      { id: 1, lat: 45.6189, lng: 9.2756, name: "Curva Grande" },
      { id: 2, lat: 45.6078, lng: 9.2701, name: "Lesmo" },
      { id: 3, lat: 45.6123, lng: 9.2889, name: "Parabolica" },
    ],
    trackLength: 5793,
  },
};

type GPSListener = (position: GPSPosition) => void;
type LapListener = (lap: GPSLap) => void;
type SectorListener = (sector: GPSSector, lap: GPSLap) => void;

class GPSTrackingService {
  private watchId: number | null = null;
  private currentLap: GPSLap | null = null;
  private laps: GPSLap[] = [];
  private currentTrack: TrackBoundary | null = null;
  private isTracking = false;
  private lastPosition: GPSPosition | null = null;

  private positionListeners: GPSListener[] = [];
  private lapListeners: LapListener[] = [];
  private sectorListeners: SectorListener[] = [];

  // GPS options for high accuracy
  private readonly gpsOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 1000, // 1 second max age
  };

  constructor() {
    this.detectTrack();
  }

  // Check if GPS is available
  isGPSAvailable(): boolean {
    return "geolocation" in navigator;
  }

  // Start GPS tracking
  async startTracking(): Promise<void> {
    if (!this.isGPSAvailable()) {
      throw new Error("GPS not available on this device");
    }

    if (this.isTracking) {
      console.warn("GPS tracking already active");
      return;
    }

    return new Promise((resolve, reject) => {
      // Get initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.isTracking = true;
          this.handlePositionUpdate(position);

          // Start continuous tracking
          this.watchId = navigator.geolocation.watchPosition(
            (pos) => this.handlePositionUpdate(pos),
            (error) => this.handleGPSError(error),
            this.gpsOptions,
          );

          resolve();
        },
        (error) => {
          reject(new Error(`GPS initialization failed: ${error.message}`));
        },
        this.gpsOptions,
      );
    });
  }

  // Stop GPS tracking
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;

    // Complete current lap if active
    if (this.currentLap && !this.currentLap.endTime) {
      this.completeLap();
    }
  }

  // Auto-detect which racing track we're at
  private async detectTrack(): Promise<void> {
    if (!this.isGPSAvailable()) return;

    try {
      const position = await this.getCurrentPosition();
      const detected = this.findNearestTrack(position);

      if (detected) {
        this.currentTrack = detected;
        console.log(`Detected track: ${detected.name}`);
      }
    } catch (error) {
      console.warn("Track detection failed:", error);
    }
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        this.gpsOptions,
      );
    });
  }

  private findNearestTrack(
    position: GeolocationPosition,
  ): TrackBoundary | null {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    const maxDistance = 10000; // 10km radius

    for (const track of Object.values(RACING_TRACKS)) {
      const distance = this.calculateDistance(
        userLat,
        userLng,
        track.startFinishLine.lat,
        track.startFinishLine.lng,
      );

      if (distance <= maxDistance) {
        return track;
      }
    }

    return null;
  }

  private handlePositionUpdate(position: GeolocationPosition): void {
    const gpsPosition: GPSPosition = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude || undefined,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined,
      timestamp: position.timestamp,
    };

    // Calculate speed if not provided by GPS
    if (!gpsPosition.speed && this.lastPosition) {
      gpsPosition.speed = this.calculateSpeed(this.lastPosition, gpsPosition);
    }

    this.lastPosition = gpsPosition;

    // Notify position listeners
    this.positionListeners.forEach((listener) => {
      try {
        listener(gpsPosition);
      } catch (error) {
        console.warn("Position listener error:", error);
      }
    });

    // Handle lap and sector detection
    if (this.currentTrack) {
      this.processRacingPosition(gpsPosition);
    }
  }

  private calculateSpeed(pos1: GPSPosition, pos2: GPSPosition): number {
    const distance = this.calculateDistance(
      pos1.latitude,
      pos1.longitude,
      pos2.latitude,
      pos2.longitude,
    );
    const timeDiff = (pos2.timestamp - pos1.timestamp) / 1000; // seconds
    return timeDiff > 0 ? distance / timeDiff : 0; // m/s
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private processRacingPosition(position: GPSPosition): void {
    if (!this.currentTrack) return;

    // Check if crossing start/finish line
    if (this.isNearStartFinish(position)) {
      if (this.currentLap) {
        this.completeLap();
      }
      this.startNewLap(position);
    }

    // Add position to current lap
    if (this.currentLap) {
      this.currentLap.positions.push(position);
      this.updateLapMetrics(position);
      this.checkSectorCrossing(position);
    }
  }

  private isNearStartFinish(position: GPSPosition): boolean {
    if (!this.currentTrack) return false;

    const distance = this.calculateDistance(
      position.latitude,
      position.longitude,
      this.currentTrack.startFinishLine.lat,
      this.currentTrack.startFinishLine.lng,
    );

    return distance <= 50; // 50 meter threshold
  }

  private startNewLap(position: GPSPosition): void {
    this.currentLap = {
      id: `lap-${Date.now()}`,
      startTime: position.timestamp,
      positions: [position],
      sectors: [],
      bestSpeed: position.speed || 0,
      averageSpeed: 0,
      distance: 0,
    };

    console.log(`New lap started: ${this.currentLap.id}`);
  }

  private completeLap(): void {
    if (!this.currentLap) return;

    this.currentLap.endTime = Date.now();
    this.calculateFinalLapMetrics();
    this.laps.push({ ...this.currentLap });

    // Notify lap completion
    this.lapListeners.forEach((listener) => {
      try {
        if (this.currentLap) listener(this.currentLap);
      } catch (error) {
        console.warn("Lap listener error:", error);
      }
    });

    console.log(
      `Lap completed: ${this.currentLap.id}, Time: ${(
        (this.currentLap.endTime - this.currentLap.startTime) /
        1000
      ).toFixed(3)}s`,
    );
  }

  private updateLapMetrics(position: GPSPosition): void {
    if (!this.currentLap) return;

    // Update best speed
    const currentSpeed = position.speed || 0;
    if (currentSpeed > this.currentLap.bestSpeed) {
      this.currentLap.bestSpeed = currentSpeed;
    }

    // Calculate distance
    if (this.currentLap.positions.length > 1) {
      const lastPos =
        this.currentLap.positions[this.currentLap.positions.length - 2];
      const distance = this.calculateDistance(
        lastPos.latitude,
        lastPos.longitude,
        position.latitude,
        position.longitude,
      );
      this.currentLap.distance += distance;
    }
  }

  private calculateFinalLapMetrics(): void {
    if (!this.currentLap || this.currentLap.positions.length < 2) return;

    const totalTime =
      (this.currentLap.endTime! - this.currentLap.startTime) / 1000;
    this.currentLap.averageSpeed = this.currentLap.distance / totalTime;
  }

  private checkSectorCrossing(position: GPSPosition): void {
    if (!this.currentTrack || !this.currentLap) return;

    for (const sector of this.currentTrack.sectors) {
      // Check if we haven't crossed this sector yet in current lap
      const alreadyCrossed = this.currentLap.sectors.some(
        (s) => s.id === sector.id,
      );
      if (alreadyCrossed) continue;

      const distance = this.calculateDistance(
        position.latitude,
        position.longitude,
        sector.lat,
        sector.lng,
      );

      if (distance <= 100) {
        // 100 meter threshold for sector
        const sectorCrossing: GPSSector = {
          id: sector.id,
          startPosition: this.currentLap.positions[0],
          endPosition: position,
          time: position.timestamp - this.currentLap.startTime,
          topSpeed: this.currentLap.bestSpeed,
        };

        this.currentLap.sectors.push(sectorCrossing);

        // Notify sector crossing
        this.sectorListeners.forEach((listener) => {
          try {
            listener(sectorCrossing, this.currentLap!);
          } catch (error) {
            console.warn("Sector listener error:", error);
          }
        });

        console.log(`Sector ${sector.id} crossed: ${sector.name}`);
      }
    }
  }

  private handleGPSError(error: GeolocationPositionError): void {
    console.error("GPS Error:", error);
    let message = "Unknown GPS error";

    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = "GPS access denied by user";
        break;
      case error.POSITION_UNAVAILABLE:
        message = "GPS position unavailable";
        break;
      case error.TIMEOUT:
        message = "GPS timeout";
        break;
    }

    console.error(`GPS Error: ${message}`);
  }

  // Event listeners
  onPositionUpdate(listener: GPSListener): () => void {
    this.positionListeners.push(listener);
    return () => {
      const index = this.positionListeners.indexOf(listener);
      if (index > -1) this.positionListeners.splice(index, 1);
    };
  }

  onLapComplete(listener: LapListener): () => void {
    this.lapListeners.push(listener);
    return () => {
      const index = this.lapListeners.indexOf(listener);
      if (index > -1) this.lapListeners.splice(index, 1);
    };
  }

  onSectorCrossing(listener: SectorListener): () => void {
    this.sectorListeners.push(listener);
    return () => {
      const index = this.sectorListeners.indexOf(listener);
      if (index > -1) this.sectorListeners.splice(index, 1);
    };
  }

  // Getters
  getCurrentTrack(): TrackBoundary | null {
    return this.currentTrack;
  }

  getCurrentLap(): GPSLap | null {
    return this.currentLap;
  }

  getLaps(): GPSLap[] {
    return [...this.laps];
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  // Manual track selection
  setTrack(trackName: string): void {
    const track = RACING_TRACKS[trackName];
    if (track) {
      this.currentTrack = track;
      console.log(`Track manually set to: ${track.name}`);
    }
  }

  getAvailableTracks(): { [key: string]: TrackBoundary } {
    return RACING_TRACKS;
  }
}

export const gpsService = new GPSTrackingService();
export type { GPSPosition, GPSLap, GPSSector, TrackBoundary };
