import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Line, Box } from '@react-three/drei';
import * as THREE from 'three';
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

interface TrackMeshProps {
  trackId: string;
  onLoaded?: (track: TrackGeometry) => void;
}

const TrackMesh: React.FC<TrackMeshProps> = ({ trackId, onLoaded }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [track, setTrack] = useState<TrackGeometry | null>(null);

  useEffect(() => {
    const loadTrack = async () => {
      try {
        const trackData = await trackGeometryService.getTrackGeometry(trackId);
        if (trackData) {
          setTrack(trackData);
          const meshGeometry = await trackGeometryService.generateTrackMesh(trackId);
          setGeometry(meshGeometry);
          onLoaded?.(trackData);
        }
      } catch (error) {
        console.error('Failed to load track geometry:', error);
      }
    };

    loadTrack();
  }, [trackId, onLoaded]);

  if (!geometry) return null;

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial 
        color="#2c2c2c" 
        roughness={0.8} 
        metalness={0.1}
      />
    </mesh>
  );
};

interface TelemetryPathProps {
  sessionData: SessionData;
  trackId: string;
  color?: string;
  lineWidth?: number;
}

const TelemetryPath: React.FC<TelemetryPathProps> = ({ 
  sessionData, 
  trackId, 
  color = "#ff6b35",
  lineWidth = 3 
}) => {
  const [points, setPoints] = useState<THREE.Vector3[]>([]);

  useEffect(() => {
    const convertTelemetryTo3D = async () => {
      if (!sessionData.telemetryData || sessionData.telemetryData.length === 0) return;

      const track = await trackGeometryService.getTrackGeometry(trackId);
      if (!track) return;

      const centerLat = track.location.lat;
      const centerLng = track.location.lng;
      const centerElevation = track.location.elevation;

             const telemetryPoints = sessionData.telemetryData.map(point => {
         const latDiff = point.position.lat - centerLat;
         const lngDiff = point.position.lng - centerLng;
         
         const x = lngDiff * 111000 * Math.cos(centerLat * Math.PI / 180);
         const z = -latDiff * 111000;
         const y = centerElevation - 100 + 1; // Slightly above track

         return new THREE.Vector3(x, y, z);
       });

      setPoints(telemetryPoints);
    };

    convertTelemetryTo3D();
  }, [sessionData, trackId]);

  if (points.length === 0) return null;

  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      dashed={false}
    />
  );
};

interface SectorMarkersProps {
  trackId: string;
}

const SectorMarkers: React.FC<SectorMarkersProps> = ({ trackId }) => {
  const [sectors, setSectors] = useState<any[]>([]);

  useEffect(() => {
    const loadSectors = async () => {
      const sectorData = await trackGeometryService.getTrackSectors(trackId);
      setSectors(sectorData);
    };

    loadSectors();
  }, [trackId]);

  return (
    <>
      {sectors.map((sector, index) => (
        <Box
          key={sector.id}
          args={[2, 0.5, 2]}
          position={[
            sector.startPoint.lng * 111000,
            (sector.startPoint.elevation || 100) - 100 + 2,
            -sector.startPoint.lat * 111000
          ]}
        >
          <meshStandardMaterial color={index === 0 ? "#ff0000" : index === 1 ? "#00ff00" : "#0000ff"} />
        </Box>
      ))}
    </>
  );
};

interface CornerMarkersProps {
  trackId: string;
}

const CornerMarkers: React.FC<CornerMarkersProps> = ({ trackId }) => {
  const [corners, setCorners] = useState<any[]>([]);

  useEffect(() => {
    const loadCorners = async () => {
      const cornerData = await trackGeometryService.getTrackCorners(trackId);
      setCorners(cornerData);
    };

    loadCorners();
  }, [trackId]);

  return (
    <>
      {corners.map((corner) => (
        <group key={corner.id}>
          <Box
            args={[1, 0.3, 1]}
            position={[
              corner.entryPoint.lng * 111000,
              (corner.entryPoint.elevation || 100) - 100 + 1.5,
              -corner.entryPoint.lat * 111000
            ]}
          >
            <meshStandardMaterial color="#ffff00" />
          </Box>
          <Text
            position={[
              corner.entryPoint.lng * 111000,
              (corner.entryPoint.elevation || 100) - 100 + 3,
              -corner.entryPoint.lat * 111000
            ]}
            fontSize={0.5}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {corner.number}
          </Text>
        </group>
      ))}
    </>
  );
};

interface DRSZoneMarkersProps {
  trackId: string;
}

const DRSZoneMarkers: React.FC<DRSZoneMarkersProps> = ({ trackId }) => {
  const [drsZones, setDrsZones] = useState<any[]>([]);

  useEffect(() => {
    const loadDRSZones = async () => {
      const drsData = await trackGeometryService.getDRSZones(trackId);
      setDrsZones(drsData);
    };

    loadDRSZones();
  }, [trackId]);

  return (
    <>
      {drsZones.map((zone) => (
        <group key={zone.id}>
          <Box
            args={[zone.length, 0.2, 5]}
            position={[
              zone.activationPoint.lng * 111000,
              (zone.activationPoint.elevation || 100) - 100 + 0.5,
              -zone.activationPoint.lat * 111000
            ]}
          >
            <meshStandardMaterial color="#00ffff" opacity={0.3} transparent />
          </Box>
          <Text
            position={[
              zone.activationPoint.lng * 111000,
              (zone.activationPoint.elevation || 100) - 100 + 2,
              -zone.activationPoint.lat * 111000
            ]}
            fontSize={0.4}
            color="cyan"
            anchorX="center"
            anchorY="middle"
          >
            DRS
          </Text>
        </group>
      ))}
    </>
  );
};

interface HeatMapProps {
  sessionData: SessionData;
  trackId: string;
  type: 'speed' | 'braking' | 'throttle' | 'gforce';
}

const HeatMap: React.FC<HeatMapProps> = ({ sessionData, trackId, type }) => {
  const [heatMapPoints, setHeatMapPoints] = useState<THREE.Vector3[]>([]);
  const [colors, setColors] = useState<THREE.Color[]>([]);

  useEffect(() => {
    const generateHeatMap = async () => {
      if (!sessionData.telemetryData || sessionData.telemetryData.length === 0) return;

      const track = await trackGeometryService.getTrackGeometry(trackId);
      if (!track) return;

      const centerLat = track.location.lat;
      const centerLng = track.location.lng;
      const centerElevation = track.location.elevation;

      const points: THREE.Vector3[] = [];
      const pointColors: THREE.Color[] = [];

      sessionData.telemetryData.forEach(point => {
        let value = 0;
        switch (type) {
          case 'speed':
            value = point.speed || 0;
            break;
          case 'braking':
            value = point.brake || 0;
            break;
          case 'throttle':
            value = point.throttle || 0;
            break;
          case 'gforce':
            if (point.gForce) {
              value = Math.sqrt(
                point.gForce.lateral ** 2 +
                point.gForce.longitudinal ** 2 +
                point.gForce.vertical ** 2
              );
            }
            break;
        }

        const latDiff = point.position.lat - centerLat;
        const lngDiff = point.position.lng - centerLng;
        
                 const x = lngDiff * 111000 * Math.cos(centerLat * Math.PI / 180);
         const z = -latDiff * 111000;
         const y = centerElevation - 100 + 0.1;

        points.push(new THREE.Vector3(x, y, z));

        // Color based on value
        const normalizedValue = Math.min(value / 300, 1); // Normalize to 0-1
        const color = new THREE.Color();
        color.setHSL(0.6 * (1 - normalizedValue), 1, 0.5); // Blue to red
        pointColors.push(color);
      });

      setHeatMapPoints(points);
      setColors(pointColors);
    };

    generateHeatMap();
  }, [sessionData, trackId, type]);

  if (heatMapPoints.length === 0) return null;

  return (
    <group>
      {heatMapPoints.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshStandardMaterial color={colors[index]} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
};

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

  const handleTrackLoaded = (trackData: TrackGeometry) => {
    setTrack(trackData);
    onTrackLoaded?.(trackData);
  };

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 50, 100], fov: 60 }}
        style={{ background: '#1a1a1a' }}
      >
        <PerspectiveCamera makeDefault position={[0, 50, 100]} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxDistance={500}
          minDistance={10}
        />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* Track */}
        <TrackMesh trackId={trackId} onLoaded={handleTrackLoaded} />

        {/* Telemetry Path */}
        {sessionData && showRacingLine && (
          <TelemetryPath 
            sessionData={sessionData} 
            trackId={trackId}
            color="#ff6b35"
            lineWidth={3}
          />
        )}

        {/* Heat Map */}
        {sessionData && showHeatMap && (
          <HeatMap 
            sessionData={sessionData} 
            trackId={trackId} 
            type="speed" 
          />
        )}

        {/* Sector Markers */}
        {showSectors && <SectorMarkers trackId={trackId} />}

        {/* Corner Markers */}
        {showCorners && <CornerMarkers trackId={trackId} />}

        {/* DRS Zone Markers */}
        {showDRSZones && <DRSZoneMarkers trackId={trackId} />}

        {/* Track Info */}
        {track && (
          <Text
            position={[0, 30, 0]}
            fontSize={2}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {track.name}
          </Text>
        )}
      </Canvas>
    </div>
  );
};

export default Track3DViewer; 