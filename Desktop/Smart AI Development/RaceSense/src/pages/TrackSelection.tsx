import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  MapPin, 
  Timer, 
  Route, 
  Target, 
  Zap, 
  Square, 
  Play, 
  Info,
  ArrowLeft,
  Globe,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/components/RacingNotifications';
import TrackLayoutPreview from '@/components/TrackLayoutPreview';
import { trackGeometryService } from '@/services/TrackGeometryService';
import { TrackGeometry } from '@/services/TrackGeometryService';

interface TrackFilter {
  country: string;
  length: { min: number; max: number };
  corners: { min: number; max: number };
  direction: string;
}

const TrackSelection: React.FC = () => {
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const [tracks, setTracks] = useState<TrackGeometry[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<TrackGeometry[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAccelerationLines, setShowAccelerationLines] = useState(true);
  const [showBrakingLines, setShowBrakingLines] = useState(true);
  const [showSectors, setShowSectors] = useState(true);
  const [showCorners, setShowCorners] = useState(true);
  const [showDRSZones, setShowDRSZones] = useState(true);
  const [filters, setFilters] = useState<TrackFilter>({
    country: '',
    length: { min: 0, max: 10000 },
    corners: { min: 0, max: 50 },
    direction: ''
  });

  useEffect(() => {
    loadTracks();
  }, []);

  useEffect(() => {
    filterTracks();
  }, [tracks, searchTerm, filters]);

  const loadTracks = async () => {
    try {
      setLoading(true);
      const availableTracks = await trackGeometryService.getAllTracks();
      setTracks(availableTracks);
      setFilteredTracks(availableTracks);
    } catch (error) {
      console.error('Failed to load tracks:', error);
      notify({ type: 'error', title: 'Error', message: 'Failed to load tracks' });
    } finally {
      setLoading(false);
    }
  };

  const filterTracks = () => {
    let filtered = tracks.filter(track => {
      // Search filter
      const matchesSearch = track.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           track.country.toLowerCase().includes(searchTerm.toLowerCase());

      // Country filter
      const matchesCountry = !filters.country || track.country === filters.country;

      // Length filter
      const matchesLength = track.layout.length >= filters.length.min && 
                           track.layout.length <= filters.length.max;

      // Corners filter
      const matchesCorners = track.layout.corners >= filters.corners.min && 
                            track.layout.corners <= filters.corners.max;

      // Direction filter
      const matchesDirection = !filters.direction || track.layout.direction === filters.direction;

      return matchesSearch && matchesCountry && matchesLength && matchesCorners && matchesDirection;
    });

    setFilteredTracks(filtered);
  };

  const handleTrackSelect = (trackId: string) => {
    setSelectedTrack(trackId);
    notify({ 
      type: 'success', 
      title: 'Track Selected', 
      message: `Selected track for analysis` 
    });
  };

  const handleAnalyzeTrack = () => {
    if (!selectedTrack) {
      notify({ type: 'error', title: 'No Track Selected', message: 'Please select a track first' });
      return;
    }
    
    // Navigate to analysis page with selected track
    navigate(`/session-analysis?track=${selectedTrack}`);
  };

  const handleBackToModeSelection = () => {
    navigate('/mode-selection');
  };

  const getUniqueCountries = () => {
    return [...new Set(tracks.map(track => track.country))];
  };

  const getTrackStats = () => {
    if (tracks.length === 0) return null;
    
    const totalLength = tracks.reduce((sum, track) => sum + track.layout.length, 0);
    const totalCorners = tracks.reduce((sum, track) => sum + track.layout.corners, 0);
    const avgLength = Math.round(totalLength / tracks.length);
    const avgCorners = Math.round(totalCorners / tracks.length);
    
    return { totalLength, totalCorners, avgLength, avgCorners };
  };

  const stats = getTrackStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg w-fit">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Track Selection & Analysis
              </h1>
              <p className="text-gray-400 text-base sm:text-lg mt-1">
                Choose from our comprehensive track database with acceleration and braking analysis
              </p>
            </div>
          </div>
          
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-blue-400">{tracks.length}</div>
                <div className="text-blue-300 text-xs sm:text-sm font-medium">Available Tracks</div>
              </div>
              <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-green-400">{stats.avgLength}m</div>
                <div className="text-green-300 text-xs sm:text-sm font-medium">Avg Length</div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-yellow-400">{stats.avgCorners}</div>
                <div className="text-yellow-300 text-xs sm:text-sm font-medium">Avg Corners</div>
              </div>
              <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-purple-400">{filteredTracks.length}</div>
                <div className="text-purple-300 text-xs sm:text-sm font-medium">Filtered</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Controls Panel */}
          <div className="space-y-4 sm:space-y-6">
            {/* Search and Filters */}
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Search className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                  </div>
                  <span className="text-sm sm:text-base">Search & Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    placeholder="Search tracks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-blue-500/50"
                  />
                </div>
                
                <div>
                  <Label className="text-xs text-gray-400">Country</Label>
                  <select
                    value={filters.country}
                    onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full mt-1 bg-gray-700/50 border border-gray-600/50 text-white rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All Countries</option>
                    {getUniqueCountries().map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs text-gray-400">Track Length (m)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.length.min}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        length: { ...prev.length, min: parseInt(e.target.value) || 0 } 
                      }))}
                      className="bg-gray-700/50 border-gray-600/50 text-white text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.length.max}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        length: { ...prev.length, max: parseInt(e.target.value) || 10000 } 
                      }))}
                      className="bg-gray-700/50 border-gray-600/50 text-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-400">Direction</Label>
                  <select
                    value={filters.direction}
                    onChange={(e) => setFilters(prev => ({ ...prev, direction: e.target.value }))}
                    className="w-full mt-1 bg-gray-700/50 border border-gray-600/50 text-white rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All Directions</option>
                    <option value="clockwise">Clockwise</option>
                    <option value="counterclockwise">Counter-clockwise</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Display Options */}
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                  </div>
                  <span className="text-sm sm:text-base">Display Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-300 flex items-center gap-2">
                    <Zap className="h-3 w-3 text-green-400" />
                    Acceleration Lines
                  </Label>
                  <Switch
                    checked={showAccelerationLines}
                    onCheckedChange={setShowAccelerationLines}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-300 flex items-center gap-2">
                    <Square className="h-3 w-3 text-red-400" />
                    Braking Lines
                  </Label>
                  <Switch
                    checked={showBrakingLines}
                    onCheckedChange={setShowBrakingLines}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-300 flex items-center gap-2">
                    <Timer className="h-3 w-3 text-blue-400" />
                    Sectors
                  </Label>
                  <Switch
                    checked={showSectors}
                    onCheckedChange={setShowSectors}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-300 flex items-center gap-2">
                    <Target className="h-3 w-3 text-yellow-400" />
                    Corners
                  </Label>
                  <Switch
                    checked={showCorners}
                    onCheckedChange={setShowCorners}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-300 flex items-center gap-2">
                    <Route className="h-3 w-3 text-cyan-400" />
                    DRS Zones
                  </Label>
                  <Switch
                    checked={showDRSZones}
                    onCheckedChange={setShowDRSZones}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Selected Track Info */}
            {selectedTrack && (
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                    </div>
                    <span className="text-sm sm:text-base">Selected Track</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-blue-300">
                    Ready to analyze with acceleration and braking data
                  </div>
                  <Button
                    onClick={handleAnalyzeTrack}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all duration-200"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Analyze Track
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
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

          {/* Tracks Grid */}
          <div className="lg:col-span-3">
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-semibold">Available Tracks</div>
                      <div className="text-xs sm:text-sm text-gray-400">
                        {filteredTracks.length} of {tracks.length} tracks
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="text-xs"
                    >
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="text-xs"
                    >
                      List
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTracks.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <div className="p-4 bg-gray-700/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Search className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="font-medium">No tracks found</p>
                    <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' 
                    : 'space-y-4'
                  }>
                    {filteredTracks.map((track) => (
                      <TrackLayoutPreview
                        key={track.id}
                        trackId={track.id}
                        showAccelerationLines={showAccelerationLines}
                        showBrakingLines={showBrakingLines}
                        showSectors={showSectors}
                        showCorners={showCorners}
                        showDRSZones={showDRSZones}
                        size={viewMode === 'grid' ? 'medium' : 'large'}
                        onClick={handleTrackSelect}
                        selected={selectedTrack === track.id}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackSelection; 