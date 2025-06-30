import React from "react";
import { RacingButton } from "@/components/RacingButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RacingStatusIndicator,
  PerformanceMetric,
  RacingProgressBar,
} from "@/components/LoadingStates";
import { notify } from "@/components/RacingNotifications";
import {
  aiCoachService,
  AIInsight,
  PerformanceAnalysis,
  PredictiveLapTime,
  LapData,
} from "@/services/AICoachService";
import {
  lapComparisonService,
  DetailedLapData,
  LapComparison,
  MultiLapComparison,
} from "@/services/LapComparisonService";
import {
  Brain,
  TrendingUp,
  BarChart3,
  Target,
  Zap,
  Trophy,
  AlertTriangle,
  CheckCircle,
  Clock,
  Gauge,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  Play,
  Square,
  RotateCcw,
  Eye,
  Lightbulb,
  Star,
  Flame,
} from "lucide-react";

interface AnalysisState {
  // AI Coach State
  isCoachingActive: boolean;
  currentSession: string | null;
  latestInsights: AIInsight[];
  performanceAnalysis: PerformanceAnalysis | null;
  predictions: PredictiveLapTime[];

  // Lap Comparison State
  storedLaps: DetailedLapData[];
  selectedLaps: string[];
  activeComparison: LapComparison | null;
  multiLapAnalysis: MultiLapComparison | null;

  // UI State
  selectedTab: "coach" | "comparison" | "analytics";
  isGeneratingData: boolean;
}

class AdvancedRacingAnalysisPage extends React.Component<{}, AnalysisState> {
  private coachUnsubscribe: (() => void)[] = [];
  private comparisonUnsubscribe: (() => void)[] = [];
  private simulationInterval: NodeJS.Timeout | null = null;

  constructor(props: {}) {
    super(props);
    this.state = {
      isCoachingActive: false,
      currentSession: null,
      latestInsights: [],
      performanceAnalysis: null,
      predictions: [],
      storedLaps: [],
      selectedLaps: [],
      activeComparison: null,
      multiLapAnalysis: null,
      selectedTab: "coach",
      isGeneratingData: false,
    };
  }

  componentDidMount() {
    this.setupServiceSubscriptions();
    this.loadStoredData();
  }

  componentWillUnmount() {
    this.coachUnsubscribe.forEach((unsub) => unsub());
    this.comparisonUnsubscribe.forEach((unsub) => unsub());
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
  }

  private setupServiceSubscriptions(): void {
    // AI Coach subscriptions
    this.coachUnsubscribe.push(
      aiCoachService.onInsight((insight) => {
        this.setState((prev) => ({
          latestInsights: [insight, ...prev.latestInsights.slice(0, 9)],
        }));

        // Show insight as notification
        const priority = insight.priority;
        if (priority === "high" || priority === "critical") {
          notify.warning(`AI Coach: ${insight.title}`, insight.description, {
            duration: 6000,
            actions: [
              {
                label: "View Details",
                action: () => console.log("View insight details", insight),
                style: "primary",
              },
            ],
          });
        } else if (insight.type === "achievement") {
          notify.success(`AI Coach: ${insight.title}`, insight.description, {
            duration: 4000,
          });
        }
      }),
    );

    this.coachUnsubscribe.push(
      aiCoachService.onAnalysis((analysis) => {
        this.setState({ performanceAnalysis: analysis });
      }),
    );

    this.coachUnsubscribe.push(
      aiCoachService.onPrediction((prediction) => {
        this.setState((prev) => ({
          predictions: [prediction, ...prev.predictions.slice(0, 4)],
        }));
      }),
    );

    // Lap Comparison subscriptions
    this.comparisonUnsubscribe.push(
      lapComparisonService.onComparison((comparison) => {
        this.setState({ activeComparison: comparison });
        notify.info(
          "Lap Comparison Complete",
          `Analysis ready: ${comparison.analysis.timeDifference.toFixed(3)}s difference`,
          {
            actions: [
              {
                label: "View Analysis",
                action: () => this.setState({ selectedTab: "comparison" }),
                style: "primary",
              },
            ],
          },
        );
      }),
    );

    this.comparisonUnsubscribe.push(
      lapComparisonService.onMultiLapAnalysis((analysis) => {
        this.setState({ multiLapAnalysis: analysis });
      }),
    );
  }

  private loadStoredData(): void {
    this.setState({
      storedLaps: lapComparisonService.getStoredLaps(),
    });
  }

  // AI Coaching Controls
  private handleStartCoaching = (): void => {
    const sessionId = aiCoachService.startSession("silverstone");
    this.setState({
      isCoachingActive: true,
      currentSession: sessionId,
    });

    notify.success(
      "AI Coach Activated",
      "Real-time performance analysis started",
      { duration: 3000 },
    );

    // Start simulating lap data for demo
    this.startLapSimulation();
  };

  private handleStopCoaching = (): void => {
    aiCoachService.endSession();
    this.setState({
      isCoachingActive: false,
      currentSession: null,
    });

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    notify.info("AI Coach Stopped", "Session analysis complete", {
      duration: 3000,
    });
  };

  private startLapSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    let lapCount = 0;
    this.simulationInterval = setInterval(() => {
      lapCount++;
      const lapData = this.generateSimulatedLapData(lapCount);
      aiCoachService.addLapData(lapData);

      // Also store for comparison
      const detailedLap = this.convertToDetailedLap(lapData, lapCount);
      lapComparisonService.storeLap(detailedLap);
      this.loadStoredData();

      if (lapCount >= 10) {
        // Stop after 10 laps
        this.handleStopCoaching();
      }
    }, 3000); // Generate a new lap every 3 seconds
  }

  private generateSimulatedLapData(lapNumber: number): LapData {
    // Simulate improving performance over time with some variance
    const baseTime = 85.0; // Base lap time
    const improvement = Math.max(0, (lapNumber - 1) * 0.2); // Gradual improvement
    const variance = (Math.random() - 0.5) * 2; // Random variance

    const lapTime = baseTime - improvement + variance;

    // Generate realistic sector times (roughly 30%, 35%, 35% of lap time)
    const sector1 = lapTime * (0.28 + Math.random() * 0.04);
    const sector2 = lapTime * (0.33 + Math.random() * 0.04);
    const sector3 = lapTime - sector1 - sector2;

    // Generate performance metrics
    const maxSpeed = 280 + Math.random() * 40;
    const avgSpeed = 160 + Math.random() * 30;
    const maxGForce = 2.0 + Math.random() * 1.5;
    const brakingEvents = 8 + Math.floor(Math.random() * 6);

    return {
      id: `sim-lap-${Date.now()}-${lapNumber}`,
      timestamp: Date.now(),
      trackName: "silverstone",
      lapTime,
      sectors: {
        sector1,
        sector2,
        sector3,
      },
      telemetry: {
        maxSpeed,
        avgSpeed,
        maxRPM: 6500 + Math.random() * 1000,
        maxGForce,
        avgThrottle: 65 + Math.random() * 25,
        brakingEvents,
        throttleEvents: 12 + Math.floor(Math.random() * 8),
      },
      conditions: {
        temperature: 22 + Math.random() * 8,
        weather: "Clear",
        gripLevel: 85 + Math.random() * 10,
        tires: "Medium",
      },
    };
  }

  private convertToDetailedLap(
    lapData: LapData,
    lapNumber: number,
  ): DetailedLapData {
    // Generate detailed telemetry points
    const telemetryPoints = Array.from({ length: 100 }, (_, i) => ({
      distanceFromStart: (i / 100) * 5891, // Silverstone track length
      timestamp: lapData.timestamp + (i / 100) * lapData.lapTime * 1000,
      speed: lapData.telemetry.avgSpeed + (Math.random() - 0.5) * 30,
      throttle: Math.random() * 100,
      brake: Math.random() * 100,
      gear: Math.floor(Math.random() * 6) + 1,
      rpm: 3000 + Math.random() * 4000,
      lateralG: (Math.random() - 0.5) * 2,
      longitudinalG: (Math.random() - 0.5) * 1,
      steeringAngle: (Math.random() - 0.5) * 180,
      trackPosition: (Math.random() - 0.5) * 10,
    }));

    return {
      ...lapData,
      sessionId: this.state.currentSession || "demo-session",
      driverName: "Driver",
      lapNumber,
      telemetryPoints,
      performance: {
        ...lapData.telemetry,
        topSpeed: lapData.telemetry.maxSpeed,
        maxBraking: 2.5 + Math.random() * 1.5,
        maxAcceleration: 1.5 + Math.random() * 1.0,
        maxLateralG: lapData.telemetry.maxGForce,
        avgThrottlePosition: lapData.telemetry.avgThrottle,
        brakingZones: Array.from({ length: 8 }, (_, i) => ({
          startDistance: i * 700,
          endDistance: i * 700 + 100,
          peakDeceleration: 2.0 + Math.random() * 2.0,
          brakingDistance: 80 + Math.random() * 40,
          entrySpeed: 200 + Math.random() * 50,
          exitSpeed: 80 + Math.random() * 40,
          efficiency: 70 + Math.random() * 25,
        })),
        corneringSpeeds: Array.from({ length: 12 }, (_, i) => ({
          corner: i + 1,
          apexSpeed: 80 + Math.random() * 60,
          entrySpeed: 150 + Math.random() * 50,
          exitSpeed: 120 + Math.random() * 60,
          minRadius: 50 + Math.random() * 100,
          maxLateralG: 1.5 + Math.random() * 1.0,
          racingLineDeviation: Math.random() * 5,
        })),
      },
      quality: {
        cleanLap: Math.random() > 0.2,
        validLap: true,
        confidence: 85 + Math.random() * 10,
        issues: Math.random() > 0.7 ? ["Minor track limits"] : [],
      },
    };
  }

  // Lap Comparison Controls
  private handleCompareLaps = (): void => {
    if (this.state.selectedLaps.length !== 2) {
      notify.warning(
        "Select Two Laps",
        "Please select exactly 2 laps for comparison",
      );
      return;
    }

    try {
      lapComparisonService.compareLaps(
        this.state.selectedLaps[0],
        this.state.selectedLaps[1],
      );
    } catch (error) {
      notify.error("Comparison Failed", (error as Error).message);
    }
  };

  private handleMultiLapAnalysis = (): void => {
    if (this.state.selectedLaps.length < 3) {
      notify.warning(
        "Select Multiple Laps",
        "Please select at least 3 laps for multi-lap analysis",
      );
      return;
    }

    try {
      lapComparisonService.analyzeMultipleLaps(this.state.selectedLaps);
      notify.success("Multi-Lap Analysis", "Comprehensive analysis complete");
    } catch (error) {
      notify.error("Analysis Failed", (error as Error).message);
    }
  };

  private toggleLapSelection = (lapId: string): void => {
    this.setState((prev) => ({
      selectedLaps: prev.selectedLaps.includes(lapId)
        ? prev.selectedLaps.filter((id) => id !== lapId)
        : [...prev.selectedLaps, lapId],
    }));
  };

  // Render methods for different tabs
  private renderCoachTab(): React.ReactNode {
    const {
      isCoachingActive,
      latestInsights,
      performanceAnalysis,
      predictions,
    } = this.state;

    return (
      <div className="space-y-6">
        {/* AI Coach Status */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-racing-purple" />
            AI Performance Coach
          </h3>

          <div className="flex items-center gap-4 mb-6">
            <RacingStatusIndicator
              status={isCoachingActive ? "online" : "offline"}
              text={isCoachingActive ? "Active Analysis" : "Ready"}
              size="md"
            />
            <span className="text-sm text-muted-foreground">
              {isCoachingActive
                ? "Real-time performance analysis running"
                : "Click start to begin AI coaching session"}
            </span>
          </div>

          <div className="flex gap-3">
            {!isCoachingActive ? (
              <RacingButton
                variant="racing"
                racing="purple"
                icon={Play}
                onClick={this.handleStartCoaching}
              >
                Start AI Coaching
              </RacingButton>
            ) : (
              <RacingButton
                variant="racing"
                racing="red"
                icon={Square}
                onClick={this.handleStopCoaching}
              >
                Stop Session
              </RacingButton>
            )}
          </div>
        </Card>

        {/* Performance Analysis */}
        {performanceAnalysis && (
          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-racing-green" />
              Performance Analysis
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <PerformanceMetric
                label="Overall Rating"
                value={performanceAnalysis.overallRating}
                unit="%"
                target={85}
                color="blue"
              />
              <PerformanceMetric
                label="Consistency"
                value={performanceAnalysis.consistency.rating}
                unit="%"
                target={90}
                color="green"
              />
              <PerformanceMetric
                label="Racing Line"
                value={performanceAnalysis.racingLineEfficiency.rating}
                unit="%"
                target={80}
                color="purple"
              />
              <PerformanceMetric
                label="Lap Variance"
                value={performanceAnalysis.consistency.lapTimeVariance}
                unit="s"
                color="yellow"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div>
                <h5 className="font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-racing-green" />
                  Strengths
                </h5>
                <div className="space-y-2">
                  {performanceAnalysis.strengths.map((strength, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Star className="h-3 w-3 text-racing-yellow" />
                      {strength}
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvement Areas */}
              <div>
                <h5 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-racing-orange" />
                  Improvement Areas
                </h5>
                <div className="space-y-2">
                  {performanceAnalysis.improvementAreas
                    .slice(0, 3)
                    .map((area, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{area.category}</span>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            area.impact === "high"
                              ? "bg-racing-red/20 text-racing-red"
                              : area.impact === "medium"
                                ? "bg-racing-yellow/20 text-racing-yellow"
                                : "bg-racing-green/20 text-racing-green"
                          }`}
                        >
                          {area.timeGain.toFixed(1)}s
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Latest AI Insights */}
        {latestInsights.length > 0 && (
          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-racing-yellow" />
              Latest AI Insights
            </h4>
            <div className="space-y-3">
              {latestInsights.slice(0, 5).map((insight) => (
                <div
                  key={insight.id}
                  className={`p-4 rounded-lg border ${
                    insight.priority === "critical"
                      ? "bg-racing-red/10 border-racing-red/30"
                      : insight.priority === "high"
                        ? "bg-racing-orange/10 border-racing-orange/30"
                        : insight.type === "achievement"
                          ? "bg-racing-green/10 border-racing-green/30"
                          : "bg-racing-blue/10 border-racing-blue/30"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium text-sm">{insight.title}</h5>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {insight.priority.toUpperCase()}
                      </Badge>
                      {insight.potentialTimeGain > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-racing-green/20 text-racing-green"
                        >
                          +{insight.potentialTimeGain.toFixed(1)}s
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {insight.description}
                  </p>
                  <p className="text-sm font-medium">
                    {insight.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Predictions */}
        {predictions.length > 0 && (
          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-racing-blue" />
              AI Lap Time Predictions
            </h4>
            <div className="space-y-4">
              {predictions.slice(0, 2).map((prediction, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <PerformanceMetric
                      label="Predicted Time"
                      value={prediction.predictedTime}
                      format="time"
                      color="blue"
                    />
                    <PerformanceMetric
                      label="Confidence"
                      value={prediction.confidence}
                      unit="%"
                      color="green"
                    />
                    <PerformanceMetric
                      label="Optimistic"
                      value={prediction.optimisticTime}
                      format="time"
                      color="green"
                    />
                    <PerformanceMetric
                      label="Conservative"
                      value={prediction.conservativeTime}
                      format="time"
                      color="yellow"
                    />
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {Object.entries(prediction.factorsConsidered).map(
                      ([factor, value]) => (
                        <div key={factor} className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">
                            {factor.replace(/([A-Z])/g, " $1")}
                          </div>
                          <RacingProgressBar
                            progress={value}
                            color={
                              value > 80
                                ? "green"
                                : value > 60
                                  ? "yellow"
                                  : "red"
                            }
                            showPercentage={false}
                            animated={false}
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  private renderComparisonTab(): React.ReactNode {
    const { storedLaps, selectedLaps, activeComparison, multiLapAnalysis } =
      this.state;

    return (
      <div className="space-y-6">
        {/* Lap Selection */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-racing-blue" />
            Lap Comparison System
          </h3>

          <div className="flex gap-3 mb-6">
            <RacingButton
              variant="racing"
              racing="blue"
              icon={Eye}
              onClick={this.handleCompareLaps}
              disabled={selectedLaps.length !== 2}
            >
              Compare Selected Laps ({selectedLaps.length}/2)
            </RacingButton>
            <RacingButton
              variant="outline"
              icon={BarChart3}
              onClick={this.handleMultiLapAnalysis}
              disabled={selectedLaps.length < 3}
            >
              Multi-Lap Analysis ({selectedLaps.length})
            </RacingButton>
            <RacingButton
              variant="outline"
              icon={RotateCcw}
              onClick={() => this.setState({ selectedLaps: [] })}
            >
              Clear Selection
            </RacingButton>
          </div>

          {/* Stored Laps */}
          <div className="space-y-3">
            <h4 className="font-medium">Stored Laps ({storedLaps.length})</h4>
            <div className="grid gap-3">
              {storedLaps.slice(0, 10).map((lap) => (
                <div
                  key={lap.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedLaps.includes(lap.id)
                      ? "bg-racing-blue/10 border-racing-blue/30"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => this.toggleLapSelection(lap.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">
                        Lap {lap.lapNumber} - {lap.lapTime.toFixed(3)}s
                      </span>
                      <div className="text-sm text-muted-foreground">
                        Sectors: {lap.sectors.sector1.toFixed(3)} /{" "}
                        {lap.sectors.sector2.toFixed(3)} /{" "}
                        {lap.sectors.sector3.toFixed(3)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        Max: {lap.performance.maxSpeed.toFixed(0)} km/h
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          lap.quality.confidence > 90
                            ? "bg-racing-green/20 text-racing-green"
                            : lap.quality.confidence > 70
                              ? "bg-racing-yellow/20 text-racing-yellow"
                              : "bg-racing-red/20 text-racing-red"
                        }`}
                      >
                        {lap.quality.confidence.toFixed(0)}% Quality
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Active Comparison Results */}
        {activeComparison && (
          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-racing-gold" />
              Lap Comparison Analysis
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <PerformanceMetric
                label="Time Difference"
                value={Math.abs(activeComparison.analysis.timeDifference)}
                format="time"
                color={
                  activeComparison.analysis.timeDifference < 0 ? "green" : "red"
                }
              />
              <PerformanceMetric
                label="Speed Difference"
                value={Math.abs(
                  activeComparison.analysis.performanceDelta.speedDifference,
                )}
                unit="km/h"
                color="blue"
              />
              <PerformanceMetric
                label="Confidence"
                value={activeComparison.analysis.summary.confidenceLevel}
                unit="%"
                color="purple"
              />
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  Performance
                </div>
                <div
                  className={`text-lg font-bold ${
                    activeComparison.analysis.summary.overallPerformance ===
                    "better"
                      ? "text-racing-green"
                      : activeComparison.analysis.summary.overallPerformance ===
                          "worse"
                        ? "text-racing-red"
                        : "text-racing-yellow"
                  }`}
                >
                  {activeComparison.analysis.summary.overallPerformance.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Time Gains */}
              {activeComparison.analysis.insights.biggestTimeGains.length >
                0 && (
                <div>
                  <h5 className="font-medium mb-3 flex items-center gap-2">
                    <ArrowUp className="h-4 w-4 text-racing-green" />
                    Biggest Time Gains
                  </h5>
                  {activeComparison.analysis.insights.biggestTimeGains.map(
                    (gain, index) => (
                      <div
                        key={index}
                        className="mb-3 p-3 bg-racing-green/10 rounded-lg"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-sm">
                            {gain.name}
                          </span>
                          <span className="text-racing-green font-bold">
                            +{gain.timeDifference.toFixed(3)}s
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {gain.reason}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              )}

              {/* Time Losses */}
              {activeComparison.analysis.insights.biggestTimeLosses.length >
                0 && (
                <div>
                  <h5 className="font-medium mb-3 flex items-center gap-2">
                    <ArrowDown className="h-4 w-4 text-racing-red" />
                    Areas for Improvement
                  </h5>
                  {activeComparison.analysis.insights.biggestTimeLosses.map(
                    (loss, index) => (
                      <div
                        key={index}
                        className="mb-3 p-3 bg-racing-red/10 rounded-lg"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-sm">
                            {loss.name}
                          </span>
                          <span className="text-racing-red font-bold">
                            -{loss.timeDifference.toFixed(3)}s
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {loss.recommendation}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Multi-Lap Analysis Results */}
        {multiLapAnalysis && (
          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-racing-purple" />
              Multi-Lap Consistency Analysis
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <PerformanceMetric
                label="Consistency Rating"
                value={multiLapAnalysis.analysis.consistencyRating}
                unit="%"
                target={85}
                color="green"
              />
              <PerformanceMetric
                label="Best Lap Time"
                value={multiLapAnalysis.analysis.fastestLap.lapTime}
                format="time"
                color="blue"
              />
              <PerformanceMetric
                label="Average Lap Time"
                value={multiLapAnalysis.analysis.averageLapTime}
                format="time"
                color="purple"
              />
              <PerformanceMetric
                label="Lap Variation"
                value={multiLapAnalysis.analysis.lapTimeVariation}
                format="time"
                color="yellow"
              />
            </div>

            {/* Recommendations */}
            <div>
              <h5 className="font-medium mb-3">Recommendations</h5>
              <div className="space-y-2">
                {multiLapAnalysis.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm p-2 bg-racing-blue/10 rounded"
                  >
                    <Lightbulb className="h-3 w-3 text-racing-yellow" />
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  private renderAnalyticsTab(): React.ReactNode {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-racing-green" />
          Advanced Analytics
        </h3>
        <div className="text-center py-12">
          <Flame className="h-16 w-16 mx-auto text-racing-orange mb-4" />
          <h4 className="text-lg font-semibold mb-2">
            Advanced Analytics Coming Soon
          </h4>
          <p className="text-muted-foreground">
            Predictive modeling, machine learning insights, and advanced
            performance analytics are in development.
          </p>
        </div>
      </Card>
    );
  }

  render() {
    const { selectedTab } = this.state;

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-racing-purple" />
              Advanced Racing Analysis
            </h1>
            <p className="text-muted-foreground mt-2">
              AI-powered performance coaching and comprehensive lap analysis
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          <RacingButton
            variant={selectedTab === "coach" ? "racing" : "outline"}
            racing="purple"
            icon={Brain}
            onClick={() => this.setState({ selectedTab: "coach" })}
          >
            AI Coach
          </RacingButton>
          <RacingButton
            variant={selectedTab === "comparison" ? "racing" : "outline"}
            racing="blue"
            icon={BarChart3}
            onClick={() => this.setState({ selectedTab: "comparison" })}
          >
            Lap Comparison
          </RacingButton>
          <RacingButton
            variant={selectedTab === "analytics" ? "racing" : "outline"}
            racing="green"
            icon={TrendingUp}
            onClick={() => this.setState({ selectedTab: "analytics" })}
          >
            Analytics
          </RacingButton>
        </div>

        {/* Tab Content */}
        {selectedTab === "coach" && this.renderCoachTab()}
        {selectedTab === "comparison" && this.renderComparisonTab()}
        {selectedTab === "analytics" && this.renderAnalyticsTab()}
      </div>
    );
  }
}

export default function AdvancedRacingAnalysis() {
  return <AdvancedRacingAnalysisPage />;
}
