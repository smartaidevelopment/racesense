import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "@googlemaps/js-api-loader";
import { Timer, Trash2, Plus, Globe, Save, ArrowLeft, Info, Flag, MapPin } from "lucide-react";
import { useNotifications } from "@/components/RacingNotifications";
import { useNavigate } from "react-router-dom";

const GOOGLE_MAPS_API_KEY = "AIzaSyA5ondxplwoNnMztrYiYnr2Gs8Uwm-8MLk";

interface SectorPoint {
  id: string;
  lat: number;
  lng: number;
  name?: string;
}

interface CustomTrack {
  id: string;
  name: string;
  city: string;
  country: string;
  sectors: {
    id: number;
    name: string;
    startPoint: SectorPoint;
    endPoint: SectorPoint;
    length: number;
  }[];
  direction: "clockwise" | "counterclockwise";
  surface: "asphalt" | "concrete" | "dirt" | "gravel";
  createdAt: string;
}

const TrackCreator: React.FC = () => {
  const { notify } = useNotifications();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const sectorMarkersRef = useRef<any[]>([]);
  const sectorsCountRef = useRef<number>(0);
  const currentLocationMarkerRef = useRef<any>(null);

  const [track, setTrack] = useState<CustomTrack>({
    id: "",
    name: "",
    city: "",
    country: "",
    sectors: [],
    direction: "clockwise",
    surface: "asphalt",
    createdAt: new Date().toISOString(),
  });
  const [showSectors, setShowSectors] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: 60.1699, lng: 24.9384 });
  const [zoom, setZoom] = useState(12);
  const [dragMode, setDragMode] = useState<"sectors" | "none">("none");
  const [isDragging, setIsDragging] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [trackName, setTrackName] = useState("");

  // Update sectors count ref whenever sectors change
  useEffect(() => {
    sectorsCountRef.current = track.sectors.length;
  }, [track.sectors.length]);

  // Load Google Maps
  useEffect(() => {
    if (!mapRef.current) return;
    const loader = new Loader({ apiKey: GOOGLE_MAPS_API_KEY, version: "weekly" });
    loader.load().then(() => {
      if (!mapRef.current) return;
      // @ts-ignore
      const map = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: zoom,
        mapTypeId: "roadmap",
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapInstanceRef.current = map;
      
      // Add map event listeners
      map.addListener("zoom_changed", () => setZoom(map.getZoom() || 12));
      map.addListener("center_changed", () => {
        const c = map.getCenter();
        if (c) setMapCenter({ lat: c.lat(), lng: c.lng() });
      });
      
      // Add click listener for adding sectors
      // @ts-ignore
      const clickListener = map.addListener("click", (e: any) => {
        console.log("Map clicked!", e); // Debug log
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          const currentSectorsCount = sectorsCountRef.current;
          console.log("Adding sector at:", lat, lng, "count:", currentSectorsCount); // Debug log
          const newPoint: SectorPoint = {
            id: Date.now().toString(),
            lat,
            lng,
            name: `Sector Point ${currentSectorsCount * 2 + 1}`,
          };
          const newSector = {
            id: currentSectorsCount + 1,
            name: `Sector ${currentSectorsCount + 1}`,
            startPoint: newPoint,
            endPoint: { ...newPoint, id: (Date.now() + 1).toString() },
            length: 0,
          };
          setTrack(prev => ({ ...prev, sectors: [...prev.sectors, newSector] }));
          notify({ type: "success", title: "Sector Added", message: `Added sector at ${lat.toFixed(6)}, ${lng.toFixed(6)}` });
        }
      });
      
      setMapReady(true);
      console.log("Map loaded and click listener attached"); // Debug log
    }).catch((error) => {
      console.error("Failed to load Google Maps:", error);
    });
    
    return () => { 
      mapInstanceRef.current = null; 
      setMapReady(false);
    };
  }, []);



  // Add start/finish line at map center
  const addStartFinishAtCenter = () => {
    if (!mapInstanceRef.current) return;
    const center = mapInstanceRef.current.getCenter();
    if (center) {
      const lat = center.lat();
      const lng = center.lng();
      const currentSectorsCount = sectorsCountRef.current;
      const newPoint: SectorPoint = {
        id: Date.now().toString(),
        lat,
        lng,
        name: `Start/Finish Line`,
      };
      const newSector = {
        id: currentSectorsCount + 1,
        name: `Start/Finish Line`,
        startPoint: newPoint,
        endPoint: { ...newPoint, id: (Date.now() + 1).toString() },
        length: 0,
      };
      setTrack(prev => ({ ...prev, sectors: [...prev.sectors, newSector] }));
      notify({ type: "success", title: "Start/Finish Added", message: `Added start/finish line at center: ${lat.toFixed(6)}, ${lng.toFixed(6)}` });
    }
  };

  // Add sector at map center
  const addSectorAtMapCenter = () => {
    if (!mapInstanceRef.current) return;
    const center = mapInstanceRef.current.getCenter();
    if (center) {
      const lat = center.lat();
      const lng = center.lng();
      const currentSectorsCount = sectorsCountRef.current;
      const newPoint: SectorPoint = {
        id: Date.now().toString(),
        lat,
        lng,
        name: `Sector Point ${currentSectorsCount * 2 + 1}`,
      };
      const newSector = {
        id: currentSectorsCount + 1,
        name: `Sector ${currentSectorsCount + 1}`,
        startPoint: newPoint,
        endPoint: { ...newPoint, id: (Date.now() + 1).toString() },
        length: 0,
      };
      setTrack(prev => ({ ...prev, sectors: [...prev.sectors, newSector] }));
      notify({ type: "success", title: "Sector Added", message: `Added sector at center: ${lat.toFixed(6)}, ${lng.toFixed(6)}` });
    }
  };



  // Get current location and center map
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      notify({ type: "error", title: "Geolocation Not Supported", message: "Your browser doesn't support geolocation" });
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        
        setCurrentLocation(newLocation);
        
        // Center map on current location
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(newLocation);
          mapInstanceRef.current.setZoom(15); // Closer zoom for current location
        }
        
        // Add current location marker
        if (mapInstanceRef.current && currentLocationMarkerRef.current) {
          currentLocationMarkerRef.current.setMap(null); // Remove existing marker
        }
        
        if (mapInstanceRef.current) {
          // @ts-ignore
          const marker = new window.google.maps.Marker({
            position: newLocation,
            map: mapInstanceRef.current,
            title: "Your Current Location",
            icon: {
              // @ts-ignore
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#3b82f6",
              fillOpacity: 0.8,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
          currentLocationMarkerRef.current = marker;
        }
        
        setLocationLoading(false);
        notify({ 
          type: "success", 
          title: "Location Found", 
          message: `Centered map on your location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}` 
        });
      },
      (error) => {
        setLocationLoading(false);
        let errorMessage = "Failed to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please allow location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        notify({ type: "error", title: "Location Error", message: errorMessage });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Update sector markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // Remove old markers
    sectorMarkersRef.current.forEach(m => m.setMap(null));
    const newSectorMarkers: any[] = [];
    
    // Define colors for sectors
    const sectorColors = [
      "#3B82F6", // Blue
      "#10B981", // Green
      "#F59E0B", // Yellow
      "#EF4444", // Red
      "#8B5CF6", // Purple
      "#06B6D4", // Cyan
      "#F97316", // Orange
      "#EC4899", // Pink
    ];
    
    track.sectors.forEach((sector, idx) => {
      const isStartFinish = sector.name.toLowerCase().includes('start/finish') || sector.name.toLowerCase().includes('start finish');
      const color = isStartFinish ? "#FF0000" : sectorColors[idx % sectorColors.length];
      
      // Create a line for every sector
      // @ts-ignore
      const sectorLine = new window.google.maps.Polyline({
        path: [
          { lat: sector.startPoint.lat, lng: sector.startPoint.lng },
          { lat: sector.endPoint.lat, lng: sector.endPoint.lng }
        ],
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 1.0,
        strokeWeight: isStartFinish ? 4 : 3,
        map: showSectors ? mapInstanceRef.current! : null,
      });
      
      // Add start marker
      // @ts-ignore
      const startMarker = new window.google.maps.Marker({
        position: { lat: sector.startPoint.lat, lng: sector.startPoint.lng },
        map: showSectors ? mapInstanceRef.current! : null,
        label: isStartFinish ? "S" : `S${idx + 1}S`,
        title: isStartFinish ? "Start/Finish Line Start" : `Sector ${idx + 1} Start`,
        draggable: dragMode === "sectors",
        icon: {
          // @ts-ignore
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isStartFinish ? 4 : 6,
          fillColor: color,
          fillOpacity: 0.8,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      
      // Add end marker
      // @ts-ignore
      const endMarker = new window.google.maps.Marker({
        position: { lat: sector.endPoint.lat, lng: sector.endPoint.lng },
        map: showSectors ? mapInstanceRef.current! : null,
        label: isStartFinish ? "F" : `S${idx + 1}E`,
        title: isStartFinish ? "Start/Finish Line Finish" : `Sector ${idx + 1} End`,
        draggable: dragMode === "sectors",
        icon: {
          // @ts-ignore
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isStartFinish ? 4 : 6,
          fillColor: color,
          fillOpacity: 0.8,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      
      // Drag listeners
      startMarker.addListener("dragend", (e: any) => {
        if (e.latLng) {
          updateSectorPosition(sector.id, "start", e.latLng.lat(), e.latLng.lng());
          // Update the line path
          sectorLine.setPath([
            { lat: e.latLng.lat(), lng: e.latLng.lng() },
            { lat: sector.endPoint.lat, lng: sector.endPoint.lng }
          ]);
        }
      });
      
      endMarker.addListener("dragend", (e: any) => {
        if (e.latLng) {
          updateSectorPosition(sector.id, "end", e.latLng.lat(), e.latLng.lng());
          // Update the line path
          sectorLine.setPath([
            { lat: sector.startPoint.lat, lng: sector.startPoint.lng },
            { lat: e.latLng.lat(), lng: e.latLng.lng() }
          ]);
        }
      });
      
      newSectorMarkers.push(sectorLine, startMarker, endMarker);
    });
    sectorMarkersRef.current = newSectorMarkers;
  }, [track.sectors, dragMode, showSectors]);

  // Update sector position
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

    // Update the sector line
    const sector = track.sectors.find(s => s.id === sectorId);
    if (sector) {
      // Find the polyline in the markers array and update it
      const polylineIndex = sectorMarkersRef.current.findIndex(marker => 
        // @ts-ignore
        marker instanceof window.google.maps.Polyline
      );
      if (polylineIndex !== -1) {
        const polyline = sectorMarkersRef.current[polylineIndex];
        const newStartPoint = position === "start" ? { lat, lng } : sector.startPoint;
        const newEndPoint = position === "end" ? { lat, lng } : sector.endPoint;
        polyline.setPath([newStartPoint, newEndPoint]);
      }
    }
  };

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Remove sector
  const removeSector = (sectorId: number) => {
    setTrack(prev => ({ ...prev, sectors: prev.sectors.filter(s => s.id !== sectorId) }));
    notify({ type: "warning", title: "Sector Removed", message: "Sector has been removed from the track" });
  };

  // Toggle drag mode
  const toggleDragMode = (mode: "sectors" | "none") => {
    setDragMode(mode);
    setIsDragging(false);
    notify({
      type: "info",
      title: mode === "sectors" ? "Drag Sectors Mode Active" : "Drag Mode Disabled",
      message: mode === "sectors" ? "You can now drag sector start/end points to adjust sectors" : "Drag functionality has been disabled",
    });
  };

  // Navigate back to mode selection
  const handleBackToModeSelection = () => {
    navigate('/mode-selection');
  };

  // Save track (dummy, just notifies)
  const handleSaveTrack = () => {
    if (!trackName.trim()) {
      notify({ type: "error", title: "Missing Track Name", message: "Please enter a name for your track" });
      return;
    }
    if (track.sectors.length === 0) {
      notify({ type: "error", title: "No Sectors", message: "Please add at least one sector to your track" });
      return;
    }
    
    const trackToSave = {
      ...track,
      id: Date.now().toString(),
      name: trackName.trim(),
      createdAt: new Date().toISOString(),
    };
    
    // In a real app, you would save to a database here
    console.log("Saving track:", trackToSave);
    
    // For now, save to localStorage
    try {
      const savedTracks = JSON.parse(localStorage.getItem('racesense_tracks') || '[]');
      savedTracks.push(trackToSave);
      localStorage.setItem('racesense_tracks', JSON.stringify(savedTracks));
      
      notify({ 
        type: "success", 
        title: "Track Saved Successfully", 
        message: `"${trackName}" has been saved with ${track.sectors.length} sectors` 
      });
      
      // Reset form
      setTrackName("");
      setTrack(prev => ({
        ...prev,
        id: "",
        name: "",
        city: "",
        country: "",
        sectors: [],
        createdAt: new Date().toISOString(),
      }));
    } catch (error) {
      notify({ type: "error", title: "Save Failed", message: "Failed to save track. Please try again." });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg w-fit">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Create Custom Track (Sectors Only)
              </h1>
              <p className="text-gray-400 text-base sm:text-lg mt-1">
                Design your own racing circuit sectors using Google Maps
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-yellow-400">{track.sectors.length}</div>
              <div className="text-yellow-300 text-xs sm:text-sm font-medium">Sectors</div>
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
                      <div className="text-base sm:text-lg font-semibold">Interactive Sector Design</div>
                      <div className="text-xs sm:text-sm text-gray-400">Click on the map to add sectors</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={dragMode === "sectors" ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDragMode(dragMode === "sectors" ? "none" : "sectors")}
                      className={`$${dragMode === "sectors" ? "bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg shadow-yellow-500/25" : "border-gray-600 text-gray-300 hover:bg-gray-700/50"} transition-all duration-200`}
                      title="Drag Sectors"
                      disabled={track.sectors.length === 0}
                    >
                      <Timer className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Drag Sectors</span>
                      <span className="sm:hidden">Sectors</span>
                    </Button>
                    <Button
                      variant={showSectors ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowSectors(!showSectors)}
                      className={`$${showSectors ? "bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg shadow-yellow-500/25" : "border-gray-600 text-gray-300 hover:bg-gray-700/50"} transition-all duration-200`}
                      title="Toggle Sectors"
                    >
                      <Timer className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                                          <Button
                        variant="outline"
                        size="sm"
                      onClick={getCurrentLocation}
                      className="border-blue-600/50 text-blue-400 hover:bg-blue-400/10 transition-all duration-200"
                      title="Get Current Location"
                      disabled={!mapReady || locationLoading}
                    >
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">{locationLoading ? "Loading..." : "Location"}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                      onClick={addStartFinishAtCenter}
                      className="border-green-600/50 text-green-400 hover:bg-green-400/10 transition-all duration-200"
                      title="Add Start/Finish at Center"
                      disabled={!mapReady}
                      >
                        <Flag className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Start/Finish</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                      onClick={addSectorAtMapCenter}
                      className="border-yellow-600/50 text-yellow-400 hover:bg-yellow-400/10 transition-all duration-200"
                      title="Add Sector at Center"
                      disabled={!mapReady}
                      >
                        <Timer className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Add Sector</span>
                      </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div
                  ref={mapRef}
                  className="w-full h-[300px] sm:h-[400px] lg:h-[500px] rounded-b-lg border-t border-gray-700/50 relative overflow-hidden"
                  style={{ zIndex: 1, cursor: dragMode === "sectors" ? 'move' : 'crosshair' }}
                />
                {track.sectors.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 text-center max-w-sm mx-4">
                      <div className="text-yellow-400 text-lg font-semibold mb-2">
                        {mapReady ? "Click to Add Sectors" : "Loading Map..."}
                      </div>
                      <div className="text-gray-300 text-sm">
                        {mapReady 
                          ? "Click anywhere on the map or use the 'Add Sector' button"
                          : "Please wait while the map loads..."
                        }
                      </div>
                      {mapReady && (
                        <div className="mt-3 text-xs text-green-400">
                          ✓ Map ready - Click to add sectors or use Quick Actions
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Control Panel */}
          <div className="space-y-4 sm:space-y-6">
            {/* Track Name Input */}
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Save className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                  </div>
                  <span className="text-sm sm:text-base">Track Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Track Name *</label>
                  <Input
                    type="text"
                    placeholder="Enter track name..."
                    value={trackName}
                    onChange={(e) => setTrackName(e.target.value)}
                    className="bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-green-500/50"
                  />
                </div>
                <Button
                  onClick={handleSaveTrack}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg shadow-green-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                  disabled={!trackName.trim() || track.sectors.length === 0}
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Save Track</span>
                  <span className="sm:hidden">Save</span>
                </Button>
              </CardContent>
            </Card>

                        {/* Quick Actions Info */}
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                      </div>
                  <span className="text-sm sm:text-base">Quick Actions</span>
                    </CardTitle>
                  </CardHeader>
              <CardContent className="space-y-3">
                                <div className="text-xs text-gray-400 text-center">
                  Use the buttons in the map controls above to add sectors and start/finish lines
                              </div>
                  </CardContent>
                </Card>

            <Tabs defaultValue="sectors" className="w-full">
              <TabsList className="grid w-full grid-cols-1 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700/50 p-1 rounded-lg">
                <TabsTrigger value="sectors" className="text-white data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 rounded-md transition-all duration-200 text-xs sm:text-sm">
                  <Timer className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Sectors</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="sectors" className="space-y-4">
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                      </div>
                      <span className="text-sm sm:text-base">Timing Sectors ({track.sectors.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {track.sectors.length === 0 ? (
                      <div className="text-center text-gray-400 py-6 sm:py-8">
                        <div className="p-3 sm:p-4 bg-gray-700/30 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                          <Timer className="h-6 w-6 sm:h-8 sm:w-8 opacity-50" />
                        </div>
                        <p className="font-medium text-sm sm:text-base">No sectors defined yet</p>
                        <p className="text-xs sm:text-sm text-gray-500">Click on the map to add sectors</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                        {track.sectors.map((sector) => {
                          const isStartFinish = sector.name.toLowerCase().includes('start/finish') || sector.name.toLowerCase().includes('start finish');
                          return (
                            <div key={sector.id} className={`p-2 sm:p-3 rounded-lg border transition-all duration-200 ${
                              isStartFinish 
                                ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20' 
                                : 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium text-xs sm:text-sm ${
                                    isStartFinish ? 'text-red-400' : 'text-white'
                                  }`}>
                                    {sector.name}
                                  </span>
                                  {isStartFinish && (
                                    <Flag className="h-3 w-3 text-red-400" />
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeSector(sector.id)}
                                    className="text-red-400 border-red-400/50 hover:bg-red-400/10 transition-all duration-200 p-1 sm:p-2"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="text-xs text-gray-400 space-y-1">
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${
                                    isStartFinish ? 'bg-red-500' : 'bg-green-500'
                                  }`} />
                                  <span>From: <span className="text-white">{sector.startPoint.name}</span></span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${
                                    isStartFinish ? 'bg-red-500' : 'bg-red-500'
                                  }`} />
                                  <span>To: <span className="text-white">{sector.endPoint.name}</span></span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${
                                    isStartFinish ? 'bg-red-500' : 'bg-yellow-500'
                                  }`} />
                                  <span>Length: <span className="text-white">{(sector.length / 1000).toFixed(2)} km</span></span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <Button
                  variant="outline"
                  onClick={handleBackToModeSelection}
                  className="w-full border-gray-600/50 text-gray-300 hover:bg-gray-700/50 transition-all duration-200 text-xs sm:text-sm"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
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