import React, { useRef, useEffect, useState } from 'react';
import { TrackGeometry, trackGeometryService } from '@/services/TrackGeometryService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Timer, Route, Target, Zap, Square } from 'lucide-react';

interface TrackLayoutPreviewProps {
  trackId: string;
  showAccelerationLines?: boolean;
  showBrakingLines?: boolean;
  showSectors?: boolean;
  showCorners?: boolean;
  showDRSZones?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: (trackId: string) => void;
  selected?: boolean;
}

const TrackLayoutPreview: React.FC<TrackLayoutPreviewProps> = ({
  trackId,
  showAccelerationLines = true,
  showBrakingLines = true,
  showSectors = true,
  showCorners = true,
  showDRSZones = true,
  size = 'medium',
  onClick,
  selected = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [track, setTrack] = useState<TrackGeometry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrack = async () => {
      try {
        setLoading(true);
        const trackData = await trackGeometryService.getTrackGeometry(trackId);
        setTrack(trackData);
      } catch (error) {
        console.error('Failed to load track:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrack();
  }, [trackId]);

  useEffect(() => {
    if (!track || !canvasRef.current) {
      console.log('No track or canvas for', trackId, track);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on size prop
    const sizeMap = {
      small: { width: 200, height: 150 },
      medium: { width: 300, height: 200 },
      large: { width: 400, height: 300 }
    };
    
    const { width, height } = sizeMap[size];
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate track bounds
    const bounds = calculateTrackBounds(track);
    const scale = Math.min(
      (width - 40) / (bounds.maxX - bounds.minX),
      (height - 40) / (bounds.maxY - bounds.minY)
    );
    const offsetX = (width - (bounds.maxX - bounds.minX) * scale) / 2 - bounds.minX * scale;
    const offsetY = (height - (bounds.maxY - bounds.minY) * scale) / 2 - bounds.minY * scale;

    // Debug log
    console.log('Drawing track', trackId, track, { width, height, bounds, scale, offsetX, offsetY });

    // Draw track boundaries
    drawTrackBoundaries(ctx, track, scale, offsetX, offsetY);

    // Draw centerline
    drawCenterline(ctx, track, scale, offsetX, offsetY);

    // Draw sectors
    if (showSectors) {
      drawSectors(ctx, track, scale, offsetX, offsetY);
    }

    // Draw corners
    if (showCorners) {
      drawCorners(ctx, track, scale, offsetX, offsetY);
    }

    // Draw DRS zones
    if (showDRSZones) {
      drawDRSZones(ctx, track, scale, offsetX, offsetY);
    }

    // Draw acceleration lines
    if (showAccelerationLines) {
      drawAccelerationLines(ctx, track, scale, offsetX, offsetY);
    }

    // Draw braking lines
    if (showBrakingLines) {
      drawBrakingLines(ctx, track, scale, offsetX, offsetY);
    }

    // Draw start/finish line
    drawStartFinishLine(ctx, track, scale, offsetX, offsetY);

  }, [track, showSectors, showCorners, showDRSZones, showAccelerationLines, showBrakingLines, size]);

  const calculateTrackBounds = (track: TrackGeometry) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    const centerLat = track.location.lat;
    const centerLng = track.location.lng;

    // Check all boundary points
    [...track.boundaries.inner, ...track.boundaries.outer, ...track.boundaries.centerline].forEach(point => {
      const x = (point.lng - centerLng) * 111000 * Math.cos(centerLat * Math.PI / 180);
      const y = -(point.lat - centerLat) * 111000;
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });

    return { minX, minY, maxX, maxY };
  };

  const gpsToCanvas = (lat: number, lng: number, scale: number, offsetX: number, offsetY: number) => {
    const centerLat = track!.location.lat;
    const centerLng = track!.location.lng;
    
    const x = (lng - centerLng) * 111000 * Math.cos(centerLat * Math.PI / 180) * scale + offsetX;
    const y = -(lat - centerLat) * 111000 * scale + offsetY;
    
    return { x, y };
  };

  const drawTrackBoundaries = (ctx: CanvasRenderingContext2D, track: TrackGeometry, scale: number, offsetX: number, offsetY: number) => {
    // Draw inner boundary
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    track.boundaries.inner.forEach((point, index) => {
      const { x, y } = gpsToCanvas(point.lat, point.lng, scale, offsetX, offsetY);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw outer boundary
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    track.boundaries.outer.forEach((point, index) => {
      const { x, y } = gpsToCanvas(point.lat, point.lng, scale, offsetX, offsetY);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  };

  const drawCenterline = (ctx: CanvasRenderingContext2D, track: TrackGeometry, scale: number, offsetX: number, offsetY: number) => {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    track.boundaries.centerline.forEach((point, index) => {
      const { x, y } = gpsToCanvas(point.lat, point.lng, scale, offsetX, offsetY);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  };

  const drawSectors = (ctx: CanvasRenderingContext2D, track: TrackGeometry, scale: number, offsetX: number, offsetY: number) => {
    const sectorColors = ['#ff0000', '#00ff00', '#0000ff'];
    
    track.sectors.forEach((sector, index) => {
      const { x, y } = gpsToCanvas(sector.startPoint.lat, sector.startPoint.lng, scale, offsetX, offsetY);
      
      ctx.fillStyle = sectorColors[index % sectorColors.length];
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw sector number
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.fillText(`${index + 1}`, x - 3, y + 4);
    });
  };

  const drawCorners = (ctx: CanvasRenderingContext2D, track: TrackGeometry, scale: number, offsetX: number, offsetY: number) => {
    track.corners.forEach((corner) => {
      const { x, y } = gpsToCanvas(corner.entryPoint.lat, corner.entryPoint.lng, scale, offsetX, offsetY);
      
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw corner number
      ctx.fillStyle = '#000000';
      ctx.font = '10px Arial';
      ctx.fillText(`${corner.number}`, x - 2, y + 3);
    });
  };

  const drawDRSZones = (ctx: CanvasRenderingContext2D, track: TrackGeometry, scale: number, offsetX: number, offsetY: number) => {
    track.drsZones.forEach((zone) => {
      const { x, y } = gpsToCanvas(zone.activationPoint.lat, zone.activationPoint.lng, scale, offsetX, offsetY);
      
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw DRS text
      ctx.fillStyle = '#000000';
      ctx.font = '8px Arial';
      ctx.fillText('DRS', x - 8, y + 3);
    });
  };

  const drawAccelerationLines = (ctx: CanvasRenderingContext2D, track: TrackGeometry, scale: number, offsetX: number, offsetY: number) => {
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // Draw acceleration zones (straights and exits)
    track.corners.forEach((corner) => {
      const exitPoint = gpsToCanvas(corner.exitPoint.lat, corner.exitPoint.lng, scale, offsetX, offsetY);
      const nextPoint = gpsToCanvas(
        corner.exitPoint.lat + (corner.exitPoint.lat - corner.entryPoint.lat) * 0.1,
        corner.exitPoint.lng + (corner.exitPoint.lng - corner.entryPoint.lng) * 0.1,
        scale, offsetX, offsetY
      );
      
      ctx.beginPath();
      ctx.moveTo(exitPoint.x, exitPoint.y);
      ctx.lineTo(nextPoint.x, nextPoint.y);
      ctx.stroke();
    });
    
    ctx.setLineDash([]);
  };

  const drawBrakingLines = (ctx: CanvasRenderingContext2D, track: TrackGeometry, scale: number, offsetX: number, offsetY: number) => {
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    
    // Draw braking zones
    track.corners.forEach((corner) => {
      const entryPoint = gpsToCanvas(corner.entryPoint.lat, corner.entryPoint.lng, scale, offsetX, offsetY);
      const brakingStart = gpsToCanvas(
        corner.brakingZone.start.lat,
        corner.brakingZone.start.lng,
        scale, offsetX, offsetY
      );
      
      ctx.beginPath();
      ctx.moveTo(brakingStart.x, brakingStart.y);
      ctx.lineTo(entryPoint.x, entryPoint.y);
      ctx.stroke();
    });
    
    ctx.setLineDash([]);
  };

  const drawStartFinishLine = (ctx: CanvasRenderingContext2D, track: TrackGeometry, scale: number, offsetX: number, offsetY: number) => {
    const { x, y } = gpsToCanvas(track.boundaries.centerline[0].lat, track.boundaries.centerline[0].lng, scale, offsetX, offsetY);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 10);
    ctx.lineTo(x + 10, y + 10);
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Arial';
    ctx.fillText('S/F', x - 8, y + 15);
  };

  if (loading) {
    return (
      <Card className={`${selected ? 'ring-2 ring-blue-500' : ''} cursor-pointer transition-all duration-200 hover:shadow-lg`}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="bg-gray-700 h-32 rounded mb-2"></div>
            <div className="bg-gray-700 h-4 rounded mb-1"></div>
            <div className="bg-gray-700 h-3 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!track) {
    return (
      <Card className={`${selected ? 'ring-2 ring-blue-500' : ''} cursor-pointer transition-all duration-200 hover:shadow-lg`}>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <div className="bg-gray-700 h-32 rounded mb-2 flex items-center justify-center">
              <span>Track not found</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`${selected ? 'ring-2 ring-blue-500' : ''} cursor-pointer transition-all duration-200 hover:shadow-lg`}
      onClick={() => onClick?.(trackId)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span>{track.name}</span>
          <Badge variant="outline" className="text-xs">
            {track.country}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <canvas
          ref={canvasRef}
          className="w-full h-auto border border-red-500 rounded"
          style={{ background: '#1a1a1a', border: '2px solid red' }}
        />
        
        {/* Fallback error message if track data is missing */}
        {!track && !loading && (
          <div style={{ color: 'red', marginTop: 8 }}>
            Track data not found for ID: {trackId}
          </div>
        )}
        
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Route className="h-3 w-3" />
              <span>{track.layout.length}m</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>{track.layout.corners} corners</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              <span>{track.sectors.length} sectors</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{track.layout.direction}</span>
            </div>
          </div>
          
          {showAccelerationLines && showBrakingLines && (
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-green-400" />
                <span>Acceleration</span>
              </div>
              <div className="flex items-center gap-1">
                <Square className="h-3 w-3 text-red-400" />
                <span>Braking</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackLayoutPreview; 