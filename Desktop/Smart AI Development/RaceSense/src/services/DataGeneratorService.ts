// Data Generator Service
// Generates sample session data for testing real analysis functionality

import { SessionData, TelemetryPoint } from "./DataManagementService";
import { dataManagementService } from "./DataManagementService";

class DataGeneratorService {
  // Generate sample session data
  generateSampleSessions(): void {
    console.log("=== Starting sample session generation ===");
    
    // Clear existing demo sessions first
    this.clearSampleData();
    
    const tracks = [
      "Silverstone GP",
      "Spa-Francorchamps",
      "Nürburgring GP",
      "Monaco",
      "Monza",
    ];

    const sessionTypes: SessionData["type"][] = ["practice", "qualifying", "race", "test"];

    console.log("Generating sample sessions...");

    // Generate 5 sample sessions
    for (let i = 0; i < 5; i++) {
      const track = tracks[i % tracks.length];
      const sessionType = sessionTypes[i % sessionTypes.length];
      const date = new Date();
      date.setDate(date.getDate() - i * 2); // Sessions every 2 days

      console.log(`\n--- Generating session ${i + 1}: ${track} ${sessionType} ---`);

      const telemetryData = this.generateTelemetryData(track, sessionType);
      console.log(`Generated ${telemetryData.length} telemetry points for ${track}`);

      const session: Omit<SessionData, "id"> = {
        name: `${track} ${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} Session ${i + 1}`,
        track,
        type: sessionType,
        date,
        duration: 1800 + Math.random() * 3600, // 30-90 minutes
        bestLapTime: 80000 + Math.random() * 20000, // 1:20-1:40
        totalLaps: 10 + Math.floor(Math.random() * 20), // 10-30 laps
        notes: `Sample ${sessionType} session on ${track}`,
        telemetryData: telemetryData,
        metadata: {
          weather: ["Sunny", "Cloudy", "Light Rain"][Math.floor(Math.random() * 3)],
          temperature: 15 + Math.random() * 20, // 15-35°C
          trackCondition: ["Dry", "Damp", "Wet"][Math.floor(Math.random() * 3)],
        },
      };

      console.log(`Creating session: ${session.name}`);
      console.log(`Session telemetry data length: ${session.telemetryData.length}`);
      
      const sessionId = dataManagementService.addSession(session);
      console.log(`Created session with ID: ${sessionId}`);
      
      // Verify the session was created correctly
      const createdSession = dataManagementService.getSession(sessionId);
      if (createdSession) {
        console.log(`✓ Verified session: ${createdSession.name} with ${createdSession.telemetryData?.length || 0} telemetry points`);
      } else {
        console.error(`✗ Failed to retrieve created session: ${sessionId}`);
      }
    }

    console.log("\n=== Sample session generation complete ===");
    
    // Final verification
    const allSessions = dataManagementService.getAllSessions();
    console.log(`Total sessions in storage: ${allSessions.length}`);
    allSessions.forEach(session => {
      console.log(`Session: ${session.name} - Telemetry points: ${session.telemetryData?.length || 0}`);
    });
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
    // More realistic track simulation with larger radius for proper distances
    const radius = 0.05; // ~5km radius for more realistic lap distances
    const centerLat = trackParams.startLat;
    const centerLng = trackParams.startLng;
    
    const angle = progress * 2 * Math.PI;
    const lat = centerLat + radius * Math.cos(angle);
    const lng = centerLng + radius * Math.sin(angle);
    
    return { lat, lng };
  }

  // Clear all sample data
  clearSampleData(): void {
    console.log("Clearing existing sample data...");
    const sessions = dataManagementService.getAllSessions();
    let clearedCount = 0;
    
    sessions.forEach(session => {
      // Clear any session that looks like it might be sample/demo data
      if (session.name.includes("Sample") || 
          session.name.includes("Session") ||
          session.name.includes("Practice") ||
          session.name.includes("Qualifying") ||
          session.name.includes("Testing") ||
          session.name.includes("Morning") ||
          session.name.includes("Simulation") ||
          session.name.includes("Wet Weather") ||
          session.name.includes("Setup") ||
          session.name.includes("Test Session")) {
        console.log(`Clearing session: ${session.name} (ID: ${session.id})`);
        dataManagementService.deleteSession(session.id);
        clearedCount++;
      }
    });
    
    console.log(`Cleared ${clearedCount} existing sessions`);
    
    // Verify all sessions are cleared
    const remainingSessions = dataManagementService.getAllSessions();
    console.log(`Remaining sessions after clearing: ${remainingSessions.length}`);
    remainingSessions.forEach(session => {
      console.log(`Remaining: ${session.name} (ID: ${session.id})`);
    });
  }

  // Check if sample data exists
  hasSampleData(): boolean {
    const sessions = dataManagementService.getAllSessions();
    const hasData = sessions.some(session => 
      session.name.includes("Sample") || session.name.includes("Session")
    );
    
    console.log(`Sample data check: ${hasData ? 'Found' : 'Not found'}`);
    sessions.forEach(session => {
      console.log(`Session: ${session.name}, Telemetry points: ${session.telemetryData?.length || 0}`);
    });
    
    return hasData;
  }

  // Test method to create a single session with telemetry data
  testCreateSingleSession(): void {
    console.log("=== Testing single session creation ===");
    
    const telemetryData = this.generateTelemetryData("Silverstone GP", "practice");
    console.log(`Generated ${telemetryData.length} telemetry points for test`);
    
    // Verify telemetry data structure
    if (telemetryData.length > 0) {
      const firstPoint = telemetryData[0];
      console.log("First telemetry point structure:", {
        timestamp: firstPoint.timestamp,
        position: firstPoint.position,
        speed: firstPoint.speed,
        rpm: firstPoint.rpm,
        throttle: firstPoint.throttle,
        brake: firstPoint.brake,
        gear: firstPoint.gear
      });
    }
    
    const session: Omit<SessionData, "id"> = {
      name: "Test Session with Telemetry",
      track: "Silverstone GP",
      type: "practice",
      date: new Date(),
      duration: 1800,
      bestLapTime: 83000,
      totalLaps: 5,
      notes: "Test session with telemetry data",
      telemetryData: telemetryData,
      metadata: {
        weather: "Sunny",
        temperature: 20,
        trackCondition: "Dry",
      },
    };

    console.log(`Creating test session: ${session.name}`);
    console.log(`Session telemetry data length: ${session.telemetryData.length}`);
    
    const sessionId = dataManagementService.addSession(session);
    console.log(`Test session created with ID: ${sessionId}`);
    
    // Verify the session was created correctly
    const createdSession = dataManagementService.getSession(sessionId);
    if (createdSession) {
      console.log(`✓ Verified test session: ${createdSession.name} with ${createdSession.telemetryData?.length || 0} telemetry points`);
      
      // Verify telemetry data is accessible
      if (createdSession.telemetryData && createdSession.telemetryData.length > 0) {
        console.log("✓ Telemetry data is accessible in created session");
        console.log("First point from created session:", {
          timestamp: createdSession.telemetryData[0].timestamp,
          position: createdSession.telemetryData[0].position,
          speed: createdSession.telemetryData[0].speed
        });
      } else {
        console.error("✗ Telemetry data is missing or empty in created session");
      }
    } else {
      console.error("✗ Failed to retrieve created test session");
    }
    
    console.log("=== Single session test complete ===");
  }
}

export const dataGeneratorService = new DataGeneratorService(); 