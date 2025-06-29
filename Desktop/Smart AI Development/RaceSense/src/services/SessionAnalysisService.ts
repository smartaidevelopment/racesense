// Advanced Session Analysis Service
// Comprehensive telemetry data analysis, comparison, and insights

import { LapData, LiveSession, GPSPoint } from "./LapTimingService";
import { LiveOBDData } from "./OBDIntegrationService";

interface SessionDataPoint {
  timestamp: number;
  gps: GPSPoint;
  obd: Partial<LiveOBDData>;
  speed: number;
  lap: number;
  sector: number;
  distanceFromStart: number; // meters
}

interface SectorAnalysis {
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
}

interface LapComparison {
  lap1: LapData;
  lap2: LapData;
  timeDifference: number; // milliseconds
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

interface PerformanceTrend {
  metric: "lapTime" | "maxSpeed" | "consistency" | "throttleEfficiency";
  sessions: {
    sessionId: string;
    date: number;
    value: number;
    improvement: number; // percentage change from previous
  }[];
  trend: "improving" | "declining" | "stable";
  trendPercentage: number;
}

interface TrackAnalysis {
  trackId: string;
  totalSessions: number;
  totalLaps: number;
  bestLapTime: number;
  bestLapSession: string;
  averageLapTime: number;
  consistencyRating: number; // 0-100
  sectors: SectorAnalysis[];
  speedZones: {
    start: number;
    end: number;
    type: "braking" | "acceleration" | "cornering" | "straight";
    optimalSpeed: number;
    averageSpeed: number;
  }[];
}

interface PerformanceInsights {
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

interface SessionMetrics {
  totalDistance: number;
  totalTime: number;
  averageSpeed: number;
  maxSpeed: number;
  fuelConsumption?: number;
  avgEngineLoad?: number;
  maxRPM?: number;
  avgCoolantTemp?: number;
  throttleTime: number; // total time on throttle
  brakingTime: number; // total time braking
  corneringTime: number; // total time cornering
}

class SessionAnalysisService {
  private sessionData: Map<string, SessionDataPoint[]> = new Map();
  private analyzedSessions: Map<string, TrackAnalysis> = new Map();
  private performanceHistory: Map<string, PerformanceTrend[]> = new Map();

  // Process and store session data
  processSession(
    session: LiveSession,
    obdData: LiveOBDData[],
  ): SessionDataPoint[] {
    const dataPoints: SessionDataPoint[] = [];

    session.laps.forEach((lap, lapIndex) => {
      lap.gpsPoints.forEach((gpsPoint, pointIndex) => {
        // Find corresponding OBD data (closest timestamp)
        const obdPoint = this.findClosestOBDData(gpsPoint.timestamp, obdData);

        const dataPoint: SessionDataPoint = {
          timestamp: gpsPoint.timestamp,
          gps: gpsPoint,
          obd: obdPoint || {},
          speed: gpsPoint.speed,
          lap: lapIndex + 1,
          sector: this.calculateSector(pointIndex, lap.gpsPoints.length),
          distanceFromStart: this.calculateDistanceFromStart(
            lap.gpsPoints,
            pointIndex,
          ),
        };

        dataPoints.push(dataPoint);
      });
    });

    this.sessionData.set(session.sessionId, dataPoints);
    return dataPoints;
  }

  // Compare two laps in detail
  compareLaps(lap1: LapData, lap2: LapData): LapComparison {
    const timeDifference = lap2.lapTime - lap1.lapTime;

    // Normalize both laps to same distance points for comparison
    const normalizedPoints = this.normalizeLapsForComparison(lap1, lap2);

    const speedDifferences = normalizedPoints.map((point, index) => ({
      distance: point.distance,
      difference: point.lap2Speed - point.lap1Speed,
    }));

    const throttleDifferences = normalizedPoints.map((point, index) => ({
      distance: point.distance,
      difference: (point.lap2Throttle || 0) - (point.lap1Throttle || 0),
    }));

    const trajectoryDifferences = normalizedPoints.map((point, index) => ({
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

  // Analyze track performance over multiple sessions
  analyzeTrackPerformance(
    trackId: string,
    sessions: LiveSession[],
  ): TrackAnalysis {
    const allLaps = sessions.flatMap((s) => s.laps);
    const totalSessions = sessions.length;
    const totalLaps = allLaps.length;

    if (totalLaps === 0) {
      throw new Error("No laps found for analysis");
    }

    const validLaps = allLaps.filter((lap) => lap.isValidLap);
    const lapTimes = validLaps.map((lap) => lap.lapTime);

    const bestLapTime = Math.min(...lapTimes);
    const bestLapIndex = lapTimes.indexOf(bestLapTime);
    const bestLap = validLaps[bestLapIndex];

    const averageLapTime =
      lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
    const consistencyRating = this.calculateConsistency(lapTimes);

    const sectors = this.analyzeSectors(validLaps);
    const speedZones = this.identifySpeedZones(validLaps);

    const analysis: TrackAnalysis = {
      trackId,
      totalSessions,
      totalLaps,
      bestLapTime,
      bestLapSession:
        sessions.find((s) => s.laps.includes(bestLap))?.sessionId || "",
      averageLapTime,
      consistencyRating,
      sectors,
      speedZones,
    };

    this.analyzedSessions.set(trackId, analysis);
    return analysis;
  }

  // Generate performance insights
  generateInsights(
    trackAnalysis: TrackAnalysis,
    recentLaps: LapData[],
  ): PerformanceInsights {
    const strengths = this.identifyStrengths(trackAnalysis, recentLaps);
    const improvements = this.identifyImprovements(trackAnalysis, recentLaps);
    const consistency = this.analyzeConsistency(recentLaps);
    const efficiency = this.analyzeEfficiency(recentLaps);

    return {
      strengths,
      improvements,
      consistency,
      efficiency,
    };
  }

  // Calculate session metrics
  calculateSessionMetrics(sessionData: SessionDataPoint[]): SessionMetrics {
    if (sessionData.length === 0) {
      throw new Error("No session data provided");
    }

    const totalTime =
      sessionData[sessionData.length - 1].timestamp - sessionData[0].timestamp;
    const totalDistance = sessionData[sessionData.length - 1].distanceFromStart;

    const speeds = sessionData
      .map((point) => point.speed)
      .filter((speed) => speed > 0);
    const averageSpeed =
      speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
    const maxSpeed = Math.max(...speeds);

    // Calculate time spent in different driving modes
    let throttleTime = 0;
    let brakingTime = 0;
    let corneringTime = 0;

    for (let i = 1; i < sessionData.length; i++) {
      const current = sessionData[i];
      const previous = sessionData[i - 1];
      const deltaTime = current.timestamp - previous.timestamp;

      const throttle = current.obd.throttlePosition || 0;
      const speedChange = current.speed - previous.speed;

      if (throttle > 20) throttleTime += deltaTime;
      if (speedChange < -2) brakingTime += deltaTime;
      if (Math.abs(speedChange) < 2 && current.speed > 20)
        corneringTime += deltaTime;
    }

    const obdData = sessionData
      .map((p) => p.obd)
      .filter((obd) => Object.keys(obd).length > 0);
    const avgEngineLoad =
      obdData.length > 0
        ? obdData.reduce((sum, obd) => sum + (obd.engineLoad || 0), 0) /
          obdData.length
        : undefined;

    const maxRPM =
      obdData.length > 0
        ? Math.max(...obdData.map((obd) => obd.rpm || 0))
        : undefined;

    const avgCoolantTemp =
      obdData.length > 0
        ? obdData.reduce((sum, obd) => sum + (obd.coolantTemp || 0), 0) /
          obdData.length
        : undefined;

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

  // Helper methods
  private findClosestOBDData(
    timestamp: number,
    obdData: LiveOBDData[],
  ): LiveOBDData | null {
    if (obdData.length === 0) return null;

    let closest = obdData[0];
    let minDiff = Math.abs(timestamp - closest.timestamp);

    for (const obd of obdData) {
      const diff = Math.abs(timestamp - obd.timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closest = obd;
      }
    }

    return minDiff < 5000 ? closest : null; // Only if within 5 seconds
  }

  private calculateSector(pointIndex: number, totalPoints: number): number {
    const sectorSize = totalPoints / 3;
    return Math.floor(pointIndex / sectorSize) + 1;
  }

  private calculateDistanceFromStart(
    gpsPoints: GPSPoint[],
    currentIndex: number,
  ): number {
    let distance = 0;
    for (let i = 1; i <= currentIndex; i++) {
      distance += this.calculateDistance(
        gpsPoints[i - 1].latitude,
        gpsPoints[i - 1].longitude,
        gpsPoints[i].latitude,
        gpsPoints[i].longitude,
      );
    }
    return distance;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Earth's radius in meters
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

  private normalizeLapsForComparison(lap1: LapData, lap2: LapData): any[] {
    // Simplified normalization - in reality would use distance-based interpolation
    const minPoints = Math.min(lap1.gpsPoints.length, lap2.gpsPoints.length);
    const normalized = [];

    for (let i = 0; i < minPoints; i++) {
      const ratio1 = i / (lap1.gpsPoints.length - 1);
      const ratio2 = i / (lap2.gpsPoints.length - 1);

      const index1 = Math.floor(ratio1 * (lap1.gpsPoints.length - 1));
      const index2 = Math.floor(ratio2 * (lap2.gpsPoints.length - 1));

      normalized.push({
        distance: i * 50, // 50m intervals
        lap1Speed: lap1.gpsPoints[index1].speed,
        lap2Speed: lap2.gpsPoints[index2].speed,
        lap1GPS: lap1.gpsPoints[index1],
        lap2GPS: lap2.gpsPoints[index2],
        lap1Throttle: undefined, // Would need OBD integration
        lap2Throttle: undefined,
      });
    }

    return normalized;
  }

  private calculateLateralOffset(gps1: GPSPoint, gps2: GPSPoint): number {
    // Simplified calculation - actual implementation would use proper trajectory analysis
    return this.calculateDistance(
      gps1.latitude,
      gps1.longitude,
      gps2.latitude,
      gps2.longitude,
    );
  }

  private compareBrakingPoints(lap1: LapData, lap2: LapData): any[] {
    // Simplified braking point analysis
    return lap1.sectors.map((sector, index) => ({
      sector: index + 1,
      lap1BrakingPoint: 0, // Would calculate from speed/throttle data
      lap2BrakingPoint: 0,
      difference: 0,
    }));
  }

  private calculateConsistency(lapTimes: number[]): number {
    if (lapTimes.length < 2) return 100;

    const mean =
      lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
    const variance =
      lapTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) /
      lapTimes.length;
    const standardDeviation = Math.sqrt(variance);

    // Convert to 0-100 scale (lower deviation = higher consistency)
    const coefficientOfVariation = standardDeviation / mean;
    return Math.max(0, 100 - coefficientOfVariation * 1000);
  }

  private analyzeSectors(laps: LapData[]): SectorAnalysis[] {
    const sectors: SectorAnalysis[] = [];

    for (let sectorNum = 0; sectorNum < 3; sectorNum++) {
      const sectorTimes = laps
        .map((lap) => lap.sectors[sectorNum]?.time || 0)
        .filter((time) => time > 0);
      const sectorSpeeds = laps
        .map((lap) => lap.sectors[sectorNum]?.maxSpeed || 0)
        .filter((speed) => speed > 0);

      if (sectorTimes.length > 0) {
        sectors.push({
          sectorNumber: sectorNum + 1,
          startDistance: sectorNum * 1000, // Simplified
          endDistance: (sectorNum + 1) * 1000,
          bestTime: Math.min(...sectorTimes),
          averageTime:
            sectorTimes.reduce((sum, time) => sum + time, 0) /
            sectorTimes.length,
          bestSpeed: Math.max(...sectorSpeeds),
          averageSpeed:
            sectorSpeeds.reduce((sum, speed) => sum + speed, 0) /
            sectorSpeeds.length,
          throttleEfficiency: 0.85, // Would calculate from OBD data
          brakingPoints: [],
          accelerationZones: [],
        });
      }
    }

    return sectors;
  }

  private identifySpeedZones(laps: LapData[]): any[] {
    // Simplified speed zone identification
    return [
      {
        start: 0,
        end: 500,
        type: "acceleration" as const,
        optimalSpeed: 120,
        averageSpeed: 110,
      },
      {
        start: 500,
        end: 1000,
        type: "straight" as const,
        optimalSpeed: 180,
        averageSpeed: 170,
      },
      {
        start: 1000,
        end: 1500,
        type: "braking" as const,
        optimalSpeed: 80,
        averageSpeed: 85,
      },
      {
        start: 1500,
        end: 2000,
        type: "cornering" as const,
        optimalSpeed: 60,
        averageSpeed: 58,
      },
    ];
  }

  private identifyStrengths(
    trackAnalysis: TrackAnalysis,
    recentLaps: LapData[],
  ): any[] {
    const strengths = [];

    // High-speed sections
    if (
      trackAnalysis.speedZones.some(
        (zone) => zone.averageSpeed > zone.optimalSpeed * 0.95,
      )
    ) {
      strengths.push({
        area: "High-Speed Sections",
        description: "Excellent performance in straight-line speed zones",
        confidence: 0.9,
      });
    }

    // Consistency
    if (trackAnalysis.consistencyRating > 85) {
      strengths.push({
        area: "Consistency",
        description: "Very consistent lap times with minimal variation",
        confidence: 0.95,
      });
    }

    return strengths;
  }

  private identifyImprovements(
    trackAnalysis: TrackAnalysis,
    recentLaps: LapData[],
  ): any[] {
    const improvements = [];

    // Sector analysis
    trackAnalysis.sectors.forEach((sector, index) => {
      if (sector.averageTime > sector.bestTime * 1.05) {
        improvements.push({
          area: `Sector ${sector.sectorNumber}`,
          description: `Potential improvement in sector ${sector.sectorNumber} - average is 5% slower than best`,
          potentialGain: `${((sector.averageTime - sector.bestTime) / 1000).toFixed(2)}s`,
          priority: "high" as const,
        });
      }
    });

    return improvements;
  }

  private analyzeConsistency(laps: LapData[]): any {
    const lapTimes = laps.map((lap) => lap.lapTime);
    const consistency = this.calculateConsistency(lapTimes);

    let description = "";
    if (consistency > 90)
      description = "Excellent consistency - very small lap time variation";
    else if (consistency > 80)
      description = "Good consistency - room for minor improvement";
    else if (consistency > 70)
      description = "Moderate consistency - focus on repeatable driving";
    else description = "Poor consistency - major improvement opportunity";

    return {
      rating: consistency,
      description,
      variability:
        lapTimes.length > 1 ? Math.max(...lapTimes) - Math.min(...lapTimes) : 0,
    };
  }

  private analyzeEfficiency(laps: LapData[]): any {
    // Simplified efficiency analysis - would use OBD data in reality
    return {
      throttle: 85, // Percentage efficiency
      braking: 78,
      cornering: 82,
      overall: 82,
    };
  }

  // Data export/import methods
  exportSessionData(sessionId: string): string {
    const data = this.sessionData.get(sessionId);
    if (!data) throw new Error("Session not found");

    return JSON.stringify(
      {
        sessionId,
        timestamp: Date.now(),
        data,
        version: "1.0",
      },
      null,
      2,
    );
  }

  importSessionData(jsonData: string): string {
    const parsed = JSON.parse(jsonData);
    const sessionId = parsed.sessionId || `imported-${Date.now()}`;

    this.sessionData.set(sessionId, parsed.data);
    return sessionId;
  }

  // Get stored data
  getSessionData(sessionId: string): SessionDataPoint[] {
    return this.sessionData.get(sessionId) || [];
  }

  getTrackAnalysis(trackId: string): TrackAnalysis | null {
    return this.analyzedSessions.get(trackId) || null;
  }

  getAllAnalyzedTracks(): TrackAnalysis[] {
    return Array.from(this.analyzedSessions.values());
  }
}

// Global instance
export const sessionAnalysisService = new SessionAnalysisService();

// Export types
export type {
  SessionDataPoint,
  SectorAnalysis,
  LapComparison,
  PerformanceTrend,
  TrackAnalysis,
  PerformanceInsights,
  SessionMetrics,
};
