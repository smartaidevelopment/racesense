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
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"points" | "sectors" | "none">("none");
  const [selectedSector, setSelectedSector] = useState<any>(null);
  const [sectorMarkersRef, setSectorMarkersRef] = useState<any[]>([]);
  const [showInstructions, setShowInstructions] = useState(true);

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
        console.log("Map clicked:", { isDrawing, dragMode, latLng: e.latLng });
        if (isDrawing && e.latLng && dragMode === "none") {
          console.log("Adding point at:", e.latLng.lat(), e.latLng.lng());
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
        draggable: dragMode === "points",
        icon: {
          // @ts-ignore
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: point.type === "start" ? "#10b981" : 
                    point.type === "finish" ? "#ef4444" : 
                    point.type === "sector" ? "#f59e0b" : "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      // Add drag listeners
      // @ts-ignore
      marker.addListener("dragstart", () => {
        setIsDragging(true);
        setSelectedPoint(point);
      });

      // @ts-ignore
      marker.addListener("dragend", (e: any) => {
        setIsDragging(false);
        if (e.latLng) {
          updatePoint(point.id, {
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          });
        }
      });

      // @ts-ignore
      marker.addListener("click", () => {
        setSelectedPoint(point);
        if (dragMode === "none") {
          setSelectedPoint(point);
        }
      });

      markersRef.current.push(marker);
    });

    // Update sector markers
    updateSectorMarkers();

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
      track.points.forEach(point => bounds.extend({ lat: point.lat, lng: point.lng }));
      mapInstanceRef.current!.fitBounds(bounds);
    }
  }, [track.points, dragMode]);

  // Update markers when drag mode changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    // Update existing markers draggable state
    markersRef.current.forEach(marker => {
      marker.setDraggable(dragMode === "points");
    });
    
    // Update sector markers
    updateSectorMarkers();
  }, [dragMode]);

  // Debug drawing state changes
  useEffect(() => {
    console.log("Drawing state changed:", { isDrawing, dragMode });
  }, [isDrawing, dragMode]);

  // Update sector markers
  const updateSectorMarkers = () => {
    if (!mapInstanceRef.current) return;
    
    // Remove old sector markers
    sectorMarkersRef.forEach(m => m.setMap(null));
    const newSectorMarkers: any[] = [];

    track.sectors.forEach((sector, idx) => {
      // Start point marker
      // @ts-ignore
      const startMarker = new window.google.maps.Marker({
        position: { lat: sector.startPoint.lat, lng: sector.startPoint.lng },
        map: mapInstanceRef.current!,
        label: `S${idx + 1}S`,
        title: `Sector ${idx + 1} Start`,
        draggable: dragMode === "sectors",
        icon: {
          // @ts-ignore
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: "#f59e0b",
          fillOpacity: 0.8,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      // End point marker
      // @ts-ignore
      const endMarker = new window.google.maps.Marker({
        position: { lat: sector.endPoint.lat, lng: sector.endPoint.lng },
        map: mapInstanceRef.current!,
        label: `S${idx + 1}E`,
        title: `Sector ${idx + 1} End`,
        draggable: dragMode === "sectors",
        icon: {
          // @ts-ignore
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: "#f59e0b",
          fillOpacity: 0.8,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      // Add drag listeners for sector markers
      // @ts-ignore
      startMarker.addListener("dragstart", () => {
        setIsDragging(true);
        setSelectedSector({ ...sector, isStart: true });
      });

      // @ts-ignore
      startMarker.addListener("dragend", (e: any) => {
        setIsDragging(false);
        if (e.latLng) {
          updateSectorPosition(sector.id, "start", e.latLng.lat(), e.latLng.lng());
        }
      });

      // @ts-ignore
      endMarker.addListener("dragstart", () => {
        setIsDragging(true);
        setSelectedSector({ ...sector, isStart: false });
      });

      // @ts-ignore
      endMarker.addListener("dragend", (e: any) => {
        setIsDragging(false);
        if (e.latLng) {
          updateSectorPosition(sector.id, "end", e.latLng.lat(), e.latLng.lng());
        }
      });

      newSectorMarkers.push(startMarker, endMarker);
    });

    setSectorMarkersRef(newSectorMarkers);
  };

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
    console.log("addPoint called with:", lat, lng);
    const newPoint: TrackPoint = {
      id: Date.now().toString(),
      lat,
      lng,
      type: "corner",
      name: `Point ${track.points.length + 1}`,
      order: track.points.length,
    };
    console.log("New point:", newPoint);
    setTrack(prev => {
      const newTrack = { ...prev, points: [...prev.points, newPoint] };
      console.log("Updated track:", newTrack);
      return newTrack;
    });
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
      points: prev.points.map(p => p.id === pointId ? { ...p, ...updates } : p)
    }));
  };

  const updateSectorPosition = (sectorId: number, position: "start" | "end", lat: number, lng: number) => {
    setTrack(prev => ({
      ...prev,
      sectors: prev.sectors.map(sector => {
        if (sector.id === sectorId) {
          const updatedSector = { ...sector };
          if (position === "start") {
            updatedSector.startPoint = { ...sector.startPoint, lat, lng };
          } else {
            updatedSector.endPoint = { ...sector.endPoint, lat, lng };
          }
          // Recalculate sector length
          updatedSector.length = calculateDistance(
            updatedSector.startPoint.lat,
            updatedSector.startPoint.lng,
            updatedSector.endPoint.lat,
            updatedSector.endPoint.lng
          );
          return updatedSector;
        }
        return sector;
      })
    }));
  };

  const toggleDragMode = (mode: "points" | "sectors" | "none") => {
    setDragMode(mode);
    
    // If activating drag mode, disable drawing mode
    if (mode !== "none" && isDrawing) {
      setIsDrawing(false);
      notify({
        type: "info",
        title: "Drawing Mode Disabled",
        message: "Drawing mode has been disabled to enable drag mode",
      });
    }
    
    if (mode === "none") {
      setIsDragging(false);
      setSelectedPoint(null);
      setSelectedSector(null);
      notify({
        type: "info",
        title: "Drag Mode Disabled",
        message: "Drag functionality has been disabled",
      });
    } else if (mode === "points") {
      notify({
        type: "info",
        title: "Drag Points Mode Active",
        message: "You can now drag track points to reposition them",
      });
    } else if (mode === "sectors") {
      notify({
        type: "info",
        title: "Drag Sectors Mode Active",
        message: "You can now drag sector start/end points to adjust sectors",
      });
    }
    
    // Update markers to reflect new drag mode
    if (mapInstanceRef.current) {
      // Update existing markers
      markersRef.current.forEach(marker => {
        marker.setDraggable(mode === "points");
      });
      
      // Update sector markers
      updateSectorMarkers();
    }
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
    console.log("handleStartDrawing called");
    // Disable drag mode when starting drawing
    if (dragMode !== "none") {
      setDragMode("none");
      notify({
        type: "info",
        title: "Drag Mode Disabled",
        message: "Drag mode has been disabled to enable drawing mode",
      });
    }
    setIsDrawing(true);
    console.log("Drawing mode set to true");
    notify({
      type: "info",
      title: "Drawing Mode Active",
      message: "Click on the map to add track points",
    });
  };

  const handleStopDrawing = () => {
    setIsDrawing(false);
    notify({
      type: "info",
      title: "Drawing Mode Disabled",
      message: "Drawing mode has been disabled",
    });
  };

  const clearTrack = () => {
    setTrack(prev => ({ 
      ...prev, 
      points: [], 
      sectors: [],
      length: 0 
    }));
    setSelectedPoint(null);
    setShowInstructions(true); // Show instructions again when track is cleared
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
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg w-fit">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Create Custom Track
              </h1>
              <p className="text-gray-400 text-base sm:text-lg mt-1">
                Design your own racing circuit using Google Maps
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-blue-400">{track.points.length}</div>
              <div className="text-blue-300 text-xs sm:text-sm font-medium">Track Points</div>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-green-400">{(track.length / 1000).toFixed(2)}</div>
              <div className="text-green-300 text-xs sm:text-sm font-medium">Length (km)</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-yellow-400">{track.sectors.length}</div>
              <div className="text-yellow-300 text-xs sm:text-sm font-medium">Sectors</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-purple-400">
                {track.points.filter(p => p.type === "start" || p.type === "finish").length}
              </div>
              <div className="text-purple-300 text-xs sm:text-sm font-medium">Timing Lines</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Map Section */}
          <div className="lg:col-span-3">
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Globe className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-semibold">Interactive Track Design</div>
                      <div className="text-xs sm:text-sm text-gray-400">Click on the map to add track points</div>
                    </div>
                  </div>
                  
                  {/* Map Controls */}
                  <div className="flex flex-wrap gap-2">
                    {/* Primary Controls */}
                    <div className="flex gap-2">
                      <Button
                        variant={isDrawing ? "default" : "outline"}
                        size="sm"
                        onClick={isDrawing ? handleStopDrawing : handleStartDrawing}
                        className={`${
                          isDrawing 
                            ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25" 
                            : dragMode !== "none"
                            ? "border-orange-500 text-orange-400 hover:bg-orange-500/10"
                            : "border-gray-600 text-gray-300 hover:bg-gray-700/50"
                        } transition-all duration-200 text-xs sm:text-sm`}
                      >
                        {isDrawing ? (
                          <>
                            <Square className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Stop Drawing</span>
                            <span className="sm:hidden">Stop</span>
                          </>
                        ) : (
                          <>
                            <Circle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Start Drawing</span>
                            <span className="sm:hidden">Start</span>
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Navigation Controls */}
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleZoomIn}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700/50 transition-all duration-200"
                        title="Zoom In"
                      >
                        <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleZoomOut}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700/50 transition-all duration-200"
                        title="Zoom Out"
                      >
                        <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCenterMap}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700/50 transition-all duration-200"
                        title="Center Map"
                      >
                        <Crosshair className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                    
                    {/* Drag Controls */}
                    <div className="flex gap-1">
                      <Button
                        variant={dragMode === "points" ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDragMode(dragMode === "points" ? "none" : "points")}
                        className={`${
                          dragMode === "points"
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                            : "border-gray-600 text-gray-300 hover:bg-gray-700/50"
                        } transition-all duration-200`}
                        title="Drag Points"
                        disabled={track.points.length === 0}
                      >
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Drag Points</span>
                        <span className="sm:hidden">Points</span>
                      </Button>
                      
                      <Button
                        variant={dragMode === "sectors" ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDragMode(dragMode === "sectors" ? "none" : "sectors")}
                        className={`${
                          dragMode === "sectors"
                            ? "bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg shadow-yellow-500/25"
                            : "border-gray-600 text-gray-300 hover:bg-gray-700/50"
                        } transition-all duration-200`}
                        title="Drag Sectors"
                        disabled={track.sectors.length === 0}
                      >
                        <Timer className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Drag Sectors</span>
                        <span className="sm:hidden">Sectors</span>
                      </Button>
                    </div>
                    
                    {/* Secondary Controls */}
                    <div className="flex gap-1">
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
                        <Globe className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">{mapTypeId === "satellite" ? "Satellite" : "Map"}</span>
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
                        <Timer className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearTrack}
                        className="text-red-400 border-red-400/50 hover:bg-red-400/10 transition-all duration-200"
                        title="Clear Track"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-0">
                {/* Interactive Google Map */}
                <div
                  ref={mapRef}
                  className="w-full h-[300px] sm:h-[400px] lg:h-[500px] rounded-b-lg border-t border-gray-700/50 relative overflow-hidden"
                  style={{ zIndex: 1 }}
                />
                
                {/* Mode Indicators */}
                {isDrawing && (
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-gradient-to-r from-green-600 to-green-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium z-10 shadow-lg shadow-green-500/25 animate-pulse">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-ping" />
                      <span className="hidden sm:inline">Drawing Mode Active</span>
                      <span className="sm:hidden">Drawing</span>
                    </div>
                  </div>
                )}

                {dragMode === "points" && (
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium z-10 shadow-lg shadow-blue-500/25 animate-pulse">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-ping" />
                      <span className="hidden sm:inline">Drag Points Mode</span>
                      <span className="sm:hidden">Drag Points</span>
                    </div>
                  </div>
                )}

                {dragMode === "sectors" && (
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium z-10 shadow-lg shadow-yellow-500/25 animate-pulse">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-ping" />
                      <span className="hidden sm:inline">Drag Sectors Mode</span>
                      <span className="sm:hidden">Drag Sectors</span>
                    </div>
                  </div>
                )}

                {isDragging && (
                  <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium z-10 shadow-lg shadow-orange-500/25">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-ping" />
                      <span className="hidden sm:inline">Dragging...</span>
                      <span className="sm:hidden">Drag</span>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {!isDrawing && track.points.length === 0 && showInstructions && (
                  <div className="absolute bottom-4 left-4 right-4 z-10">
                    <div className="text-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-700/50 max-w-sm mx-auto relative">
                      {/* Dismiss Button */}
                      <button
                        onClick={() => setShowInstructions(false)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white transition-colors duration-200 pointer-events-auto"
                        title="Dismiss instructions"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-full">
                          <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                        </div>
                        <h3 className="text-sm sm:text-base font-semibold text-white">Ready to Create Your Track</h3>
                      </div>
                      <p className="text-gray-300 text-xs sm:text-sm mb-2">Click "Start Drawing" to begin creating your custom racing circuit</p>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                          <span>Navigate to any location worldwide</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                          <span>Click to add track points</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                          <span>Drag points and sectors to adjust positions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show Instructions Button */}
                {!isDrawing && track.points.length === 0 && !showInstructions && (
                  <div className="absolute bottom-4 left-4 z-10">
                    <button
                      onClick={() => setShowInstructions(true)}
                      className="bg-black/80 backdrop-blur-sm p-2 rounded-lg border border-gray-700/50 text-white text-xs hover:bg-black/90 transition-colors duration-200 pointer-events-auto"
                      title="Show instructions"
                    >
                      <div className="flex items-center gap-1.5">
                        <Info className="h-3 w-3" />
                        <span>Show Help</span>
                      </div>
                    </button>
                  </div>
                )}

                {/* Track Creation Progress */}
                {track.points.length > 0 && (
                  <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/80 backdrop-blur-sm p-2 sm:p-4 rounded-lg sm:rounded-xl border border-gray-700/50 text-white text-xs sm:text-sm z-10">
                    <div className="font-semibold mb-2 sm:mb-3 text-blue-400">Track Progress</div>
                    <div className="space-y-1 sm:space-y-2 text-xs">
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
          <div className="space-y-4 sm:space-y-6">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700/50 p-1 rounded-lg">
                <TabsTrigger value="info" className="text-white data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 rounded-md transition-all duration-200 text-xs sm:text-sm">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Info</span>
                </TabsTrigger>
                <TabsTrigger value="points" className="text-white data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 rounded-md transition-all duration-200 text-xs sm:text-sm">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Points</span>
                </TabsTrigger>
                <TabsTrigger value="sectors" className="text-white data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 rounded-md transition-all duration-200 text-xs sm:text-sm">
                  <Timer className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Sectors</span>
                </TabsTrigger>
              </TabsList>

              {/* Track Information Tab */}
              <TabsContent value="info" className="space-y-4">
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                      </div>
                      <span className="text-sm sm:text-base">Track Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="trackName" className="text-gray-300 font-medium text-sm">Track Name</Label>
                      <Input
                        id="trackName"
                        value={track.name}
                        onChange={(e) => setTrack(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter track name"
                        className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="trackCity" className="text-gray-300 font-medium text-sm">City</Label>
                        <Input
                          id="trackCity"
                          value={track.city}
                          onChange={(e) => setTrack(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Enter city"
                          className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="trackCountry" className="text-gray-300 font-medium text-sm">Country</Label>
                        <Input
                          id="trackCountry"
                          value={track.country}
                          onChange={(e) => setTrack(prev => ({ ...prev, country: e.target.value }))}
                          placeholder="Enter country"
                          className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="trackSurface" className="text-gray-300 font-medium text-sm">Surface</Label>
                        <select
                          id="trackSurface"
                          value={track.surface}
                          onChange={(e) => setTrack(prev => ({ ...prev, surface: e.target.value as any }))}
                          className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-md px-3 py-2 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200 text-sm"
                        >
                          <option value="asphalt">Asphalt</option>
                          <option value="concrete">Concrete</option>
                          <option value="dirt">Dirt</option>
                          <option value="gravel">Gravel</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="trackDirection" className="text-gray-300 font-medium text-sm">Direction</Label>
                        <select
                          id="trackDirection"
                          value={track.direction}
                          onChange={(e) => setTrack(prev => ({ ...prev, direction: e.target.value as any }))}
                          className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-md px-3 py-2 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200 text-sm"
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
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                      </div>
                      <span className="text-sm sm:text-base">Track Points</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2 mb-4">
                      <Button
                        variant={currentMode === "draw" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentMode("draw")}
                        className={`flex-1 text-xs sm:text-sm ${
                          currentMode === "draw"
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                            : "border-gray-600 text-gray-300 hover:bg-gray-700/50"
                        } transition-all duration-200`}
                      >
                        <Circle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Points</span>
                        <span className="sm:hidden">Draw</span>
                      </Button>
                      <Button
                        variant={currentMode === "start-finish" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentMode("start-finish")}
                        className={`flex-1 text-xs sm:text-sm ${
                          currentMode === "start-finish"
                            ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25"
                            : "border-gray-600 text-gray-300 hover:bg-gray-700/50"
                        } transition-all duration-200`}
                      >
                        <Flag className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Start/Finish</span>
                        <span className="sm:hidden">Start</span>
                      </Button>
                    </div>

                    {track.points.length === 0 ? (
                      <div className="text-center text-gray-400 py-6 sm:py-8">
                        <div className="p-3 sm:p-4 bg-gray-700/30 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                          <MapPin className="h-6 w-6 sm:h-8 sm:w-8 opacity-50" />
                        </div>
                        <p className="font-medium text-sm sm:text-base">No points added yet</p>
                        <p className="text-xs sm:text-sm text-gray-500">Start drawing to add track points</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                        {track.points.map((point, index) => (
                          <div
                            key={point.id}
                            className={`p-2 sm:p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                              selectedPoint?.id === point.id
                                ? "bg-blue-600/20 border-blue-400/50 shadow-lg shadow-blue-500/25"
                                : "bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50 hover:border-gray-500/50"
                            }`}
                            onClick={() => setSelectedPoint(point)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                                  point.type === "start" ? "bg-green-500 shadow-lg shadow-green-500/50" :
                                  point.type === "finish" ? "bg-red-500 shadow-lg shadow-red-500/50" :
                                  point.type === "sector" ? "bg-yellow-500 shadow-lg shadow-yellow-500/50" :
                                  "bg-blue-500 shadow-lg shadow-blue-500/50"
                                }`} />
                                <span className="text-xs sm:text-sm font-medium text-white">{point.name || `Point ${index + 1}`}</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removePoint(point.id);
                                }}
                                className="text-red-400 border-red-400/50 hover:bg-red-400/10 transition-all duration-200 p-1 sm:p-2"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-xs text-gray-400 mt-1 sm:mt-2 font-mono">
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
                          <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                        </div>
                        <span className="text-sm sm:text-base">Edit Point</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="pointName" className="text-gray-300 font-medium text-sm">Point Name</Label>
                        <Input
                          id="pointName"
                          value={selectedPoint.name || ""}
                          onChange={(e) => updatePoint(selectedPoint.id, { name: e.target.value })}
                          className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pointType" className="text-gray-300 font-medium text-sm">Point Type</Label>
                        <select
                          id="pointType"
                          value={selectedPoint.type}
                          onChange={(e) => updatePoint(selectedPoint.id, { type: e.target.value as any })}
                          className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-md px-3 py-2 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200 text-sm"
                        >
                          <option value="corner">Corner</option>
                          <option value="straight">Straight</option>
                          <option value="start">Start/Finish</option>
                          <option value="finish">Finish Line</option>
                          <option value="sector">Sector</option>
                          <option value="checkpoint">Checkpoint</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 p-2 sm:p-3 bg-gray-700/30 rounded-lg">
                        <div>
                          <span className="text-gray-400 text-xs sm:text-sm font-medium">Latitude:</span>
                          <div className="text-white font-mono text-xs sm:text-sm">{selectedPoint.lat.toFixed(6)}</div>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs sm:text-sm font-medium">Longitude:</span>
                          <div className="text-white font-mono text-xs sm:text-sm">{selectedPoint.lng.toFixed(6)}</div>
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
                        <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                      </div>
                      <span className="text-sm sm:text-base">Timing Sectors</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-xs sm:text-sm text-gray-400 mb-4 p-2 sm:p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                        <span className="font-medium text-blue-300 text-xs sm:text-sm">How to create sectors</span>
                      </div>
                      Select two points below to create a timing sector between them
                    </div>

                    {track.sectors.length === 0 ? (
                      <div className="text-center text-gray-400 py-6 sm:py-8">
                        <div className="p-3 sm:p-4 bg-gray-700/30 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                          <Timer className="h-6 w-6 sm:h-8 sm:w-8 opacity-50" />
                        </div>
                        <p className="font-medium text-sm sm:text-base">No sectors defined yet</p>
                        <p className="text-xs sm:text-sm text-gray-500">Create sectors for detailed timing analysis</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-36 sm:max-h-48 overflow-y-auto">
                        {track.sectors.map((sector) => (
                          <div key={sector.id} className="p-2 sm:p-3 bg-gray-700/30 rounded-lg border border-gray-600/50 hover:bg-gray-700/50 transition-all duration-200">
                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                              <span className="font-medium text-white text-xs sm:text-sm">{sector.name}</span>
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
                      <div className="space-y-3 p-3 sm:p-4 bg-gray-700/20 rounded-lg border border-gray-600/30">
                        <Label className="text-gray-300 font-medium text-sm">Create New Sector</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <select className="bg-gray-700/50 border border-gray-600/50 text-white rounded-md px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm focus:border-yellow-500/50 focus:ring-yellow-500/20 transition-all duration-200">
                            <option value="">Start Point</option>
                            {track.points.map((point) => (
                              <option key={point.id} value={point.id}>
                                {point.name || `Point ${point.order + 1}`}
                              </option>
                            ))}
                          </select>
                          <select className="bg-gray-700/50 border border-gray-600/50 text-white rounded-md px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm focus:border-yellow-500/50 focus:ring-yellow-500/20 transition-all duration-200">
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
                          className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 transition-all duration-200 text-xs sm:text-sm"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Create Sector
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Drag Help */}
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Info className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                  </div>
                  <span className="text-sm sm:text-base">Drag Controls</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs sm:text-sm text-gray-300 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-blue-400">Drag Points:</span>
                      <span className="text-gray-400"> Click "Drag Points" button, then drag any track point to reposition it</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-yellow-400">Drag Sectors:</span>
                      <span className="text-gray-400"> Click "Drag Sectors" button, then drag sector start/end markers</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-green-400">Drawing Mode:</span>
                      <span className="text-gray-400"> Click "Start Drawing" to add new points by clicking on the map</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-purple-400">Visual Feedback:</span>
                      <span className="text-gray-400"> Active modes show colored indicators on the map</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <Button
                  onClick={handleSaveTrack}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg shadow-green-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  disabled={track.points.length < 3 || !track.name || !track.city || !track.country}
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Save Track
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/mode-selection")}
                  className="w-full border-gray-600/50 text-gray-300 hover:bg-gray-700/50 transition-all duration-200 text-sm sm:text-base"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Mode Selection</span>
                  <span className="sm:hidden">Back</span>
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