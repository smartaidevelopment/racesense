import React, { useRef, useEffect, useState } from 'react';
import { TrackGeometry, trackGeometryService } from '@/services/TrackGeometryService';
import { SessionData } from '@/services/DataManagementService';

interface Track3DViewerProps {
  trackId: string;
  sessionData?: SessionData;
  showHeatMap?: boolean;
  showRacingLine?: boolean;
  showSectors?: boolean;
  showCorners?: boolean;
  showDRSZones?: boolean;
  animationSpeed?: number;
  onTrackLoaded?: (track: TrackGeometry) => void;
}

const Track3DViewer: React.FC<Track3DViewerProps> = ({
  trackId,
  sessionData,
  showHeatMap = false,
  showRacingLine = true,
  showSectors = true,
  showCorners = true,
  showDRSZones = true,
  animationSpeed = 1,
  onTrackLoaded
}) => {
  const [track, setTrack] = useState<TrackGeometry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadTrack = async () => {
      try {
        setLoading(true);
        const trackData = await trackGeometryService.getTrackGeometry(trackId);
        if (trackData) {
          setTrack(trackData);
          onTrackLoaded?.(trackData);
        } else {
          setError('Track not found');
        }
      } catch (err) {
        setError('Failed to load track');
        console.error('Track loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTrack();
  }, [trackId, onTrackLoaded]);

  useEffect(() => {
    if (!track || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw track info
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.fillText(`Track: ${track.name}`, 20, 30);
    ctx.fillText(`Country: ${track.country}`, 20, 50);
    ctx.fillText(`Length: ${track.layout.length}m`, 20, 70);
    ctx.fillText(`Corners: ${track.layout.corners}`, 20, 90);
    ctx.fillText(`Direction: ${track.layout.direction}`, 20, 110);

    // Draw sectors
    if (showSectors && track.sectors.length > 0) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      track.sectors.forEach((sector, index) => {
        const x = 20 + (index * 150);
        const y = 150;
        
        ctx.fillStyle = index === 0 ? '#ff0000' : index === 1 ? '#00ff00' : '#0000ff';
        ctx.fillRect(x, y, 100, 30);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(sector.name, x + 5, y + 20);
        ctx.fillText(`${sector.length}m`, x + 5, y + 40);
      });
    }

    // Draw corners
    if (showCorners && track.corners.length > 0) {
      ctx.fillStyle = '#ffff00';
      ctx.font = '14px Arial';
      track.corners.forEach((corner, index) => {
        const x = 20;
        const y = 220 + (index * 25);
        ctx.fillText(`${corner.number}. ${corner.name} (${corner.type})`, x, y);
      });
    }

    // Draw DRS zones
    if (showDRSZones && track.drsZones.length > 0) {
      ctx.fillStyle = '#00ffff';
      ctx.font = '14px Arial';
      track.drsZones.forEach((zone, index) => {
        const x = 20;
        const y = 350 + (index * 25);
        ctx.fillText(`${zone.name} (${zone.length}m)`, x, y);
      });
    }

    // Draw session info
    if (sessionData) {
      ctx.fillStyle = '#00ff00';
      ctx.font = '14px Arial';
      ctx.fillText(`Session: ${sessionData.name}`, 20, 450);
      ctx.fillText(`Duration: ${sessionData.duration}s`, 20, 470);
      ctx.fillText(`Laps: ${sessionData.totalLaps}`, 20, 490);
      if (sessionData.telemetryData) {
        ctx.fillText(`Telemetry Points: ${sessionData.telemetryData.length}`, 20, 510);
      }
    }

  }, [track, sessionData, showSectors, showCorners, showDRSZones]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <div className="text-lg">Loading Track Data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="text-red-400 text-lg mb-4">Error Loading Track</div>
          <div className="text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-900 relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: '#1a1a1a' }}
      />
      
      {/* Info overlay */}
      <div className="absolute top-4 right-4 bg-black/80 rounded-lg p-3 text-white text-sm">
        <div>Track: {track?.name}</div>
        <div>Status: Ready</div>
        <div>Layers: {[showSectors, showCorners, showDRSZones].filter(Boolean).length} active</div>
      </div>
    </div>
  );
};

export default Track3DViewer; 