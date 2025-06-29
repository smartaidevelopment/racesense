import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
// Radix UI Tabs removed to prevent hook issues
import {
  Box,
  Map,
  Thermometer,
  Eye,
  Download,
  Settings,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layers,
  Palette,
  Route,
  Target,
  MapPin,
  Activity,
  Gauge,
  Timer,
  TrendingUp,
} from "lucide-react";
import {
  visualizationService,
  Track3DModel,
  HeatMapData,
  RacingLine,
} from "@/services/VisualizationService";
import { dataManagementService } from "@/services/DataManagementService";

const AdvancedVisualization: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [track3D, setTrack3D] = useState<Track3DModel | null>(null);
  const [heatMaps, setHeatMaps] = useState<HeatMapData[]>([]);
  const [racingLines, setRacingLines] = useState<RacingLine[]>([]);
  const [activeVisualization, setActiveVisualization] = useState("3d_track");
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"3d" | "2d" | "split">("3d");
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [selectedHeatMapType, setSelectedHeatMapType] = useState("speed");
  const [selectedTrack, setSelectedTrack] = useState("Silverstone");
  const [visualizationSettings, setVisualizationSettings] = useState({
    lighting: { ambient: 0.4, directional: 0.8, shadows: true },
    colors: {
      primary: "#ff6b35",
      secondary: "#4ecdc4",
      accent: "#ffe66d",
      background: "#1a1a1a",
    },
    quality: "high",
    antiAliasing: true,
  });
  const [layersVisible, setLayersVisible] = useState({
    track: true,
    telemetry: true,
    heatMap: false,
    racingLine: true,
    sectors: true,
    corners: false,
  });
  const [interactiveMap, setInteractiveMap] = useState<any>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("sessions");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    loadData();
    initialize3DVisualization();

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const sessions = dataManagementService.getAllSessions();
      setSessions(sessions);

      if (sessions.length > 0) {
        const firstSession = sessions[0];
        await loadSession(firstSession.id);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load visualization data:", error);
      setIsLoading(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      setSelectedSession(sessionId);

      const session = dataManagementService.getSession(sessionId);
      if (!session) return;

      // Generate 3D track model
      const track3D = await visualizationService.generateTrack3D(session.track);

      // Generate visualizations
      const telemetryViz = await visualizationService.visualizeTelemetryIn3D(
        session,
        {
          showRacingLine: layersVisible.racingLine,
          showHeatMap: layersVisible.heatMap,
          heatMapType: selectedHeatMapType as any,
          animation: true,
        },
      );

      // Generate heat maps
      const heatMaps = await visualizationService.generateMultiLayerHeatMap(
        session.telemetryData,
        ["speed", "braking", "throttle", "gforce"],
        track3D,
      );

      // Generate racing line
      const racingLine = await visualizationService.generateRacingLine(
        session.telemetryData,
        track3D,
      );

      setTrack3D(track3D);
      setHeatMaps(heatMaps);
      setRacingLines([racingLine]);
      setSelectedTrack(session.track);
      setIsLoading(false);

      render3DScene();
    } catch (error) {
      console.error("Failed to load session visualization:", error);
      setIsLoading(false);
    }
  };

  const initialize3DVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize 3D context (simplified for demo)
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set up basic styling
    ctx.fillStyle = visualizationSettings.colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    render3DScene();
  };

  const render3DScene = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = visualizationSettings.colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render track (simplified 2D representation for demo)
    if (track3D && layersVisible.track) {
      renderTrack(ctx, track3D);
    }

    // Render heat maps
    if (heatMaps.length > 0 && layersVisible.heatMap) {
      renderHeatMap(ctx, heatMaps[0]);
    }

    // Render racing lines
    if (racingLines.length > 0 && layersVisible.racingLine) {
      renderRacingLine(ctx, racingLines[0]);
    }

    // Render sectors
    if (track3D && layersVisible.sectors) {
      renderSectors(ctx, track3D);
    }

    // Render corners
    if (track3D && layersVisible.corners) {
      renderCorners(ctx, track3D);
    }
  };

  const renderTrack = (ctx: CanvasRenderingContext2D, track: Track3DModel) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const scale = 0.3;

    ctx.strokeStyle = "#444444";
    ctx.lineWidth = 8;
    ctx.beginPath();

    // Simplified track outline (oval for demo)
    const radiusX = 200 * scale;
    const radiusY = 150 * scale;

    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();

    // Track surface
    ctx.strokeStyle = "#2c2c2c";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Start/finish line
    ctx.strokeStyle = visualizationSettings.colors.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - radiusX, centerY);
    ctx.lineTo(centerX - radiusX + 20, centerY);
    ctx.stroke();

    // Track name
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(track.name, centerX, centerY - radiusY - 20);
  };

  const renderHeatMap = (
    ctx: CanvasRenderingContext2D,
    heatMap: HeatMapData,
  ) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const scale = 0.3;

    heatMap.points.forEach((point, index) => {
      if (index % 10 !== 0) return; // Sample points for performance

      // Convert 3D coordinates to 2D canvas coordinates
      const x = centerX + point.x * scale;
      const y = centerY + point.y * scale;

      // Get color based on value
      const color = getHeatMapColor(
        point.value,
        heatMap.colorScale.min,
        heatMap.colorScale.max,
      );

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const renderRacingLine = (
    ctx: CanvasRenderingContext2D,
    racingLine: RacingLine,
  ) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const scale = 0.3;

    ctx.strokeStyle = visualizationSettings.colors.primary;
    ctx.lineWidth = 3;
    ctx.beginPath();

    racingLine.points.forEach((point, index) => {
      const x = centerX + point.x * scale;
      const y = centerY + point.y * scale;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Racing line confidence indicator
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    ctx.fillText(
      `Confidence: ${Math.round(racingLine.confidence * 100)}%`,
      10,
      30,
    );
  };

  const renderSectors = (
    ctx: CanvasRenderingContext2D,
    track: Track3DModel,
  ) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;

    // Render sector lines
    track.sectorLines.forEach((line, index) => {
      ctx.strokeStyle = "#666666";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();

      const startX = centerX + line[0].x * 0.3;
      const startY = centerY + line[0].y * 0.3;
      const endX = centerX + line[1].x * 0.3;
      const endY = centerY + line[1].y * 0.3;

      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Sector number
      ctx.fillStyle = "white";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`S${index + 1}`, startX, startY - 10);
    });

    ctx.setLineDash([]); // Reset line dash
  };

  const renderCorners = (
    ctx: CanvasRenderingContext2D,
    track: Track3DModel,
  ) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const scale = 0.3;

    track.corners.forEach((corner) => {
      const x = centerX + corner.entryPoint.x * scale;
      const y = centerY + corner.entryPoint.y * scale;

      // Corner marker
      ctx.fillStyle = visualizationSettings.colors.secondary;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Corner name
      ctx.fillStyle = "white";
      ctx.font = "10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(corner.name, x, y + 15);
    });
  };

  const getHeatMapColor = (value: number, min: number, max: number): string => {
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));

    // Create gradient from blue (cold) to red (hot)
    const r = Math.round(255 * normalized);
    const g = Math.round(255 * (1 - Math.abs(normalized - 0.5) * 2));
    const b = Math.round(255 * (1 - normalized));

    return `rgba(${r}, ${g}, ${b}, 0.7)`;
  };

  const toggleAnimation = () => {
    setAnimationPlaying(!animationPlaying);
  };

  const resetView = () => {
    initialize3DVisualization();
  };

  const exportVisualization = async (format: string) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (format === "png") {
        // Export canvas as PNG
        const link = document.createElement("a");
        link.download = `racesense_visualization_${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } else {
        // For other formats, use the visualization service
        const visualizations = visualizationService.getAllVisualizations();
        if (visualizations.length > 0) {
          const blob = await visualizationService.exportVisualization(
            visualizations[0].id,
            format as any,
          );
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `racesense_visualization_${Date.now()}.${format}`;
          link.click();
          URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    }
  };

  const toggleLayer = (layerName: string) => {
    setLayersVisible((prev) => ({
      ...prev,
      [layerName]: !prev[layerName as keyof typeof prev],
    }));

    // Re-render after layer toggle
    setTimeout(() => {
      render3DScene();
    }, 100);
  };

  const handleTrackChange = async (trackName: string) => {
    setSelectedTrack(trackName);
    setIsLoading(true);

    try {
      const track3D = await visualizationService.generateTrack3D(trackName);
      setTrack3D(track3D);
      setIsLoading(false);
      render3DScene();
    } catch (error) {
      console.error("Failed to load track:", error);
      setIsLoading(false);
    }
  };

  const handleHeatMapTypeChange = (type: string) => {
    setSelectedHeatMapType(type);
    if (selectedSession) {
      loadSession(selectedSession);
    }
  };

  if (isLoading && !track3D) {
    return (
      <div className="min-h-screen bg-racing-dark text-white p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-racing-orange border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading 3D visualization...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-racing-dark text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-racing-orange flex items-center gap-3">
                <Box className="h-8 w-8" />
                Advanced Visualization
              </h1>
              <p className="text-muted-foreground mt-2">
                3D track visualization, heat maps, and interactive analysis
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={resetView}
                variant="outline"
                className="bg-racing-dark border-gray-600 hover:bg-gray-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset View
              </Button>

              <Button
                onClick={() => exportVisualization("png")}
                className="bg-racing-orange hover:bg-racing-orange/80"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Selected Track
                    </p>
                    <p className="text-lg font-bold text-racing-orange">
                      {selectedTrack}
                    </p>
                  </div>
                  <MapPin className="h-6 w-6 text-racing-orange/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Heat Map Type
                    </p>
                    <p className="text-lg font-bold text-blue-400">
                      {selectedHeatMapType}
                    </p>
                  </div>
                  <Thermometer className="h-6 w-6 text-blue-400/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Racing Lines
                    </p>
                    <p className="text-lg font-bold text-green-400">
                      {racingLines.length}
                    </p>
                  </div>
                  <Route className="h-6 w-6 text-green-400/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">View Mode</p>
                    <p className="text-lg font-bold text-purple-400">
                      {viewMode.toUpperCase()}
                    </p>
                  </div>
                  <Eye className="h-6 w-6 text-purple-400/60" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-200px)]">
        {/* Sidebar Controls */}
        <div className="w-80 border-r border-gray-800 bg-gray-900/50 p-4 overflow-y-auto">
          <div className="w-full">
            {/* Custom Tab Navigation */}
            <div className="grid w-full grid-cols-3 bg-gray-800 rounded-lg p-1 mb-4">
              {[
                { value: "sessions", label: "Sessions" },
                { value: "layers", label: "Layers" },
                { value: "settings", label: "Settings" },
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

            {/* Sessions Tab */}
            {activeTab === "sessions" && (
              <div className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Select Session</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <select
                      value={selectedSession}
                      onChange={(e) => loadSession(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                    >
                      <option value="">Choose a session...</option>
                      {sessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {session.name} - {session.track}
                        </option>
                      ))}
                    </select>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Track Selection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <select
                      value={selectedTrack}
                      onChange={(e) => handleTrackChange(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                    >
                      <option value="Silverstone">Silverstone</option>
                      <option value="Spa-Francorchamps">
                        Spa-Francorchamps
                      </option>
                      <option value="Monza">Monza</option>
                      <option value="Nürburgring">Nürburgring</option>
                      <option value="Suzuka">Suzuka</option>
                    </select>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Heat Map Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <select
                      value={selectedHeatMapType}
                      onChange={(e) => handleHeatMapTypeChange(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                    >
                      <option value="speed">Speed</option>
                      <option value="braking">Braking</option>
                      <option value="throttle">Throttle</option>
                      <option value="steering">Steering</option>
                      <option value="gforce">G-Force</option>
                      <option value="temperature">Temperature</option>
                    </select>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Layers Tab */}
            {activeTab === "layers" && (
              <div className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Visualization Layers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(layersVisible).map(([layer, visible]) => (
                      <div
                        key={layer}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm capitalize">
                          {layer.replace(/([A-Z])/g, " $1")}
                        </span>
                        <Button
                          size="sm"
                          variant={visible ? "default" : "outline"}
                          onClick={() => toggleLayer(layer)}
                          className={
                            visible
                              ? "bg-racing-orange hover:bg-racing-orange/80"
                              : "bg-gray-700 border-gray-600"
                          }
                        >
                          {visible ? <Eye className="h-4 w-4" /> : "Hidden"}
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Visualization Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">
                        Quality
                      </label>
                      <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="ultra">Ultra</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">
                        Export Options
                      </label>
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full bg-gray-700 border-gray-600"
                          onClick={() => exportVisualization("png")}
                        >
                          Export PNG
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full bg-gray-700 border-gray-600"
                          onClick={() => exportVisualization("svg")}
                        >
                          Export SVG
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Main Visualization Area */}
        <div className="flex-1 relative bg-black">
          {/* Animation Controls */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/80 rounded-lg p-2">
            <Button
              size="sm"
              variant="outline"
              onClick={toggleAnimation}
              className="bg-gray-800 border-gray-600"
            >
              {animationPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <span className="text-xs text-white">
              {animationPlaying ? "Playing" : "Paused"}
            </span>
          </div>

          {/* Performance Info */}
          <div className="absolute top-4 right-4 z-10 bg-black/80 rounded-lg p-2">
            <div className="text-xs text-white space-y-1">
              <div>FPS: 60</div>
              <div>Quality: High</div>
              {track3D && <div>Polygons: {track3D.meshData.length / 3}</div>}
            </div>
          </div>

          {/* Main Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ background: "#1a1a1a" }}
          />

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-racing-orange border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white">Rendering visualization...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="border-t border-gray-800 bg-black/50 p-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Session: {selectedSession || "None"}</span>
            <span>Track: {selectedTrack}</span>
            <span>Heat Map: {selectedHeatMapType}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>View: {viewMode.toUpperCase()}</span>
            <span>
              Layers: {Object.values(layersVisible).filter(Boolean).length}{" "}
              active
            </span>
            {track3D && (
              <span>
                Corners: {track3D.corners.length} • Sectors:{" "}
                {track3D.sectorLines.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedVisualization;
