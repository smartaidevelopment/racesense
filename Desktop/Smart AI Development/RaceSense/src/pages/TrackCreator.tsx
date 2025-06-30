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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
            Create Custom Track
          </h1>
          <p className="text-gray-400 text-lg">
            Design your own racing circuit using Google Maps
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-3">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-400" />
                    Google Map - Interactive Track Design
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={isDrawing ? "default" : "outline"}
                      size="sm"
                      onClick={isDrawing ? handleStopDrawing : handleStartDrawing}
                      className={isDrawing ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {isDrawing ? "Stop Drawing" : "Start Drawing"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomIn}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomOut}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCenterMap}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Crosshair className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={mapTypeId === "satellite" ? "default" : "outline"}
                      size="sm"
                      onClick={handleToggleMapType}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      {mapTypeId === "satellite" ? "Satellite" : "Map"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSectors(!showSectors)}
                      className={showSectors ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                    >
                      <Timer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearTrack}
                      className="text-red-400 border-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Interactive Google Map */}
                <div
                  ref={mapRef}
                  className="w-full h-96 rounded-lg border border-gray-600 relative overflow-hidden"
                  style={{ zIndex: 1 }}
                />
                
                {/* Drawing Mode Indicator */}
                {isDrawing && (
                  <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
                    Drawing Mode: Track Points
                  </div>
                )}

                {/* Instructions */}
                {!isDrawing && track.points.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none z-10">
                    <div className="text-center bg-black/50 p-6 rounded-lg">
                      <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-semibold text-white">Google Map Ready</p>
                      <p className="text-sm text-gray-300 mb-4">Click "Start Drawing" to begin creating your track</p>
                      <div className="text-xs text-gray-400 space-y-1">
                        <p>• Navigate to any location in the world</p>
                        <p>• Click on the map to add track points</p>
                        <p>• Use zoom controls for precise placement</p>
                        <p>• Add timing sectors for detailed analysis</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Track Creation Progress */}
                {track.points.length > 0 && (
                  <div className="absolute top-4 right-4 bg-black/70 p-3 rounded-lg text-white text-sm z-10">
                    <div className="font-semibold mb-1">Track Progress</div>
                    <div className="space-y-1 text-xs">
                      <div>Points: {track.points.length}</div>
                      <div>Length: {(track.length / 1000).toFixed(2)} km</div>
                      <div>Sectors: {track.sectors.length}</div>
                      <div>Zoom: {zoom}</div>
                    </div>
                  </div>
                )}

                {/* Track Statistics */}
                <div className="mt-4 grid grid-cols-4 gap-4">
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {track.points.length}
                    </div>
                    <div className="text-gray-400 text-sm">Points</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {(track.length / 1000).toFixed(2)}
                    </div>
                    <div className="text-gray-400 text-sm">Length (km)</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {track.sectors.length}
                    </div>
                    <div className="text-gray-400 text-sm">Sectors</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {track.points.filter(p => p.type === "start" || p.type === "finish").length}
                    </div>
                    <div className="text-gray-400 text-sm">Timing Lines</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                <TabsTrigger value="info" className="text-white">Info</TabsTrigger>
                <TabsTrigger value="points" className="text-white">Points</TabsTrigger>
                <TabsTrigger value="sectors" className="text-white">Sectors</TabsTrigger>
              </TabsList>

              {/* Track Information Tab */}
              <TabsContent value="info" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Settings className="h-5 w-5 text-purple-400" />
                      Track Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="trackName" className="text-gray-300">Track Name</Label>
                      <Input
                        id="trackName"
                        value={track.name}
                        onChange={(e) => setTrack(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter track name"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="trackCity" className="text-gray-300">City</Label>
                      <Input
                        id="trackCity"
                        value={track.city}
                        onChange={(e) => setTrack(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Enter city"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="trackCountry" className="text-gray-300">Country</Label>
                      <Input
                        id="trackCountry"
                        value={track.country}
                        onChange={(e) => setTrack(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="Enter country"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="trackSurface" className="text-gray-300">Surface</Label>
                      <select
                        id="trackSurface"
                        value={track.surface}
                        onChange={(e) => setTrack(prev => ({ ...prev, surface: e.target.value as any }))}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2"
                      >
                        <option value="asphalt">Asphalt</option>
                        <option value="concrete">Concrete</option>
                        <option value="dirt">Dirt</option>
                        <option value="gravel">Gravel</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="trackDirection" className="text-gray-300">Direction</Label>
                      <select
                        id="trackDirection"
                        value={track.direction}
                        onChange={(e) => setTrack(prev => ({ ...prev, direction: e.target.value as any }))}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2"
                      >
                        <option value="clockwise">Clockwise</option>
                        <option value="counterclockwise">Counter-clockwise</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Points Tab */}
              <TabsContent value="points" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-400" />
                      Track Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2 mb-4">
                      <Button
                        variant={currentMode === "draw" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentMode("draw")}
                        className="flex-1"
                      >
                        <Circle className="h-4 w-4 mr-1" />
                        Points
                      </Button>
                      <Button
                        variant={currentMode === "start-finish" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentMode("start-finish")}
                        className="flex-1"
                      >
                        <Flag className="h-4 w-4 mr-1" />
                        Start/Finish
                      </Button>
                    </div>

                    {track.points.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No points added yet</p>
                        <p className="text-sm">Start drawing to add track points</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {track.points.map((point, index) => (
                          <div
                            key={point.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedPoint?.id === point.id
                                ? "bg-blue-600 border-blue-400"
                                : "bg-gray-700 border-gray-600 hover:bg-gray-650"
                            }`}
                            onClick={() => setSelectedPoint(point)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  point.type === "start" ? "bg-green-500" :
                                  point.type === "finish" ? "bg-red-500" :
                                  point.type === "sector" ? "bg-yellow-500" :
                                  "bg-blue-500"
                                }`} />
                                <span className="text-sm font-medium">{point.name}</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removePoint(point.id);
                                }}
                                className="text-red-400 border-red-400 hover:bg-red-400/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
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
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Settings className="h-5 w-5 text-blue-400" />
                        Edit Point
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="pointName" className="text-gray-300">Point Name</Label>
                        <Input
                          id="pointName"
                          value={selectedPoint.name || ""}
                          onChange={(e) => updatePoint(selectedPoint.id, { name: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pointType" className="text-gray-300">Point Type</Label>
                        <select
                          id="pointType"
                          value={selectedPoint.type}
                          onChange={(e) => updatePoint(selectedPoint.id, { type: e.target.value as any })}
                          className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2"
                        >
                          <option value="corner">Corner</option>
                          <option value="straight">Straight</option>
                          <option value="start">Start/Finish</option>
                          <option value="finish">Finish Line</option>
                          <option value="sector">Sector</option>
                          <option value="checkpoint">Checkpoint</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">Lat:</span>
                          <div className="text-white">{selectedPoint.lat.toFixed(6)}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Lng:</span>
                          <div className="text-white">{selectedPoint.lng.toFixed(6)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Sectors Tab */}
              <TabsContent value="sectors" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Timer className="h-5 w-5 text-yellow-400" />
                      Timing Sectors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-gray-400 mb-4">
                      Select two points to create a timing sector between them
                    </div>

                    {track.sectors.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        <Timer className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No sectors defined yet</p>
                        <p className="text-sm">Create sectors for detailed timing analysis</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {track.sectors.map((sector) => (
                          <div key={sector.id} className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-white">{sector.name}</span>
                              <Badge className="bg-yellow-500 text-black text-xs">
                                {(sector.length / 1000).toFixed(2)} km
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-400">
                              From: {sector.startPoint.name}<br />
                              To: {sector.endPoint.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {track.points.length >= 2 && (
                      <div className="space-y-2">
                        <Label className="text-gray-300">Create New Sector</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <select className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm">
                            <option value="">Start Point</option>
                            {track.points.map((point) => (
                              <option key={point.id} value={point.id}>
                                {point.name}
                              </option>
                            ))}
                          </select>
                          <select className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm">
                            <option value="">End Point</option>
                            {track.points.map((point) => (
                              <option key={point.id} value={point.id}>
                                {point.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
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
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 space-y-3">
                <Button
                  onClick={handleSaveTrack}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={track.points.length < 3 || !track.name || !track.city || !track.country}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Track
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/mode-selection")}
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
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