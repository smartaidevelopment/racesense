// Advanced AI Racing Intelligence Interface
// Machine Learning Track Optimization, Predictive Analysis, and Computer Vision

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Brain,
  Cpu,
  Eye,
  Target,
  TrendingUp,
  Zap,
  Settings,
  Play,
  BarChart3,
  Camera,
  Clock,
  Trophy,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Download,
  RefreshCw,
} from "lucide-react";

import advancedAIService, {
  MLTrackOptimization,
  VehicleSetupPrediction,
  ComputerVisionAnalysis,
  RealTimeStrategy,
  PerformancePrediction,
  AICoachingRecommendation,
} from "../services/AdvancedAIService";

const AdvancedAIPage: React.FC = () => {
  const [optimizations, setOptimizations] = useState<MLTrackOptimization[]>([]);
  const [setupPredictions, setSetupPredictions] = useState<
    VehicleSetupPrediction[]
  >([]);
  const [cvAnalysis, setCvAnalysis] = useState<ComputerVisionAnalysis | null>(
    null,
  );
  const [strategies, setStrategies] = useState<RealTimeStrategy[]>([]);
  const [predictions, setPredictions] = useState<PerformancePrediction[]>([]);
  const [recommendations, setRecommendations] = useState<
    AICoachingRecommendation[]
  >([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);

  useEffect(() => {
    // Optionally, fetch initial data from backend if endpoints exist
    // Otherwise, leave empty to only show results after user actions
  }, []);

  const startMLOptimization = async (
    trackId: string,
    algorithm: MLTrackOptimization["algorithm"],
  ) => {
    setIsOptimizing(true);
    setOptimizationProgress(0);
    try {
      // No simulated progress, just set loading state
      const optimization = await advancedAIService.optimizeTrackWithML(trackId, algorithm, 1000);
      setOptimizations((prev) => [optimization, ...prev]);
      setOptimizationProgress(100);
    } catch (error) {
      console.error("ML optimization failed:", error);
    } finally {
      setIsOptimizing(false);
      setTimeout(() => setOptimizationProgress(0), 2000);
    }
  };

  const generateSetupPrediction = async () => {
    try {
      const prediction = await advancedAIService.predictOptimalSetup(
        "silverstone-gp",
        "Formula Car",
        {
          temperature: 22,
          humidity: 65,
          windSpeed: 8,
          trackTemp: 28,
          rainProbability: 15,
        },
      );
      setSetupPredictions((prev) => [prediction, ...prev]);
    } catch (error) {
      console.error("Setup prediction failed:", error);
    }
  };

  const analyzeWithComputerVision = async () => {
    try {
      const analysis = await advancedAIService.analyzeDriverWithCV(
        "session-123",
        null,
      );
      setCvAnalysis(analysis);
    } catch (error) {
      console.error("CV analysis failed:", error);
    }
  };

  const generateRealTimeStrategy = async () => {
    try {
      const strategy = await advancedAIService.optimizeRealTimeStrategy(
        "session-123",
        15,
        50,
        { temperature: 25, humidity: 60 },
      );
      setStrategies((prev) => [strategy, ...prev]);
    } catch (error) {
      console.error("Strategy generation failed:", error);
    }
  };

  const generatePerformancePrediction = async () => {
    try {
      const prediction = await advancedAIService.predictPerformance(
        "silverstone-gp",
        "driver-123",
        { downforce: "medium", suspension: "stiff" },
        { dry: true, temperature: 22 },
      );
      setPredictions((prev) => [prediction, ...prev]);
    } catch (error) {
      console.error("Performance prediction failed:", error);
    }
  };

  const generateCoachingRecommendations = async () => {
    try {
      const newRecommendations = await advancedAIService.generateCoachingRecommendations("session-123");
      setRecommendations(newRecommendations);
    } catch (error) {
      console.error("Coaching recommendations failed:", error);
    }
  };

  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(3);
    return `${minutes}:${seconds.padStart(6, "0")}`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return "text-green-400";
    if (confidence >= 0.6) return "text-yellow-400";
    return "text-red-400";
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Advanced AI Racing Intelligence
          </h1>
          <p className="text-gray-400">
            Machine Learning Track Optimization, Predictive Analysis, and
            Computer Vision
          </p>
        </div>

        <Tabs defaultValue="optimization" className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-gray-800">
            <TabsTrigger value="optimization">ML Optimization</TabsTrigger>
            <TabsTrigger value="setup">Setup Prediction</TabsTrigger>
            <TabsTrigger value="computer-vision">Computer Vision</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="prediction">Performance</TabsTrigger>
            <TabsTrigger value="coaching">AI Coaching</TabsTrigger>
          </TabsList>

          {/* ML Track Optimization */}
          <TabsContent value="optimization" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-400" />
                  Machine Learning Track Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Track</Label>
                    <Select defaultValue="silverstone-gp">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="silverstone-gp">
                          Silverstone
                        </SelectItem>
                        <SelectItem value="spa-francorchamps">Spa</SelectItem>
                        <SelectItem value="monza">Monza</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Algorithm</Label>
                    <Select defaultValue="neural_network">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neural_network">
                          Neural Network
                        </SelectItem>
                        <SelectItem value="genetic">
                          Genetic Algorithm
                        </SelectItem>
                        <SelectItem value="reinforcement">
                          Reinforcement Learning
                        </SelectItem>
                        <SelectItem value="gradient_descent">
                          Gradient Descent
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() =>
                        startMLOptimization("silverstone-gp", "neural_network")
                      }
                      disabled={isOptimizing}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {isOptimizing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Optimizing...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Optimization
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {isOptimizing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Optimization Progress</span>
                      <span>{optimizationProgress}%</span>
                    </div>
                    <Progress value={optimizationProgress} className="h-2" />
                    <p className="text-xs text-gray-400">
                      Training neural network with historical data...
                    </p>
                  </div>
                )}

                {optimizations.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-purple-400">
                      Recent Optimizations
                    </h4>
                    {optimizations.slice(0, 3).map((optimization) => (
                      <Card
                        key={optimization.optimizationId}
                        className="bg-gray-700 border-gray-600"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="font-semibold">
                                {optimization.trackId.replace("-", " ")}
                              </div>
                              <div className="text-sm text-gray-400">
                                {optimization.algorithm} •{" "}
                                {optimization.iterations} iterations
                              </div>
                            </div>
                            <Badge
                              className={`${getConfidenceColor(optimization.confidence)}`}
                            >
                              {(optimization.confidence * 100).toFixed(1)}%
                              confidence
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Lap Time:</span>
                              <div className="font-mono">
                                {formatTime(optimization.optimalLine.lapTime)}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-400">Fuel:</span>
                              <div className="font-mono">
                                {optimization.optimalLine.fuelConsumption.toFixed(
                                  2,
                                )}
                                L
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-400">Tire Wear:</span>
                              <div className="font-mono">
                                {(
                                  optimization.optimalLine.tireWear * 100
                                ).toFixed(1)}
                                %
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 text-xs text-gray-400">
                            Training Data: {optimization.trainingData.sessions}{" "}
                            sessions, {optimization.trainingData.laps} laps,{" "}
                            {optimization.trainingData.drivers} drivers
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vehicle Setup Prediction */}
          <TabsContent value="setup" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-400" />
                  Predictive Vehicle Setup Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={generateSetupPrediction}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Generate Setup Prediction
                </Button>

                {setupPredictions.length > 0 && (
                  <div className="space-y-4">
                    {setupPredictions.slice(0, 1).map((prediction, index) => (
                      <Card key={index} className="bg-gray-700 border-gray-600">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <div className="font-semibold">
                                {prediction.trackId.replace("-", " ")}
                              </div>
                              <div className="text-sm text-gray-400">
                                {prediction.vehicleType}
                              </div>
                            </div>
                            <Badge
                              className={`${getConfidenceColor(prediction.confidence)}`}
                            >
                              {(prediction.confidence * 100).toFixed(1)}%
                              confidence
                            </Badge>
                          </div>

                          <Tabs defaultValue="aerodynamics" className="w-full">
                            <TabsList className="grid w-full grid-cols-4 bg-gray-600">
                              <TabsTrigger value="aerodynamics">
                                Aero
                              </TabsTrigger>
                              <TabsTrigger value="suspension">
                                Suspension
                              </TabsTrigger>
                              <TabsTrigger value="tires">Tires</TabsTrigger>
                              <TabsTrigger value="performance">
                                Performance
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent value="aerodynamics">
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-400">
                                    Front Wing:
                                  </span>
                                  <div className="font-mono">
                                    {
                                      prediction.predictedSetup.aerodynamics
                                        .frontWing
                                    }
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-400">
                                    Rear Wing:
                                  </span>
                                  <div className="font-mono">
                                    {
                                      prediction.predictedSetup.aerodynamics
                                        .rearWing
                                    }
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-400">
                                    Diffuser:
                                  </span>
                                  <div className="font-mono">
                                    {
                                      prediction.predictedSetup.aerodynamics
                                        .diffuser
                                    }
                                  </div>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="suspension">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">
                                      Front Ride Height:
                                    </span>
                                    <span className="font-mono">
                                      {prediction.predictedSetup.suspension.frontRideHeight.toFixed(
                                        1,
                                      )}
                                      mm
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">
                                      Front Spring:
                                    </span>
                                    <span className="font-mono">
                                      {prediction.predictedSetup.suspension.frontSpring.toFixed(
                                        0,
                                      )}{" "}
                                      N/mm
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">
                                      Rear Ride Height:
                                    </span>
                                    <span className="font-mono">
                                      {prediction.predictedSetup.suspension.rearRideHeight.toFixed(
                                        1,
                                      )}
                                      mm
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">
                                      Rear Spring:
                                    </span>
                                    <span className="font-mono">
                                      {prediction.predictedSetup.suspension.rearSpring.toFixed(
                                        0,
                                      )}{" "}
                                      N/mm
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="tires">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">
                                      Front Pressure:
                                    </span>
                                    <span className="font-mono">
                                      {prediction.predictedSetup.tires.frontPressure.toFixed(
                                        1,
                                      )}{" "}
                                      PSI
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">
                                      Compound:
                                    </span>
                                    <span className="capitalize">
                                      {prediction.predictedSetup.tires.compound}
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">
                                      Rear Pressure:
                                    </span>
                                    <span className="font-mono">
                                      {prediction.predictedSetup.tires.rearPressure.toFixed(
                                        1,
                                      )}{" "}
                                      PSI
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">
                                      Camber:
                                    </span>
                                    <span className="font-mono">
                                      {prediction.predictedSetup.tires.camber.toFixed(
                                        1,
                                      )}
                                      °
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="performance">
                              <div className="space-y-3">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-400">
                                    {formatTime(prediction.expectedLapTime)}
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    Expected Lap Time
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="flex justify-between">
                                      <span>Top Speed:</span>
                                      <span>
                                        {prediction.expectedPerformance.topSpeed.toFixed(
                                          0,
                                        )}{" "}
                                        km/h
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Acceleration:</span>
                                      <span>
                                        {prediction.expectedPerformance.acceleration.toFixed(
                                          1,
                                        )}
                                        /10
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Cornering:</span>
                                      <span>
                                        {prediction.expectedPerformance.cornering.toFixed(
                                          1,
                                        )}
                                        /10
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between">
                                      <span>Braking:</span>
                                      <span>
                                        {prediction.expectedPerformance.braking.toFixed(
                                          1,
                                        )}
                                        /10
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Stability:</span>
                                      <span>
                                        {prediction.expectedPerformance.stability.toFixed(
                                          1,
                                        )}
                                        /10
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>

                          {prediction.reasoning.length > 0 && (
                            <div className="mt-4 p-3 bg-gray-600 rounded">
                              <div className="text-sm font-semibold mb-2">
                                AI Reasoning:
                              </div>
                              <ul className="text-xs text-gray-300 space-y-1">
                                {prediction.reasoning.map((reason, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-2"
                                  >
                                    <ArrowRight className="h-3 w-3 mt-0.5 text-blue-400" />
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Computer Vision Analysis */}
          <TabsContent value="computer-vision" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-400" />
                  Advanced Driver Coaching with Computer Vision
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={analyzeWithComputerVision}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Analyze Driver Behavior
                </Button>

                {cvAnalysis && (
                  <Card className="bg-gray-700 border-gray-600">
                    <CardContent className="p-4">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">
                            Computer Vision Analysis
                          </h4>
                          <Badge
                            className={`${getConfidenceColor(cvAnalysis.confidence)}`}
                          >
                            {(cvAnalysis.confidence * 100).toFixed(1)}%
                            confidence
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-400">
                          Processed {cvAnalysis.frameAnalysis.processedFrames}/
                          {cvAnalysis.frameAnalysis.totalFrames} frames (
                          {cvAnalysis.frameAnalysis.resolution})
                        </div>
                      </div>

                      <Tabs defaultValue="eye-tracking" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 bg-gray-600">
                          <TabsTrigger value="eye-tracking">
                            Eye Tracking
                          </TabsTrigger>
                          <TabsTrigger value="body-language">
                            Body Language
                          </TabsTrigger>
                          <TabsTrigger value="steering">Steering</TabsTrigger>
                          <TabsTrigger value="racing-line">
                            Racing Line
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="eye-tracking">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">
                                  Look Ahead Time:
                                </span>
                                <div className="font-mono">
                                  {cvAnalysis.driverBehavior.eyeTracking.lookAhead.toFixed(
                                    1,
                                  )}{" "}
                                  seconds
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400">
                                  Apex Focus:
                                </span>
                                <div className="font-mono">
                                  {cvAnalysis.driverBehavior.eyeTracking.apexFocus.toFixed(
                                    0,
                                  )}
                                  %
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400">
                                  Mirror Checks:
                                </span>
                                <div className="font-mono">
                                  {
                                    cvAnalysis.driverBehavior.eyeTracking
                                      .mirrorChecks
                                  }{" "}
                                  per lap
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400">
                                  Distraction Events:
                                </span>
                                <div className="font-mono">
                                  {
                                    cvAnalysis.driverBehavior.eyeTracking
                                      .distractionEvents
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="body-language">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span>Shoulder Tension:</span>
                                  <span>
                                    {
                                      cvAnalysis.driverBehavior.bodyLanguage
                                        .shoulderTension
                                    }
                                    /10
                                  </span>
                                </div>
                                <Progress
                                  value={
                                    cvAnalysis.driverBehavior.bodyLanguage
                                      .shoulderTension * 10
                                  }
                                  className="h-2"
                                />
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span>Hand Grip:</span>
                                  <span>
                                    {
                                      cvAnalysis.driverBehavior.bodyLanguage
                                        .handGrip
                                    }
                                    /10
                                  </span>
                                </div>
                                <Progress
                                  value={
                                    cvAnalysis.driverBehavior.bodyLanguage
                                      .handGrip * 10
                                  }
                                  className="h-2"
                                />
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span>Leg Movement:</span>
                                  <span>
                                    {
                                      cvAnalysis.driverBehavior.bodyLanguage
                                        .legMovement
                                    }
                                    /10
                                  </span>
                                </div>
                                <Progress
                                  value={
                                    cvAnalysis.driverBehavior.bodyLanguage
                                      .legMovement * 10
                                  }
                                  className="h-2"
                                />
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span>Head Movement:</span>
                                  <span>
                                    {
                                      cvAnalysis.driverBehavior.bodyLanguage
                                        .headMovement
                                    }
                                    /10
                                  </span>
                                </div>
                                <Progress
                                  value={
                                    cvAnalysis.driverBehavior.bodyLanguage
                                      .headMovement * 10
                                  }
                                  className="h-2"
                                />
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="steering">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span>Smoothness:</span>
                                  <span>
                                    {cvAnalysis.driverBehavior.steeringAnalysis.smoothness.toFixed(
                                      1,
                                    )}
                                    /10
                                  </span>
                                </div>
                                <Progress
                                  value={
                                    cvAnalysis.driverBehavior.steeringAnalysis
                                      .smoothness * 10
                                  }
                                  className="h-2"
                                />
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span>Precision:</span>
                                  <span>
                                    {cvAnalysis.driverBehavior.steeringAnalysis.precision.toFixed(
                                      1,
                                    )}
                                    /10
                                  </span>
                                </div>
                                <Progress
                                  value={
                                    cvAnalysis.driverBehavior.steeringAnalysis
                                      .precision * 10
                                  }
                                  className="h-2"
                                />
                              </div>
                              <div>
                                <span className="text-gray-400">
                                  Overcorrections:
                                </span>
                                <div className="font-mono">
                                  {
                                    cvAnalysis.driverBehavior.steeringAnalysis
                                      .overcorrections
                                  }
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400">
                                  Input Lag:
                                </span>
                                <div className="font-mono">
                                  {cvAnalysis.driverBehavior.steeringAnalysis.inputLag.toFixed(
                                    0,
                                  )}{" "}
                                  ms
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="racing-line">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">
                                  Line Deviation:
                                </span>
                                <div className="font-mono">
                                  {cvAnalysis.vehicleTracking.racingLine.deviation.toFixed(
                                    2,
                                  )}{" "}
                                  meters
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400">
                                  Consistency:
                                </span>
                                <div className="font-mono">
                                  {cvAnalysis.vehicleTracking.racingLine.consistency.toFixed(
                                    1,
                                  )}
                                  /10
                                </div>
                              </div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-400">
                                Improvement Areas:
                              </span>
                              <div className="mt-1 space-y-1">
                                {cvAnalysis.vehicleTracking.racingLine.improvementAreas.map(
                                  (area, i) => (
                                    <Badge
                                      key={i}
                                      className="bg-orange-500 text-white mr-2"
                                    >
                                      {area}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>

                      {cvAnalysis.recommendations.length > 0 && (
                        <div className="mt-4 p-3 bg-gray-600 rounded">
                          <div className="text-sm font-semibold mb-2">
                            CV Recommendations:
                          </div>
                          <ul className="text-xs text-gray-300 space-y-1">
                            {cvAnalysis.recommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle className="h-3 w-3 mt-0.5 text-green-400" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Real-time Strategy */}
          <TabsContent value="strategy" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  Real-time Strategy Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={generateRealTimeStrategy}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Strategy
                </Button>

                {strategies.length > 0 && (
                  <div className="space-y-4">
                    {strategies.slice(0, 1).map((strategy, index) => (
                      <Card key={index} className="bg-gray-700 border-gray-600">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <div className="font-semibold">
                                Race Strategy Optimization
                              </div>
                              <div className="text-sm text-gray-400">
                                Lap {strategy.currentLap} of{" "}
                                {strategy.totalLaps}
                              </div>
                            </div>
                            <Badge
                              className={`${getConfidenceColor(strategy.confidence)}`}
                            >
                              {(strategy.confidence * 100).toFixed(1)}%
                              confidence
                            </Badge>
                          </div>

                          <Tabs defaultValue="immediate" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-gray-600">
                              <TabsTrigger value="immediate">
                                Immediate
                              </TabsTrigger>
                              <TabsTrigger value="fuel">Fuel</TabsTrigger>
                              <TabsTrigger value="tires">Tires</TabsTrigger>
                            </TabsList>

                            <TabsContent value="immediate">
                              <div className="space-y-3">
                                <h5 className="font-semibold text-yellow-400">
                                  Immediate Actions
                                </h5>
                                {strategy.recommendations.immediate.map(
                                  (rec, i) => (
                                    <div
                                      key={i}
                                      className="p-3 bg-gray-600 rounded"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold">
                                          {rec.action}
                                        </span>
                                        <Badge
                                          className={getPriorityColor(
                                            rec.priority,
                                          )}
                                        >
                                          {rec.priority}
                                        </Badge>
                                      </div>
                                      <div className="text-sm text-gray-300 mb-1">
                                        {rec.reasoning}
                                      </div>
                                      <div className="text-xs text-green-400">
                                        Expected gain: {rec.expectedGain}s
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </TabsContent>

                            <TabsContent value="fuel">
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-400">
                                      Current Fuel:
                                    </span>
                                    <div className="font-mono">
                                      {strategy.fuelStrategy.currentFuel}%
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">
                                      Consumption Rate:
                                    </span>
                                    <div className="font-mono">
                                      {strategy.fuelStrategy.consumptionRate.toFixed(
                                        2,
                                      )}
                                      L/lap
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">
                                      Fuel to Finish:
                                    </span>
                                    <div className="font-mono">
                                      {strategy.fuelStrategy.fuelToFinish.toFixed(
                                        1,
                                      )}
                                      L
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">
                                      Margin:
                                    </span>
                                    <div className="font-mono">
                                      {strategy.fuelStrategy.margin}L
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-400">
                                    Pit Windows:
                                  </span>
                                  <div className="mt-1">
                                    {strategy.fuelStrategy.pitWindows.map(
                                      (lap, i) => (
                                        <Badge
                                          key={i}
                                          className="bg-blue-500 text-white mr-2"
                                        >
                                          Lap {lap}
                                        </Badge>
                                      ),
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="tires">
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-400">
                                      Current Compound:
                                    </span>
                                    <div className="capitalize">
                                      {strategy.tireStrategy.currentCompound}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">
                                      Degradation:
                                    </span>
                                    <div className="font-mono">
                                      {strategy.tireStrategy.degradation.toFixed(
                                        1,
                                      )}
                                      %
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">
                                      Optimal Change:
                                    </span>
                                    <div className="font-mono">
                                      Lap{" "}
                                      {strategy.tireStrategy.optimalChangeLap}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">
                                      Recommended:
                                    </span>
                                    <div className="capitalize">
                                      {
                                        strategy.tireStrategy
                                          .recommendedCompound
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Prediction */}
          <TabsContent value="prediction" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  Performance Prediction Algorithms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={generatePerformancePrediction}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Generate Prediction
                </Button>

                {predictions.length > 0 && (
                  <div className="space-y-4">
                    {predictions.slice(0, 1).map((prediction) => (
                      <Card
                        key={prediction.predictionId}
                        className="bg-gray-700 border-gray-600"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <div className="font-semibold">
                                Performance Prediction
                              </div>
                              <div className="text-sm text-gray-400">
                                {prediction.predictionModel} model
                              </div>
                            </div>
                            <Badge
                              className={`${getConfidenceColor(prediction.predictions.lapTime.confidence)}`}
                            >
                              {(
                                prediction.predictions.lapTime.confidence * 100
                              ).toFixed(1)}
                              % confidence
                            </Badge>
                          </div>

                          <div className="space-y-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-400">
                                {formatTime(
                                  prediction.predictions.lapTime.predicted,
                                )}
                              </div>
                              <div className="text-sm text-gray-400">
                                Predicted Lap Time
                              </div>
                              <div className="text-xs text-gray-500">
                                Range:{" "}
                                {formatTime(
                                  prediction.predictions.lapTime.range.min,
                                )}{" "}
                                -{" "}
                                {formatTime(
                                  prediction.predictions.lapTime.range.max,
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              {prediction.predictions.sectorTimes.map(
                                (sector) => (
                                  <div
                                    key={sector.sector}
                                    className="text-center p-3 bg-gray-600 rounded"
                                  >
                                    <div className="font-mono text-sm">
                                      {formatTime(sector.predicted)}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Sector {sector.sector}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {(sector.confidence * 100).toFixed(0)}%
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="flex justify-between">
                                  <span>Top Speed:</span>
                                  <span>
                                    {prediction.predictions.performance.topSpeed.toFixed(
                                      0,
                                    )}{" "}
                                    km/h
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Average Speed:</span>
                                  <span>
                                    {prediction.predictions.performance.averageSpeed.toFixed(
                                      0,
                                    )}{" "}
                                    km/h
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Acceleration:</span>
                                  <span>
                                    {prediction.predictions.performance.acceleration.toFixed(
                                      1,
                                    )}
                                    /10
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between">
                                  <span>Braking:</span>
                                  <span>
                                    {prediction.predictions.performance.braking.toFixed(
                                      1,
                                    )}
                                    /10
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Cornering:</span>
                                  <span>
                                    {prediction.predictions.performance.cornering.toFixed(
                                      1,
                                    )}
                                    /10
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Consistency:</span>
                                  <span>
                                    {prediction.predictions.consistency.stabilityScore.toFixed(
                                      1,
                                    )}
                                    /10
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-xs text-gray-400">
                              <div className="flex justify-between">
                                <span>Historical Accuracy:</span>
                                <span>
                                  {prediction.accuracy.historicalAccuracy.toFixed(
                                    1,
                                  )}
                                  %
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Training Data:</span>
                                <span>
                                  {prediction.trainingData.historicalSessions}{" "}
                                  sessions
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Coaching */}
          <TabsContent value="coaching" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-400" />
                  AI Coaching Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={generateCoachingRecommendations}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Cpu className="h-4 w-4 mr-2" />
                  Generate Coaching
                </Button>

                {recommendations.length > 0 && (
                  <div className="space-y-4">
                    {recommendations.map((rec) => (
                      <Card
                        key={rec.id}
                        className="bg-gray-700 border-gray-600"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-semibold">{rec.title}</div>
                              <div className="text-sm text-gray-400">
                                {rec.category} • {rec.analysis.difficultyLevel}
                              </div>
                            </div>
                            <Badge className={getPriorityColor(rec.priority)}>
                              {rec.priority}
                            </Badge>
                          </div>

                          <p className="text-sm text-gray-300 mb-3">
                            {rec.description}
                          </p>

                          <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                            <div className="text-center p-2 bg-gray-600 rounded">
                              <div className="font-mono">
                                {rec.analysis.currentPerformance}
                              </div>
                              <div className="text-xs text-gray-400">
                                Current
                              </div>
                            </div>
                            <div className="text-center p-2 bg-gray-600 rounded">
                              <div className="font-mono">
                                {rec.analysis.targetPerformance}
                              </div>
                              <div className="text-xs text-gray-400">
                                Target
                              </div>
                            </div>
                            <div className="text-center p-2 bg-gray-600 rounded">
                              <div className="font-mono text-green-400">
                                +{rec.analysis.improvementPotential.toFixed(1)}s
                              </div>
                              <div className="text-xs text-gray-400">
                                Potential
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold text-purple-400">
                              Recommendations:
                            </h5>
                            {rec.recommendations.map((recommendation, i) => (
                              <div
                                key={i}
                                className="p-2 bg-gray-600 rounded text-sm"
                              >
                                <div className="font-semibold">
                                  {recommendation.action}
                                </div>
                                <div className="text-gray-400">
                                  {recommendation.method}
                                </div>
                                <div className="text-xs text-green-400">
                                  Expected: {recommendation.expectedResult}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Timeframe: {recommendation.timeframe}
                                </div>
                              </div>
                            ))}
                          </div>

                          {rec.trackingMetrics.length > 0 && (
                            <div className="mt-3">
                              <span className="text-xs text-gray-400">
                                Tracking Metrics:
                              </span>
                              <div className="mt-1">
                                {rec.trackingMetrics.map((metric, i) => (
                                  <Badge
                                    key={i}
                                    className="bg-gray-500 text-white mr-1 mb-1 text-xs"
                                  >
                                    {metric.replace("_", " ")}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdvancedAIPage;
