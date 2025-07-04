import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RacingButton } from "@/components/RacingButton";
import { DataCard } from "@/components/DataCard";
import { PerformanceMetric } from "@/components/LoadingStates";
import { notify } from "@/components/RacingNotifications";
import {
  realSessionAnalysisService,
  RealTrackAnalysis,
  RealLapComparison,
  RealPerformanceInsights,
  RealSessionMetrics,
  RealLapData,
} from "@/services/RealSessionAnalysisService";
import { dataManagementService, SessionData } from "@/services/DataManagementService";
import { dataGeneratorService } from "@/services/DataGeneratorService";
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
  Database,
  FileText,
  Settings,
  Trash2,
} from "lucide-react";

interface SessionAnalysisState {
  selectedSession: string | null;
  availableSessions: SessionData[];
  trackAnalysis: RealTrackAnalysis | null;
  selectedLaps: RealLapData[];
  lapComparison: RealLapComparison | null;
  performanceInsights: RealPerformanceInsights | null;
  sessionMetrics: RealSessionMetrics | null;
  isAnalyzing: boolean;
  showLapComparison: boolean;
  selectedLap1: RealLapData | null;
  selectedLap2: RealLapData | null;
  analysisType: "overview" | "detailed" | "comparison" | "trends";
  selectedTrack: string | null;
  availableTracks: string[];
  error: string | null;
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
      selectedTrack: null,
      availableTracks: [],
      error: null,
    };
  }

  componentDidMount() {
    this.loadRealData();
  }

  loadRealData = async () => {
    try {
      console.log("=== Loading real data ===");
      this.setState({ isAnalyzing: true, error: null });

      // Load real sessions from storage
      const sessions = dataManagementService.getAllSessions();
      console.log(`Loaded ${sessions.length} sessions from storage`);
      
      // Debug each session
      sessions.forEach((session, index) => {
        console.log(`Session ${index + 1}: ${session.name}`);
        console.log(`  - ID: ${session.id}`);
        console.log(`  - Track: ${session.track}`);
        console.log(`  - Telemetry points: ${session.telemetryData?.length || 0}`);
        console.log(`  - Has telemetry data: ${!!session.telemetryData}`);
        if (session.telemetryData && session.telemetryData.length > 0) {
          console.log(`  - First telemetry point:`, session.telemetryData[0]);
        }
      });
      
      // Extract unique tracks
      const tracks = [...new Set(sessions.map(s => s.track))];
      console.log(`Found ${tracks.length} unique tracks:`, tracks);
      
      this.setState({
        availableSessions: sessions,
        availableTracks: tracks,
        selectedTrack: tracks[0] || null,
        isAnalyzing: false,
      });

      if (tracks.length > 0) {
        console.log(`Analyzing first track: ${tracks[0]}`);
        await this.analyzeTrack(tracks[0]);
      } else {
        console.log("No tracks found, setting error");
        this.setState({
          error: "No session data found. Please record some sessions first.",
        });
      }
    } catch (error) {
      console.error("Error loading real data:", error);
      this.setState({
        isAnalyzing: false,
        error: "Failed to load session data. Please check your data storage.",
      });
    }
  };

  analyzeTrack = async (trackId: string) => {
    if (!trackId) return;

    this.setState({ isAnalyzing: true, error: null });

    try {
      // Analyze track performance using real data
      const trackAnalysis = await realSessionAnalysisService.analyzeRealTrackPerformance(trackId);
      
      // Get sessions for this track
      const trackSessions = this.state.availableSessions.filter(s => s.track === trackId);
      
      // Convert sessions to lap data
      const allLaps: RealLapData[] = [];
      for (const session of trackSessions) {
        const sessionLaps = await realSessionAnalysisService.convertSessionToLapData(session.id);
        allLaps.push(...sessionLaps);
      }

      // Generate insights
      const performanceInsights = await realSessionAnalysisService.generateRealInsights(
        trackId,
        trackSessions.map(s => s.id)
      );

      this.setState({
        selectedTrack: trackId,
        trackAnalysis,
        selectedLaps: allLaps,
        performanceInsights,
        isAnalyzing: false,
      });

      notify.success(
        "Real Analysis Complete",
        `Track analysis completed for ${trackId} with ${allLaps.length} laps`,
        { duration: 3000 },
      );
    } catch (error) {
      console.error("Error analyzing track:", error);
      this.setState({
        isAnalyzing: false,
        error: `Failed to analyze track ${trackId}: ${error}`,
      });
    }
  };

  analyzeSession = async (sessionId: string) => {
    this.setState({ isAnalyzing: true, error: null });

    try {
      // Calculate real session metrics
      const sessionMetrics = await realSessionAnalysisService.calculateRealSessionMetrics(sessionId);
      
      // Convert session to lap data
      const sessionLaps = await realSessionAnalysisService.convertSessionToLapData(sessionId);

      this.setState({
        selectedSession: sessionId,
        selectedLaps: sessionLaps,
        sessionMetrics,
        isAnalyzing: false,
      });

      notify.success(
        "Session Analysis Complete",
        `Session ${sessionId} analyzed with ${sessionLaps.length} laps`,
        { duration: 3000 },
      );
    } catch (error) {
      console.error("Error analyzing session:", error);
      this.setState({
        isAnalyzing: false,
        error: `Failed to analyze session ${sessionId}: ${error}`,
      });
    }
  };

  compareLaps = async (lap1: RealLapData, lap2: RealLapData) => {
    try {
      const comparison = await realSessionAnalysisService.compareRealLaps(lap1, lap2);
      this.setState({
        lapComparison: comparison,
        selectedLap1: lap1,
        selectedLap2: lap2,
        showLapComparison: true,
      });
    } catch (error) {
      console.error("Error comparing laps:", error);
      notify.error("Comparison Failed", `Could not compare laps: ${error}`, {
        duration: 5000,
      });
    }
  };

  handleTrackChange = (trackId: string) => {
    if (!trackId) {
      this.setState({ selectedTrack: null, trackAnalysis: null, error: null });
      return;
    }
    
    console.log(`Track changed to: ${trackId}`);
    this.analyzeTrack(trackId);
  };

  handleSessionChange = (sessionId: string) => {
    if (!sessionId) {
      this.setState({ selectedSession: null, sessionMetrics: null, error: null });
      return;
    }
    
    console.log(`Session changed to: ${sessionId}`);
    this.analyzeSession(sessionId);
  };

  exportAnalysisData = async () => {
    if (!this.state.selectedTrack) {
      notify.error("No Track Selected", "Please select a track to export analysis data");
      return;
    }

    if (!this.state.trackAnalysis) {
      notify.error("No Analysis Data", "Please analyze a track first before exporting");
      return;
    }

    try {
      this.setState({ isAnalyzing: true });
      const analysisData = await realSessionAnalysisService.exportAnalysisData(this.state.selectedTrack);
      
      // Create and download file
      const blob = new Blob([analysisData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${this.state.selectedTrack}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.setState({ isAnalyzing: false });
      notify.success("Export Complete", "Analysis data exported successfully");
    } catch (error) {
      this.setState({ isAnalyzing: false });
      console.error("Export error:", error);
      notify.error("Export Failed", `Failed to export analysis data: ${error}`);
    }
  };

  importAnalysisData = async (file: File) => {
    try {
      this.setState({ isAnalyzing: true });
      const text = await file.text();
      await realSessionAnalysisService.importAnalysisData(text);
      await this.loadRealData(); // Reload data
      this.setState({ isAnalyzing: false });
      notify.success("Import Complete", "Analysis data imported successfully");
    } catch (error) {
      this.setState({ isAnalyzing: false });
      console.error("Import error:", error);
      notify.error("Import Failed", `Failed to import analysis data: ${error}`);
    }
  };

  generateSampleData = async () => {
    try {
      this.setState({ isAnalyzing: true, error: null });
      console.log("=== Starting sample data generation from SessionAnalysis ===");
      
      // Generate sample sessions
      dataGeneratorService.generateSampleSessions();
      
      // Wait a moment for localStorage operations to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log("Sample data generation completed, reloading data...");
      
      // Reload data
      await this.loadRealData();
      
      this.setState({ isAnalyzing: false });
      notify.success("Sample Data Generated", "Sample session data has been created for testing");
    } catch (error) {
      this.setState({ isAnalyzing: false });
      console.error("Error generating sample data:", error);
      notify.error("Generation Failed", `Failed to generate sample data: ${error}`);
    }
  };

  testSingleSession = async () => {
    try {
      this.setState({ isAnalyzing: true, error: null });
      console.log("=== Creating single test session ===");
      
      dataGeneratorService.testCreateSingleSession();
      
      // Wait a moment for localStorage operations to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log("Test session created, reloading data...");
      
      // Reload data
      await this.loadRealData();
      
      this.setState({ isAnalyzing: false });
      notify.success("Test Session Created", "Single test session with telemetry data created");
    } catch (error) {
      this.setState({ isAnalyzing: false });
      console.error("Error creating test session:", error);
      notify.error("Test Failed", `Failed to create test session: ${error}`);
    }
  };

  debugClearAndGenerate = async () => {
    try {
      this.setState({ isAnalyzing: true, error: null });
      console.log("=== DEBUG: Clearing localStorage and generating fresh data ===");
      
      // Manually clear localStorage
      localStorage.clear();
      console.log("Cleared all localStorage");
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Generate fresh sample data
      dataGeneratorService.generateSampleSessions();
      
      // Wait for generation to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log("Fresh data generated, reloading...");
      
      // Reload data
      await this.loadRealData();
      
      this.setState({ isAnalyzing: false });
      notify.success("Debug Complete", "Cleared localStorage and generated fresh sample data");
    } catch (error) {
      this.setState({ isAnalyzing: false });
      console.error("Debug error:", error);
      notify.error("Debug Failed", `Debug operation failed: ${error}`);
    }
  };

  forceReloadWithTelemetry = async () => {
    try {
      this.setState({ isAnalyzing: true, error: null });
      console.log("=== Force reloading with telemetry data ===");
      
      // Force reload sessions with telemetry data
      dataManagementService.forceReloadWithTelemetry();
      
      // Wait a moment for the reload to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log("Force reload complete, refreshing data...");
      
      // Reload data
      await this.loadRealData();
      
      this.setState({ isAnalyzing: false });
      notify.success("Force Reload Complete", "Sessions reloaded with telemetry data");
    } catch (error) {
      this.setState({ isAnalyzing: false });
      console.error("Force reload error:", error);
      notify.error("Force Reload Failed", `Force reload operation failed: ${error}`);
    }
  };

  createDebugSession = async () => {
    try {
      this.setState({ isAnalyzing: true, error: null });
      console.log("=== Creating debug session from SessionAnalysis ===");
      
      const sessionId = await realSessionAnalysisService.createDebugSession();
      
      // Wait a moment for localStorage operations to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log("Debug session created, reloading data...");
      
      // Reload data
      await this.loadRealData();
      
      this.setState({ isAnalyzing: false });
      notify.success("Debug Session Created", `Debug session created with ID: ${sessionId}`);
    } catch (error) {
      this.setState({ isAnalyzing: false });
      console.error("Error creating debug session:", error);
      notify.error("Debug Session Failed", `Failed to create debug session: ${error}`);
    }
  };

  handleNavigation = (path: string) => {
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const ms = Math.floor((milliseconds % 1000) / 10);
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  formatDuration = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  formatDistance = (meters: number): string => {
    return `${(meters / 1000).toFixed(2)} km`;
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
      selectedTrack,
      availableTracks,
      error,
    } = this.state;

    if (error) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
          <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-400 mb-2">Analysis Error</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <RacingButton
                onClick={this.loadRealData}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Loading Data
              </RacingButton>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg w-fit">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Real Session Analysis
                </h1>
                <p className="text-gray-400 text-base sm:text-lg mt-1">
                  Advanced telemetry analysis using real session data
                </p>
              </div>
            </div>

            {/* Data Source Info */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-green-400">{availableSessions.length}</div>
                <div className="text-green-300 text-xs sm:text-sm font-medium">Total Sessions</div>
              </div>
              <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-blue-400">{availableTracks.length}</div>
                <div className="text-blue-300 text-xs sm:text-sm font-medium">Tracks</div>
              </div>
              <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-purple-400">{selectedLaps.length}</div>
                <div className="text-purple-300 text-xs sm:text-sm font-medium">Total Laps</div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-yellow-400">
                  {trackAnalysis ? "✓" : "—"}
                </div>
                <div className="text-yellow-300 text-xs sm:text-sm font-medium">Analysis Ready</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Control Panel */}
            <div className="space-y-4 sm:space-y-6">
              {/* Track Selection */}
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
                <div className="p-4 sm:p-6">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Route className="h-4 w-4" />
                    Track Selection
                  </h3>
                  <select
                    value={selectedTrack || ""}
                    onChange={(e) => this.handleTrackChange(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-lg p-2 mb-3"
                    disabled={isAnalyzing}
                  >
                    <option value="">Select Track</option>
                    {availableTracks.map(track => (
                      <option key={track} value={track}>{track}</option>
                    ))}
                  </select>
                  {availableTracks.length === 0 && (
                    <div className="text-xs text-yellow-400 mb-2">
                      No tracks available. Generate sample data first.
                    </div>
                  )}
                  {isAnalyzing && selectedTrack && (
                    <div className="text-xs text-blue-400 flex items-center gap-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-400"></div>
                      Analyzing track...
                    </div>
                  )}
                </div>
              </Card>

              {/* Session Selection */}
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
                <div className="p-4 sm:p-6">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Session Selection
                  </h3>
                  <select
                    value={selectedSession || ""}
                    onChange={(e) => this.handleSessionChange(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-lg p-2 mb-3"
                    disabled={isAnalyzing}
                  >
                    <option value="">Select Session</option>
                    {availableSessions.map(session => (
                      <option key={session.id} value={session.id}>
                        {session.name} - {session.date.toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                  {availableSessions.length === 0 && (
                    <div className="text-xs text-yellow-400 mb-2">
                      No sessions available. Generate sample data first.
                    </div>
                  )}
                  {isAnalyzing && selectedSession && (
                    <div className="text-xs text-blue-400 flex items-center gap-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-400"></div>
                      Analyzing session...
                    </div>
                  )}
                </div>
              </Card>

              {/* Analysis Controls */}
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
                <div className="p-4 sm:p-6">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Analysis Controls
                  </h3>
                  {error && (
                    <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                      <div className="flex items-center justify-between">
                        <div>
                          <strong>Error:</strong> {error}
                        </div>
                        <button
                          onClick={() => this.setState({ error: null })}
                          className="text-red-300 hover:text-red-100 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                  {!error && (
                    <div className="mb-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>
                          {trackAnalysis ? 'Analysis ready' : 'Select a track to analyze'}
                        </span>
                      </div>
                    </div>
                  )}
                                     <div className="space-y-2">
                     <RacingButton
                       onClick={this.loadRealData}
                       disabled={isAnalyzing}
                       className="w-full bg-blue-600 hover:bg-blue-700"
                       title="Reload all session and track data from storage"
                     >
                       <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                       Refresh Data
                     </RacingButton>
                     <RacingButton
                       onClick={this.generateSampleData}
                       disabled={isAnalyzing}
                       className="w-full bg-orange-600 hover:bg-orange-700"
                       title="Create sample sessions with telemetry data for testing"
                     >
                       <Database className="h-4 w-4 mr-2" />
                       Generate Sample Data
                     </RacingButton>
                     <RacingButton
                       onClick={this.testSingleSession}
                       disabled={isAnalyzing}
                       className="w-full bg-purple-600 hover:bg-purple-700"
                       title="Create a single test session with telemetry data"
                     >
                       <Database className="h-4 w-4 mr-2" />
                       Test Single Session
                     </RacingButton>
                     <RacingButton
                       onClick={this.debugClearAndGenerate}
                       disabled={isAnalyzing}
                       className="w-full bg-red-600 hover:bg-red-700"
                       title="Clear all data and generate fresh sample data (debug mode)"
                     >
                       <RefreshCw className="h-4 w-4 mr-2" />
                       Debug: Clear & Generate
                     </RacingButton>
                     <RacingButton
                       onClick={this.forceReloadWithTelemetry}
                       disabled={isAnalyzing}
                       className="w-full bg-orange-600 hover:bg-orange-700"
                       title="Force reload sessions with telemetry data (fixes missing telemetry)"
                     >
                       <RefreshCw className="h-4 w-4 mr-2" />
                       Force Reload with Telemetry
                     </RacingButton>
                     <RacingButton
                       onClick={this.createDebugSession}
                       disabled={isAnalyzing}
                       className="w-full bg-purple-600 hover:bg-purple-700"
                       title="Create a test session with telemetry data for debugging"
                     >
                       <Database className="h-4 w-4 mr-2" />
                       Create Debug Session
                     </RacingButton>
                     <RacingButton
                       onClick={() => {
                         if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                           localStorage.clear();
                           this.setState({
                             availableSessions: [],
                             availableTracks: [],
                             selectedTrack: null,
                             selectedSession: null,
                             trackAnalysis: null,
                             error: null
                           });
                           notify.success("Data Cleared", "All data has been cleared");
                         }
                       }}
                       disabled={isAnalyzing}
                       className="w-full bg-red-600 hover:bg-red-700"
                       title="Clear all stored data (sessions, tracks, analysis)"
                     >
                       <Trash2 className="h-4 w-4 mr-2" />
                       Clear All Data
                     </RacingButton>
                     <RacingButton
                       onClick={this.exportAnalysisData}
                       disabled={!trackAnalysis}
                       className="w-full bg-green-600 hover:bg-green-700"
                       title="Export current track analysis data as JSON file"
                     >
                       <Download className="h-4 w-4 mr-2" />
                       Export Analysis
                     </RacingButton>
                    <label className="block">
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => e.target.files?.[0] && this.importAnalysisData(e.target.files[0])}
                        className="hidden"
                        disabled={isAnalyzing}
                      />
                      <div className={`w-full text-white rounded-lg p-2 text-center cursor-pointer transition-colors ${
                        isAnalyzing 
                          ? 'bg-gray-600 cursor-not-allowed' 
                          : 'bg-purple-600 hover:bg-purple-700'
                      }`}>
                        <Upload className={`h-4 w-4 mr-2 inline ${isAnalyzing ? 'animate-spin' : ''}`} />
                        {isAnalyzing ? 'Importing...' : 'Import Analysis'}
                      </div>
                    </label>
                  </div>
                </div>
              </Card>

              {/* Navigation */}
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
                <div className="p-4 sm:p-6">
                  <RacingButton
                    onClick={() => this.handleNavigation("/mode-selection")}
                    className="w-full bg-gray-600 hover:bg-gray-700"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Mode Selection
                  </RacingButton>
                </div>
              </Card>
            </div>

            {/* Analysis Results */}
            <div className="lg:col-span-3 space-y-4 sm:space-y-6">
              {isAnalyzing ? (
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <h3 className="text-white font-semibold mb-2">Analyzing Real Data</h3>
                    <p className="text-gray-400">Processing telemetry and generating insights...</p>
                  </div>
                </Card>
              ) : (
                <>
                  {/* Track Analysis Overview */}
                  {trackAnalysis && (
                    <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
                      <div className="p-4 sm:p-6">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-yellow-400" />
                          Track Performance Analysis
                        </h3>
                                                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                           <DataCard
                             label="Best Lap Time"
                             value={this.formatTime(trackAnalysis.bestLapTime)}
                             icon={Clock}
                             trend="down"
                           />
                           <DataCard
                             label="Average Lap Time"
                             value={this.formatTime(trackAnalysis.averageLapTime)}
                             icon={Timer}
                             trend="neutral"
                           />
                           <DataCard
                             label="Consistency Rating"
                             value={`${trackAnalysis.consistencyRating.toFixed(1)}%`}
                             icon={Target}
                             trend={trackAnalysis.consistencyRating > 80 ? "up" : "down"}
                           />
                           <DataCard
                             label="Total Laps"
                             value={trackAnalysis.totalLaps.toString()}
                             icon={Activity}
                             trend="neutral"
                           />
                         </div>
                      </div>
                    </Card>
                  )}

                  {/* Session Metrics */}
                  {sessionMetrics && (
                    <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
                      <div className="p-4 sm:p-6">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Gauge className="h-5 w-5 text-blue-400" />
                          Session Metrics
                        </h3>
                                                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                           <DataCard
                             label="Total Distance"
                             value={this.formatDistance(sessionMetrics.totalDistance)}
                             icon={Route}
                             trend="neutral"
                           />
                           <DataCard
                             label="Max Speed"
                             value={`${sessionMetrics.maxSpeed.toFixed(0)} km/h`}
                             icon={Zap}
                             trend="up"
                           />
                           <DataCard
                             label="Average Speed"
                             value={`${sessionMetrics.averageSpeed.toFixed(0)} km/h`}
                             icon={Gauge}
                             trend="neutral"
                           />
                           <DataCard
                             label="Session Duration"
                             value={this.formatDuration(sessionMetrics.totalTime)}
                             icon={Clock}
                             trend="neutral"
                           />
                         </div>
                      </div>
                    </Card>
                  )}

                  {/* Performance Insights */}
                  {performanceInsights && (
                    <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
                      <div className="p-4 sm:p-6">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Eye className="h-5 w-5 text-purple-400" />
                          Performance Insights
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-green-400 font-medium mb-2">Strengths</h4>
                            {performanceInsights.strengths.length > 0 ? (
                              <ul className="space-y-1">
                                {performanceInsights.strengths.map((strength, index) => (
                                  <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span>{strength.description}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">No specific strengths identified yet</p>
                            )}
                          </div>
                          <div>
                            <h4 className="text-yellow-400 font-medium mb-2">Areas for Improvement</h4>
                            {performanceInsights.improvements.length > 0 ? (
                              <ul className="space-y-1">
                                {performanceInsights.improvements.map((improvement, index) => (
                                  <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                                    <AlertCircle className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <span>{improvement.description}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">No specific improvements identified yet</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Lap List */}
                  {selectedLaps.length > 0 && (
                    <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
                      <div className="p-4 sm:p-6">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Timer className="h-5 w-5 text-cyan-400" />
                          Lap Analysis ({selectedLaps.length} laps)
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {selectedLaps.map((lap, index) => (
                            <div
                              key={lap.lapNumber}
                              className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600/50 hover:bg-gray-700/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-xs">
                                  Lap {lap.lapNumber}
                                </Badge>
                                <div>
                                  <div className="text-white font-medium">
                                    {this.formatTime(lap.lapTime)}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    Max: {lap.maxSpeed.toFixed(0)} km/h | Avg: {lap.averageSpeed.toFixed(0)} km/h
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={lap.isValidLap ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {lap.isValidLap ? "Valid" : "Invalid"}
                                </Badge>
                                <RacingButton
                                  size="sm"
                                  onClick={() => {
                                    if (selectedLap1 === null) {
                                      this.setState({ selectedLap1: lap });
                                    } else if (selectedLap2 === null && selectedLap1 !== lap) {
                                      this.compareLaps(selectedLap1, lap);
                                    }
                                  }}
                                  disabled={selectedLap1 === lap}
                                  className="text-xs"
                                >
                                  Compare
                                </RacingButton>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* No Data Message */}
                  {!trackAnalysis && !sessionMetrics && !isAnalyzing && (
                    <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
                      <div className="p-8 text-center">
                        <Database className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-white font-semibold mb-2">No Analysis Data</h3>
                        <p className="text-gray-400 mb-4">
                          Select a track or session to begin real data analysis
                        </p>
                        <RacingButton
                          onClick={this.loadRealData}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Load Session Data
                        </RacingButton>
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default function SessionAnalysis() {
  return <SessionAnalysisPage />;
}
