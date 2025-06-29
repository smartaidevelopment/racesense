import { Layout } from "@/components/Layout";
import { DataCard } from "@/components/DataCard";
import { RacingButton } from "@/components/RacingButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Radix UI Tabs and Progress removed to prevent hook issues
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ArrowLeft,
  MessageSquare,
  TrendingUp,
  Award,
  Target,
  Zap,
  Brain,
  BarChart3,
  Trophy,
  AlertTriangle,
  CheckCircle,
  Clock,
  Gauge,
  Activity,
} from "lucide-react";
import { Link } from "react-router-dom";
import React, { useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

// Enhanced feedback with detailed metrics
const feedbackItems = [
  {
    turn: "Turn 3 - Hairpin Entry",
    suggestion:
      "Increase entry speed by 5-8 km/h for optimal angle initiation. Your current entry is too conservative.",
    severity: "medium",
    improvement: "+15 pts potential",
    icon: Target,
    currentValue: 52,
    targetValue: 60,
    unit: "km/h",
    technique: "Entry Speed Optimization",
    priority: 2,
    confidence: 85,
  },
  {
    turn: "Turn 7 - High Speed Corner",
    suggestion:
      "Maintain consistent throttle through mid-drift. You're lifting too early, losing speed points.",
    severity: "low",
    improvement: "+8 pts potential",
    icon: TrendingUp,
    currentValue: 75,
    targetValue: 82,
    unit: "%",
    technique: "Throttle Control",
    priority: 3,
    confidence: 92,
  },
  {
    turn: "Turn 12 - Technical Section",
    suggestion:
      "Reduce steering input by 15% to prevent spin-out. Your corrections are too aggressive.",
    severity: "high",
    improvement: "Consistency boost",
    icon: MessageSquare,
    currentValue: 285,
    targetValue: 240,
    unit: "°/s",
    technique: "Steering Finesse",
    priority: 1,
    confidence: 78,
  },
  {
    turn: "Turn 5 - Long Sweeper",
    suggestion:
      "Extend drift duration by maintaining angle through apex. You're straightening too early.",
    severity: "medium",
    improvement: "+12 pts potential",
    icon: Clock,
    currentValue: 2.3,
    targetValue: 3.1,
    unit: "sec",
    technique: "Angle Maintenance",
    priority: 2,
    confidence: 88,
  },
];

const achievements = [
  {
    title: "Drift Master",
    description: "Achieved 8,000+ drift points in a single session",
    earned: true,
    icon: Award,
    color: "yellow",
    progress: 100,
    requirement: "8,000 points",
    current: "8,450 points",
  },
  {
    title: "Angle King",
    description: "Maintained 45°+ angle for 5+ seconds continuously",
    earned: true,
    icon: Zap,
    color: "orange",
    progress: 100,
    requirement: "5 seconds",
    current: "6.2 seconds",
  },
  {
    title: "Speed Demon",
    description: "Drift at 80+ km/h while maintaining control",
    earned: false,
    icon: Target,
    color: "red",
    progress: 84,
    requirement: "80 km/h",
    current: "67.3 km/h",
  },
  {
    title: "Consistency Pro",
    description: "Complete 5 consecutive laps within 2% variance",
    earned: false,
    icon: CheckCircle,
    color: "green",
    progress: 60,
    requirement: "5 laps",
    current: "3 laps",
  },
  {
    title: "Style Virtuoso",
    description: "Earn 1,500+ style points in a single drift",
    earned: true,
    icon: Trophy,
    color: "purple",
    progress: 100,
    requirement: "1,500 points",
    current: "1,680 points",
  },
];

// Performance analysis data
const performanceData = [
  { metric: "Entry Speed", current: 75, target: 85, max: 100 },
  { metric: "Angle Control", current: 88, target: 90, max: 100 },
  { metric: "Throttle Management", current: 82, target: 88, max: 100 },
  { metric: "Line Consistency", current: 71, target: 85, max: 100 },
  { metric: "Exit Speed", current: 79, target: 83, max: 100 },
  { metric: "Style Factor", current: 92, target: 95, max: 100 },
];

// Technique progression over time
const progressionData = [
  { session: 1, score: 6200, consistency: 65, style: 70 },
  { session: 2, score: 6850, consistency: 72, style: 75 },
  { session: 3, score: 7320, consistency: 78, style: 82 },
  { session: 4, score: 7890, consistency: 81, style: 87 },
  { session: 5, score: 8450, consistency: 85, style: 92 },
];

// Detailed turn analysis
const turnAnalysis = [
  { turn: "T1", angle: 42, speed: 58, points: 850, difficulty: "Medium" },
  { turn: "T3", angle: 48, speed: 52, points: 920, difficulty: "Hard" },
  { turn: "T5", angle: 35, speed: 67, points: 720, difficulty: "Easy" },
  { turn: "T7", angle: 51, speed: 75, points: 1240, difficulty: "Hard" },
  { turn: "T9", angle: 39, speed: 61, points: 780, difficulty: "Medium" },
  { turn: "T12", angle: 45, speed: 48, points: 880, difficulty: "Hard" },
];

const chartConfig = {
  score: {
    label: "Drift Score",
    color: "hsl(var(--racing-yellow))",
  },
  consistency: {
    label: "Consistency",
    color: "hsl(var(--racing-green))",
  },
  style: {
    label: "Style",
    color: "hsl(var(--racing-purple))",
  },
  current: {
    label: "Current Performance",
    color: "hsl(var(--racing-orange))",
  },
  target: {
    label: "Target Performance",
    color: "hsl(var(--racing-blue))",
  },
};

export default function DriftFeedback() {
  const [activeTab, setActiveTab] = useState("feedback");

  const renderCustomProgress = (value: number, className?: string) => {
    return (
      <div className={`w-full bg-gray-700 rounded-full h-2 ${className || ""}`}>
        <div
          className="bg-racing-blue h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/">
            <RacingButton variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </RacingButton>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-racing-purple" />
              AI Drift Coach
            </h1>
            <p className="text-muted-foreground">
              Advanced AI-powered analysis and personalized coaching
              recommendations
            </p>
          </div>
        </div>

        {/* Session Summary */}
        <Card className="p-6 bg-gradient-to-br from-racing-purple/10 to-racing-orange/10 border-racing-purple/30">
          <div className="flex items-center gap-2 mb-4">
            <Badge
              variant="secondary"
              className="bg-racing-purple/20 text-racing-purple border-racing-purple/30"
            >
              AI Analysis Complete
            </Badge>
            <span className="text-sm text-muted-foreground">
              Session analyzed • 12 improvements identified
            </span>
          </div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-racing-orange mb-4">
              Exceptional Progress! +23% improvement from last session
            </h2>
            <p className="text-muted-foreground">
              Your angle consistency and throttle control have significantly
              improved. The AI has identified 4 key areas for maximum point gain
              potential.
            </p>
          </div>

          {/* Performance metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <DataCard
              label="Total Score"
              value="8,450"
              unit="pts"
              icon={Award}
              color="yellow"
              trend="up"
            />
            <DataCard
              label="AI Confidence"
              value="87.3"
              unit="%"
              icon={Brain}
              color="purple"
              trend="up"
            />
            <DataCard
              label="Skill Rating"
              value="A-"
              icon={BarChart3}
              color="orange"
              trend="up"
            />
            <DataCard
              label="Improvement Potential"
              value="+42"
              unit="pts"
              icon={TrendingUp}
              color="green"
              trend="up"
            />
          </div>
        </Card>

        {/* Enhanced Analysis Tabs */}
        <div className="space-y-6">
          {/* Custom Tab Navigation */}
          <div className="grid w-full grid-cols-4 bg-card/50 rounded-lg p-1">
            {[
              { value: "feedback", label: "AI Feedback" },
              { value: "performance", label: "Performance" },
              { value: "progression", label: "Progress" },
              { value: "achievements", label: "Achievements" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === tab.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* AI Feedback Tab */}
          {activeTab === "feedback" && (
            <div className="space-y-6">
              <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-racing-purple" />
                  Priority Recommendations
                </h2>

                <div className="space-y-6">
                  {feedbackItems
                    .sort((a, b) => a.priority - b.priority)
                    .map((item, index) => (
                      <div
                        key={index}
                        className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] group ${
                          item.severity === "high"
                            ? "bg-racing-red/10 border-racing-red/30 hover:border-racing-red/50"
                            : item.severity === "medium"
                              ? "bg-racing-orange/10 border-racing-orange/30 hover:border-racing-orange/50"
                              : "bg-racing-green/10 border-racing-green/30 hover:border-racing-green/50"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              item.severity === "high"
                                ? "bg-racing-red/20"
                                : item.severity === "medium"
                                  ? "bg-racing-orange/20"
                                  : "bg-racing-green/20"
                            }`}
                          >
                            <item.icon
                              className={`h-6 w-6 ${
                                item.severity === "high"
                                  ? "text-racing-red"
                                  : item.severity === "medium"
                                    ? "text-racing-orange"
                                    : "text-racing-green"
                              }`}
                            />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="font-bold text-lg">{item.turn}</h3>
                              <Badge
                                variant="outline"
                                className={`text-xs px-2 py-1 ${
                                  item.severity === "high"
                                    ? "border-racing-red/30 text-racing-red"
                                    : item.severity === "medium"
                                      ? "border-racing-orange/30 text-racing-orange"
                                      : "border-racing-green/30 text-racing-green"
                                }`}
                              >
                                Priority {item.priority}
                              </Badge>
                              <Badge className="bg-racing-blue/20 text-racing-blue border-racing-blue/30 text-xs">
                                {item.confidence}% confidence
                              </Badge>
                            </div>

                            <p className="text-muted-foreground group-hover:text-foreground transition-colors mb-4">
                              {item.suggestion}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-muted/20 rounded-lg p-3">
                                <div className="text-xs text-muted-foreground mb-1">
                                  Current
                                </div>
                                <div className="font-mono text-lg">
                                  {item.currentValue} {item.unit}
                                </div>
                              </div>
                              <div className="bg-racing-blue/10 rounded-lg p-3">
                                <div className="text-xs text-racing-blue mb-1">
                                  Target
                                </div>
                                <div className="font-mono text-lg text-racing-blue">
                                  {item.targetValue} {item.unit}
                                </div>
                              </div>
                              <div className="bg-racing-green/10 rounded-lg p-3">
                                <div className="text-xs text-racing-green mb-1">
                                  Improvement
                                </div>
                                <div className="font-semibold text-racing-green">
                                  {item.improvement}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3">
                              <div className="text-xs text-muted-foreground mb-1">
                                Technique Focus: {item.technique}
                              </div>
                              {renderCustomProgress(
                                (item.currentValue / item.targetValue) * 100,
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === "performance" && (
            <div className="space-y-6">
              <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-racing-orange" />
                  Performance Radar Analysis
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <ChartContainer config={chartConfig} className="h-[400px]">
                      <RadarChart data={performanceData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 100]}
                          tickCount={5}
                        />
                        <Radar
                          name="Current Performance"
                          dataKey="current"
                          stroke="var(--color-current)"
                          fill="var(--color-current)"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                        <Radar
                          name="Target Performance"
                          dataKey="target"
                          stroke="var(--color-target)"
                          fill="var(--color-target)"
                          fillOpacity={0.1}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                        />
                        <Legend />
                      </RadarChart>
                    </ChartContainer>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Detailed Breakdown
                    </h3>
                    {performanceData.map((metric, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{metric.metric}</span>
                          <div className="flex gap-4 text-sm">
                            <span className="text-racing-orange">
                              {metric.current}%
                            </span>
                            <span className="text-racing-blue">
                              Target: {metric.target}%
                            </span>
                          </div>
                        </div>
                        <div className="relative">
                          {renderCustomProgress(metric.current, "h-3")}
                          <div
                            className="absolute top-0 w-1 h-3 bg-racing-blue rounded"
                            style={{
                              left: `${(metric.target / metric.max) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-racing-red" />
                  Turn-by-Turn Analysis
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {turnAnalysis.map((turn, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border transition-colors hover:bg-muted/30 ${
                        turn.difficulty === "Hard"
                          ? "border-racing-red/30"
                          : turn.difficulty === "Medium"
                            ? "border-racing-orange/30"
                            : "border-racing-green/30"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold">{turn.turn}</h4>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            turn.difficulty === "Hard"
                              ? "border-racing-red/30 text-racing-red"
                              : turn.difficulty === "Medium"
                                ? "border-racing-orange/30 text-racing-orange"
                                : "border-racing-green/30 text-racing-green"
                          }`}
                        >
                          {turn.difficulty}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Angle:</span>
                          <span className="font-mono">{turn.angle}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Speed:</span>
                          <span className="font-mono">{turn.speed} km/h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Points:</span>
                          <span className="font-mono font-semibold text-racing-yellow">
                            {turn.points}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Progression Tab */}
          {activeTab === "progression" && (
            <div className="space-y-6">
              <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-racing-green" />
                  Skill Progression Analysis
                </h2>

                <ChartContainer config={chartConfig} className="h-[400px]">
                  <LineChart data={progressionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="session"
                      label={{
                        value: "Session",
                        position: "insideBottom",
                        offset: -10,
                      }}
                    />
                    <YAxis
                      yAxisId="left"
                      label={{
                        value: "Score",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      label={{
                        value: "Performance %",
                        angle: 90,
                        position: "insideRight",
                      }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="score"
                      stroke="var(--color-score)"
                      strokeWidth={3}
                      dot={{
                        fill: "var(--color-score)",
                        strokeWidth: 2,
                        r: 5,
                      }}
                      activeDot={{ r: 7 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="consistency"
                      stroke="var(--color-consistency)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{
                        fill: "var(--color-consistency)",
                        strokeWidth: 2,
                        r: 4,
                      }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="style"
                      stroke="var(--color-style)"
                      strokeWidth={2}
                      strokeDasharray="10 5"
                      dot={{
                        fill: "var(--color-style)",
                        strokeWidth: 2,
                        r: 4,
                      }}
                    />
                  </LineChart>
                </ChartContainer>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <DataCard
                    label="Score Improvement"
                    value="+36"
                    unit="%"
                    color="yellow"
                    trend="up"
                  />
                  <DataCard
                    label="Consistency Gain"
                    value="+31"
                    unit="%"
                    color="green"
                    trend="up"
                  />
                  <DataCard
                    label="Style Evolution"
                    value="+31"
                    unit="%"
                    color="purple"
                    trend="up"
                  />
                </div>
              </Card>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === "achievements" && (
            <div className="space-y-6">
              <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-racing-yellow" />
                  Session Achievements & Goals
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                        achievement.earned
                          ? `bg-racing-${achievement.color}/10 border-racing-${achievement.color}/30 hover:scale-105`
                          : "bg-muted/20 border-border/30 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            achievement.earned
                              ? `bg-racing-${achievement.color}/20`
                              : "bg-muted/30"
                          }`}
                        >
                          <achievement.icon
                            className={`h-6 w-6 ${
                              achievement.earned
                                ? `text-racing-${achievement.color}`
                                : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`font-bold ${
                                achievement.earned
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {achievement.title}
                            </h3>
                            {achievement.earned && (
                              <Badge className="bg-racing-green/20 text-racing-green border-racing-green/30">
                                ✓ Unlocked
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {achievement.description}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-mono">
                            {achievement.progress}%
                          </span>
                        </div>
                        {renderCustomProgress(achievement.progress)}
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Current: {achievement.current}</span>
                          <span>Target: {achievement.requirement}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Enhanced Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RacingButton
            variant="racing"
            racing="purple"
            className="flex items-center justify-center gap-2"
            glow
          >
            <Brain className="h-4 w-4" />
            Start Guided Practice
          </RacingButton>
          <RacingButton
            variant="racing"
            racing="orange"
            className="flex items-center justify-center gap-2"
          >
            <Target className="h-4 w-4" />
            Focus Training Mode
          </RacingButton>
          <RacingButton
            variant="outline"
            className="flex items-center justify-center gap-2 border-racing-blue/30 text-racing-blue hover:bg-racing-blue/10"
          >
            <BarChart3 className="h-4 w-4" />
            View Full Report
          </RacingButton>
        </div>
      </div>
    </Layout>
  );
}
