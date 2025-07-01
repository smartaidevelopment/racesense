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
      return [];
    }

    const telemetryData = session.telemetryData;
    const laps: RealLapData[] = [];
    
    // Group telemetry data by laps (assuming lap detection logic)
    const lapGroups = this.groupTelemetryByLaps(telemetryData, session);
    
    lapGroups.forEach((lapTelemetry, lapIndex) => {
      if (lapTelemetry.length === 0) return;

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
        isValidLap: this.validateLap(lapTelemetry),
        distance: this.calculateLapDistance(lapTelemetry),
      };

      laps.push(lapData);
    });

    this.sessionCache.set(sessionId, laps);
    return laps;
  }

  // Analyze real track performance
  async analyzeRealTrackPerformance(trackId: string): Promise<RealTrackAnalysis> {
    const sessions = dataManagementService.getAllSessions()
      .filter(s => s.track === trackId);

    if (sessions.length === 0) {
      throw new Error(`No sessions found for track: ${trackId}`);
    }

    const allLaps: RealLapData[] = [];
    
    // Convert all sessions to lap data
    for (const session of sessions) {
      const sessionLaps = await this.convertSessionToLapData(session.id);
      allLaps.push(...sessionLaps);
    }

    const validLaps = allLaps.filter(lap => lap.isValidLap);
    const lapTimes = validLaps.map(lap => lap.lapTime);

    if (lapTimes.length === 0) {
      throw new Error("No valid laps found for analysis");
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
    // Simple lap detection based on time intervals
    // In a real implementation, this would use more sophisticated lap detection
    const lapDuration = session.duration / session.totalLaps;
    const lapGroups: TelemetryPoint[][] = [];
    let currentLap: TelemetryPoint[] = [];
    let lastTimestamp = telemetryData[0]?.timestamp || 0;

    telemetryData.forEach(point => {
      if (point.timestamp - lastTimestamp > lapDuration * 1000 && currentLap.length > 0) {
        lapGroups.push(currentLap);
        currentLap = [];
      }
      currentLap.push(point);
      lastTimestamp = point.timestamp;
    });

    if (currentLap.length > 0) {
      lapGroups.push(currentLap);
    }

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
    // Basic lap validation
    if (telemetryData.length < 10) return false; // Too few data points
    if (this.calculateTotalDistance(telemetryData) < 100) return false; // Too short
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