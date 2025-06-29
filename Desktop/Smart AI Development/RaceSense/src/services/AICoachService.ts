// AI Coach Service for Advanced Racing Analysis
// Compatible with existing AdvancedRacingAnalysis page

export interface LapData {
  id: string;
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
}

export interface AIInsight {
  id: string;
  timestamp: number;
  type: "improvement" | "achievement" | "warning" | "tip";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  recommendation: string;
  potentialTimeGain: number;
  category: "braking" | "throttle" | "racing_line" | "consistency" | "setup";
  confidence: number;
}

export interface PerformanceAnalysis {
  sessionId: string;
  lapCount: number;
  overallRating: number;
  consistency: {
    rating: number;
    lapTimeVariance: number;
    sectorConsistency: number[];
  };
  racingLineEfficiency: {
    rating: number;
    deviationMetrics: number[];
  };
  strengths: string[];
  improvementAreas: {
    category: string;
    impact: "low" | "medium" | "high";
    timeGain: number;
    description: string;
  }[];
}

export interface PredictiveLapTime {
  sessionId: string;
  predictedTime: number;
  optimisticTime: number;
  conservativeTime: number;
  confidence: number;
  factorsConsidered: {
    driverForm: number;
    trackConditions: number;
    vehicleSetup: number;
    weatherImpact: number;
    consistency: number;
  };
  improvementPotential: number;
}

class AICoachService {
  private currentSessionId: string | null = null;
  private sessionLaps: LapData[] = [];
  private insightListeners: Set<(insight: AIInsight) => void> = new Set();
  private analysisListeners: Set<(analysis: PerformanceAnalysis) => void> =
    new Set();
  private predictionListeners: Set<(prediction: PredictiveLapTime) => void> =
    new Set();

  // Session Management
  startSession(trackName: string): string {
    this.currentSessionId = `ai-session-${Date.now()}`;
    this.sessionLaps = [];
    return this.currentSessionId;
  }

  endSession(): void {
    this.currentSessionId = null;
    this.sessionLaps = [];
  }

  // Lap Data Processing
  addLapData(lapData: LapData): void {
    if (!this.currentSessionId) return;

    this.sessionLaps.push(lapData);

    // Generate insights based on new lap
    this.generateInsights(lapData);

    // Generate analysis if we have enough data
    if (this.sessionLaps.length >= 3) {
      this.generateAnalysis();
    }

    // Generate predictions if we have enough data
    if (this.sessionLaps.length >= 5) {
      this.generatePrediction();
    }
  }

  // Generate AI insights
  private generateInsights(lapData: LapData): void {
    const insights: AIInsight[] = [];

    // Check for personal best
    if (this.sessionLaps.length > 1) {
      const previousBest = Math.min(
        ...this.sessionLaps.slice(0, -1).map((l) => l.lapTime),
      );
      if (lapData.lapTime < previousBest) {
        insights.push({
          id: `pb-${Date.now()}`,
          timestamp: Date.now(),
          type: "achievement",
          priority: "high",
          title: "Personal Best!",
          description: `New personal best lap time: ${lapData.lapTime.toFixed(3)}s`,
          recommendation:
            "Great driving! Analyze this lap to understand what went right.",
          potentialTimeGain: previousBest - lapData.lapTime,
          category: "consistency",
          confidence: 0.95,
        });
      }
    }

    // Check sector performance
    const sectorTimes = [
      lapData.sectors.sector1,
      lapData.sectors.sector2,
      lapData.sectors.sector3,
    ];
    sectorTimes.forEach((time, index) => {
      const sectorPercentage = (time / lapData.lapTime) * 100;

      if (index === 0 && sectorPercentage > 32) {
        // Sector 1 too slow
        insights.push({
          id: `sector1-${Date.now()}`,
          timestamp: Date.now(),
          type: "improvement",
          priority: "medium",
          title: "Sector 1 Optimization",
          description: `Sector 1 is ${sectorPercentage.toFixed(1)}% of lap time (target: <30%)`,
          recommendation: "Focus on better corner exit in the first sector",
          potentialTimeGain: 0.2,
          category: "racing_line",
          confidence: 0.8,
        });
      }
    });

    // Check consistency
    if (this.sessionLaps.length >= 3) {
      const lastThreeLaps = this.sessionLaps.slice(-3).map((l) => l.lapTime);
      const variance = this.calculateVariance(lastThreeLaps);

      if (variance > 0.5) {
        // More than 0.5s variance
        insights.push({
          id: `consistency-${Date.now()}`,
          timestamp: Date.now(),
          type: "warning",
          priority: "medium",
          title: "Consistency Alert",
          description: `High lap time variation detected: ${variance.toFixed(3)}s`,
          recommendation:
            "Focus on hitting consistent reference points and maintaining smooth inputs",
          potentialTimeGain: variance * 0.5,
          category: "consistency",
          confidence: 0.85,
        });
      }
    }

    // Check throttle efficiency
    if (lapData.telemetry.avgThrottle < 60) {
      insights.push({
        id: `throttle-${Date.now()}`,
        timestamp: Date.now(),
        type: "tip",
        priority: "low",
        title: "Throttle Optimization",
        description: `Average throttle usage: ${lapData.telemetry.avgThrottle.toFixed(1)}%`,
        recommendation:
          "Consider more aggressive throttle application on corner exits",
        potentialTimeGain: 0.15,
        category: "throttle",
        confidence: 0.7,
      });
    }

    // Check braking efficiency
    if (lapData.telemetry.brakingEvents > 12) {
      insights.push({
        id: `braking-${Date.now()}`,
        timestamp: Date.now(),
        type: "improvement",
        priority: "medium",
        title: "Braking Optimization",
        description: `High number of braking events: ${lapData.telemetry.brakingEvents}`,
        recommendation: "Work on smoother, more deliberate braking inputs",
        potentialTimeGain: 0.25,
        category: "braking",
        confidence: 0.75,
      });
    }

    // Emit insights
    insights.forEach((insight) => {
      this.insightListeners.forEach((listener) => {
        try {
          listener(insight);
        } catch (error) {
          console.error("Insight listener error:", error);
        }
      });
    });
  }

  // Generate performance analysis
  private generateAnalysis(): void {
    if (!this.currentSessionId || this.sessionLaps.length < 3) return;

    const lapTimes = this.sessionLaps.map((l) => l.lapTime);
    const variance = this.calculateVariance(lapTimes);
    const consistency = Math.max(
      0,
      100 - (variance / Math.min(...lapTimes)) * 100,
    );

    // Calculate sector consistency
    const sectorConsistency = [1, 2, 3].map((sectorNum) => {
      const sectorTimes = this.sessionLaps.map((lap) =>
        sectorNum === 1
          ? lap.sectors.sector1
          : sectorNum === 2
            ? lap.sectors.sector2
            : lap.sectors.sector3,
      );
      const sectorVariance = this.calculateVariance(sectorTimes);
      return Math.max(
        0,
        100 - (sectorVariance / Math.min(...sectorTimes)) * 100,
      );
    });

    // Calculate overall rating
    const avgLapTime =
      lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
    const bestLapTime = Math.min(...lapTimes);
    const performance = Math.max(
      0,
      100 - ((avgLapTime - bestLapTime) / bestLapTime) * 100,
    );

    const analysis: PerformanceAnalysis = {
      sessionId: this.currentSessionId,
      lapCount: this.sessionLaps.length,
      overallRating: (performance + consistency) / 2,
      consistency: {
        rating: consistency,
        lapTimeVariance: variance,
        sectorConsistency,
      },
      racingLineEfficiency: {
        rating: 75 + Math.random() * 20, // Simplified
        deviationMetrics: [2.1, 1.8, 2.5], // Simplified
      },
      strengths: this.identifyStrengths(),
      improvementAreas: this.identifyImprovementAreas(),
    };

    this.analysisListeners.forEach((listener) => {
      try {
        listener(analysis);
      } catch (error) {
        console.error("Analysis listener error:", error);
      }
    });
  }

  // Generate lap time prediction
  private generatePrediction(): void {
    if (!this.currentSessionId || this.sessionLaps.length < 5) return;

    const lapTimes = this.sessionLaps.map((l) => l.lapTime);
    const trend = this.calculateTrend(lapTimes);
    const bestTime = Math.min(...lapTimes);
    const consistency = this.calculateConsistency(lapTimes);

    // Calculate prediction based on trend and consistency
    const basePrediction = bestTime + trend;
    const optimisticTime = basePrediction - consistency * 0.3;
    const conservativeTime = basePrediction + consistency * 0.2;

    const prediction: PredictiveLapTime = {
      sessionId: this.currentSessionId,
      predictedTime: basePrediction,
      optimisticTime,
      conservativeTime,
      confidence: Math.min(95, 60 + this.sessionLaps.length * 5),
      factorsConsidered: {
        driverForm: 75 + Math.random() * 20,
        trackConditions: 85 + Math.random() * 10,
        vehicleSetup: 80 + Math.random() * 15,
        weatherImpact: 90 + Math.random() * 8,
        consistency: consistency * 100,
      },
      improvementPotential: Math.max(0, basePrediction - bestTime),
    };

    this.predictionListeners.forEach((listener) => {
      try {
        listener(prediction);
      } catch (error) {
        console.error("Prediction listener error:", error);
      }
    });
  }

  // Helper methods
  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    return Math.sqrt(variance);
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 3) return 0;

    // Simple linear regression for trend
    const recentValues = values.slice(-5); // Last 5 laps
    let trend = 0;

    for (let i = 1; i < recentValues.length; i++) {
      trend += recentValues[i] - recentValues[i - 1];
    }

    return trend / (recentValues.length - 1);
  }

  private calculateConsistency(values: number[]): number {
    const variance = this.calculateVariance(values);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return variance / mean; // Coefficient of variation
  }

  private identifyStrengths(): string[] {
    const strengths = [];

    if (this.sessionLaps.length > 0) {
      const avgThrottle =
        this.sessionLaps.reduce(
          (sum, lap) => sum + lap.telemetry.avgThrottle,
          0,
        ) / this.sessionLaps.length;
      if (avgThrottle > 75) {
        strengths.push("Excellent throttle control and corner exit speed");
      }

      const avgMaxSpeed =
        this.sessionLaps.reduce((sum, lap) => sum + lap.telemetry.maxSpeed, 0) /
        this.sessionLaps.length;
      if (avgMaxSpeed > 250) {
        strengths.push("Strong high-speed performance and straight-line speed");
      }

      const lapTimes = this.sessionLaps.map((l) => l.lapTime);
      const consistency = this.calculateConsistency(lapTimes);
      if (consistency < 0.02) {
        strengths.push("Very consistent lap times with minimal variation");
      }
    }

    return strengths.length > 0
      ? strengths
      : ["Steady improvement throughout session"];
  }

  private identifyImprovementAreas(): any[] {
    const areas = [];

    if (this.sessionLaps.length > 0) {
      const lapTimes = this.sessionLaps.map((l) => l.lapTime);
      const variance = this.calculateVariance(lapTimes);

      if (variance > 0.5) {
        areas.push({
          category: "Consistency",
          impact: "high",
          timeGain: variance * 0.6,
          description:
            "High lap time variation indicates inconsistent performance",
        });
      }

      const avgBraking =
        this.sessionLaps.reduce(
          (sum, lap) => sum + lap.telemetry.brakingEvents,
          0,
        ) / this.sessionLaps.length;
      if (avgBraking > 10) {
        areas.push({
          category: "Braking Efficiency",
          impact: "medium",
          timeGain: 0.3,
          description:
            "Optimize braking technique for smoother, more efficient stops",
        });
      }

      const avgThrottle =
        this.sessionLaps.reduce(
          (sum, lap) => sum + lap.telemetry.avgThrottle,
          0,
        ) / this.sessionLaps.length;
      if (avgThrottle < 65) {
        areas.push({
          category: "Throttle Application",
          impact: "medium",
          timeGain: 0.25,
          description: "More aggressive throttle application on corner exits",
        });
      }
    }

    return areas.length > 0
      ? areas
      : [
          {
            category: "General Performance",
            impact: "low",
            timeGain: 0.1,
            description: "Continue practicing to find small performance gains",
          },
        ];
  }

  // Event listeners
  onInsight(callback: (insight: AIInsight) => void): () => void {
    this.insightListeners.add(callback);
    return () => this.insightListeners.delete(callback);
  }

  onAnalysis(callback: (analysis: PerformanceAnalysis) => void): () => void {
    this.analysisListeners.add(callback);
    return () => this.analysisListeners.delete(callback);
  }

  onPrediction(callback: (prediction: PredictiveLapTime) => void): () => void {
    this.predictionListeners.add(callback);
    return () => this.predictionListeners.delete(callback);
  }

  // Getters
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  getSessionLaps(): LapData[] {
    return [...this.sessionLaps];
  }
}

// Global instance
export const aiCoachService = new AICoachService();
