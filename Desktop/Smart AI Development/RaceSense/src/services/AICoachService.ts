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
  async addLapData(lapData: LapData): Promise<void> {
    if (!this.currentSessionId) return;
    this.sessionLaps.push(lapData);

    // Call backend for insights
    try {
      const insightRes = await fetch("/api/ai/coach/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: this.currentSessionId, lapData, sessionLaps: this.sessionLaps }),
      });
      if (insightRes.ok) {
        const insights: AIInsight[] = await insightRes.json();
        insights.forEach((insight) => this.insightListeners.forEach((cb) => cb(insight)));
      }
    } catch (e) { /* handle error/log */ }

    // Call backend for analysis if enough laps
    if (this.sessionLaps.length >= 3) {
      try {
        const analysisRes = await fetch("/api/ai/coach/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: this.currentSessionId, sessionLaps: this.sessionLaps }),
        });
        if (analysisRes.ok) {
          const analysis: PerformanceAnalysis = await analysisRes.json();
          this.analysisListeners.forEach((cb) => cb(analysis));
        }
      } catch (e) { /* handle error/log */ }
    }

    // Call backend for prediction if enough laps
    if (this.sessionLaps.length >= 5) {
      try {
        const predictionRes = await fetch("/api/ai/coach/prediction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: this.currentSessionId, sessionLaps: this.sessionLaps }),
        });
        if (predictionRes.ok) {
          const prediction: PredictiveLapTime = await predictionRes.json();
          this.predictionListeners.forEach((cb) => cb(prediction));
        }
      } catch (e) { /* handle error/log */ }
    }
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
