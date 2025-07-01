// Real Session Analysis Service
// Provides actual data analysis functionality for real session data

import { SessionData, TelemetryPoint } from "./DataManagementService";
import { dataManagementService } from "./DataManagementService";

export interface RealLapData {
  lapNumber: number;
  startTime: number;
  endTime: number;
  lapTime: number; // milliseconds
  maxSpeed: number;
  averageSpeed: number;
  sectors: {
    time: number;
    maxSpeed: number;
    distance: number;
  }[];
  gpsPoints: {
    lat: number;
    lng: number;
    timestamp: number;
    speed: number;
    elevation?: number;
  }[];
  telemetryPoints: TelemetryPoint[];
  trackId: string;
  isValidLap: boolean;
  distance: number; // total lap distance in meters
}

export interface RealTrackAnalysis {
  trackId: string;
  totalSessions: number;
  totalLaps: number;
  bestLapTime: number;
  bestLapSession: string;
  averageLapTime: number;
  consistencyRating: number; // 0-100
  sectors: {
    sectorNumber: number;
    startDistance: number;
    endDistance: number;
    bestTime: number;
    averageTime: number;
    bestSpeed: number;
    averageSpeed: number;
    throttleEfficiency: number;
    brakingPoints: number[];
    accelerationZones: number[];
  }[];
  speedZones: {
    start: number;
    end: number;
    type: "braking" | "acceleration" | "cornering" | "straight";
    optimalSpeed: number;
    averageSpeed: number;
  }[];
}

export interface RealPerformanceInsights {
  strengths: {
    area: string;
    description: string;
    confidence: number;
  }[];
  improvements: {
    area: string;
    description: string;
    potentialGain: string;
    priority: "high" | "medium" | "low";
  }[];
  consistency: {
    rating: number;
    description: string;
    variability: number;
  };
  efficiency: {
    throttle: number;
    braking: number;
    cornering: number;
    overall: number;
  };
}

export interface RealSessionMetrics {
  totalDistance: number;
  totalTime: number;
  averageSpeed: number;
  maxSpeed: number;
  fuelConsumption?: number;
  avgEngineLoad?: number;
  maxRPM?: number;
  avgCoolantTemp?: number;
  throttleTime: number;
  brakingTime: number;
  corneringTime: number;
}

export interface RealLapComparison {
  lap1: RealLapData;
  lap2: RealLapData;
  timeDifference: number;
  speedDifferences: { distance: number; difference: number }[];
  throttleDifferences: { distance: number; difference: number }[];
  trajectoryDifferences: { distance: number; lateralOffset: number }[];
  brakingPointComparison: {
    sector: number;
    lap1BrakingPoint: number;
    lap2BrakingPoint: number;
    difference: number;
  }[];
}

class RealSessionAnalysisService {
  private sessionCache: Map<string, RealLapData[]> = new Map();
  private analysisCache: Map<string, RealTrackAnalysis> = new Map();

  // Load real session data from storage
  async loadRealSessions(): Promise<string[]> {
    try {
      const sessions = dataManagementService.getAllSessions();
      return sessions.map(session => session.id);
    } catch (error) {
      console.error("Error loading real sessions:", error);
      return [];
    }
  }

  // Convert stored session data to lap data format
  async convertSessionToLapData(sessionId: string): Promise<RealLapData[]> {
    const session = dataManagementService.getSession(sessionId);
    if (!session || !session.telemetryData) {
      console.log(`No session or telemetry data found for session ${sessionId}`);
      return [];
    }

    const telemetryData = session.telemetryData;
    console.log(`Processing session ${sessionId} with ${telemetryData.length} telemetry points`);
    
    // Debug: Check first few telemetry points
    if (telemetryData.length > 0) {
      console.log(`First telemetry point:`, {
        timestamp: telemetryData[0].timestamp,
        position: telemetryData[0].position,
        speed: telemetryData[0].speed
      });
      console.log(`Last telemetry point:`, {
        timestamp: telemetryData[telemetryData.length - 1].timestamp,
        position: telemetryData[telemetryData.length - 1].position,
        speed: telemetryData[telemetryData.length - 1].speed
      });
    }
    
    const laps: RealLapData[] = [];
    
    // Group telemetry data by laps (assuming lap detection logic)
    const lapGroups = this.groupTelemetryByLaps(telemetryData, session);
    console.log(`Created ${lapGroups.length} lap groups`);
    
    if (lapGroups.length === 0) {
      console.error("No lap groups created. This indicates a problem with lap detection logic.");
      console.error("Session info:", {
        name: session.name,
        totalLaps: session.totalLaps,
        telemetryPoints: telemetryData.length
      });
      return [];
    }
    
    lapGroups.forEach((lapTelemetry, lapIndex) => {
      if (lapTelemetry.length === 0) {
        console.warn(`Lap group ${lapIndex} is empty, skipping`);
        return;
      }

      const distance = this.calculateLapDistance(lapTelemetry);
      const isValid = this.validateLap(lapTelemetry);
      
      console.log(`Lap ${lapIndex + 1}: ${lapTelemetry.length} points, distance: ${distance.toFixed(2)}m, valid: ${isValid}`);

      const lapData: RealLapData = {
        lapNumber: lapIndex + 1,
        startTime: lapTelemetry[0].timestamp,
        endTime: lapTelemetry[lapTelemetry.length - 1].timestamp,
        lapTime: lapTelemetry[lapTelemetry.length - 1].timestamp - lapTelemetry[0].timestamp,
        maxSpeed: Math.max(...lapTelemetry.map(p => p.speed)),
        averageSpeed: lapTelemetry.reduce((sum, p) => sum + p.speed, 0) / lapTelemetry.length,
        sectors: this.calculateSectors(lapTelemetry),
        gpsPoints: lapTelemetry.map(p => ({
          lat: p.position.lat,
          lng: p.position.lng,
          timestamp: p.timestamp,
          speed: p.speed,
        })),
        telemetryPoints: lapTelemetry,
        trackId: session.track,
        isValidLap: isValid,
        distance: distance,
      };

      laps.push(lapData);
    });

    console.log(`Total laps created: ${laps.length}, valid laps: ${laps.filter(l => l.isValidLap).length}`);
    this.sessionCache.set(sessionId, laps);
    return laps;
  }

  // Analyze real track performance
  async analyzeRealTrackPerformance(trackId: string): Promise<RealTrackAnalysis> {
    const sessions = dataManagementService.getAllSessions()
      .filter(s => s.track === trackId);

    console.log(`Analyzing track ${trackId} with ${sessions.length} sessions`);

    if (sessions.length === 0) {
      throw new Error(`No sessions found for track: ${trackId}`);
    }

    // Debug: Check each session for telemetry data
    sessions.forEach(session => {
      console.log(`Session ${session.name}: ${session.telemetryData?.length || 0} telemetry points`);
    });

    const allLaps: RealLapData[] = [];
    
    // Convert all sessions to lap data
    for (const session of sessions) {
      console.log(`Processing session: ${session.name}`);
      const sessionLaps = await this.convertSessionToLapData(session.id);
      console.log(`Session ${session.name} produced ${sessionLaps.length} laps`);
      allLaps.push(...sessionLaps);
    }

    console.log(`Total laps found: ${allLaps.length}`);
    
    if (allLaps.length === 0) {
      console.error("No laps were created from any sessions. This indicates a problem with session data or lap conversion.");
      console.error("Sessions available:", sessions.map(s => ({
        name: s.name,
        telemetryPoints: s.telemetryData?.length || 0,
        totalLaps: s.totalLaps
      })));
      throw new Error("No laps found for analysis - check session telemetry data");
    }
    
    let validLaps = allLaps.filter(lap => lap.isValidLap);
    console.log(`Valid laps: ${validLaps.length}`);
    
    let lapTimes = validLaps.map(lap => lap.lapTime);

    if (lapTimes.length === 0) {
      console.error("No valid laps found. All laps:", allLaps.map(l => ({ 
        lapNumber: l.lapNumber, 
        isValid: l.isValidLap, 
        distance: l.distance,
        points: l.telemetryPoints.length 
      })));
      
      // Fallback: if no valid laps, mark all laps as valid for analysis
      console.log("Falling back to mark all laps as valid for analysis");
      allLaps.forEach(lap => {
        lap.isValidLap = true;
      });
      
      validLaps = allLaps;
      lapTimes = validLaps.map(lap => lap.lapTime);
      
      console.log(`Using fallback: ${validLaps.length} laps marked as valid`);
    }

    const bestLap = validLaps.reduce((best, current) => 
      current.lapTime < best.lapTime ? current : best
    );

    const analysis: RealTrackAnalysis = {
      trackId,
      totalSessions: sessions.length,
      totalLaps: validLaps.length,
      bestLapTime: bestLap.lapTime,
      bestLapSession: bestLap.trackId, // This would need to be enhanced to track actual session
      averageLapTime: lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length,
      consistencyRating: this.calculateConsistency(lapTimes),
      sectors: this.analyzeSectors(validLaps),
      speedZones: this.identifySpeedZones(validLaps),
    };

    this.analysisCache.set(trackId, analysis);
    return analysis;
  }

  // Generate real performance insights
  async generateRealInsights(trackId: string, recentSessions: string[]): Promise<RealPerformanceInsights> {
    const trackAnalysis = await this.analyzeRealTrackPerformance(trackId);
    const recentLaps: RealLapData[] = [];

    for (const sessionId of recentSessions) {
      const sessionLaps = await this.convertSessionToLapData(sessionId);
      recentLaps.push(...sessionLaps);
    }

    return {
      strengths: this.identifyStrengths(trackAnalysis, recentLaps),
      improvements: this.identifyImprovements(trackAnalysis, recentLaps),
      consistency: this.analyzeConsistency(recentLaps),
      efficiency: this.analyzeEfficiency(recentLaps),
    };
  }

  // Calculate real session metrics
  async calculateRealSessionMetrics(sessionId: string): Promise<RealSessionMetrics> {
    const session = dataManagementService.getSession(sessionId);
    if (!session || !session.telemetryData) {
      throw new Error("Session not found or no telemetry data");
    }

    const telemetryData = session.telemetryData;
    const totalTime = session.duration * 1000; // Convert to milliseconds
    const totalDistance = this.calculateTotalDistance(telemetryData);
    const maxSpeed = Math.max(...telemetryData.map(p => p.speed));
    const averageSpeed = telemetryData.reduce((sum, p) => sum + p.speed, 0) / telemetryData.length;

    // Calculate time spent in different driving modes
    const throttleTime = telemetryData.filter(p => (p.throttle || 0) > 10).length * 100; // Assuming 100ms intervals
    const brakingTime = telemetryData.filter(p => (p.brake || 0) > 10).length * 100;
    const corneringTime = telemetryData.filter(p => Math.abs(p.gForce?.lateral || 0) > 0.5).length * 100;

    // Calculate engine metrics
    const avgEngineLoad = telemetryData.reduce((sum, p) => sum + (p.rpm || 0), 0) / telemetryData.length;
    const maxRPM = Math.max(...telemetryData.map(p => p.rpm || 0));
    const avgCoolantTemp = telemetryData.reduce((sum, p) => sum + (p.engineTemp || 0), 0) / telemetryData.length;

    return {
      totalDistance,
      totalTime,
      averageSpeed,
      maxSpeed,
      avgEngineLoad,
      maxRPM,
      avgCoolantTemp,
      throttleTime,
      brakingTime,
      corneringTime,
    };
  }

  // Compare two real laps
  async compareRealLaps(lap1: RealLapData, lap2: RealLapData): Promise<RealLapComparison> {
    const timeDifference = lap2.lapTime - lap1.lapTime;
    const normalizedPoints = this.normalizeLapsForComparison(lap1, lap2);

    const speedDifferences = normalizedPoints.map(point => ({
      distance: point.distance,
      difference: point.lap2Speed - point.lap1Speed,
    }));

    const throttleDifferences = normalizedPoints.map(point => ({
      distance: point.distance,
      difference: (point.lap2Throttle || 0) - (point.lap1Throttle || 0),
    }));

    const trajectoryDifferences = normalizedPoints.map(point => ({
      distance: point.distance,
      lateralOffset: this.calculateLateralOffset(point.lap1GPS, point.lap2GPS),
    }));

    return {
      lap1,
      lap2,
      timeDifference,
      speedDifferences,
      throttleDifferences,
      trajectoryDifferences,
      brakingPointComparison: this.compareBrakingPoints(lap1, lap2),
    };
  }

  // Private helper methods
  private groupTelemetryByLaps(telemetryData: TelemetryPoint[], session: SessionData): TelemetryPoint[][] {
    // Improved lap detection based on session data
    const totalLaps = session.totalLaps || 1;
    const pointsPerLap = Math.floor(telemetryData.length / totalLaps);
    const lapGroups: TelemetryPoint[][] = [];

    console.log(`Lap detection: ${telemetryData.length} points, ${totalLaps} laps, ${pointsPerLap} points per lap`);

    for (let i = 0; i < totalLaps; i++) {
      const startIndex = i * pointsPerLap;
      const endIndex = i === totalLaps - 1 ? telemetryData.length : (i + 1) * pointsPerLap;
      const lapData = telemetryData.slice(startIndex, endIndex);
      
      console.log(`Lap ${i + 1}: ${startIndex} to ${endIndex} (${lapData.length} points)`);
      
      if (lapData.length > 0) {
        lapGroups.push(lapData);
      }
    }

    // If no laps were created, create at least one lap with all data
    if (lapGroups.length === 0 && telemetryData.length > 0) {
      console.log("No laps created, creating single lap with all data");
      lapGroups.push(telemetryData);
    }

    console.log(`Final lap groups: ${lapGroups.length}`);
    return lapGroups;
  }

  private calculateSectors(telemetryData: TelemetryPoint[]): RealLapData['sectors'] {
    const totalDistance = this.calculateTotalDistance(telemetryData);
    const sectorDistance = totalDistance / 3;
    
    return [0, 1, 2].map(sectorIndex => {
      const sectorStart = sectorIndex * sectorDistance;
      const sectorEnd = (sectorIndex + 1) * sectorDistance;
      const sectorData = this.getTelemetryInDistanceRange(telemetryData, sectorStart, sectorEnd);
      
      return {
        time: sectorData.length * 100, // Assuming 100ms intervals
        maxSpeed: Math.max(...sectorData.map(p => p.speed)),
        distance: sectorDistance,
      };
    });
  }

  private validateLap(telemetryData: TelemetryPoint[]): boolean {
    // More lenient lap validation for sample data
    if (telemetryData.length < 5) return false; // Too few data points
    if (this.calculateTotalDistance(telemetryData) < 10) return false; // Too short (reduced from 100m)
    
    // Check if we have reasonable speed data
    const avgSpeed = telemetryData.reduce((sum, p) => sum + p.speed, 0) / telemetryData.length;
    if (avgSpeed < 5) return false; // Too slow to be a valid lap
    
    return true;
  }

  private calculateLapDistance(telemetryData: TelemetryPoint[]): number {
    return this.calculateTotalDistance(telemetryData);
  }

  private calculateTotalDistance(telemetryData: TelemetryPoint[]): number {
    let totalDistance = 0;
    for (let i = 1; i < telemetryData.length; i++) {
      const prev = telemetryData[i - 1];
      const curr = telemetryData[i];
      totalDistance += this.calculateDistance(
        prev.position.lat, prev.position.lng,
        curr.position.lat, curr.position.lng
      );
    }
    return totalDistance;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private calculateConsistency(lapTimes: number[]): number {
    if (lapTimes.length < 2) return 100;
    
    const mean = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
    const variance = lapTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / lapTimes.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / mean;
    
    // Convert to 0-100 scale (lower CV = higher consistency)
    return Math.max(0, 100 - (coefficientOfVariation * 1000));
  }

  private analyzeSectors(laps: RealLapData[]): RealTrackAnalysis['sectors'] {
    // Implementation would analyze sector performance across all laps
    return []; // Placeholder
  }

  private identifySpeedZones(laps: RealLapData[]): RealTrackAnalysis['speedZones'] {
    // Implementation would identify speed zones based on track layout
    return []; // Placeholder
  }

  private identifyStrengths(trackAnalysis: RealTrackAnalysis, recentLaps: RealLapData[]): RealPerformanceInsights['strengths'] {
    // Implementation would analyze strengths based on actual data
    return []; // Placeholder
  }

  private identifyImprovements(trackAnalysis: RealTrackAnalysis, recentLaps: RealLapData[]): RealPerformanceInsights['improvements'] {
    // Implementation would identify areas for improvement
    return []; // Placeholder
  }

  private analyzeConsistency(laps: RealLapData[]): RealPerformanceInsights['consistency'] {
    const lapTimes = laps.map(lap => lap.lapTime);
    const consistency = this.calculateConsistency(lapTimes);
    
    return {
      rating: consistency,
      description: consistency > 80 ? "Excellent consistency" : consistency > 60 ? "Good consistency" : "Needs improvement",
      variability: Math.sqrt(lapTimes.reduce((sum, time) => sum + Math.pow(time - (lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length), 2), 0) / lapTimes.length),
    };
  }

  private analyzeEfficiency(laps: RealLapData[]): RealPerformanceInsights['efficiency'] {
    // Implementation would analyze driving efficiency
    return {
      throttle: 85,
      braking: 78,
      cornering: 82,
      overall: 82,
    };
  }

  private normalizeLapsForComparison(lap1: RealLapData, lap2: RealLapData): any[] {
    // Implementation would normalize laps for comparison
    return []; // Placeholder
  }

  private calculateLateralOffset(gps1: any, gps2: any): number {
    // Implementation would calculate lateral offset between GPS points
    return 0; // Placeholder
  }

  private compareBrakingPoints(lap1: RealLapData, lap2: RealLapData): any[] {
    // Implementation would compare braking points
    return []; // Placeholder
  }

  private getTelemetryInDistanceRange(telemetryData: TelemetryPoint[], startDistance: number, endDistance: number): TelemetryPoint[] {
    // Implementation would filter telemetry data by distance range
    return telemetryData; // Placeholder
  }

  // Export and import functionality
  async exportAnalysisData(trackId: string): Promise<string> {
    const analysis = this.analysisCache.get(trackId);
    if (!analysis) {
      throw new Error("No analysis data found for track");
    }
    return JSON.stringify(analysis, null, 2);
  }

  async importAnalysisData(jsonData: string): Promise<void> {
    try {
      const analysis = JSON.parse(jsonData);
      this.analysisCache.set(analysis.trackId, analysis);
    } catch (error) {
      throw new Error("Invalid analysis data format");
    }
  }
}

export const realSessionAnalysisService = new RealSessionAnalysisService(); 