import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Search,
  Plus,
  Map,
  Flag,
  Timer,
  Ruler,
  Globe,
  Star,
  CheckCircle,
  Activity,
  Brain,
  BarChart3,
  Play,
  Upload,
  Settings,
  Trophy,
  Target,
  Zap,
  Car,
  Clock,
  TrendingUp,
  Award,
  Users,
  Compass,
  Gauge,
  Filter,
  ArrowLeft,
} from "lucide-react";
import { useNotifications } from "@/components/RacingNotifications";
import trackService from "@/services/TrackService";
import { RacingTrack } from "@/types/track";

interface CustomTrack {
  id: string;
  name: string;
  city: string;
  country: string;
  points: any[];
  length: number;
  direction: "clockwise" | "counterclockwise";
  surface: "asphalt" | "concrete" | "dirt" | "gravel";
  sectors: any[];
  createdAt: string;
}

const ModeSelection: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useNotifications();
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [customTracks, setCustomTracks] = useState<CustomTrack[]>([]);
  const [showTrackSelector, setShowTrackSelector] = useState(false);
  const [showTrackConfiguration, setShowTrackConfiguration] = useState(false);
  const [trackFilter, setTrackFilter] = useState("all");

  // Load custom tracks from localStorage
  useEffect(() => {
    const savedTracks = JSON.parse(localStorage.getItem("customTracks") || "[]");
    setCustomTracks(savedTracks);
  }, []);

  // Check if we have a custom track from track creator
  useEffect(() => {
    if (location.state?.customTrack) {
      setSelectedTrack(location.state.customTrack);
      notify({
        type: "success",
        title: "Custom Track Loaded",
        message: `${location.state.customTrack.name} is ready for your session`,
      });
    }
  }, [location.state, notify]);

  const handleModeSelect = (mode: string) => {
    if (!selectedTrack) {
      setShowTrackSelector(true);
      notify({
        type: "info",
        title: "Track Selection Required",
        message: "Please select a track before starting your session",
      });
      return;
    }

    // Navigate to the appropriate page with track information
    navigate(`/${mode.toLowerCase().replace(/\s+/g, "-")}`, {
      state: { 
        track: selectedTrack,
        mode: mode 
      }
    });
  };

  const handleStartSession = () => {
    setShowTrackConfiguration(false);
    notify({
      type: "success",
      title: "Session Ready",
      message: `${selectedTrack.name} is configured and ready for your session`,
    });
  };

  const handleBackToTrackSelection = () => {
    setShowTrackConfiguration(false);
    setSelectedTrack(null);
  };

  const handleTrackSelect = (track: any) => {
    setSelectedTrack(track);
    setShowTrackSelector(false);
    setShowTrackConfiguration(true);
    notify({
      type: "success",
      title: "Track Selected",
      message: `${track.name} selected. Review track configuration before starting your session.`,
    });
  };

  const handleCreateCustomTrack = () => {
    navigate("/track-creator", { 
      state: { 
        mode: location.state?.mode || "Live Session",
        returnTo: "/mode-selection"
      } 
    });
  };

  const racingModes = [
    {
      id: "live-session",
      name: "Live Session",
      description: "Real-time telemetry and lap timing",
      icon: Play,
      color: "from-green-500 to-emerald-600",
      features: ["Live GPS tracking", "Real-time lap times", "Instant feedback"],
      badge: "Popular"
    },
    {
      id: "drug-mode",
      name: "Drug Mode",
      description: "Focused training with detailed analysis",
      icon: Target,
      color: "from-blue-500 to-cyan-600",
      features: ["Sector analysis", "Line comparison", "Performance tracking"],
      badge: "Training"
    },
    {
      id: "race-mode",
      name: "Race Mode",
      description: "Competitive racing with advanced features",
      icon: Trophy,
      color: "from-purple-500 to-pink-600",
      features: ["Race timing", "Competitor tracking", "Advanced analytics"],
      badge: "Pro"
    },
    {
      id: "drift-mode",
      name: "Drift Mode",
      description: "Specialized drift analysis and scoring",
      icon: Zap,
      color: "from-orange-500 to-red-600",
      features: ["Drift scoring", "Angle measurement", "Style analysis"],
      badge: "Specialized"
    },
    {
      id: "time-attack",
      name: "Time Attack",
      description: "Maximum precision timing and analysis",
      icon: Clock,
      color: "from-indigo-500 to-purple-600",
      features: ["Precision timing", "Detailed analysis", "Record tracking"],
      badge: "Precision"
    },
    {
      id: "endurance",
      name: "Endurance",
      description: "Long-distance racing and monitoring",
      icon: TrendingUp,
      color: "from-teal-500 to-green-600",
      features: ["Long session support", "Fuel monitoring", "Stamina tracking"],
      badge: "Long Distance"
    }
  ];

  const predefinedTracks = [
    {
      id: "kymiring",
      name: "Kymiring",
      city: "Kymi",
      country: "Finland",
      length: 4.5,
      type: "Circuit",
      surface: "Asphalt",
      direction: "Clockwise",
      featured: true
    },
    {
      id: "alastaro",
      name: "Alastaro Circuit",
      city: "Alastaro",
      country: "Finland",
      length: 2.2,
      type: "Circuit",
      surface: "Asphalt",
      direction: "Clockwise"
    },
    {
      id: "botniaring",
      name: "Botniaring",
      city: "Kauhava",
      country: "Finland",
      length: 3.2,
      type: "Circuit",
      surface: "Asphalt",
      direction: "Clockwise"
    },
    {
      id: "ahvenisto",
      name: "Ahvenisto Race Circuit",
      city: "Hämeenlinna",
      country: "Finland",
      length: 2.8,
      type: "Circuit",
      surface: "Asphalt",
      direction: "Clockwise"
    }
  ];

  const filteredTracks = trackFilter === "custom" 
    ? customTracks 
    : trackFilter === "finnish" 
    ? predefinedTracks.filter(t => t.country === "Finland")
    : predefinedTracks;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
            New Session
          </h1>
          <p className="text-gray-400 text-lg">
            Choose your racing mode and track for the ultimate driving experience
          </p>
        </div>

        {/* Track Selection */}
        {showTrackSelector && (
          <Card className="bg-gray-800 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-400" />
                  Select Track
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTrackSelector(false)}
                  className="text-gray-400 border-gray-600"
                >
                  Cancel
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="predefined" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-700">
                  <TabsTrigger value="predefined" className="text-white">Predefined</TabsTrigger>
                  <TabsTrigger value="custom" className="text-white">Custom</TabsTrigger>
                  <TabsTrigger value="create" className="text-white">Create New</TabsTrigger>
                </TabsList>

                {/* Predefined Tracks */}
                <TabsContent value="predefined" className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={trackFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTrackFilter("all")}
                    >
                      All Tracks
                    </Button>
                    <Button
                      variant={trackFilter === "finnish" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTrackFilter("finnish")}
                      className="border-green-500 text-green-400 hover:bg-green-500/10"
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Finnish Tracks
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTracks.map((track) => (
                      <Card
                        key={track.id}
                        className={`bg-gray-700 border-gray-600 cursor-pointer transition-all hover:border-blue-400 hover:bg-gray-650 ${
                          selectedTrack?.id === track.id ? "border-blue-400 bg-blue-600/20" : ""
                        }`}
                        onClick={() => handleTrackSelect(track)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-white">{track.name}</h3>
                              <p className="text-sm text-gray-400">{track.city}, {track.country}</p>
                            </div>
                            {track.featured && (
                              <Badge className="bg-green-500 text-black text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-400">Length:</span>
                              <div className="text-white font-medium">{track.length} km</div>
                            </div>
                            <div>
                              <span className="text-gray-400">Surface:</span>
                              <div className="text-white font-medium">{track.surface}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Custom Tracks */}
                <TabsContent value="custom" className="space-y-4">
                  {customTracks.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-semibold">No Custom Tracks</p>
                      <p className="text-sm mb-4">Create your first custom track to get started</p>
                      <Button
                        onClick={handleCreateCustomTrack}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Custom Track
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {customTracks.map((track) => (
                        <Card
                          key={track.id}
                          className={`bg-gray-700 border-gray-600 cursor-pointer transition-all hover:border-purple-400 hover:bg-gray-650 ${
                            selectedTrack?.id === track.id ? "border-purple-400 bg-purple-600/20" : ""
                          }`}
                          onClick={() => handleTrackSelect(track)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-white">{track.name}</h3>
                                <p className="text-sm text-gray-400">{track.city}, {track.country}</p>
                              </div>
                              <Badge className="bg-purple-500 text-white text-xs">
                                Custom
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-400">Length:</span>
                                <div className="text-white font-medium">{(track.length / 1000).toFixed(2)} km</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Points:</span>
                                <div className="text-white font-medium">{track.points.length}</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              Created: {new Date(track.createdAt).toLocaleDateString()}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Create New Track */}
                <TabsContent value="create" className="space-y-4">
                  <div className="text-center py-8">
                    <MapPin className="h-16 w-16 mx-auto mb-4 text-blue-400" />
                    <h3 className="text-xl font-semibold text-white mb-2">Create Custom Track</h3>
                    <p className="text-gray-400 mb-6">
                      Design your own racing circuit with interactive map tools
                    </p>
                    <Button
                      onClick={handleCreateCustomTrack}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Start Creating
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Track Configuration View */}
        {showTrackConfiguration && selectedTrack && (
          <Card className="bg-gray-800 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-blue-400" />
                  Track Configuration
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToTrackSelection}
                  className="text-gray-400 border-gray-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Track Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">{selectedTrack.name}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Location:</span>
                      <span className="text-white">{selectedTrack.city}, {selectedTrack.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Length:</span>
                      <span className="text-white">
                        {selectedTrack.length ? `${(selectedTrack.length / 1000).toFixed(2)} km` : `${selectedTrack.length} km`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white">{selectedTrack.type || "Circuit"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Surface:</span>
                      <span className="text-white">{selectedTrack.surface || "Asphalt"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Direction:</span>
                      <span className="text-white">{selectedTrack.direction || "Clockwise"}</span>
                    </div>
                    {selectedTrack.sectors && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sectors:</span>
                        <span className="text-white">{selectedTrack.sectors.length}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Track Analysis */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-white">Track Analysis</h4>
                  <div className="space-y-3">
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">Track Difficulty</span>
                        <span className="text-yellow-400 font-medium">Medium</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">Technical Sections</span>
                        <span className="text-blue-400 font-medium">3</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        High-speed corners, chicanes, and elevation changes
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">Overtaking Opportunities</span>
                        <span className="text-green-400 font-medium">Good</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Multiple braking zones and long straights
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <Button
                  onClick={handleStartSession}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Session
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowTrackSelector(true)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Change Track
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Track Display */}
        {selectedTrack && !showTrackSelector && !showTrackConfiguration && (
          <Card className="bg-gray-800 border-gray-700 mb-8">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-blue-400" />
                  <div>
                    <h3 className="font-semibold text-white">{selectedTrack.name}</h3>
                    <p className="text-sm text-gray-400">
                      {selectedTrack.city}, {selectedTrack.country} • 
                      {selectedTrack.length ? ` ${(selectedTrack.length / 1000).toFixed(2)} km` : ` ${selectedTrack.length} km`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTrackSelector(true)}
                  className="text-gray-400 border-gray-600"
                >
                  Change Track
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Racing Modes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {racingModes.map((mode) => {
            const IconComponent = mode.icon;
            return (
              <Card
                key={mode.id}
                className="bg-gray-800 border-gray-700 cursor-pointer transition-all hover:border-blue-400 hover:bg-gray-750 hover:scale-105"
                onClick={() => handleModeSelect(mode.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${mode.color}`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    {mode.badge && (
                      <Badge className="bg-blue-500 text-white text-xs">
                        {mode.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-white text-xl">{mode.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">{mode.description}</p>
                  <div className="space-y-2">
                    {mode.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Upload className="h-8 w-8 text-green-400" />
                <div>
                  <h3 className="font-semibold text-white">Upload Session</h3>
                  <p className="text-sm text-gray-400">Import previous racing data</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-400" />
                <div>
                  <h3 className="font-semibold text-white">Session Analysis</h3>
                  <p className="text-sm text-gray-400">Review past performance</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Settings className="h-8 w-8 text-purple-400" />
                <div>
                  <h3 className="font-semibold text-white">Settings</h3>
                  <p className="text-sm text-gray-400">Configure your preferences</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModeSelection;