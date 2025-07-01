// Data Generator Service
// Generates sample session data for testing real analysis functionality

import { SessionData, TelemetryPoint } from "./DataManagementService";
import { dataManagementService } from "./DataManagementService";

class DataGeneratorService {
  // Generate sample session data
  generateSampleSessions(): void {
    const tracks = [
      "Silverstone GP",
      "Spa-Francorchamps",
      "Nürburgring GP",
      "Monaco",
      "Monza",
    ];

    const sessionTypes: SessionData["type"][] = ["practice", "qualifying", "race", "test"];

    // Generate 5 sample sessions
    for (let i = 0; i < 5; i++) {
      const track = tracks[i % tracks.length];
      const sessionType = sessionTypes[i % sessionTypes.length];
      const date = new Date();
      date.setDate(date.getDate() - i * 2); // Sessions every 2 days

      const session: Omit<SessionData, "id"> = {
        name: `${track} ${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} Session ${i + 1}`,
        track,
        type: sessionType,
        date,
        duration: 1800 + Math.random() * 3600, // 30-90 minutes
        bestLapTime: 80000 + Math.random() * 20000, // 1:20-1:40
        totalLaps: 10 + Math.floor(Math.random() * 20), // 10-30 laps
        notes: `Sample ${sessionType} session on ${track}`,
        telemetryData: this.generateTelemetryData(track, sessionType),
        metadata: {
          weather: ["Sunny", "Cloudy", "Light Rain"][Math.floor(Math.random() * 3)],
          temperature: 15 + Math.random() * 20, // 15-35°C
          trackCondition: ["Dry", "Damp", "Wet"][Math.floor(Math.random() * 3)],
        },
      };

      dataManagementService.addSession(session);
    }
  }

  // Generate realistic telemetry data
  private generateTelemetryData(track: string, sessionType: string): TelemetryPoint[] {
    const points: TelemetryPoint[] = [];
    const sessionDuration = 1800 + Math.random() * 3600; // 30-90 minutes
    const interval = 100; // 100ms intervals
    const totalPoints = Math.floor(sessionDuration * 1000 / interval);

    // Track-specific parameters
    const trackParams = this.getTrackParameters(track);
    
    let currentLat = trackParams.startLat;
    let currentLng = trackParams.startLng;
    let currentSpeed = 0;
    let currentRPM = 800;
    let currentThrottle = 0;
    let currentBrake = 0;
    let currentGear = 1;

    for (let i = 0; i < totalPoints; i++) {
      const timestamp = Date.now() - (totalPoints - i) * interval;
      
      // Simulate realistic driving patterns
      const progress = i / totalPoints;
      const lapProgress = (progress * trackParams.laps) % 1;
      
      // Update position based on lap progress
      const newPosition = this.interpolateTrackPosition(trackParams, lapProgress);
      currentLat = newPosition.lat;
      currentLng = newPosition.lng;

      // Simulate speed variations
      const speedVariation = Math.sin(progress * Math.PI * 4) * 0.3 + 1;
      currentSpeed = Math.max(0, Math.min(trackParams.maxSpeed, 
        trackParams.avgSpeed * speedVariation + (Math.random() - 0.5) * 20));

      // Simulate throttle and brake inputs
      if (currentSpeed < trackParams.avgSpeed * 0.8) {
        currentThrottle = Math.min(100, currentThrottle + 10);
        currentBrake = Math.max(0, currentBrake - 5);
      } else if (currentSpeed > trackParams.avgSpeed * 1.2) {
        currentThrottle = Math.max(0, currentThrottle - 5);
        currentBrake = Math.min(100, currentBrake + 10);
      } else {
        currentThrottle = Math.max(0, Math.min(100, currentThrottle + (Math.random() - 0.5) * 10));
        currentBrake = Math.max(0, Math.min(100, currentBrake + (Math.random() - 0.5) * 5));
      }

      // Simulate RPM based on speed and gear
      currentRPM = Math.max(800, Math.min(8000, currentSpeed * 25 + (Math.random() - 0.5) * 500));
      currentGear = Math.max(1, Math.min(6, Math.floor(currentSpeed / 50) + 1));

      const point: TelemetryPoint = {
        timestamp,
        position: { lat: currentLat, lng: currentLng },
        speed: currentSpeed,
        rpm: currentRPM,
        throttle: currentThrottle,
        brake: currentBrake,
        gear: currentGear,
        engineTemp: 85 + Math.random() * 15, // 85-100°C
        gForce: {
          lateral: (Math.random() - 0.5) * 2, // -1 to 1 G
          longitudinal: (Math.random() - 0.5) * 1.5, // -0.75 to 0.75 G
          vertical: 1 + (Math.random() - 0.5) * 0.2, // 0.9 to 1.1 G
        },
        tireTemps: {
          frontLeft: 80 + Math.random() * 20,
          frontRight: 80 + Math.random() * 20,
          rearLeft: 75 + Math.random() * 20,
          rearRight: 75 + Math.random() * 20,
        },
      };

      points.push(point);
    }

    return points;
  }

  // Get track-specific parameters
  private getTrackParameters(track: string) {
    const params = {
      "Silverstone GP": {
        startLat: 52.0736,
        startLng: -1.0169,
        avgSpeed: 180,
        maxSpeed: 320,
        laps: 12,
        length: 5891, // meters
      },
      "Spa-Francorchamps": {
        startLat: 50.4372,
        startLng: 5.9710,
        avgSpeed: 175,
        maxSpeed: 340,
        laps: 10,
        length: 7004,
      },
      "Nürburgring GP": {
        startLat: 50.3356,
        startLng: 6.9475,
        avgSpeed: 170,
        maxSpeed: 310,
        laps: 15,
        length: 5148,
      },
      "Monaco": {
        startLat: 43.7384,
        startLng: 7.4246,
        avgSpeed: 140,
        maxSpeed: 280,
        laps: 20,
        length: 3337,
      },
      "Monza": {
        startLat: 45.6206,
        startLng: 9.2854,
        avgSpeed: 200,
        maxSpeed: 360,
        laps: 8,
        length: 5793,
      },
    };

    return params[track as keyof typeof params] || params["Silverstone GP"];
  }

  // Interpolate position along track
  private interpolateTrackPosition(trackParams: any, progress: number) {
    // Simple circular track simulation
    const radius = 0.01; // ~1km radius
    const centerLat = trackParams.startLat;
    const centerLng = trackParams.startLng;
    
    const angle = progress * 2 * Math.PI;
    const lat = centerLat + radius * Math.cos(angle);
    const lng = centerLng + radius * Math.sin(angle);
    
    return { lat, lng };
  }

  // Clear all sample data
  clearSampleData(): void {
    const sessions = dataManagementService.getAllSessions();
    sessions.forEach(session => {
      if (session.name.includes("Sample") || session.name.includes("Session")) {
        dataManagementService.deleteSession(session.id);
      }
    });
  }

  // Check if sample data exists
  hasSampleData(): boolean {
    const sessions = dataManagementService.getAllSessions();
    return sessions.some(session => 
      session.name.includes("Sample") || session.name.includes("Session")
    );
  }
}

export const dataGeneratorService = new DataGeneratorService(); 