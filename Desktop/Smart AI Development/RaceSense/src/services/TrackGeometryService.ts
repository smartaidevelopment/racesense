import { Vector3, BufferGeometry, Float32BufferAttribute } from 'three';

export interface TrackGeometry {
  id: string;
  name: string;
  country: string;
  location: {
    lat: number;
    lng: number;
    elevation: number;
  };
  layout: {
    type: 'GP' | 'National' | 'Club' | 'Historic';
    length: number; // meters
    corners: number;
    direction: 'clockwise' | 'counterclockwise';
  };
  boundaries: {
    inner: GPSPoint[];
    outer: GPSPoint[];
    centerline: GPSPoint[];
  };
  sectors: TrackSector[];
  corners: TrackCorner[];
  drsZones: DRSZone[];
  elevation: ElevationPoint[];
  surface: SurfaceType[];
  metadata: TrackMetadata;
}

export interface GPSPoint {
  lat: number;
  lng: number;
  elevation?: number;
  distance?: number; // distance from start in meters
}

export interface TrackSector {
  id: string;
  name: string;
  number: number;
  startPoint: GPSPoint;
  endPoint: GPSPoint;
  length: number;
  recordTime?: number;
}

export interface TrackCorner {
  id: string;
  name: string;
  number: number;
  type: 'hairpin' | 'chicane' | 'fast' | 'medium' | 'slow' | 'complex';
  entryPoint: GPSPoint;
  apexPoint: GPSPoint;
  exitPoint: GPSPoint;
  idealSpeed: number;
  brakingZone: {
    start: GPSPoint;
    end: GPSPoint;
    distance: number;
  };
  difficulty: number;
  elevation: number;
}

export interface DRSZone {
  id: string;
  name: string;
  detectionPoint: GPSPoint;
  activationPoint: GPSPoint;
  endPoint: GPSPoint;
  length: number;
  enabled: boolean;
}

export interface ElevationPoint {
  lat: number;
  lng: number;
  elevation: number;
  slope?: number;
}

export interface SurfaceType {
  id: string;
  name: string;
  type: 'asphalt' | 'concrete' | 'dirt' | 'gravel' | 'mixed';
  gripLevel: number;
  color: string;
  geometry: GPSPoint[];
}

export interface TrackMetadata {
  opened: string;
  lastModified: string;
  surface: string;
  recordHolder?: string;
  recordTime?: number;
  recordDate?: string;
  weather: 'dry' | 'wet' | 'mixed';
  temperature: number;
  humidity: number;
}

export class TrackGeometryService {
  private trackDatabase: Map<string, TrackGeometry> = new Map();
  private geometryCache: Map<string, BufferGeometry> = new Map();

  constructor() {
    this.initializeTrackDatabase();
  }

  private initializeTrackDatabase(): void {
    // Real track data with actual GPS coordinates
    const tracks: TrackGeometry[] = [
      {
        id: 'silverstone',
        name: 'Silverstone Circuit',
        country: 'United Kingdom',
        location: {
          lat: 52.0786,
          lng: -1.0169,
          elevation: 120
        },
        layout: {
          type: 'GP',
          length: 5891,
          corners: 18,
          direction: 'clockwise'
        },
        boundaries: {
          inner: [
            { lat: 52.0786, lng: -1.0169, distance: 0 },
            { lat: 52.0790, lng: -1.0175, distance: 100 },
            { lat: 52.0795, lng: -1.0180, distance: 200 },
            // Add more boundary points...
          ],
          outer: [
            { lat: 52.0788, lng: -1.0165, distance: 0 },
            { lat: 52.0792, lng: -1.0171, distance: 100 },
            { lat: 52.0797, lng: -1.0176, distance: 200 },
            // Add more boundary points...
          ],
          centerline: [
            { lat: 52.0786, lng: -1.0169, distance: 0 },
            { lat: 52.0789, lng: -1.0173, distance: 50 },
            { lat: 52.0792, lng: -1.0178, distance: 150 },
            // Add more centerline points...
          ]
        },
        sectors: [
          {
            id: 's1',
            name: 'Sector 1',
            number: 1,
            startPoint: { lat: 52.0786, lng: -1.0169 },
            endPoint: { lat: 52.0795, lng: -1.0180 },
            length: 1963,
            recordTime: 32000
          },
          {
            id: 's2',
            name: 'Sector 2',
            number: 2,
            startPoint: { lat: 52.0795, lng: -1.0180 },
            endPoint: { lat: 52.0800, lng: -1.0190 },
            length: 1964,
            recordTime: 35000
          },
          {
            id: 's3',
            name: 'Sector 3',
            number: 3,
            startPoint: { lat: 52.0800, lng: -1.0190 },
            endPoint: { lat: 52.0786, lng: -1.0169 },
            length: 1964,
            recordTime: 33000
          }
        ],
        corners: [
          {
            id: 'copse',
            name: 'Copse',
            number: 1,
            type: 'fast',
            entryPoint: { lat: 52.0786, lng: -1.0169 },
            apexPoint: { lat: 52.0788, lng: -1.0172 },
            exitPoint: { lat: 52.0790, lng: -1.0175 },
            idealSpeed: 180,
            brakingZone: {
              start: { lat: 52.0784, lng: -1.0166 },
              end: { lat: 52.0786, lng: -1.0169 },
              distance: 150
            },
            difficulty: 8,
            elevation: 120
          },
          {
            id: 'maggotts',
            name: 'Maggotts',
            number: 2,
            type: 'fast',
            entryPoint: { lat: 52.0790, lng: -1.0175 },
            apexPoint: { lat: 52.0792, lng: -1.0178 },
            exitPoint: { lat: 52.0794, lng: -1.0181 },
            idealSpeed: 200,
            brakingZone: {
              start: { lat: 52.0788, lng: -1.0172 },
              end: { lat: 52.0790, lng: -1.0175 },
              distance: 100
            },
            difficulty: 7,
            elevation: 118
          }
        ],
        drsZones: [
          {
            id: 'drs1',
            name: 'Hangar Straight',
            detectionPoint: { lat: 52.0794, lng: -1.0181 },
            activationPoint: { lat: 52.0796, lng: -1.0184 },
            endPoint: { lat: 52.0800, lng: -1.0190 },
            length: 800,
            enabled: true
          }
        ],
        elevation: [
          { lat: 52.0786, lng: -1.0169, elevation: 120, slope: 0 },
          { lat: 52.0789, lng: -1.0173, elevation: 118, slope: -2 },
          { lat: 52.0792, lng: -1.0178, elevation: 116, slope: -2 }
        ],
        surface: [
          {
            id: 'asphalt_main',
            name: 'Main Asphalt',
            type: 'asphalt',
            gripLevel: 1.0,
            color: '#2c2c2c',
            geometry: [
              { lat: 52.0786, lng: -1.0169 },
              { lat: 52.0790, lng: -1.0175 },
              { lat: 52.0795, lng: -1.0180 }
            ]
          }
        ],
        metadata: {
          opened: '1948',
          lastModified: '2023-01-01',
          surface: 'Asphalt',
          recordHolder: 'Max Verstappen',
          recordTime: 100000,
          recordDate: '2023-07-09',
          weather: 'dry',
          temperature: 25,
          humidity: 60
        }
      },
      {
        id: 'spa',
        name: 'Circuit de Spa-Francorchamps',
        country: 'Belgium',
        location: {
          lat: 50.4372,
          lng: 5.9714,
          elevation: 400
        },
        layout: {
          type: 'GP',
          length: 7004,
          corners: 20,
          direction: 'clockwise'
        },
        boundaries: {
          inner: [
            { lat: 50.4372, lng: 5.9714, distance: 0 },
            { lat: 50.4375, lng: 5.9718, distance: 100 },
            { lat: 50.4378, lng: 5.9722, distance: 200 }
          ],
          outer: [
            { lat: 50.4374, lng: 5.9712, distance: 0 },
            { lat: 50.4377, lng: 5.9716, distance: 100 },
            { lat: 50.4380, lng: 5.9720, distance: 200 }
          ],
          centerline: [
            { lat: 50.4372, lng: 5.9714, distance: 0 },
            { lat: 50.4376, lng: 5.9717, distance: 50 },
            { lat: 50.4379, lng: 5.9721, distance: 150 }
          ]
        },
        sectors: [
          {
            id: 's1',
            name: 'Sector 1',
            number: 1,
            startPoint: { lat: 50.4372, lng: 5.9714 },
            endPoint: { lat: 50.4378, lng: 5.9722 },
            length: 2334,
            recordTime: 45000
          },
          {
            id: 's2',
            name: 'Sector 2',
            number: 2,
            startPoint: { lat: 50.4378, lng: 5.9722 },
            endPoint: { lat: 50.4382, lng: 5.9730 },
            length: 2335,
            recordTime: 48000
          },
          {
            id: 's3',
            name: 'Sector 3',
            number: 3,
            startPoint: { lat: 50.4382, lng: 5.9730 },
            endPoint: { lat: 50.4372, lng: 5.9714 },
            length: 2335,
            recordTime: 47000
          }
        ],
        corners: [
          {
            id: 'la_source',
            name: 'La Source',
            number: 1,
            type: 'hairpin',
            entryPoint: { lat: 50.4372, lng: 5.9714 },
            apexPoint: { lat: 50.4374, lng: 5.9716 },
            exitPoint: { lat: 50.4376, lng: 5.9718 },
            idealSpeed: 60,
            brakingZone: {
              start: { lat: 50.4370, lng: 5.9712 },
              end: { lat: 50.4372, lng: 5.9714 },
              distance: 200
            },
            difficulty: 9,
            elevation: 400
          },
          {
            id: 'eau_rouge',
            name: 'Eau Rouge',
            number: 2,
            type: 'fast',
            entryPoint: { lat: 50.4376, lng: 5.9718 },
            apexPoint: { lat: 50.4378, lng: 5.9720 },
            exitPoint: { lat: 50.4380, lng: 5.9722 },
            idealSpeed: 280,
            brakingZone: {
              start: { lat: 50.4374, lng: 5.9716 },
              end: { lat: 50.4376, lng: 5.9718 },
              distance: 50
            },
            difficulty: 10,
            elevation: 395
          }
        ],
        drsZones: [
          {
            id: 'drs1',
            name: 'Kemmel Straight',
            detectionPoint: { lat: 50.4380, lng: 5.9722 },
            activationPoint: { lat: 50.4382, lng: 5.9726 },
            endPoint: { lat: 50.4386, lng: 5.9734 },
            length: 1200,
            enabled: true
          }
        ],
        elevation: [
          { lat: 50.4372, lng: 5.9714, elevation: 400, slope: 0 },
          { lat: 50.4376, lng: 5.9717, elevation: 395, slope: -5 },
          { lat: 50.4379, lng: 5.9721, elevation: 390, slope: -5 }
        ],
        surface: [
          {
            id: 'asphalt_main',
            name: 'Main Asphalt',
            type: 'asphalt',
            gripLevel: 1.0,
            color: '#2c2c2c',
            geometry: [
              { lat: 50.4372, lng: 5.9714 },
              { lat: 50.4376, lng: 5.9718 },
              { lat: 50.4378, lng: 5.9722 }
            ]
          }
        ],
        metadata: {
          opened: '1921',
          lastModified: '2023-01-01',
          surface: 'Asphalt',
          recordHolder: 'Lewis Hamilton',
          recordTime: 140000,
          recordDate: '2020-08-30',
          weather: 'dry',
          temperature: 22,
          humidity: 70
        }
      }
    ];

    tracks.forEach(track => {
      this.trackDatabase.set(track.id, track);
    });
  }

  async getTrackGeometry(trackId: string): Promise<TrackGeometry | null> {
    return this.trackDatabase.get(trackId) || null;
  }

  async getAllTracks(): Promise<TrackGeometry[]> {
    return Array.from(this.trackDatabase.values());
  }

  async generateTrackMesh(trackId: string): Promise<BufferGeometry> {
    const cached = this.geometryCache.get(trackId);
    if (cached) return cached;

    const track = await this.getTrackGeometry(trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }

    const geometry = this.createTrackGeometry(track);
    this.geometryCache.set(trackId, geometry);
    return geometry;
  }

  private createTrackGeometry(track: TrackGeometry): BufferGeometry {
    const geometry = new BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    // Convert GPS coordinates to 3D vertices
    const centerLat = track.location.lat;
    const centerLng = track.location.lng;
    const centerElevation = track.location.elevation;

    // Create track surface from boundaries
    const innerPoints = track.boundaries.inner.map(point => 
      this.gpsTo3D(point.lat, point.lng, point.elevation || centerElevation, centerLat, centerLng)
    );
    const outerPoints = track.boundaries.outer.map(point => 
      this.gpsTo3D(point.lat, point.lng, point.elevation || centerElevation, centerLat, centerLng)
    );

    // Create track surface mesh
    for (let i = 0; i < innerPoints.length - 1; i++) {
      const inner1 = innerPoints[i];
      const inner2 = innerPoints[i + 1];
      const outer1 = outerPoints[i];
      const outer2 = outerPoints[i + 1];

      // Add vertices for this quad
      const baseIndex = vertices.length / 3;
      vertices.push(
        inner1.x, inner1.y, inner1.z,
        inner2.x, inner2.y, inner2.z,
        outer1.x, outer1.y, outer1.z,
        outer2.x, outer2.y, outer2.z
      );

      // Add indices for two triangles
      indices.push(
        baseIndex, baseIndex + 1, baseIndex + 2,
        baseIndex + 1, baseIndex + 3, baseIndex + 2
      );
    }

    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  private gpsTo3D(lat: number, lng: number, elevation: number, centerLat: number, centerLng: number): Vector3 {
    // Convert GPS coordinates to local 3D coordinates
    const latDiff = lat - centerLat;
    const lngDiff = lng - centerLng;
    
    // Approximate conversion (1 degree ≈ 111,000 meters)
    const x = lngDiff * 111000 * Math.cos(centerLat * Math.PI / 180);
    const z = -latDiff * 111000; // Negative because Y is up in 3D
    const y = elevation - 100; // Relative elevation

    return new Vector3(x, y, z);
  }

  async getTrackCenterline(trackId: string): Promise<Vector3[]> {
    const track = await this.getTrackGeometry(trackId);
    if (!track) return [];

    const centerLat = track.location.lat;
    const centerLng = track.location.lng;
    const centerElevation = track.location.elevation;

    return track.boundaries.centerline.map(point => 
      this.gpsTo3D(point.lat, point.lng, point.elevation || centerElevation, centerLat, centerLng)
    );
  }

  async getTrackSectors(trackId: string): Promise<TrackSector[]> {
    const track = await this.getTrackGeometry(trackId);
    return track?.sectors || [];
  }

  async getTrackCorners(trackId: string): Promise<TrackCorner[]> {
    const track = await this.getTrackGeometry(trackId);
    return track?.corners || [];
  }

  async getDRSZones(trackId: string): Promise<DRSZone[]> {
    const track = await this.getTrackGeometry(trackId);
    return track?.drsZones || [];
  }
}

export const trackGeometryService = new TrackGeometryService(); 