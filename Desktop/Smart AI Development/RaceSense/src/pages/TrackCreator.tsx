import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Ruler,
  Flag,
  Timer,
  Navigation,
  Layers,
  Settings,
  CheckCircle,
  AlertCircle,
  Play,
  Square,
  Circle,
  Minus,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Globe,
  ArrowLeft,
  Info,
} from "lucide-react";
import { useNotifications } from "@/components/RacingNotifications";
import { Loader } from "@googlemaps/js-api-loader";
import { Toggle } from "@/components/ui/toggle";

// TODO: Insert your Google Maps API key below
const GOOGLE_MAPS_API_KEY = "AIzaSyA5ondxplwoNnMztrYiYnr2Gs8Uwm-8MLk";

interface TrackPoint {
  id: string;
  lat: number;
  lng: number;
  elevation?: number;
  type: "start" | "finish" | "sector" | "corner" | "straight" | "checkpoint";
  name?: string;
  order: number;
}

interface CustomTrack {
  id: string;
  name: string;
  city: string;
  country: string;
  points: TrackPoint[];
  length: number;
  direction: "clockwise" | "counterclockwise";
  surface: "asphalt" | "concrete" | "dirt" | "gravel";
  sectors: {
    id: number;
    name: string;
    startPoint: TrackPoint;
    endPoint: TrackPoint;
    length: number;
  }[];
  createdAt: string;
}

const TrackCreator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useNotifications();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  
  const [track, setTrack] = useState<CustomTrack>({
    id: "",
    name: "",
    city: "",
    country: "",
    points: [],
    length: 0,
    direction: "clockwise",
    surface: "asphalt",
    sectors: [],
    createdAt: new Date().toISOString(),
  });
  
  const [currentMode, setCurrentMode] = useState<"draw" | "edit" | "sector" | "start-finish">("draw");
  const [selectedPoint, setSelectedPoint] = useState<TrackPoint | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showSectors, setShowSectors] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: 60.1699, lng: 24.9384 }); // Helsinki
  const [zoom, setZoom] = useState(12);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite'>("roadmap");

  // Load Google Maps
  useEffect(() => {
    if (!mapRef.current) return;
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
    });
    loader.load().then(() => {
      if (!mapRef.current) return;
      // @ts-ignore
      const map = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: zoom,
        mapTypeId: mapTypeId,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapInstanceRef.current = map;
      // Map click to add points
      // @ts-ignore
      map.addListener("click", (e: any) => {
        if (isDrawing && e.latLng) {
          addPoint(e.latLng.lat(), e.latLng.lng());
        }
      });
      // Zoom/center listeners
      // @ts-ignore
      map.addListener("zoom_changed", () => setZoom(map.getZoom() || 12));
      // @ts-ignore
      map.addListener("center_changed", () => {
        // @ts-ignore
        const c = map.getCenter();
        if (c) setMapCenter({ lat: c.lat(), lng: c.lng() });
      });
    });
    // Cleanup
    return () => {
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line
  }, [mapTypeId]);

  // Check if we have a custom track from track creator
  useEffect(() => {
    if (location.state?.customTrack) {
      setTrack(location.state.customTrack);
      notify({
        type: "success",
        title: "Custom Track Loaded",
        message: `${location.state.customTrack.name} is ready for your session`,
      });
    }
  }, [location.state, notify]);

  // Check if we're editing an existing track
  useEffect(() => {
    if (location.state?.editTrack) {
      setTrack(location.state.editTrack);
      notify({
        type: "info",
        title: "Editing Track",
        message: `Editing ${location.state.editTrack.name}`,
      });
    }
  }, [location.state, notify]);

  // Update markers and polyline when points change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // Remove old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    // Add new markers
    track.points.forEach((point, idx) => {
      // @ts-ignore
      const marker = new window.google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: mapInstanceRef.current!,
        label: `${idx + 1}`,
        title: point.name || `Point ${idx + 1}`,
      });
      markersRef.current.push(marker);
    });
    // Draw polyline
    if (polylineRef.current) polylineRef.current.setMap(null);
    if (track.points.length > 1) {
      // @ts-ignore
      polylineRef.current = new window.google.maps.Polyline({
        path: track.points.map(p => ({ lat: p.lat, lng: p.lng })),
        geodesic: true,
        strokeColor: "#3b82f6",
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: mapInstanceRef.current!,
      });
    }
    // Fit bounds
    if (track.points.length > 0) {
      // @ts-ignore
      const bounds = new window.google.maps.LatLngBounds();
      track.points.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [track.points]);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate total track length
  const calculateTrackLength = (points: TrackPoint[]): number => {
    if (points.length < 2) return 0;
    
    let totalLength = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalLength += calculateDistance(
        points[i].lat, points[i].lng,
        points[i + 1].lat, points[i + 1].lng
      );
    }
    
    // Add distance from last point to first point to complete the circuit
    if (points.length > 2) {
      totalLength += calculateDistance(
        points[points.length - 1].lat, points[points.length - 1].lng,
        points[0].lat, points[0].lng
      );
    }
    
    return totalLength;
  };

  // Add point
  const addPoint = (lat: number, lng: number) => {
    const newPoint: TrackPoint = {
      id: Date.now().toString(),
      lat,
      lng,
      type: "corner",
      name: `Point ${track.points.length + 1}`,
      order: track.points.length,
    };
    setTrack(prev => ({ ...prev, points: [...prev.points, newPoint] }));
    notify({
      type: "racing",
      title: "Point Added",
      message: `Added point at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    });
  };

  // Remove point from track
  const removePoint = (pointId: string) => {
    setTrack(prev => {
      const newPoints = prev.points.filter(p => p.id !== pointId);
      const newLength = calculateTrackLength(newPoints);
      return {
        ...prev,
        points: newPoints,
        length: newLength,
      };
    });

    if (selectedPoint?.id === pointId) {
      setSelectedPoint(null);
    }
  };

  // Update point properties
  const updatePoint = (pointId: string, updates: Partial<TrackPoint>) => {
    setTrack(prev => ({
      ...prev,
      points: prev.points.map(p => 
        p.id === pointId ? { ...p, ...updates } : p
      ),
    }));
  };

  // Create sector between two points
  const createSector = (startPointId: string, endPointId: string) => {
    const startPoint = track.points.find(p => p.id === startPointId);
    const endPoint = track.points.find(p => p.id === endPointId);
    
    if (!startPoint || !endPoint) return;

    const sectorLength = calculateDistance(startPoint.lat, startPoint.lng, endPoint.lat, endPoint.lng);
    
    setTrack(prev => ({
      ...prev,
      sectors: [...prev.sectors, {
        id: prev.sectors.length + 1,
        name: `Sector ${prev.sectors.length + 1}`,
        startPoint,
        endPoint,
        length: sectorLength,
      }],
    }));

    notify({
      type: "racing",
      title: "Sector Created",
      message: `Sector ${track.sectors.length + 1} created: ${(sectorLength / 1000).toFixed(2)} km`,
    });
  };

  // Save track
  const handleSaveTrack = () => {
    if (!track.name || !track.city || !track.country) {
      notify({
        type: "error",
        title: "Missing Information",
        message: "Please fill in track name, city, and country",
      });
      return;
    }

    if (track.points.length < 3) {
      notify({
        type: "error",
        title: "Insufficient Points",
        message: "Track must have at least 3 points to be valid",
      });
      return;
    }

    const finalTrack = {
      ...track,
      id: track.id || Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    const savedTracks = JSON.parse(localStorage.getItem("customTracks") || "[]");
    const existingIndex = savedTracks.findIndex((t: CustomTrack) => t.id === finalTrack.id);
    
    if (existingIndex >= 0) {
      savedTracks[existingIndex] = finalTrack;
    } else {
      savedTracks.push(finalTrack);
    }
    
    localStorage.setItem("customTracks", JSON.stringify(savedTracks));

    notify({
      type: "success",
      title: "Track Saved",
      message: `${track.name} has been saved successfully`,
    });

    // Navigate back to mode selection with the new track
    navigate("/mode-selection", { 
      state: { 
        customTrack: finalTrack,
        mode: location.state?.mode 
      } 
    });
  };

  // Drawing controls
  const handleStartDrawing = () => {
    setIsDrawing(true);
    notify({
      type: "info",
      title: "Drawing Mode Active",
      message: "Click on the map to add track points",
    });
  };

  const handleStopDrawing = () => {
    setIsDrawing(false);
  };

  const clearTrack = () => {
    setTrack(prev => ({ 
      ...prev, 
      points: [], 
      sectors: [],
      length: 0 
    }));
    setSelectedPoint(null);
    notify({
      type: "warning",
      title: "Track Cleared",
      message: "All track points and sectors have been removed",
    });
  };

  // Map controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 12) + 1);
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 12) - 1);
  };

  const handleCenterMap = () => {
    if (mapInstanceRef.current && track.points.length > 0) {
      // @ts-ignore
      const bounds = new window.google.maps.LatLngBounds();
      track.points.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  // Add a function to toggle map type
  const handleToggleMapType = () => {
    setMapTypeId((prev) => (prev === "roadmap" ? "satellite" : "roadmap"));
    if (mapInstanceRef.current) {
      // @ts-ignore
      mapInstanceRef.current.setMapTypeId(mapTypeId === "roadmap" ? "satellite" : "roadmap");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Create Custom Track
              </h1>
              <p className="text-gray-400 text-lg mt-1">
                Design your own racing circuit using Google Maps
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-400">{track.points.length}</div>
              <div className="text-blue-300 text-sm font-medium">Track Points</div>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-400">{(track.length / 1000).toFixed(2)}</div>
              <div className="text-green-300 text-sm font-medium">Length (km)</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-yellow-400">{track.sectors.length}</div>
              <div className="text-yellow-300 text-sm font-medium">Sectors</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-purple-400">
                {track.points.filter(p => p.type === "start" || p.type === "finish").length}
              </div>
              <div className="text-purple-300 text-sm font-medium">Timing Lines</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Map Section */}
          <div className="lg:col-span-3">
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Globe className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">Interactive Track Design</div>
                      <div className="text-sm text-gray-400">Click on the map to add track points</div>
                    </div>
                  </div>
                  
                  {/* Map Controls */}
                  <div className="flex gap-2">
                    <Button
                      variant={isDrawing ? "default" : "outline"}
                      size="sm"
                      onClick={isDrawing ? handleStopDrawing : handleStartDrawing}
                      className={`${
                        isDrawing 
                          ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25" 
                          : "border-gray-600 text-gray-300 hover:bg-gray-700/50"
                      } transition-all duration-200`}
                    >
                      {isDrawing ? (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          Stop Drawing
                        </>
                      ) : (
                        <>
                          <Circle className="h-4 w-4 mr-2" />
                          Start Drawing
                        </>
                      )}
                    </Button>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleZoomIn}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700/50 transition-all duration-200"
                        title="Zoom In"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleZoomOut}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700/50 transition-all duration-200"
                        title="Zoom Out"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCenterMap}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700/50 transition-all duration-200"
                        title="Center Map"
                      >
                        <Crosshair className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button
                      variant={mapTypeId === "satellite" ? "default" : "outline"}
                      size="sm"
                      onClick={handleToggleMapType}
                      className={`${
                        mapTypeId === "satellite"
                          ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/25"
                          : "border-gray-600 text-gray-300 hover:bg-gray-700/50"
                      } transition-all duration-200`}
                      title="Toggle Map Type"
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      {mapTypeId === "satellite" ? "Satellite" : "Map"}
                    </Button>
                    
                    <Button
                      variant={showSectors ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowSectors(!showSectors)}
                      className={`${
                        showSectors
                          ? "bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg shadow-yellow-500/25"
                          : "border-gray-600 text-gray-300 hover:bg-gray-700/50"
                      } transition-all duration-200`}
                      title="Toggle Sectors"
                    >
                      <Timer className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearTrack}
                      className="text-red-400 border-red-400/50 hover:bg-red-400/10 transition-all duration-200"
                      title="Clear Track"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-0">
                {/* Interactive Google Map */}
                <div
                  ref={mapRef}
                  className="w-full h-[500px] rounded-b-lg border-t border-gray-700/50 relative overflow-hidden"
                  style={{ zIndex: 1 }}
                />
                
                {/* Drawing Mode Indicator */}
                {isDrawing && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-2 rounded-full text-sm font-medium z-10 shadow-lg shadow-green-500/25 animate-pulse">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                      Drawing Mode Active
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {!isDrawing && track.points.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none z-10">
                    <div className="text-center bg-black/60 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50 max-w-md">
                      <div className="p-4 bg-blue-500/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <Globe className="h-10 w-10 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-3">Ready to Create Your Track</h3>
                      <p className="text-gray-300 mb-6">Click "Start Drawing" to begin creating your custom racing circuit</p>
                      <div className="text-sm text-gray-400 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          <span>Navigate to any location worldwide</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          <span>Click to add track points</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                          <span>Use zoom for precise placement</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full" />
                          <span>Add timing sectors for analysis</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Track Creation Progress */}
                {track.points.length > 0 && (
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50 text-white text-sm z-10">
                    <div className="font-semibold mb-3 text-blue-400">Track Progress</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Points:</span>
                        <span className="text-blue-400 font-medium">{track.points.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Length:</span>
                        <span className="text-green-400 font-medium">{(track.length / 1000).toFixed(2)} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sectors:</span>
                        <span className="text-yellow-400 font-medium">{track.sectors.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Zoom:</span>
                        <span className="text-purple-400 font-medium">{zoom}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700/50 p-1 rounded-lg">
                <TabsTrigger value="info" className="text-white data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 rounded-md transition-all duration-200">
                  <Settings className="h-4 w-4 mr-2" />
                  Info
                </TabsTrigger>
                <TabsTrigger value="points" className="text-white data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 rounded-md transition-all duration-200">
                  <MapPin className="h-4 w-4 mr-2" />
                  Points
                </TabsTrigger>
                <TabsTrigger value="sectors" className="text-white data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 rounded-md transition-all duration-200">
                  <Timer className="h-4 w-4 mr-2" />
                  Sectors
                </TabsTrigger>
              </TabsList>

              {/* Track Information Tab */}
              <TabsContent value="info" className="space-y-4">
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Settings className="h-5 w-5 text-purple-400" />
                      </div>
                      Track Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="trackName" className="text-gray-300 font-medium">Track Name</Label>
                      <Input
                        id="trackName"
                        value={track.name}
                        onChange={(e) => setTrack(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter track name"
                        className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="trackCity" className="text-gray-300 font-medium">City</Label>
                        <Input
                          id="trackCity"
                          value={track.city}
                          onChange={(e) => setTrack(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Enter city"
                          className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <Label htmlFor="trackCountry" className="text-gray-300 font-medium">Country</Label>
                        <Input
                          id="trackCountry"
                          value={track.country}
                          onChange={(e) => setTrack(prev => ({ ...prev, country: e.target.value }))}
                          placeholder="Enter country"
                          className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="trackSurface" className="text-gray-300 font-medium">Surface</Label>
                        <select
                          id="trackSurface"
                          value={track.surface}
                          onChange={(e) => setTrack(prev => ({ ...prev, surface: e.target.value as any }))}
                          className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-md px-3 py-2 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200"
                        >
                          <option value="asphalt">Asphalt</option>
                          <option value="concrete">Concrete</option>
                          <option value="dirt">Dirt</option>
                          <option value="gravel">Gravel</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="trackDirection" className="text-gray-300 font-medium">Direction</Label>
                        <select
                          id="trackDirection"
                          value={track.direction}
                          onChange={(e) => setTrack(prev => ({ ...prev, direction: e.target.value as any }))}
                          className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-md px-3 py-2 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200"
                        >
                          <option value="clockwise">Clockwise</option>
                          <option value="counterclockwise">Counter-clockwise</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Points Tab */}
              <TabsContent value="points" className="space-y-4">
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <MapPin className="h-5 w-5 text-blue-400" />
                      </div>
                      Track Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2 mb-4">
                      <Button
                        variant={currentMode === "draw" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentMode("draw")}
                        className={`flex-1 ${
                          currentMode === "draw"
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                            : "border-gray-600 text-gray-300 hover:bg-gray-700/50"
                        } transition-all duration-200`}
                      >
                        <Circle className="h-4 w-4 mr-2" />
                        Points
                      </Button>
                      <Button
                        variant={currentMode === "start-finish" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentMode("start-finish")}
                        className={`flex-1 ${
                          currentMode === "start-finish"
                            ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25"
                            : "border-gray-600 text-gray-300 hover:bg-gray-700/50"
                        } transition-all duration-200`}
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        Start/Finish
                      </Button>
                    </div>

                    {track.points.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        <div className="p-4 bg-gray-700/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <MapPin className="h-8 w-8 opacity-50" />
                        </div>
                        <p className="font-medium">No points added yet</p>
                        <p className="text-sm text-gray-500">Start drawing to add track points</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {track.points.map((point, index) => (
                          <div
                            key={point.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                              selectedPoint?.id === point.id
                                ? "bg-blue-600/20 border-blue-400/50 shadow-lg shadow-blue-500/25"
                                : "bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50 hover:border-gray-500/50"
                            }`}
                            onClick={() => setSelectedPoint(point)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  point.type === "start" ? "bg-green-500 shadow-lg shadow-green-500/50" :
                                  point.type === "finish" ? "bg-red-500 shadow-lg shadow-red-500/50" :
                                  point.type === "sector" ? "bg-yellow-500 shadow-lg shadow-yellow-500/50" :
                                  "bg-blue-500 shadow-lg shadow-blue-500/50"
                                }`} />
                                <span className="text-sm font-medium text-white">{point.name || `Point ${index + 1}`}</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removePoint(point.id);
                                }}
                                className="text-red-400 border-red-400/50 hover:bg-red-400/10 transition-all duration-200"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-xs text-gray-400 mt-2 font-mono">
                              {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Point Editor */}
                {selectedPoint && (
                  <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <Settings className="h-5 w-5 text-blue-400" />
                        </div>
                        Edit Point
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="pointName" className="text-gray-300 font-medium">Point Name</Label>
                        <Input
                          id="pointName"
                          value={selectedPoint.name || ""}
                          onChange={(e) => updatePoint(selectedPoint.id, { name: e.target.value })}
                          className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pointType" className="text-gray-300 font-medium">Point Type</Label>
                        <select
                          id="pointType"
                          value={selectedPoint.type}
                          onChange={(e) => updatePoint(selectedPoint.id, { type: e.target.value as any })}
                          className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-md px-3 py-2 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200"
                        >
                          <option value="corner">Corner</option>
                          <option value="straight">Straight</option>
                          <option value="start">Start/Finish</option>
                          <option value="finish">Finish Line</option>
                          <option value="sector">Sector</option>
                          <option value="checkpoint">Checkpoint</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-700/30 rounded-lg">
                        <div>
                          <span className="text-gray-400 text-sm font-medium">Latitude:</span>
                          <div className="text-white font-mono text-sm">{selectedPoint.lat.toFixed(6)}</div>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm font-medium">Longitude:</span>
                          <div className="text-white font-mono text-sm">{selectedPoint.lng.toFixed(6)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Sectors Tab */}
              <TabsContent value="sectors" className="space-y-4">
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <Timer className="h-5 w-5 text-yellow-400" />
                      </div>
                      Timing Sectors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-gray-400 mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Info className="h-4 w-4 text-blue-400" />
                        <span className="font-medium text-blue-300">How to create sectors</span>
                      </div>
                      Select two points below to create a timing sector between them
                    </div>

                    {track.sectors.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        <div className="p-4 bg-gray-700/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <Timer className="h-8 w-8 opacity-50" />
                        </div>
                        <p className="font-medium">No sectors defined yet</p>
                        <p className="text-sm text-gray-500">Create sectors for detailed timing analysis</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {track.sectors.map((sector) => (
                          <div key={sector.id} className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/50 hover:bg-gray-700/50 transition-all duration-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-white">{sector.name}</span>
                              <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs">
                                {(sector.length / 1000).toFixed(2)} km
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-400 space-y-1">
                              <div>From: <span className="text-white">{sector.startPoint.name}</span></div>
                              <div>To: <span className="text-white">{sector.endPoint.name}</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {track.points.length >= 2 && (
                      <div className="space-y-3 p-4 bg-gray-700/20 rounded-lg border border-gray-600/30">
                        <Label className="text-gray-300 font-medium">Create New Sector</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <select className="bg-gray-700/50 border border-gray-600/50 text-white rounded-md px-3 py-2 text-sm focus:border-yellow-500/50 focus:ring-yellow-500/20 transition-all duration-200">
                            <option value="">Start Point</option>
                            {track.points.map((point) => (
                              <option key={point.id} value={point.id}>
                                {point.name || `Point ${point.order + 1}`}
                              </option>
                            ))}
                          </select>
                          <select className="bg-gray-700/50 border border-gray-600/50 text-white rounded-md px-3 py-2 text-sm focus:border-yellow-500/50 focus:ring-yellow-500/20 transition-all duration-200">
                            <option value="">End Point</option>
                            {track.points.map((point) => (
                              <option key={point.id} value={point.id}>
                                {point.name || `Point ${point.order + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 transition-all duration-200"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Sector
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <Button
                  onClick={handleSaveTrack}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg shadow-green-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={track.points.length < 3 || !track.name || !track.city || !track.country}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Track
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/mode-selection")}
                  className="w-full border-gray-600/50 text-gray-300 hover:bg-gray-700/50 transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Mode Selection
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackCreator; 