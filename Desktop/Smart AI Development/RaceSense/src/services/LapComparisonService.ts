// Lap Comparison Service for Advanced Racing Analysis
// Compatible with existing AdvancedRacingAnalysis page

export interface DetailedLapData {
  id: string;
  sessionId: string;
  driverName: string;
  lapNumber: number;
  timestamp: number;
  trackName: string;
  lapTime: number;
  sectors: {
    sector1: number;
    sector2: number;
    sector3: number;
  };
  telemetry: {
    maxSpeed: number;
    avgSpeed: number;
    maxRPM: number;
    maxGForce: number;
    avgThrottle: number;
    brakingEvents: number;
    throttleEvents: number;
  };
  conditions: {
    temperature: number;
    weather: string;
    gripLevel: number;
    tires: string;
  };
  telemetryPoints: {
    distanceFromStart: number;
    timestamp: number;
    speed: number;
    throttle: number;
    brake: number;
    gear: number;
    rpm: number;
    lateralG: number;
    longitudinalG: number;
    steeringAngle: number;
    trackPosition: number;
  }[];
  performance: {
    maxSpeed: number;
    avgSpeed: number;
    maxRPM: number;
    maxGForce: number;
    avgThrottle: number;
    brakingEvents: number;
    throttleEvents: number;
    topSpeed: number;
    maxBraking: number;
    maxAcceleration: number;
    maxLateralG: number;
    avgThrottlePosition: number;
    brakingZones: {
      startDistance: number;
      endDistance: number;
      peakDeceleration: number;
      brakingDistance: number;
      entrySpeed: number;
      exitSpeed: number;
      efficiency: number;
    }[];
    corneringSpeeds: {
      corner: number;
      apexSpeed: number;
      entrySpeed: number;
      exitSpeed: number;
      minRadius: number;
      maxLateralG: number;
      racingLineDeviation: number;
    }[];
  };
  quality: {
    cleanLap: boolean;
    validLap: boolean;
    confidence: number;
    issues: string[];
  };
}

export interface LapComparison {
  id: string;
  lap1Id: string;
  lap2Id: string;
  lap1: DetailedLapData;
  lap2: DetailedLapData;
  timestamp: number;
  analysis: {
    timeDifference: number; // lap2 - lap1
    sectorDifferences: {
      sector1: number;
      sector2: number;
      sector3: number;
    };
    performanceDelta: {
      speedDifference: number;
      rpmDifference: number;
      gForceDifference: number;
      throttleDifference: number;
    };
    insights: {
      biggestTimeGains: {
        name: string;
        timeDifference: number;
        reason: string;
      }[];
      biggestTimeLosses: {
        name: string;
        timeDifference: number;
        recommendation: string;
      }[];
      brakingComparison: {
        lap1AvgBrakingDistance: number;
        lap2AvgBrakingDistance: number;
        brakingEfficiencyDelta: number;
      };
      corneringComparison: {
        lap1AvgCornerSpeed: number;
        lap2AvgCornerSpeed: number;
        racingLineComparison: string;
      };
    };
    summary: {
      overallPerformance: "better" | "worse" | "similar";
      confidenceLevel: number;
      keyFindings: string[];
    };
  };
}

export interface MultiLapComparison {
  id: string;
  lapIds: string[];
  laps: DetailedLapData[];
  timestamp: number;
  analysis: {
    fastestLap: DetailedLapData;
    slowestLap: DetailedLapData;
    averageLapTime: number;
    lapTimeVariation: number;
    consistencyRating: number;
    sectorAnalysis: {
      sector1: {
        fastest: number;
        slowest: number;
        average: number;
        consistency: number;
      };
      sector2: {
        fastest: number;
        slowest: number;
        average: number;
        consistency: number;
      };
      sector3: {
        fastest: number;
        slowest: number;
        average: number;
        consistency: number;
      };
    };
    performanceTrends: {
      speedTrend: "improving" | "declining" | "stable";
      consistencyTrend: "improving" | "declining" | "stable";
      sectorTrends: {
        sector1: "improving" | "declining" | "stable";
        sector2: "improving" | "declining" | "stable";
        sector3: "improving" | "declining" | "stable";
      };
    };
  };
  recommendations: string[];
}

class LapComparisonService {
  private storedLaps: Map<string, DetailedLapData> = new Map();
  private comparisons: Map<string, LapComparison> = new Map();
  private multiLapAnalyses: Map<string, MultiLapComparison> = new Map();

  private comparisonListeners: Set<(comparison: LapComparison) => void> =
    new Set();
  private multiLapListeners: Set<(analysis: MultiLapComparison) => void> =
    new Set();

  // Lap Storage
  storeLap(lap: DetailedLapData): void {
    this.storedLaps.set(lap.id, lap);
  }

  getStoredLaps(): DetailedLapData[] {
    return Array.from(this.storedLaps.values()).sort(
      (a, b) => b.timestamp - a.timestamp,
    );
  }

  getLap(lapId: string): DetailedLapData | null {
    return this.storedLaps.get(lapId) || null;
  }

  deleteLap(lapId: string): boolean {
    return this.storedLaps.delete(lapId);
  }

  // Lap Comparison
  compareLaps(lap1Id: string, lap2Id: string): void {
    const lap1 = this.storedLaps.get(lap1Id);
    const lap2 = this.storedLaps.get(lap2Id);

    if (!lap1 || !lap2) {
      throw new Error("One or both laps not found");
    }

    const comparison = this.performLapComparison(lap1, lap2);
    this.comparisons.set(comparison.id, comparison);

    // Notify listeners
    this.comparisonListeners.forEach((listener) => {
      try {
        listener(comparison);
      } catch (error) {
        console.error("Comparison listener error:", error);
      }
    });
  }

  private performLapComparison(
    lap1: DetailedLapData,
    lap2: DetailedLapData,
  ): LapComparison {
    const timeDifference = lap2.lapTime - lap1.lapTime;

    const sectorDifferences = {
      sector1: lap2.sectors.sector1 - lap1.sectors.sector1,
      sector2: lap2.sectors.sector2 - lap1.sectors.sector2,
      sector3: lap2.sectors.sector3 - lap1.sectors.sector3,
    };

    const performanceDelta = {
      speedDifference: lap2.performance.maxSpeed - lap1.performance.maxSpeed,
      rpmDifference: lap2.performance.maxRPM - lap1.performance.maxRPM,
      gForceDifference: lap2.performance.maxGForce - lap1.performance.maxGForce,
      throttleDifference:
        lap2.performance.avgThrottle - lap1.performance.avgThrottle,
    };

    // Analyze biggest gains and losses
    const biggestTimeGains = this.identifyTimeGains(
      lap1,
      lap2,
      sectorDifferences,
    );
    const biggestTimeLosses = this.identifyTimeLosses(
      lap1,
      lap2,
      sectorDifferences,
    );

    // Braking comparison
    const brakingComparison = {
      lap1AvgBrakingDistance: this.calculateAvgBrakingDistance(lap1),
      lap2AvgBrakingDistance: this.calculateAvgBrakingDistance(lap2),
      brakingEfficiencyDelta:
        this.calculateBrakingEfficiency(lap2) -
        this.calculateBrakingEfficiency(lap1),
    };

    // Cornering comparison
    const corneringComparison = {
      lap1AvgCornerSpeed: this.calculateAvgCornerSpeed(lap1),
      lap2AvgCornerSpeed: this.calculateAvgCornerSpeed(lap2),
      racingLineComparison: this.compareRacingLines(lap1, lap2),
    };

    const overallPerformance =
      timeDifference < -0.1
        ? "better"
        : timeDifference > 0.1
          ? "worse"
          : "similar";

    const keyFindings = this.generateKeyFindings(
      lap1,
      lap2,
      timeDifference,
      sectorDifferences,
    );

    return {
      id: `comparison-${Date.now()}`,
      lap1Id: lap1.id,
      lap2Id: lap2.id,
      lap1,
      lap2,
      timestamp: Date.now(),
      analysis: {
        timeDifference,
        sectorDifferences,
        performanceDelta,
        insights: {
          biggestTimeGains,
          biggestTimeLosses,
          brakingComparison,
          corneringComparison,
        },
        summary: {
          overallPerformance,
          confidenceLevel: Math.min(
            lap1.quality.confidence,
            lap2.quality.confidence,
          ),
          keyFindings,
        },
      },
    };
  }

  // Multi-Lap Analysis
  analyzeMultipleLaps(lapIds: string[]): void {
    const laps = lapIds
      .map((id) => this.storedLaps.get(id))
      .filter(Boolean) as DetailedLapData[];

    if (laps.length < 3) {
      throw new Error("At least 3 laps required for multi-lap analysis");
    }

    const analysis = this.performMultiLapAnalysis(laps);
    this.multiLapAnalyses.set(analysis.id, analysis);

    // Notify listeners
    this.multiLapListeners.forEach((listener) => {
      try {
        listener(analysis);
      } catch (error) {
        console.error("Multi-lap listener error:", error);
      }
    });
  }

  private performMultiLapAnalysis(laps: DetailedLapData[]): MultiLapComparison {
    const lapTimes = laps.map((lap) => lap.lapTime);
    const fastestLap = laps.reduce((fastest, current) =>
      current.lapTime < fastest.lapTime ? current : fastest,
    );
    const slowestLap = laps.reduce((slowest, current) =>
      current.lapTime > slowest.lapTime ? current : slowest,
    );

    const averageLapTime =
      lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
    const lapTimeVariation = Math.max(...lapTimes) - Math.min(...lapTimes);
    const consistencyRating = Math.max(
      0,
      100 - (lapTimeVariation / averageLapTime) * 100,
    );

    // Sector analysis
    const sectorAnalysis = {
      sector1: this.analyzeSector(laps, "sector1"),
      sector2: this.analyzeSector(laps, "sector2"),
      sector3: this.analyzeSector(laps, "sector3"),
    };

    // Performance trends
    const performanceTrends = {
      speedTrend: this.calculateTrend(laps.map((l) => l.performance.maxSpeed)),
      consistencyTrend: this.calculateConsistencyTrend(laps),
      sectorTrends: {
        sector1: this.calculateTrend(laps.map((l) => l.sectors.sector1)),
        sector2: this.calculateTrend(laps.map((l) => l.sectors.sector2)),
        sector3: this.calculateTrend(laps.map((l) => l.sectors.sector3)),
      },
    };

    const recommendations = this.generateMultiLapRecommendations(
      laps,
      consistencyRating,
      sectorAnalysis,
    );

    return {
      id: `multi-lap-${Date.now()}`,
      lapIds: laps.map((l) => l.id),
      laps,
      timestamp: Date.now(),
      analysis: {
        fastestLap,
        slowestLap,
        averageLapTime,
        lapTimeVariation,
        consistencyRating,
        sectorAnalysis,
        performanceTrends,
      },
      recommendations,
    };
  }

  // Helper methods
  private identifyTimeGains(
    lap1: DetailedLapData,
    lap2: DetailedLapData,
    sectorDiffs: any,
  ): any[] {
    const gains = [];

    // Check each sector for gains
    Object.entries(sectorDiffs).forEach(([sector, diff]) => {
      if (diff < -0.1) {
        // Significant improvement
        gains.push({
          name: `Sector ${sector.slice(-1)}`,
          timeDifference: Math.abs(diff),
          reason: `Improved performance in ${sector} with better racing line or technique`,
        });
      }
    });

    // Check for speed improvements
    if (lap2.performance.maxSpeed > lap1.performance.maxSpeed + 5) {
      gains.push({
        name: "Top Speed",
        timeDifference: 0.1,
        reason: `Higher top speed (${lap2.performance.maxSpeed.toFixed(1)} vs ${lap1.performance.maxSpeed.toFixed(1)} km/h)`,
      });
    }

    return gains.slice(0, 3); // Top 3 gains
  }

  private identifyTimeLosses(
    lap1: DetailedLapData,
    lap2: DetailedLapData,
    sectorDiffs: any,
  ): any[] {
    const losses = [];

    // Check each sector for losses
    Object.entries(sectorDiffs).forEach(([sector, diff]) => {
      if (diff > 0.1) {
        // Significant loss
        losses.push({
          name: `Sector ${sector.slice(-1)}`,
          timeDifference: diff,
          recommendation: `Focus on improving technique in ${sector} - analyze braking and acceleration points`,
        });
      }
    });

    // Check for consistency issues
    if (lap2.performance.brakingEvents > lap1.performance.brakingEvents + 2) {
      losses.push({
        name: "Braking Consistency",
        timeDifference: 0.15,
        recommendation:
          "Reduce unnecessary braking events and focus on smoother inputs",
      });
    }

    return losses.slice(0, 3); // Top 3 losses
  }

  private calculateAvgBrakingDistance(lap: DetailedLapData): number {
    const brakingZones = lap.performance.brakingZones;
    return (
      brakingZones.reduce((sum, zone) => sum + zone.brakingDistance, 0) /
      brakingZones.length
    );
  }

  private calculateBrakingEfficiency(lap: DetailedLapData): number {
    const brakingZones = lap.performance.brakingZones;
    return (
      brakingZones.reduce((sum, zone) => sum + zone.efficiency, 0) /
      brakingZones.length
    );
  }

  private calculateAvgCornerSpeed(lap: DetailedLapData): number {
    const corners = lap.performance.corneringSpeeds;
    return (
      corners.reduce((sum, corner) => sum + corner.apexSpeed, 0) /
      corners.length
    );
  }

  private compareRacingLines(
    lap1: DetailedLapData,
    lap2: DetailedLapData,
  ): string {
    const lap1Deviation = lap1.performance.corneringSpeeds.reduce(
      (sum, c) => sum + c.racingLineDeviation,
      0,
    );
    const lap2Deviation = lap2.performance.corneringSpeeds.reduce(
      (sum, c) => sum + c.racingLineDeviation,
      0,
    );

    if (lap2Deviation < lap1Deviation - 1) {
      return "Lap 2 shows better racing line consistency";
    } else if (lap2Deviation > lap1Deviation + 1) {
      return "Lap 1 shows better racing line consistency";
    } else {
      return "Similar racing line execution";
    }
  }

  private generateKeyFindings(
    lap1: DetailedLapData,
    lap2: DetailedLapData,
    timeDiff: number,
    sectorDiffs: any,
  ): string[] {
    const findings = [];

    if (Math.abs(timeDiff) > 0.5) {
      findings.push(
        `Significant lap time difference of ${Math.abs(timeDiff).toFixed(3)}s`,
      );
    }

    const biggestSectorDiff = Object.entries(sectorDiffs).reduce(
      (biggest, [sector, diff]) =>
        Math.abs(diff as number) > Math.abs(biggest.diff)
          ? { sector, diff: diff as number }
          : biggest,
      { sector: "", diff: 0 },
    );

    if (Math.abs(biggestSectorDiff.diff) > 0.2) {
      findings.push(
        `Largest difference in ${biggestSectorDiff.sector}: ${Math.abs(biggestSectorDiff.diff).toFixed(3)}s`,
      );
    }

    if (Math.abs(lap2.performance.maxSpeed - lap1.performance.maxSpeed) > 10) {
      findings.push(
        `Notable top speed difference: ${Math.abs(lap2.performance.maxSpeed - lap1.performance.maxSpeed).toFixed(1)} km/h`,
      );
    }

    return findings;
  }

  private analyzeSector(
    laps: DetailedLapData[],
    sector: "sector1" | "sector2" | "sector3",
  ): any {
    const sectorTimes = laps.map((lap) => lap.sectors[sector]);
    const fastest = Math.min(...sectorTimes);
    const slowest = Math.max(...sectorTimes);
    const average =
      sectorTimes.reduce((sum, time) => sum + time, 0) / sectorTimes.length;

    // Calculate consistency as inverse of coefficient of variation
    const variance =
      sectorTimes.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) /
      sectorTimes.length;
    const standardDeviation = Math.sqrt(variance);
    const consistency = Math.max(0, 100 - (standardDeviation / average) * 100);

    return { fastest, slowest, average, consistency };
  }

  private calculateTrend(
    values: number[],
  ): "improving" | "declining" | "stable" {
    if (values.length < 3) return "stable";

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;
    const threshold = firstAvg * 0.02; // 2% threshold

    if (difference < -threshold) return "improving"; // For lap times, lower is better
    if (difference > threshold) return "declining";
    return "stable";
  }

  private calculateConsistencyTrend(
    laps: DetailedLapData[],
  ): "improving" | "declining" | "stable" {
    if (laps.length < 6) return "stable";

    const firstHalf = laps.slice(0, Math.floor(laps.length / 2));
    const secondHalf = laps.slice(Math.floor(laps.length / 2));

    const firstConsistency = this.calculateLapConsistency(firstHalf);
    const secondConsistency = this.calculateLapConsistency(secondHalf);

    if (secondConsistency > firstConsistency + 5) return "improving";
    if (secondConsistency < firstConsistency - 5) return "declining";
    return "stable";
  }

  private calculateLapConsistency(laps: DetailedLapData[]): number {
    const lapTimes = laps.map((lap) => lap.lapTime);
    const average =
      lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
    const variance =
      lapTimes.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) /
      lapTimes.length;
    const standardDeviation = Math.sqrt(variance);
    return Math.max(0, 100 - (standardDeviation / average) * 100);
  }

  private generateMultiLapRecommendations(
    laps: DetailedLapData[],
    consistency: number,
    sectorAnalysis: any,
  ): string[] {
    const recommendations = [];

    if (consistency < 80) {
      recommendations.push(
        "Focus on improving consistency - use reference points for braking and turn-in",
      );
    }

    // Find weakest sector
    const sectorConsistencies = [
      { name: "Sector 1", value: sectorAnalysis.sector1.consistency },
      { name: "Sector 2", value: sectorAnalysis.sector2.consistency },
      { name: "Sector 3", value: sectorAnalysis.sector3.consistency },
    ];
    const weakestSector = sectorConsistencies.reduce((weakest, current) =>
      current.value < weakest.value ? current : weakest,
    );

    if (weakestSector.value < 85) {
      recommendations.push(
        `Work specifically on ${weakestSector.name} - lowest consistency at ${weakestSector.value.toFixed(1)}%`,
      );
    }

    // Check for speed improvements
    const speedVariation =
      Math.max(...laps.map((l) => l.performance.maxSpeed)) -
      Math.min(...laps.map((l) => l.performance.maxSpeed));
    if (speedVariation > 20) {
      recommendations.push(
        "Focus on consistent corner exit speeds to improve top speed consistency",
      );
    }

    // General recommendations
    recommendations.push(
      "Continue practicing to build muscle memory and reduce lap time variation",
    );

    return recommendations;
  }

  // Event listeners
  onComparison(callback: (comparison: LapComparison) => void): () => void {
    this.comparisonListeners.add(callback);
    return () => this.comparisonListeners.delete(callback);
  }

  onMultiLapAnalysis(
    callback: (analysis: MultiLapComparison) => void,
  ): () => void {
    this.multiLapListeners.add(callback);
    return () => this.multiLapListeners.delete(callback);
  }

  // Getters
  getComparison(comparisonId: string): LapComparison | null {
    return this.comparisons.get(comparisonId) || null;
  }

  getMultiLapAnalysis(analysisId: string): MultiLapComparison | null {
    return this.multiLapAnalyses.get(analysisId) || null;
  }

  getAllComparisons(): LapComparison[] {
    return Array.from(this.comparisons.values()).sort(
      (a, b) => b.timestamp - a.timestamp,
    );
  }

  getAllMultiLapAnalyses(): MultiLapComparison[] {
    return Array.from(this.multiLapAnalyses.values()).sort(
      (a, b) => b.timestamp - a.timestamp,
    );
  }
}

// Global instance
export const lapComparisonService = new LapComparisonService();
