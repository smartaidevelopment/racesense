import React from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RacingButton } from "@/components/RacingButton";
import { DataCard } from "@/components/DataCard";
import { PerformanceMetric } from "@/components/LoadingStates";
import { notify } from "@/components/RacingNotifications";
import {
  sessionAnalysisService,
  TrackAnalysis,
  LapComparison,
  PerformanceInsights,
  SessionMetrics,
} from "@/services/SessionAnalysisService";
import { lapTimingService, LapData } from "@/services/LapTimingService";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock,
  Gauge,
  Target,
  BarChart3,
  LineChart,
  PieChart,
  MapPin,
  Trophy,
  Activity,
  Thermometer,
  Fuel,
  Zap,
  Eye,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Calendar,
  Timer,
  Route,
} from "lucide-react";

interface SessionAnalysisState {
  selectedSession: string | null;
  availableSessions: string[];
  trackAnalysis: TrackAnalysis | null;
  selectedLaps: LapData[];
  lapComparison: LapComparison | null;
  performanceInsights: PerformanceInsights | null;
  sessionMetrics: SessionMetrics | null;
  isAnalyzing: boolean;
  showLapComparison: boolean;
  selectedLap1: LapData | null;
  selectedLap2: LapData | null;
  analysisType: "overview" | "detailed" | "comparison" | "trends";
}

class SessionAnalysisPage extends React.Component<{}, SessionAnalysisState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      selectedSession: null,
      availableSessions: [],
      trackAnalysis: null,
      selectedLaps: [],
      lapComparison: null,
      performanceInsights: null,
      sessionMetrics: null,
      isAnalyzing: false,
      showLapComparison: false,
      selectedLap1: null,
      selectedLap2: null,
      analysisType: "overview",
    };
  }

  componentDidMount() {
    this.loadAvailableSessions();
  }

  loadAvailableSessions = () => {
    // In a real app, this would load from storage/database
    const mockSessions = [
      "session-silverstone-2024-01-15",
      "session-spa-2024-01-12",
      "session-nurburgring-2024-01-10",
    ];

    this.setState({
      availableSessions: mockSessions,
      selectedSession: mockSessions[0],
    });

    if (mockSessions.length > 0) {
      this.analyzeSession(mockSessions[0]);
    }
  };

  analyzeSession = async (sessionId: string) => {
    this.setState({ isAnalyzing: true });

    try {
      // Generate mock data for demonstration
      const mockLaps = this.generateMockLaps();
      const trackAnalysis = this.generateMockTrackAnalysis();
      const performanceInsights = this.generateMockInsights();
      const sessionMetrics = this.generateMockSessionMetrics();

      this.setState({
        selectedSession: sessionId,
        selectedLaps: mockLaps,
        trackAnalysis,
        performanceInsights,
        sessionMetrics,
        isAnalyzing: false,
      });

      notify.success(
        "Analysis Complete",
        "Session data has been analyzed successfully",
        { duration: 3000 },
      );
    } catch (error) {
      this.setState({ isAnalyzing: false });
      notify.error("Analysis Failed", `Could not analyze session: ${error}`, {
        duration: 5000,
      });
    }
  };

  compareLaps = (lap1: LapData, lap2: LapData) => {
    const comparison = sessionAnalysisService.compareLaps(lap1, lap2);
    this.setState({
      lapComparison: comparison,
      selectedLap1: lap1,
      selectedLap2: lap2,
      showLapComparison: true,
    });
  };

  handleNavigation = (path: string) => {
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  generateMockLaps = (): LapData[] => {
    const laps: LapData[] = [];
    const baseTime = 83000; // 1:23.000

    for (let i = 0; i < 12; i++) {
      const variation = (Math.random() - 0.5) * 2000; // ±2 seconds variation
      laps.push({
        lapNumber: i + 1,
        startTime: Date.now() - (12 - i) * 90000,
        endTime: Date.now() - (12 - i - 1) * 90000,
        lapTime: baseTime + variation,
        maxSpeed: 245 + (Math.random() - 0.5) * 20,
        averageSpeed: 185 + (Math.random() - 0.5) * 15,
        sectors: [
          { time: (baseTime + variation) / 3, maxSpeed: 220 },
          { time: (baseTime + variation) / 3, maxSpeed: 250 },
          { time: (baseTime + variation) / 3, maxSpeed: 180 },
        ],
        gpsPoints: [], // Would contain actual GPS data
        trackId: "silverstone-gp",
        isValidLap: true,
      });
    }

    return laps;
  };

  generateMockTrackAnalysis = (): TrackAnalysis => {
    return {
      trackId: "silverstone-gp",
      totalSessions: 5,
      totalLaps: 48,
      bestLapTime: 81250, // 1:21.250
      bestLapSession: "session-silverstone-2024-01-10",
      averageLapTime: 83750, // 1:23.750
      consistencyRating: 87.3,
      sectors: [
        {
          sectorNumber: 1,
          startDistance: 0,
          endDistance: 1967,
          bestTime: 27083,
          averageTime: 27916,
          bestSpeed: 225,
          averageSpeed: 218,
          throttleEfficiency: 89.2,
          brakingPoints: [450, 1200],
          accelerationZones: [0, 800],
        },
        {
          sectorNumber: 2,
          startDistance: 1967,
          endDistance: 3934,
          bestTime: 27500,
          averageTime: 28200,
          bestSpeed: 248,
          averageSpeed: 242,
          throttleEfficiency: 91.5,
          brakingPoints: [2400, 3200],
          accelerationZones: [2000, 2800],
        },
        {
          sectorNumber: 3,
          startDistance: 3934,
          endDistance: 5891,
          bestTime: 26667,
          averageTime: 27634,
          bestSpeed: 195,
          averageSpeed: 188,
          throttleEfficiency: 85.7,
          brakingPoints: [4500, 5200],
          accelerationZones: [4200, 5600],
        },
      ],
      speedZones: [
        {
          start: 0,
          end: 500,
          type: "acceleration",
          optimalSpeed: 180,
          averageSpeed: 175,
        },
        {
          start: 500,
          end: 1500,
          type: "straight",
          optimalSpeed: 320,
          averageSpeed: 315,
        },
        {
          start: 1500,
          end: 2000,
          type: "braking",
          optimalSpeed: 120,
          averageSpeed: 125,
        },
        {
          start: 2000,
          end: 2500,
          type: "cornering",
          optimalSpeed: 85,
          averageSpeed: 82,
        },
      ],
    };
  };

  generateMockInsights = (): PerformanceInsights => {
    return {
      strengths: [
        {
          area: "High-Speed Corners",
          description:
            "Excellent speed maintenance through Copse and Maggotts-Becketts complex",
          confidence: 0.92,
        },
        {
          area: "Braking Consistency",
          description:
            "Very consistent braking points with minimal variation between laps",
          confidence: 0.88,
        },
      ],
      improvements: [
        {
          area: "Sector 1 Exit",
          description:
            "Earlier throttle application out of Turn 3 could gain 0.2-0.3 seconds",
          potentialGain: "0.25s",
          priority: "high",
        },
        {
          area: "Final Sector",
          description: "Carrying more speed through Club corner complex",
          potentialGain: "0.15s",
          priority: "medium",
        },
      ],
      consistency: {
        rating: 87.3,
        description:
          "Good consistency with room for improvement in sector timing",
        variability: 1750, // milliseconds
      },
      efficiency: {
        throttle: 89.4,
        braking: 85.2,
        cornering: 82.7,
        overall: 85.8,
      },
    };
  };

  generateMockSessionMetrics = (): SessionMetrics => {
    return {
      totalDistance: 70692, // 12 laps × 5891m
      totalTime: 1005000, // ~16.75 minutes
      averageSpeed: 253.2,
      maxSpeed: 327.5,
      fuelConsumption: 8.4,
      avgEngineLoad: 67.3,
      maxRPM: 7850,
      avgCoolantTemp: 92.8,
      throttleTime: 420000, // 7 minutes
      brakingTime: 95000, // 1.58 minutes
      corneringTime: 490000, // 8.17 minutes
    };
  };

  formatTime = (milliseconds: number): string => {
    const totalSeconds = milliseconds / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toFixed(3).padStart(6, "0")}`;
  };

  formatDuration = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  render() {
    const {
      selectedSession,
      availableSessions,
      trackAnalysis,
      selectedLaps,
      lapComparison,
      performanceInsights,
      sessionMetrics,
      isAnalyzing,
      showLapComparison,
      selectedLap1,
      selectedLap2,
      analysisType,
    } = this.state;

    return (
      <Layout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <RacingButton
                variant="outline"
                size="icon"
                onClick={() => this.handleNavigation("/")}
              >
                <ArrowLeft className="h-4 w-4" />
              </RacingButton>
              <div>
                <h1 className="text-3xl font-bold mb-2">Session Analysis</h1>
                <p className="text-muted-foreground">
                  Advanced telemetry analysis and performance insights
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <RacingButton
                variant="outline"
                icon={Upload}
                className="border-racing-blue/30 text-racing-blue"
              >
                Import Data
              </RacingButton>
              <RacingButton
                variant="outline"
                icon={Download}
                className="border-racing-green/30 text-racing-green"
                disabled={!selectedSession}
              >
                Export Report
              </RacingButton>
            </div>
          </div>

          {/* Session Selection */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-racing-blue" />
              Select Session
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availableSessions.map((session) => (
                <Card
                  key={session}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedSession === session
                      ? "border-racing-blue bg-racing-blue/10"
                      : "border-border hover:border-racing-blue/50"
                  }`}
                  onClick={() => this.analyzeSession(session)}
                >
                  <div className="space-y-2">
                    <div className="font-medium">
                      {session.includes("silverstone")
                        ? "Silverstone GP"
                        : session.includes("spa")
                          ? "Spa-Francorchamps"
                          : "Nürburgring GP"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {session.split("-").slice(-3).join("-")}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        12 laps
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        16:45 session
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {isAnalyzing && (
            <Card className="p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <RefreshCw className="h-6 w-6 animate-spin text-racing-blue" />
                <span className="text-lg font-medium">
                  Analyzing Session Data...
                </span>
              </div>
              <p className="text-muted-foreground">
                Processing telemetry data and generating insights
              </p>
            </Card>
          )}

          {/* Analysis Type Selection */}
          {!isAnalyzing && trackAnalysis && (
            <div className="flex gap-2">
              {[
                { key: "overview", label: "Overview", icon: BarChart3 },
                {
                  key: "detailed",
                  label: "Detailed Analysis",
                  icon: LineChart,
                },
                { key: "comparison", label: "Lap Comparison", icon: Eye },
                {
                  key: "trends",
                  label: "Performance Trends",
                  icon: TrendingUp,
                },
              ].map((type) => (
                <RacingButton
                  key={type.key}
                  variant={analysisType === type.key ? "racing" : "outline"}
                  racing={analysisType === type.key ? "blue" : undefined}
                  size="sm"
                  icon={type.icon}
                  onClick={() =>
                    this.setState({ analysisType: type.key as any })
                  }
                >
                  {type.label}
                </RacingButton>
              ))}
            </div>
          )}

          {/* Overview Analysis */}
          {!isAnalyzing && analysisType === "overview" && trackAnalysis && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DataCard
                  label="Best Lap"
                  value={this.formatTime(trackAnalysis.bestLapTime)}
                  icon={Trophy}
                  color="yellow"
                  trend="up"
                />
                <DataCard
                  label="Average Lap"
                  value={this.formatTime(trackAnalysis.averageLapTime)}
                  icon={Timer}
                  color="blue"
                  trend="neutral"
                />
                <DataCard
                  label="Consistency"
                  value={trackAnalysis.consistencyRating.toFixed(1)}
                  unit="%"
                  icon={Target}
                  color="green"
                  trend="up"
                />
                <DataCard
                  label="Total Laps"
                  value={trackAnalysis.totalLaps}
                  icon={Route}
                  color="purple"
                  trend="neutral"
                />
              </div>

              {/* Session Metrics */}
              {sessionMetrics && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-racing-green" />
                    Session Metrics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <PerformanceMetric
                      label="Total Distance"
                      value={sessionMetrics.totalDistance / 1000}
                      unit="km"
                      format="decimal"
                      color="blue"
                    />
                    <PerformanceMetric
                      label="Session Time"
                      value={this.formatDuration(sessionMetrics.totalTime)}
                      color="green"
                    />
                    <PerformanceMetric
                      label="Max Speed"
                      value={sessionMetrics.maxSpeed}
                      unit="km/h"
                      format="decimal"
                      color="red"
                    />
                    <PerformanceMetric
                      label="Avg Engine Load"
                      value={sessionMetrics.avgEngineLoad || 0}
                      unit="%"
                      format="decimal"
                      color="yellow"
                    />
                  </div>
                </Card>
              )}

              {/* Performance Insights */}
              {performanceInsights && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-racing-green" />
                      Strengths
                    </h3>
                    <div className="space-y-3">
                      {performanceInsights.strengths.map((strength, index) => (
                        <div
                          key={index}
                          className="p-3 bg-racing-green/10 border border-racing-green/30 rounded-lg"
                        >
                          <div className="font-medium text-racing-green mb-1">
                            {strength.area}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {strength.description}
                          </div>
                          <div className="text-xs text-racing-green mt-2">
                            Confidence: {(strength.confidence * 100).toFixed(0)}
                            %
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Improvements */}
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-racing-yellow" />
                      Improvement Areas
                    </h3>
                    <div className="space-y-3">
                      {performanceInsights.improvements.map(
                        (improvement, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border ${
                              improvement.priority === "high"
                                ? "bg-racing-red/10 border-racing-red/30"
                                : improvement.priority === "medium"
                                  ? "bg-racing-yellow/10 border-racing-yellow/30"
                                  : "bg-racing-blue/10 border-racing-blue/30"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-medium">
                                {improvement.area}
                              </div>
                              <Badge
                                variant={
                                  improvement.priority === "high"
                                    ? "destructive"
                                    : improvement.priority === "medium"
                                      ? "default"
                                      : "secondary"
                                }
                                className="text-xs"
                              >
                                {improvement.priority}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {improvement.description}
                            </div>
                            <div className="text-xs font-medium text-racing-green">
                              Potential gain: {improvement.potentialGain}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {/* Sector Analysis */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-racing-purple" />
                  Sector Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {trackAnalysis.sectors.map((sector) => (
                    <Card
                      key={sector.sectorNumber}
                      className="p-4 border-racing-purple/20"
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold text-racing-purple mb-2">
                          Sector {sector.sectorNumber}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Best:{" "}
                            </span>
                            <span className="font-mono font-bold">
                              {this.formatTime(sector.bestTime)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Average:{" "}
                            </span>
                            <span className="font-mono">
                              {this.formatTime(sector.averageTime)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Top Speed:{" "}
                            </span>
                            <span className="font-bold">
                              {sector.bestSpeed.toFixed(0)} km/h
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Efficiency:{" "}
                            </span>
                            <span className="font-bold text-racing-green">
                              {sector.throttleEfficiency.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* Lap Comparison */}
          {!isAnalyzing &&
            analysisType === "comparison" &&
            selectedLaps.length >= 2 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-racing-blue" />
                  Lap Comparison
                </h3>

                {/* Lap Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Compare Lap 1
                    </label>
                    <select
                      className="w-full p-2 border border-border rounded-md bg-background"
                      onChange={(e) => {
                        const lap = selectedLaps[parseInt(e.target.value)];
                        this.setState({ selectedLap1: lap });
                      }}
                    >
                      <option value="">Select lap...</option>
                      {selectedLaps.map((lap, index) => (
                        <option key={index} value={index}>
                          Lap {lap.lapNumber} - {this.formatTime(lap.lapTime)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Compare Lap 2
                    </label>
                    <select
                      className="w-full p-2 border border-border rounded-md bg-background"
                      onChange={(e) => {
                        const lap = selectedLaps[parseInt(e.target.value)];
                        this.setState({ selectedLap2: lap });
                      }}
                    >
                      <option value="">Select lap...</option>
                      {selectedLaps.map((lap, index) => (
                        <option key={index} value={index}>
                          Lap {lap.lapNumber} - {this.formatTime(lap.lapTime)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedLap1 && selectedLap2 && (
                  <div className="text-center">
                    <RacingButton
                      variant="racing"
                      racing="blue"
                      onClick={() =>
                        this.compareLaps(selectedLap1, selectedLap2)
                      }
                    >
                      Compare Laps
                    </RacingButton>
                  </div>
                )}

                {/* Comparison Results */}
                {lapComparison && (
                  <div className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="p-4 border-racing-blue/30">
                        <h4 className="font-medium text-racing-blue mb-3">
                          Lap {lapComparison.lap1.lapNumber}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Time:{" "}
                            </span>
                            <span className="font-mono font-bold">
                              {this.formatTime(lapComparison.lap1.lapTime)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Max Speed:{" "}
                            </span>
                            <span>
                              {lapComparison.lap1.maxSpeed.toFixed(1)} km/h
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Avg Speed:{" "}
                            </span>
                            <span>
                              {lapComparison.lap1.averageSpeed.toFixed(1)} km/h
                            </span>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 border-racing-green/30">
                        <h4 className="font-medium text-racing-green mb-3">
                          Lap {lapComparison.lap2.lapNumber}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Time:{" "}
                            </span>
                            <span className="font-mono font-bold">
                              {this.formatTime(lapComparison.lap2.lapTime)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Max Speed:{" "}
                            </span>
                            <span>
                              {lapComparison.lap2.maxSpeed.toFixed(1)} km/h
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Avg Speed:{" "}
                            </span>
                            <span>
                              {lapComparison.lap2.averageSpeed.toFixed(1)} km/h
                            </span>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <Card className="p-4">
                      <h4 className="font-medium mb-3 text-center">
                        Time Difference:{" "}
                        <span
                          className={`font-mono font-bold ${
                            lapComparison.timeDifference > 0
                              ? "text-racing-red"
                              : "text-racing-green"
                          }`}
                        >
                          {lapComparison.timeDifference > 0 ? "+" : ""}
                          {(lapComparison.timeDifference / 1000).toFixed(3)}s
                        </span>
                      </h4>
                      <p className="text-center text-sm text-muted-foreground">
                        {lapComparison.timeDifference > 0
                          ? `Lap ${lapComparison.lap2.lapNumber} was slower`
                          : `Lap ${lapComparison.lap2.lapNumber} was faster`}
                      </p>
                    </Card>
                  </div>
                )}
              </Card>
            )}
        </div>
      </Layout>
    );
  }
}

export default function SessionAnalysis() {
  return <SessionAnalysisPage />;
}
