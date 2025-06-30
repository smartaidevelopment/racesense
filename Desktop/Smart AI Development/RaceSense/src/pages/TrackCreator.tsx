import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "@googlemaps/js-api-loader";
import { Timer, Trash2, Plus, Globe, Save, ArrowLeft, Info } from "lucide-react";
import { useNotifications } from "@/components/RacingNotifications";

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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const sectorMarkersRef = useRef<any[]>([]);
  const sectorsCountRef = useRef<number>(0);

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
      map.addListener("zoom_changed", () => setZoom(map.getZoom() || 12));
      map.addListener("center_changed", () => {
        const c = map.getCenter();
        if (c) setMapCenter({ lat: c.lat(), lng: c.lng() });
      });
    });
    return () => { mapInstanceRef.current = null; };
  }, []);

  // Map click: add sector
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // @ts-ignore
    const clickListener = mapInstanceRef.current.addListener("click", (e: any) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
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
        notify({ type: "success", title: "Sector Added", message: `Added sector at ${lat.toFixed(6)}, ${lng.toFixed(6)}` });
      }
    });
    return () => {
      if (mapInstanceRef.current) {
        // @ts-ignore
        window.google.maps.event.removeListener(clickListener);
      }
    };
  }, []); // Remove dependency on track.sectors.length

  // Update sector markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // Remove old markers
    sectorMarkersRef.current.forEach(m => m.setMap(null));
    const newSectorMarkers: any[] = [];
    track.sectors.forEach((sector, idx) => {
      // Start marker
      // @ts-ignore
      const startMarker = new window.google.maps.Marker({
        position: { lat: sector.startPoint.lat, lng: sector.startPoint.lng },
        map: showSectors ? mapInstanceRef.current! : null,
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
      // End marker
      // @ts-ignore
      const endMarker = new window.google.maps.Marker({
        position: { lat: sector.endPoint.lat, lng: sector.endPoint.lng },
        map: showSectors ? mapInstanceRef.current! : null,
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
      // Drag listeners
      startMarker.addListener("dragend", (e: any) => {
        if (e.latLng) updateSectorPosition(sector.id, "start", e.latLng.lat(), e.latLng.lng());
      });
      endMarker.addListener("dragend", (e: any) => {
        if (e.latLng) updateSectorPosition(sector.id, "end", e.latLng.lat(), e.latLng.lng());
      });
      newSectorMarkers.push(startMarker, endMarker);
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

  // Save track (dummy, just notifies)
  const handleSaveTrack = () => {
    if (!track.name || !track.city || !track.country) {
      notify({ type: "error", title: "Missing Information", message: "Please fill in track name, city, and country" });
      return;
    }
    notify({ type: "success", title: "Track Saved", message: `${track.name} has been saved successfully` });
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
                      <div className="text-yellow-400 text-lg font-semibold mb-2">Click to Add Sectors</div>
                      <div className="text-gray-300 text-sm">
                        Click anywhere on the map to create your first sector
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Control Panel */}
          <div className="space-y-4 sm:space-y-6">
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
                        {track.sectors.map((sector) => (
                          <div key={sector.id} className="p-2 sm:p-3 bg-gray-700/30 rounded-lg border border-gray-600/50 hover:bg-gray-700/50 transition-all duration-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white text-xs sm:text-sm">{sector.name}</span>
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
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span>From: <span className="text-white">{sector.startPoint.name}</span></span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                <span>To: <span className="text-white">{sector.endPoint.name}</span></span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                                <span>Length: <span className="text-white">{(sector.length / 1000).toFixed(2)} km</span></span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <Button
                  onClick={handleSaveTrack}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg shadow-green-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  disabled={!track.name || !track.city || !track.country}
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Save Track
                </Button>
                <Button
                  variant="outline"
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