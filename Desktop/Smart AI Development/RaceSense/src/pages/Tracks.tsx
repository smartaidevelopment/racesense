// Comprehensive racing tracks browser for RaceSense
// Professional track database with search, filtering, and detailed information

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  MapPin,
  Clock,
  Ruler,
  Mountain,
  Flag,
  Trophy,
  Calendar,
  Globe,
  Filter,
  SortAsc,
  SortDesc,
  Map,
  Info,
  Star,
  Users,
  Plus,
} from "lucide-react";

import { RacingTrack, TrackSearchFilters } from "../types/track";
import trackService from "../services/TrackService";
import { useNotifications } from "@/components/RacingNotifications";

const TracksPage: React.FC = () => {
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const [tracks, setTracks] = useState<RacingTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<TrackSearchFilters>({});
  const [sortBy, setSortBy] = useState<"name" | "length" | "established">(
    "name",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedTrack, setSelectedTrack] = useState<RacingTrack | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Load tracks and apply search/filtering
  useEffect(() => {
    const results = trackService.searchTracks(searchQuery, filters, {
      sortBy,
      sortOrder,
    });
    setTracks(results);
  }, [searchQuery, filters, sortBy, sortOrder]);

  // Track statistics
  const trackStats = useMemo(() => trackService.getTrackStatistics(), []);

  // Get unique countries for filter
  const countries = useMemo(() => {
    const allTracks = trackService.getAllTracks();
    return [...new Set(allTracks.map((track) => track.country))].sort();
  }, []);

  // Get Finnish tracks for special section
  const finnishTracks = useMemo(() => {
    return tracks.filter(track => track.country === "Finland");
  }, [tracks]);

  // Get featured tracks (including KymiRing)
  const featuredTracks = useMemo(() => {
    const allTracks = trackService.getAllTracks();
    return allTracks.filter(track => 
      track.id === "kymiring" || 
      track.type === "formula1" || 
      track.type === "motogp"
    ).slice(0, 6);
  }, []);

  // Get custom tracks from localStorage
  const customTracks = useMemo(() => {
    try {
      const savedTracks = JSON.parse(localStorage.getItem("customTracks") || "[]");
      return savedTracks || [];
    } catch (error) {
      console.error("Error loading custom tracks:", error);
      return [];
    }
  }, []);

  // Handle create new track
  const handleCreateTrack = () => {
    navigate("/track-creator", { 
      state: { 
        returnTo: "/tracks",
        mode: "Track Creation"
      } 
    });
    notify({
      type: "info",
      title: "Track Creator",
      message: "Opening interactive track design tool",
    });
  };

  // Format track length
  const formatLength = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters} m`;
  };

  // Format lap record time
  const formatLapTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(3);
    return `${minutes}:${seconds.padStart(6, "0")}`;
  };

  // Get type badge color
  const getTypeBadgeColor = (type: string): string => {
    const colors = {
      formula1: "bg-red-500",
      motogp: "bg-orange-500",
      indycar: "bg-blue-500",
      nascar: "bg-green-500",
      circuit: "bg-purple-500",
      autocross: "bg-yellow-500",
      karting: "bg-pink-500",
      hillclimb: "bg-gray-500",
      drag: "bg-black",
      rally: "bg-brown-500",
      drifting: "bg-cyan-500",
    };
    return colors[type as keyof typeof colors] || "bg-gray-500";
  };

  // Get category badge color
  const getCategoryBadgeColor = (category: string): string => {
    const colors = {
      professional: "bg-gold-500 text-black",
      club: "bg-blue-500",
      private: "bg-green-500",
      street: "bg-gray-500",
    };
    return colors[category as keyof typeof colors] || "bg-gray-500";
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilters({});
    setSortBy("name");
    setSortOrder("asc");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
                Racing Tracks Database
              </h1>
              <p className="text-gray-400 text-lg">
                Comprehensive database of professional racing circuits worldwide
              </p>
            </div>
            <Button
              onClick={handleCreateTrack}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Track
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {trackStats.totalTracks}
              </div>
              <div className="text-gray-400 text-sm">Total Tracks</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {Object.keys(trackStats.byCountry).length}
              </div>
              <div className="text-gray-400 text-sm">Countries</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {formatLength(trackStats.longest.metadata.length)}
              </div>
              <div className="text-gray-400 text-sm">Longest Track</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">
                {Object.keys(trackStats.byType).length}
              </div>
              <div className="text-gray-400 text-sm">Track Types</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tracks by name, country, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                Clear All
              </Button>
              <Button
                variant="outline"
                onClick={() => setFilters({ country: "Finland" })}
                className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
              >
                🇫🇮 Finnish Tracks
              </Button>
              <Button
                onClick={handleCreateTrack}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Track
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-700">
                <Select
                  value={filters.country || ""}
                  onValueChange={(value) =>
                    setFilters({ ...filters, country: value || undefined })
                  }
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="">All Countries</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.type || ""}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      type: (value as RacingTrack["type"]) || undefined,
                    })
                  }
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="formula1">Formula 1</SelectItem>
                    <SelectItem value="motogp">MotoGP</SelectItem>
                    <SelectItem value="indycar">IndyCar</SelectItem>
                    <SelectItem value="nascar">NASCAR</SelectItem>
                    <SelectItem value="circuit">Circuit</SelectItem>
                    <SelectItem value="autocross">Autocross</SelectItem>
                    <SelectItem value="karting">Karting</SelectItem>
                    <SelectItem value="hillclimb">Hillclimb</SelectItem>
                    <SelectItem value="drag">Drag Racing</SelectItem>
                    <SelectItem value="rally">Rally</SelectItem>
                    <SelectItem value="drifting">Drifting</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.category || ""}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      category: (value as RacingTrack["category"]) || undefined,
                    })
                  }
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="club">Club</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="street">Street</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sortBy}
                  onValueChange={(value) =>
                    setSortBy(value as "name" | "length" | "established")
                  }
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="length">Length</SelectItem>
                    <SelectItem value="established">Established</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  {sortOrder === "asc" ? (
                    <SortAsc className="h-4 w-4 mr-2" />
                  ) : (
                    <SortDesc className="h-4 w-4 mr-2" />
                  )}
                  {sortOrder === "asc" ? "Ascending" : "Descending"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Finnish Tracks Section */}
        {finnishTracks.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-900/50 to-white/10 border-blue-500/30 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                🇫🇮 Finnish Racing Circuits
                <Badge className="bg-blue-500 text-white">Featured</Badge>
              </CardTitle>
              <p className="text-gray-300">
                Professional racing circuits from Finland, including the world-class KymiRing MotoGP venue
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {finnishTracks.map((track) => (
                  <Dialog key={track.id}>
                    <DialogTrigger asChild>
                      <Card 
                        className={`border transition-colors cursor-pointer ${
                          track.id === "kymiring" 
                            ? "bg-gradient-to-r from-orange-900/50 to-red-900/50 border-orange-500/50 hover:from-orange-800/50 hover:to-red-800/50" 
                            : "bg-gray-800/80 border-gray-700 hover:bg-gray-750"
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start mb-2">
                            <CardTitle className="text-lg font-bold text-white">
                              {track.name}
                              {track.id === "kymiring" && (
                                <Badge className="ml-2 bg-orange-500 text-white text-xs">
                                  MotoGP
                                </Badge>
                              )}
                            </CardTitle>
                            {track.metadata.safety.fiaGrade && (
                              <Badge className="bg-yellow-500 text-black text-xs">
                                FIA Grade {track.metadata.safety.fiaGrade}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Badge
                              className={`${getTypeBadgeColor(track.type)} text-white text-xs`}
                            >
                              {track.type.toUpperCase()}
                            </Badge>
                            <Badge
                              className={`${getCategoryBadgeColor(track.category)} text-xs`}
                            >
                              {track.category}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-300">
                              <MapPin className="h-4 w-4 text-blue-400" />
                              {track.city}, {track.country}
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <Ruler className="h-4 w-4 text-green-400" />
                              {formatLength(track.metadata.length)}
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <Calendar className="h-4 w-4 text-purple-400" />
                              Est. {track.established}
                            </div>
                            {track.metadata.lapRecord && (
                              <div className="flex items-center gap-2 text-gray-300">
                                <Trophy className="h-4 w-4 text-yellow-400" />
                                {formatLapTime(track.metadata.lapRecord.time)}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                          {track.name}
                          {track.id === "kymiring" && (
                            <Badge className="bg-orange-500 text-white">MotoGP Venue</Badge>
                          )}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Track Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-2">Track Information</h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Length:</span>
                                  <span className="text-white">{formatLength(track.metadata.length)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Surface:</span>
                                  <span className="text-white">{track.metadata.surface}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Direction:</span>
                                  <span className="text-white capitalize">{track.metadata.direction}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Elevation:</span>
                                  <span className="text-white">{track.metadata.elevation}m</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Established:</span>
                                  <span className="text-white">{track.established}</span>
                                </div>
                              </div>
                            </div>

                            {track.metadata.lapRecord && (
                              <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Lap Record</h3>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Time:</span>
                                    <span className="text-white font-mono">{formatLapTime(track.metadata.lapRecord.time)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Driver:</span>
                                    <span className="text-white">{track.metadata.lapRecord.driver}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Vehicle:</span>
                                    <span className="text-white">{track.metadata.lapRecord.vehicle}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Year:</span>
                                    <span className="text-white">{track.metadata.lapRecord.year}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-2">Safety & Facilities</h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">FIA Grade:</span>
                                  <span className="text-white">{track.metadata.safety.fiaGrade || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Pit Boxes:</span>
                                  <span className="text-white">{track.metadata.facilities.pitBoxes}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Capacity:</span>
                                  <span className="text-white">{track.metadata.facilities.capacity.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Grandstands:</span>
                                  <span className="text-white">{track.metadata.facilities.grandstands}</span>
                                </div>
                              </div>
                            </div>

                            {track.website && (
                              <div>
                                <h3 className="text-lg font-semibold text-white mb-2">More Information</h3>
                                <Button
                                  variant="outline"
                                  onClick={() => window.open(track.website, '_blank')}
                                  className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
                                >
                                  Visit Official Website
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Track Sectors */}
                        {track.sectors && track.sectors.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Track Sectors</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {track.sectors.map((sector) => (
                                <Card key={sector.id} className="bg-gray-800 border-gray-700">
                                  <CardContent className="p-4">
                                    <h4 className="font-semibold text-white mb-2">{sector.name}</h4>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Length:</span>
                                        <span className="text-white">{formatLength(sector.length)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Type:</span>
                                        <span className="text-white capitalize">{sector.type}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Difficulty:</span>
                                        <span className="text-white capitalize">{sector.difficulty}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custom Tracks Section */}
        {customTracks.length > 0 && (
          <Card className="bg-gradient-to-r from-purple-900/50 to-white/10 border-purple-500/30 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                🎨 Your Custom Tracks
                <Badge className="bg-purple-500 text-white">Custom</Badge>
              </CardTitle>
              <p className="text-gray-300">
                Tracks you've created with our interactive track designer
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customTracks.map((track) => (
                  <Card
                    key={track.id}
                    className="bg-gray-800/80 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer"
                    onClick={() => {
                      // Navigate to track creator to edit this track
                      navigate("/track-creator", { 
                        state: { 
                          editTrack: track,
                          returnTo: "/tracks"
                        } 
                      });
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg font-bold text-white">
                          {track.name}
                        </CardTitle>
                        <Badge className="bg-purple-500 text-white text-xs">
                          Custom
                        </Badge>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-purple-500 text-white text-xs">
                          {track.surface.toUpperCase()}
                        </Badge>
                        <Badge className="bg-blue-500 text-white text-xs">
                          {track.direction}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                          <MapPin className="h-4 w-4 text-blue-400" />
                          {track.city}, {track.country}
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Ruler className="h-4 w-4 text-green-400" />
                          {(track.length / 1000).toFixed(2)} km
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Plus className="h-4 w-4 text-purple-400" />
                          {track.points.length} points
                        </div>
                        {track.sectors.length > 0 && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Clock className="h-4 w-4 text-yellow-400" />
                            {track.sectors.length} sectors
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          Created {new Date(track.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-gray-400">
            Showing {tracks.length} tracks
            {searchQuery && ` for "${searchQuery}"`}
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="border-gray-600"
            >
              Grid
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="border-gray-600"
            >
              List
            </Button>
          </div>
        </div>

        {/* Tracks Grid/List */}
        <div
          className={`grid gap-6 ${
            viewMode === "grid"
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {tracks.map((track) => (
            <Dialog key={track.id}>
              <DialogTrigger asChild>
                <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg font-bold text-white">
                        {track.name}
                      </CardTitle>
                      {track.metadata.safety.fiaGrade && (
                        <Badge className="bg-yellow-500 text-black text-xs">
                          FIA Grade {track.metadata.safety.fiaGrade}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge
                        className={`${getTypeBadgeColor(track.type)} text-white text-xs`}
                      >
                        {track.type.toUpperCase()}
                      </Badge>
                      <Badge
                        className={`${getCategoryBadgeColor(track.category)} text-xs`}
                      >
                        {track.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="h-4 w-4 text-blue-400" />
                        {track.city}, {track.country}
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Ruler className="h-4 w-4 text-green-400" />
                        {formatLength(track.metadata.length)}
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="h-4 w-4 text-purple-400" />
                        Established {track.established}
                      </div>
                      {track.metadata.lapRecord && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Trophy className="h-4 w-4 text-yellow-400" />
                          {formatLapTime(track.metadata.lapRecord.time)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>

              {/* Track Detail Dialog */}
              <DialogContent className="max-w-4xl bg-gray-800 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white">
                    {track.name}
                  </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-700">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="technical">Technical</TabsTrigger>
                    <TabsTrigger value="records">Records</TabsTrigger>
                    <TabsTrigger value="facilities">Facilities</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-blue-400">
                          Location
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-400" />
                            {track.city}, {track.country}
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-green-400" />
                            {track.region}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-purple-400" />
                            {track.timezone}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-blue-400">
                          Track Info
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Ruler className="h-4 w-4 text-green-400" />
                            Length: {formatLength(track.metadata.length)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Mountain className="h-4 w-4 text-orange-400" />
                            Elevation: {track.metadata.elevation}m
                          </div>
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-red-400" />
                            Direction: {track.metadata.direction}
                          </div>
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-gray-400" />
                            Surface: {track.metadata.surface}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-blue-400">
                        Track Sectors
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {track.sectors.map((sector) => (
                          <Card
                            key={sector.id}
                            className="bg-gray-700 border-gray-600"
                          >
                            <CardContent className="p-4">
                              <div className="font-semibold text-white mb-2">
                                {sector.name}
                              </div>
                              <div className="text-sm text-gray-300 space-y-1">
                                <div>Length: {formatLength(sector.length)}</div>
                                <div>Type: {sector.type}</div>
                                <div>
                                  Difficulty:{" "}
                                  <Badge
                                    className={`text-xs ${
                                      sector.difficulty === "extreme"
                                        ? "bg-red-500"
                                        : sector.difficulty === "hard"
                                          ? "bg-orange-500"
                                          : sector.difficulty === "medium"
                                            ? "bg-yellow-500"
                                            : "bg-green-500"
                                    }`}
                                  >
                                    {sector.difficulty}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="technical" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-gray-700 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-lg text-blue-400">
                            Safety Features
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          {track.metadata.safety.fiaGrade && (
                            <div>
                              FIA Grade: {track.metadata.safety.fiaGrade}
                            </div>
                          )}
                          <div>
                            Barriers:{" "}
                            {track.metadata.safety.barriers.join(", ")}
                          </div>
                          <div>
                            Runoff Areas:{" "}
                            {track.metadata.safety.runoffAreas ? "Yes" : "No"}
                          </div>
                        </CardContent>
                      </Card>

                      {track.pitLane && (
                        <Card className="bg-gray-700 border-gray-600">
                          <CardHeader>
                            <CardTitle className="text-lg text-blue-400">
                              Pit Lane
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div>
                              Speed Limit: {track.pitLane.speedLimit} km/h
                            </div>
                            <div>Pit Boxes: {track.pitLane.boxes.length}</div>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    <Card className="bg-gray-700 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-lg text-blue-400">
                          Weather Zones
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {track.weatherZones.map((zone) => (
                            <div
                              key={zone.id}
                              className="p-3 bg-gray-600 rounded"
                            >
                              <div className="font-semibold">{zone.name}</div>
                              <div className="text-sm text-gray-300">
                                Radius: {zone.radius}m
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="records" className="space-y-6">
                    {track.metadata.lapRecord ? (
                      <Card className="bg-gray-700 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-lg text-blue-400 flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-400" />
                            Lap Record
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-3xl font-bold text-yellow-400">
                            {formatLapTime(track.metadata.lapRecord.time)}
                          </div>
                          <div className="space-y-1 text-sm">
                            <div>
                              <span className="text-gray-400">Driver:</span>{" "}
                              {track.metadata.lapRecord.driver}
                            </div>
                            <div>
                              <span className="text-gray-400">Vehicle:</span>{" "}
                              {track.metadata.lapRecord.vehicle}
                            </div>
                            <div>
                              <span className="text-gray-400">Year:</span>{" "}
                              {track.metadata.lapRecord.year}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="text-center text-gray-400 py-8">
                        No lap record available for this track
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="facilities" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="bg-gray-700 border-gray-600">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-400">
                            {track.metadata.facilities.pitBoxes}
                          </div>
                          <div className="text-gray-400 text-sm">Pit Boxes</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-700 border-gray-600">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-400">
                            {track.metadata.facilities.grandstands}
                          </div>
                          <div className="text-gray-400 text-sm">
                            Grandstands
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-700 border-gray-600">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-400">
                            {track.metadata.facilities.capacity.toLocaleString()}
                          </div>
                          <div className="text-gray-400 text-sm">Capacity</div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-blue-400">
                        Additional Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-400">Established:</span>{" "}
                          {track.established}
                        </div>
                        {track.website && (
                          <div>
                            <span className="text-gray-400">Website:</span>{" "}
                            <a
                              href={track.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline"
                            >
                              Visit Website
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          ))}
        </div>

        {tracks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No tracks found</div>
            <Button
              onClick={clearFilters}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TracksPage;
