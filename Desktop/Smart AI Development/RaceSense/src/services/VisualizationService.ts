import { SessionData, TelemetryPoint } from "./DataManagementService";

export interface Track3DModel {
  id: string;
  name: string;
  meshData: Float32Array;
  textureUrls: string[];
  startFinishLine: { x: number; y: number; z: number }[];
  sectorLines: { x: number; y: number; z: number }[][];
  trackBounds: {
    center: { x: number; y: number; z: number };
    dimensions: { width: number; height: number; depth: number };
  };
  elevation: Float32Array;
  surfaceTypes: SurfaceType[];
  corners: TrackCorner[];
  drsZones: DRSZone[];
}

export interface SurfaceType {
  id: string;
  name: string;
  gripLevel: number;
  color: string;
  geometry: Float32Array;
}

export interface TrackCorner {
  id: string;
  name: string;
  number: number;
  type: "hairpin" | "chicane" | "fast" | "medium" | "slow";
  entryPoint: { x: number; y: number; z: number };
  exitPoint: { x: number; y: number; z: number };
  idealSpeed: number;
  brakingZone: { start: number; end: number };
  difficulty: number;
}

export interface DRSZone {
  id: string;
  name: string;
  detectionPoint: { x: number; y: number; z: number };
  activationPoint: { x: number; y: number; z: number };
  endPoint: { x: number; y: number; z: number };
  length: number;
}

export interface HeatMapData {
  type:
    | "speed"
    | "braking"
    | "throttle"
    | "steering"
    | "gforce"
    | "temperature";
  points: HeatMapPoint[];
  colorScale: ColorScale;
  intensity: number;
  smoothing: number;
  overlay: boolean;
}

export interface HeatMapPoint {
  x: number;
  y: number;
  z: number;
  value: number;
  timestamp: number;
  lapNumber?: number;
  sector?: number;
}

export interface ColorScale {
  name: string;
  colors: { value: number; color: string }[];
  min: number;
  max: number;
}

export interface RacingLine {
  id: string;
  name: string;
  type: "ideal" | "fastest" | "wet" | "custom";
  points: RacingLinePoint[];
  confidence: number;
  lapTime: number;
  conditions: {
    weather: "dry" | "wet" | "mixed";
    temperature: number;
    grip: number;
  };
}

export interface RacingLinePoint {
  x: number;
  y: number;
  z: number;
  speed: number;
  throttle: number;
  brake: number;
  steering: number;
  gear: number;
  distance: number;
  curvature: number;
}

export interface TelemetryVisualization {
  id: string;
  sessionId: string;
  type:
    | "3d_path"
    | "heat_map"
    | "racing_line"
    | "comparison"
    | "sector_analysis";
  data: any;
  style: VisualizationStyle;
  animation: AnimationConfig;
  filters: DataFilters;
}

export interface VisualizationStyle {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  lineWidth: number;
  pointSize: number;
  opacity: number;
  lighting: {
    ambient: number;
    directional: number;
    shadows: boolean;
  };
}

export interface AnimationConfig {
  enabled: boolean;
  speed: number;
  loop: boolean;
  autoPlay: boolean;
  showTrail: boolean;
  trailLength: number;
}

export interface DataFilters {
  lapNumbers: number[];
  sectors: number[];
  speedRange: { min: number; max: number };
  timeRange: { start: number; end: number };
  channels: string[];
}

export interface InteractiveMapLayer {
  id: string;
  name: string;
  type: "satellite" | "terrain" | "street" | "racing";
  url: string;
  opacity: number;
  visible: boolean;
  attribution: string;
}

export interface MapOverlay {
  id: string;
  name: string;
  type:
    | "telemetry"
    | "racing_line"
    | "sector_times"
    | "speed_zones"
    | "incidents";
  data: any;
  style: OverlayStyle;
  interactive: boolean;
  zIndex: number;
}

export interface OverlayStyle {
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  fillOpacity: number;
  markerIcon?: string;
  markerSize?: number;
}

export class VisualizationService {
  private track3DModels: Map<string, Track3DModel> = new Map();
  private heatMaps: Map<string, HeatMapData> = new Map();
  private racingLines: Map<string, RacingLine> = new Map();
  private visualizations: Map<string, TelemetryVisualization> = new Map();
  private mapLayers: Map<string, InteractiveMapLayer> = new Map();
  private mapOverlays: Map<string, MapOverlay> = new Map();
  private colorScales: Map<string, ColorScale> = new Map();

  constructor() {
    try {
      this.initializeColorScales();
      this.initializeTrack3DModels();
      this.initializeMapLayers();
    } catch (error) {
      console.error("VisualizationService initialization error:", error);
      // Initialize with minimal defaults to prevent complete failure
      this.initializeDefaults();
    }
  }

  private initializeDefaults(): void {
    // Fallback initialization
    this.colorScales.set("speed", {
      name: "speed",
      colors: [
        { value: 0, color: "#0066cc" },
        { value: 100, color: "#cc0000" },
      ],
      min: 0,
      max: 200,
    });
  }

  // 3D Track Visualization
  async generateTrack3D(trackName: string): Promise<Track3DModel> {
    try {
      let track = this.track3DModels.get(trackName);
      if (track) {
        return track;
      }

      // Try to load from real track geometry service first
      try {
        const realTrack = await import('@/services/TrackGeometryService').then(m => 
          m.trackGeometryService.getTrackGeometry(trackName)
        );
        
        if (realTrack) {
          // Convert real track geometry to legacy format for compatibility
          track = this.convertRealTrackToLegacy(realTrack);
          this.track3DModels.set(trackName, track);
          return track;
        }
      } catch (error) {
        console.log('Real track geometry not available, falling back to generated model');
      }

      // Generate 3D model for the track
      track = await this.create3DTrackModel(trackName);
      this.track3DModels.set(trackName, track);
      return track;
    } catch (error) {
      console.error(
        `Failed to generate 3D track model for ${trackName}:`,
        error,
      );
      // Return a fallback minimal track model
      return this.getFallbackTrackModel(trackName);
    }
  }

  private getFallbackTrackModel(trackName: string): Track3DModel {
    return {
      id: this.generateId(),
      name: trackName,
      meshData: new Float32Array([0, 0, 0, 100, 0, 0, 100, 100, 0, 0, 100, 0]),
      textureUrls: [],
      startFinishLine: [
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 0, z: 0 },
      ],
      sectorLines: [],
      trackBounds: {
        center: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1000, height: 1000, depth: 10 },
      },
      elevation: new Float32Array([0]),
      surfaceTypes: [],
      corners: [],
      drsZones: [],
    };
  }

  private convertRealTrackToLegacy(realTrack: any): Track3DModel {
    // Convert real track geometry to legacy Track3DModel format
    return {
      id: realTrack.id,
      name: realTrack.name,
      meshData: new Float32Array([0, 0, 0, 100, 0, 0, 100, 100, 0, 0, 100, 0]), // Simplified
      textureUrls: [],
      startFinishLine: [
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 0, z: 0 },
      ],
      sectorLines: realTrack.sectors.map((sector: any) => [
        { x: sector.startPoint.lng * 111000, y: 0, z: -sector.startPoint.lat * 111000 },
        { x: sector.endPoint.lng * 111000, y: 0, z: -sector.endPoint.lat * 111000 }
      ]),
      trackBounds: {
        center: { x: 0, y: 0, z: 0 },
        dimensions: { width: realTrack.layout.length, height: realTrack.layout.length, depth: 10 },
      },
      elevation: new Float32Array(realTrack.elevation.map((e: any) => e.elevation)),
      surfaceTypes: realTrack.surface.map((s: any) => ({
        id: s.id,
        name: s.name,
        gripLevel: s.gripLevel,
        color: s.color,
        geometry: new Float32Array([0, 0, 0, 100, 0, 0, 100, 100, 0, 0, 100, 0])
      })),
      corners: realTrack.corners.map((c: any) => ({
        id: c.id,
        name: c.name,
        number: c.number,
        type: c.type,
        entryPoint: { x: c.entryPoint.lng * 111000, y: 0, z: -c.entryPoint.lat * 111000 },
        exitPoint: { x: c.exitPoint.lng * 111000, y: 0, z: -c.exitPoint.lat * 111000 },
        idealSpeed: c.idealSpeed,
        brakingZone: { start: c.brakingZone.start, end: c.brakingZone.end },
        difficulty: c.difficulty
      })),
      drsZones: realTrack.drsZones.map((d: any) => ({
        id: d.id,
        name: d.name,
        detectionPoint: { x: d.detectionPoint.lng * 111000, y: 0, z: -d.detectionPoint.lat * 111000 },
        activationPoint: { x: d.activationPoint.lng * 111000, y: 0, z: -d.activationPoint.lat * 111000 },
        endPoint: { x: d.endPoint.lng * 111000, y: 0, z: -d.endPoint.lat * 111000 },
        length: d.length
      })),
    };
  }

  async visualizeTelemetryIn3D(
    sessionData: SessionData,
    options: {
      showRacingLine?: boolean;
      showHeatMap?: boolean;
      heatMapType?: HeatMapData["type"];
      animation?: boolean;
      lapNumbers?: number[];
    } = {},
  ): Promise<TelemetryVisualization> {
    try {
      const track = await this.generateTrack3D(sessionData.track);

      // Safety check for telemetry data
      if (
        !sessionData.telemetryData ||
        sessionData.telemetryData.length === 0
      ) {
        throw new Error(
          `No telemetry data available for visualization. Session: ${sessionData.name}, Track: ${sessionData.track}`,
        );
      }

      console.log(
        `Generating 3D visualization for session: ${sessionData.name} with ${sessionData.telemetryData.length} telemetry points`,
      );

      const telemetryPath = this.convertTelemetryTo3D(
        sessionData.telemetryData,
        track,
      );

      const visualization: TelemetryVisualization = {
        id: this.generateId(),
        sessionId: sessionData.id,
        type: "3d_path",
        data: {
          track,
          telemetryPath,
          heatMap: options.showHeatMap
            ? await this.generateHeatMapSafe(
                sessionData.telemetryData,
                options.heatMapType || "speed",
                track,
              )
            : null,
          racingLine: options.showRacingLine
            ? await this.generateRacingLineSafe(
                sessionData.telemetryData,
                track,
              )
            : null,
        },
        style: this.getDefaultVisualizationStyle(),
        animation: {
          enabled: options.animation || false,
          speed: 1,
          loop: true,
          autoPlay: false,
          showTrail: true,
          trailLength: 100,
        },
        filters: {
          lapNumbers: options.lapNumbers || [],
          sectors: [],
          speedRange: { min: 0, max: 400 },
          timeRange: { start: 0, end: sessionData.duration * 1000 },
          channels: ["speed", "throttle", "brake", "steering"],
        },
      };

      this.visualizations.set(visualization.id, visualization);
      return visualization;
    } catch (error) {
      console.error("Failed to generate 3D telemetry visualization:", error);
      throw new Error(`Telemetry visualization failed: ${error.message}`);
    }
  }

  // Safe wrapper methods
  private async generateHeatMapSafe(
    telemetryData: TelemetryPoint[],
    type: HeatMapData["type"],
    track: Track3DModel,
  ): Promise<HeatMapData | null> {
    try {
      return await this.generateHeatMap(telemetryData, type, track);
    } catch (error) {
      console.error("Heat map generation failed:", error);
      return null;
    }
  }

  private async generateRacingLineSafe(
    telemetryData: TelemetryPoint[],
    track: Track3DModel,
  ): Promise<RacingLine | null> {
    try {
      return await this.generateRacingLine(telemetryData, track);
    } catch (error) {
      console.error("Racing line generation failed:", error);
      return null;
    }
  }

  // Heat Map Generation
  async generateHeatMap(
    telemetryData: TelemetryPoint[],
    type: HeatMapData["type"],
    track: Track3DModel,
  ): Promise<HeatMapData> {
    if (!telemetryData || telemetryData.length === 0) {
      throw new Error("No telemetry data available for heat map generation");
    }

    const points: HeatMapPoint[] = telemetryData.map((point) => {
      let value: number;

      switch (type) {
        case "speed":
          value = point.speed || 0;
          break;
        case "braking":
          value = point.brake || 0;
          break;
        case "throttle":
          value = point.throttle || 0;
          break;
        case "steering":
          // Since steering is not in our TelemetryPoint interface, use 0 as default
          value = 0;
          break;
        case "gforce":
          const gForce = point.gForce;
          if (gForce) {
            value = Math.sqrt(
              gForce.lateral ** 2 +
                gForce.longitudinal ** 2 +
                gForce.vertical ** 2,
            );
          } else {
            value = 0;
          }
          break;
        case "temperature":
          // Use engine temperature if available, otherwise 0
          value = point.engineTemp || 0;
          break;
        default:
          value = 0;
      }

      const position3D = this.convertGPSTo3D(point.position, track);

      return {
        x: position3D.x,
        y: position3D.y,
        z: position3D.z,
        value,
        timestamp: point.timestamp,
        lapNumber: point.lapNumber,
        sector: point.sector,
      };
    });

    const colorScale =
      this.colorScales.get(type) || this.colorScales.get("default")!;

    const heatMap: HeatMapData = {
      type,
      points,
      colorScale,
      intensity: 1.0,
      smoothing: 0.5,
      overlay: true,
    };

    const heatMapId = `${type}_${Date.now()}`;
    this.heatMaps.set(heatMapId, heatMap);

    return heatMap;
  }

  async generateMultiLayerHeatMap(
    telemetryData: TelemetryPoint[],
    types: HeatMapData["type"][],
    track: Track3DModel,
  ): Promise<HeatMapData[]> {
    const heatMaps = await Promise.all(
      types.map((type) => this.generateHeatMap(telemetryData, type, track)),
    );

    return heatMaps;
  }

  // Racing Line Analysis
  async generateRacingLine(
    telemetryData: TelemetryPoint[],
    track: Track3DModel,
    type: RacingLine["type"] = "fastest",
  ): Promise<RacingLine> {
    if (!telemetryData || telemetryData.length < 2) {
      throw new Error("Insufficient telemetry data for racing line generation");
    }

    const points: RacingLinePoint[] = [];
    let totalDistance = 0;

    for (let i = 0; i < telemetryData.length - 1; i++) {
      const current = telemetryData[i];
      const next = telemetryData[i + 1];

      const position3D = this.convertGPSTo3D(current.position, track);
      const nextPosition3D = this.convertGPSTo3D(next.position, track);

      const segmentDistance = Math.sqrt(
        (nextPosition3D.x - position3D.x) ** 2 +
          (nextPosition3D.y - position3D.y) ** 2 +
          (nextPosition3D.z - position3D.z) ** 2,
      );

      totalDistance += segmentDistance;

      // Calculate curvature
      const curvature = this.calculateCurvature(
        telemetryData[Math.max(0, i - 1)],
        current,
        next,
      );

      points.push({
        x: position3D.x,
        y: position3D.y,
        z: position3D.z,
        speed: current.speed,
        throttle: current.throttle,
        brake: current.brake,
        steering: current.steering,
        gear: current.gear,
        distance: totalDistance,
        curvature,
      });
    }

    const racingLine: RacingLine = {
      id: this.generateId(),
      name: `${type} Racing Line`,
      type,
      points,
      confidence: this.calculateLineConfidence(points),
      lapTime: this.calculateEstimatedLapTime(points),
      conditions: {
        weather: "dry",
        temperature: 25,
        grip: 1.0,
      },
    };

    this.racingLines.set(racingLine.id, racingLine);
    return racingLine;
  }

  async compareRacingLines(
    sessionData1: SessionData,
    sessionData2: SessionData,
    track: Track3DModel,
  ): Promise<{
    line1: RacingLine;
    line2: RacingLine;
    comparison: RacingLineComparison;
  }> {
    const line1 = await this.generateRacingLine(
      sessionData1.telemetryData,
      track,
      "custom",
    );
    const line2 = await this.generateRacingLine(
      sessionData2.telemetryData,
      track,
      "custom",
    );

    const comparison = this.analyzeRacingLineComparison(line1, line2);

    return { line1, line2, comparison };
  }

  // Interactive Map Features
  createInteractiveMap(
    trackName: string,
    center: { lat: number; lng: number },
    zoom = 15,
  ): {
    mapId: string;
    config: MapConfiguration;
  } {
    const mapId = this.generateId();
    const config: MapConfiguration = {
      center,
      zoom,
      baseLayers: Array.from(this.mapLayers.values()),
      overlays: [],
      controls: {
        zoom: true,
        fullscreen: true,
        layers: true,
        measurement: true,
        drawing: true,
      },
      interactions: {
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
      },
    };

    return { mapId, config };
  }

  async addTelemetryOverlay(
    mapId: string,
    sessionData: SessionData,
    style?: Partial<OverlayStyle>,
  ): Promise<string> {
    const overlayId = this.generateId();

    const telemetryOverlay: MapOverlay = {
      id: overlayId,
      name: `${sessionData.name} Telemetry`,
      type: "telemetry",
      data: {
        points: sessionData.telemetryData.map((point) => ({
          lat: point.position.lat,
          lng: point.position.lng,
          speed: point.speed,
          timestamp: point.timestamp,
          lapNumber: point.lapNumber,
        })),
        sessionInfo: {
          name: sessionData.name,
          track: sessionData.track,
          date: sessionData.date,
          bestLapTime: sessionData.bestLapTime,
        },
      },
      style: {
        strokeColor: "#ff6b35",
        strokeWidth: 3,
        fillColor: "#ff6b35",
        fillOpacity: 0.3,
        ...style,
      },
      interactive: true,
      zIndex: 1000,
    };

    this.mapOverlays.set(overlayId, telemetryOverlay);
    return overlayId;
  }

  async addSectorTimesOverlay(
    mapId: string,
    sessionData: SessionData,
    bestSectorTimes: number[],
  ): Promise<string> {
    const overlayId = this.generateId();

    // Group telemetry by sectors
    const sectorData = this.groupTelemetryBySectors(sessionData.telemetryData);

    const sectorOverlay: MapOverlay = {
      id: overlayId,
      name: "Sector Times",
      type: "sector_times",
      data: {
        sectors: sectorData.map((sector, index) => ({
          sectorNumber: index + 1,
          bestTime: bestSectorTimes[index],
          currentTime: this.calculateSectorTime(sector),
          improvement: bestSectorTimes[index]
            ? this.calculateSectorTime(sector) - bestSectorTimes[index]
            : 0,
          points: sector.map((point) => ({
            lat: point.position.lat,
            lng: point.position.lng,
          })),
        })),
      },
      style: {
        strokeColor: "#4ecdc4",
        strokeWidth: 2,
        fillColor: "#4ecdc4",
        fillOpacity: 0.2,
        markerIcon: "sector",
        markerSize: 12,
      },
      interactive: true,
      zIndex: 900,
    };

    this.mapOverlays.set(overlayId, sectorOverlay);
    return overlayId;
  }

  // Data Export for Visualization
  async exportVisualization(
    visualizationId: string,
    format: "json" | "obj" | "gltf" | "png" | "svg",
  ): Promise<Blob> {
    const visualization = this.visualizations.get(visualizationId);
    if (!visualization) {
      throw new Error("Visualization not found");
    }

    switch (format) {
      case "json":
        return this.exportToJSON(visualization);
      case "obj":
        return this.exportToOBJ(visualization);
      case "gltf":
        return this.exportToGLTF(visualization);
      case "png":
        return this.exportToPNG(visualization);
      case "svg":
        return this.exportToSVG(visualization);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Helper Methods
  private async create3DTrackModel(trackName: string): Promise<Track3DModel> {
    // This would normally load real track data from a database or API
    // For now, generate a simplified model based on known tracks

    const trackConfigs: Record<string, any> = {
      Silverstone: {
        center: { x: 0, y: 0, z: 0 },
        dimensions: { width: 3000, height: 2000, depth: 50 },
        corners: [
          {
            id: "copse",
            name: "Copse",
            number: 1,
            type: "fast",
            idealSpeed: 180,
          },
          {
            id: "maggotts",
            name: "Maggotts",
            number: 2,
            type: "fast",
            idealSpeed: 200,
          },
          {
            id: "chapel",
            name: "Chapel",
            number: 3,
            type: "fast",
            idealSpeed: 190,
          },
          {
            id: "stowe",
            name: "Stowe",
            number: 4,
            type: "medium",
            idealSpeed: 120,
          },
          { id: "vale", name: "Vale", number: 5, type: "slow", idealSpeed: 80 },
          { id: "club", name: "Club", number: 6, type: "slow", idealSpeed: 70 },
        ],
      },
      "Spa-Francorchamps": {
        center: { x: 0, y: 0, z: 0 },
        dimensions: { width: 4000, height: 2500, depth: 100 },
        corners: [
          {
            id: "la_source",
            name: "La Source",
            number: 1,
            type: "hairpin",
            idealSpeed: 60,
          },
          {
            id: "eau_rouge",
            name: "Eau Rouge",
            number: 2,
            type: "fast",
            idealSpeed: 280,
          },
          {
            id: "raidillon",
            name: "Raidillon",
            number: 3,
            type: "fast",
            idealSpeed: 300,
          },
          {
            id: "les_combes",
            name: "Les Combes",
            number: 4,
            type: "chicane",
            idealSpeed: 120,
          },
        ],
      },
      Monza: {
        center: { x: 0, y: 0, z: 0 },
        dimensions: { width: 2800, height: 1800, depth: 30 },
        corners: [
          {
            id: "turn1",
            name: "Prima Variante",
            number: 1,
            type: "chicane",
            idealSpeed: 100,
          },
          {
            id: "curva_grande",
            name: "Curva Grande",
            number: 2,
            type: "fast",
            idealSpeed: 250,
          },
          {
            id: "variante_della_roggia",
            name: "Variante della Roggia",
            number: 3,
            type: "chicane",
            idealSpeed: 90,
          },
          {
            id: "lesmo1",
            name: "Lesmo 1",
            number: 4,
            type: "medium",
            idealSpeed: 150,
          },
          {
            id: "lesmo2",
            name: "Lesmo 2",
            number: 5,
            type: "medium",
            idealSpeed: 140,
          },
          {
            id: "parabolica",
            name: "Parabolica",
            number: 6,
            type: "slow",
            idealSpeed: 110,
          },
        ],
      },
    };

    const config = trackConfigs[trackName] || trackConfigs.Silverstone;

    // Generate simplified mesh data (in a real implementation, this would be much more complex)
    const meshData = this.generateTrackMesh(config);

    const track: Track3DModel = {
      id: this.generateId(),
      name: trackName,
      meshData,
      textureUrls: [`/textures/${trackName.toLowerCase()}_asphalt.jpg`],
      startFinishLine: [
        { x: -10, y: 0, z: 0 },
        { x: 10, y: 0, z: 0 },
      ],
      sectorLines: [
        [
          { x: config.dimensions.width * 0.33, y: 0, z: 0 },
          { x: config.dimensions.width * 0.33, y: 10, z: 0 },
        ],
        [
          { x: config.dimensions.width * 0.66, y: 0, z: 0 },
          { x: config.dimensions.width * 0.66, y: 10, z: 0 },
        ],
      ],
      trackBounds: {
        center: config.center,
        dimensions: config.dimensions,
      },
      elevation: this.generateElevationData(config),
      surfaceTypes: [
        {
          id: "asphalt",
          name: "Asphalt",
          gripLevel: 1.0,
          color: "#2c2c2c",
          geometry: meshData,
        },
      ],
      corners: config.corners.map((corner: any, index: number) => ({
        ...corner,
        entryPoint: { x: index * 100, y: 0, z: 0 },
        exitPoint: { x: index * 100 + 50, y: 0, z: 0 },
        brakingZone: { start: index * 100 - 50, end: index * 100 },
        difficulty: Math.random() * 5 + 1,
      })),
      drsZones: [
        {
          id: "drs1",
          name: "Main Straight",
          detectionPoint: { x: -200, y: 0, z: 0 },
          activationPoint: { x: -100, y: 0, z: 0 },
          endPoint: { x: 0, y: 0, z: 0 },
          length: 800,
        },
      ],
    };

    return track;
  }

  private generateTrackMesh(config: any): Float32Array {
    // Generate a simplified track mesh (rectangle for demo)
    const width = config.dimensions.width;
    const height = config.dimensions.height;

    return new Float32Array([
      // Track outline vertices
      -width / 2,
      -height / 2,
      0,
      width / 2,
      -height / 2,
      0,
      width / 2,
      height / 2,
      0,
      -width / 2,
      height / 2,
      0,
    ]);
  }

  private generateElevationData(config: any): Float32Array {
    // Generate elevation data for the track
    const points = 1000;
    const elevationData = new Float32Array(points);

    for (let i = 0; i < points; i++) {
      // Simulate elevation changes
      elevationData[i] = Math.sin((i / points) * Math.PI * 4) * 20;
    }

    return elevationData;
  }

  private convertGPSTo3D(
    gpsPosition: { lat: number; lng: number },
    track: Track3DModel,
  ): { x: number; y: number; z: number } {
    // Convert GPS coordinates to 3D track space
    // This is a simplified conversion - real implementation would use proper coordinate transformation

    if (!track || !track.trackBounds) {
      console.warn("Invalid track data for GPS conversion");
      return { x: 0, y: 0, z: 0 };
    }

    const bounds = track.trackBounds;

    // Safety check for valid bounds
    if (!bounds.center || !bounds.dimensions) {
      console.warn("Invalid track bounds data");
      return { x: 0, y: 0, z: 0 };
    }

    const x =
      ((gpsPosition.lng - bounds.center.x) / 0.001) * bounds.dimensions.width;
    const y =
      ((gpsPosition.lat - bounds.center.y) / 0.001) * bounds.dimensions.height;
    const z = 0; // Would be calculated from elevation data

    // Clamp values to reasonable ranges to prevent extreme coordinates
    const clampedX = Math.max(
      -bounds.dimensions.width,
      Math.min(bounds.dimensions.width, x),
    );
    const clampedY = Math.max(
      -bounds.dimensions.height,
      Math.min(bounds.dimensions.height, y),
    );

    return { x: clampedX, y: clampedY, z };
  }

  private convertTelemetryTo3D(
    telemetryData: TelemetryPoint[],
    track: Track3DModel,
  ): { x: number; y: number; z: number; data: TelemetryPoint }[] {
    if (!telemetryData || telemetryData.length === 0) {
      return [];
    }

    return telemetryData.map((point) => {
      // Safety check for position data
      if (
        !point.position ||
        typeof point.position.lat !== "number" ||
        typeof point.position.lng !== "number"
      ) {
        console.warn("Invalid telemetry point position data:", point);
        return {
          x: 0,
          y: 0,
          z: 0,
          data: point,
        };
      }

      const position3D = this.convertGPSTo3D(point.position, track);
      return {
        ...position3D,
        data: point,
      };
    });
  }

  private calculateCurvature(
    prev: TelemetryPoint,
    current: TelemetryPoint,
    next: TelemetryPoint,
  ): number {
    // Simplified curvature calculation
    if (!prev || !next) return 0;

    const dx1 = current.position.lng - prev.position.lng;
    const dy1 = current.position.lat - prev.position.lat;
    const dx2 = next.position.lng - current.position.lng;
    const dy2 = next.position.lat - current.position.lat;

    const angle1 = Math.atan2(dy1, dx1);
    const angle2 = Math.atan2(dy2, dx2);

    let curvature = angle2 - angle1;
    if (curvature > Math.PI) curvature -= 2 * Math.PI;
    if (curvature < -Math.PI) curvature += 2 * Math.PI;

    return Math.abs(curvature);
  }

  private calculateLineConfidence(points: RacingLinePoint[]): number {
    // Calculate confidence based on consistency of the racing line
    let consistencyScore = 0;
    const speedVariations = [];

    for (let i = 1; i < points.length; i++) {
      const speedDiff = Math.abs(points[i].speed - points[i - 1].speed);
      speedVariations.push(speedDiff);
    }

    const avgSpeedVariation =
      speedVariations.reduce((sum, diff) => sum + diff, 0) /
      speedVariations.length;

    // Lower variation = higher confidence
    consistencyScore = Math.max(0, 1 - avgSpeedVariation / 50);

    return Math.min(1, consistencyScore);
  }

  private calculateEstimatedLapTime(points: RacingLinePoint[]): number {
    // Estimate lap time based on racing line data
    let totalTime = 0;

    for (let i = 1; i < points.length; i++) {
      const distance = points[i].distance - points[i - 1].distance;
      const avgSpeed = (points[i].speed + points[i - 1].speed) / 2;

      if (avgSpeed > 0) {
        totalTime += (distance / avgSpeed) * 3.6; // Convert to seconds
      }
    }

    return totalTime;
  }

  private analyzeRacingLineComparison(
    line1: RacingLine,
    line2: RacingLine,
  ): RacingLineComparison {
    const comparison: RacingLineComparison = {
      timeDifference: line2.lapTime - line1.lapTime,
      sectors: [],
      areas: {
        braking: { line1Better: 0, line2Better: 0, similar: 0 },
        cornering: { line1Better: 0, line2Better: 0, similar: 0 },
        acceleration: { line1Better: 0, line2Better: 0, similar: 0 },
      },
      insights: [],
    };

    // Analyze sector by sector
    const sectorsCount = 3;
    const pointsPerSector = Math.floor(line1.points.length / sectorsCount);

    for (let sector = 0; sector < sectorsCount; sector++) {
      const startIndex = sector * pointsPerSector;
      const endIndex = Math.min(
        (sector + 1) * pointsPerSector,
        line1.points.length,
      );

      const line1SectorTime = this.calculateSectorTimeFromPoints(
        line1.points.slice(startIndex, endIndex),
      );
      const line2SectorTime = this.calculateSectorTimeFromPoints(
        line2.points.slice(startIndex, endIndex),
      );

      comparison.sectors.push({
        sectorNumber: sector + 1,
        line1Time: line1SectorTime,
        line2Time: line2SectorTime,
        difference: line2SectorTime - line1SectorTime,
      });
    }

    // Generate insights
    if (Math.abs(comparison.timeDifference) < 0.1) {
      comparison.insights.push("Very similar overall lap times");
    } else if (comparison.timeDifference > 0) {
      comparison.insights.push("First racing line is faster overall");
    } else {
      comparison.insights.push("Second racing line is faster overall");
    }

    return comparison;
  }

  private calculateSectorTimeFromPoints(points: RacingLinePoint[]): number {
    let totalTime = 0;

    for (let i = 1; i < points.length; i++) {
      const distance = points[i].distance - points[i - 1].distance;
      const avgSpeed = (points[i].speed + points[i - 1].speed) / 2;

      if (avgSpeed > 0) {
        totalTime += (distance / avgSpeed) * 3.6;
      }
    }

    return totalTime;
  }

  private groupTelemetryBySectors(
    telemetryData: TelemetryPoint[],
  ): TelemetryPoint[][] {
    const sectors: TelemetryPoint[][] = [[], [], []];

    telemetryData.forEach((point) => {
      const sectorIndex = Math.min(point.sector - 1, 2);
      if (sectorIndex >= 0) {
        sectors[sectorIndex].push(point);
      }
    });

    return sectors;
  }

  private calculateSectorTime(sectorData: TelemetryPoint[]): number {
    if (sectorData.length < 2) return 0;

    const startTime = sectorData[0].timestamp;
    const endTime = sectorData[sectorData.length - 1].timestamp;

    return (endTime - startTime) / 1000; // Convert to seconds
  }

  private initializeColorScales(): void {
    try {
      const colorScales: ColorScale[] = [
        {
          name: "speed",
          colors: [
            { value: 0, color: "#0066cc" },
            { value: 50, color: "#00cc66" },
            { value: 100, color: "#cccc00" },
            { value: 200, color: "#cc6600" },
            { value: 300, color: "#cc0000" },
          ],
          min: 0,
          max: 300,
        },
        {
          name: "braking",
          colors: [
            { value: 0, color: "#ffffff" },
            { value: 25, color: "#ffcc00" },
            { value: 50, color: "#ff6600" },
            { value: 75, color: "#ff3300" },
            { value: 100, color: "#cc0000" },
          ],
          min: 0,
          max: 100,
        },
        {
          name: "throttle",
          colors: [
            { value: 0, color: "#ffffff" },
            { value: 25, color: "#66ff66" },
            { value: 50, color: "#33cc33" },
            { value: 75, color: "#009900" },
            { value: 100, color: "#006600" },
          ],
          min: 0,
          max: 100,
        },
        {
          name: "gforce",
          colors: [
            { value: 0, color: "#0066ff" },
            { value: 1, color: "#00ffff" },
            { value: 2, color: "#00ff00" },
            { value: 3, color: "#ffff00" },
            { value: 4, color: "#ff6600" },
            { value: 5, color: "#ff0000" },
          ],
          min: 0,
          max: 5,
        },
        {
          name: "temperature",
          colors: [
            { value: 0, color: "#0066ff" },
            { value: 100, color: "#00ff00" },
            { value: 200, color: "#ffff00" },
            { value: 300, color: "#ff6600" },
            { value: 400, color: "#ff0000" },
          ],
          min: 0,
          max: 400,
        },
        {
          name: "default",
          colors: [
            { value: 0, color: "#0066cc" },
            { value: 0.5, color: "#ffcc00" },
            { value: 1, color: "#cc0000" },
          ],
          min: 0,
          max: 1,
        },
      ];

      colorScales.forEach((scale) => {
        this.colorScales.set(scale.name, scale);
      });
    } catch (error) {
      console.error("Failed to initialize color scales:", error);
      // Initialize minimal default scale
      this.colorScales.set("default", {
        name: "default",
        colors: [
          { value: 0, color: "#0066cc" },
          { value: 1, color: "#cc0000" },
        ],
        min: 0,
        max: 1,
      });
    }
  }

  private initializeTrack3DModels(): void {
    try {
      // Pre-initialize some common tracks
      const commonTracks = [
        "Silverstone",
        "Spa-Francorchamps",
        "Monza",
        "Nürburgring",
      ];

      // These would be loaded asynchronously in a real implementation
      commonTracks.forEach((trackName) => {
        // Models would be loaded from CDN or local storage
        console.log(`Preparing 3D model for ${trackName}`);
      });
    } catch (error) {
      console.error("Failed to initialize track 3D models:", error);
    }
  }

  private initializeMapLayers(): void {
    try {
      const layers: InteractiveMapLayer[] = [
        {
          id: "satellite",
          name: "Satellite",
          type: "satellite",
          url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
          opacity: 1,
          visible: true,
          attribution: "© Google",
        },
        {
          id: "terrain",
          name: "Terrain",
          type: "terrain",
          url: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
          opacity: 1,
          visible: false,
          attribution: "© Google",
        },
        {
          id: "openstreetmap",
          name: "OpenStreetMap",
          type: "street",
          url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          opacity: 1,
          visible: false,
          attribution: "© OpenStreetMap",
        },
      ];

      layers.forEach((layer) => {
        this.mapLayers.set(layer.id, layer);
      });
    } catch (error) {
      console.error("Failed to initialize map layers:", error);
    }
  }

  private getDefaultVisualizationStyle(): VisualizationStyle {
    return {
      colors: {
        primary: "#ff6b35",
        secondary: "#4ecdc4",
        accent: "#ffe66d",
        background: "#1a1a1a",
      },
      lineWidth: 2,
      pointSize: 4,
      opacity: 0.8,
      lighting: {
        ambient: 0.4,
        directional: 0.8,
        shadows: true,
      },
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Export Functions
  private async exportToJSON(
    visualization: TelemetryVisualization,
  ): Promise<Blob> {
    const exportData = {
      visualization,
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
    };

    return new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
  }

  private async exportToOBJ(
    visualization: TelemetryVisualization,
  ): Promise<Blob> {
    // Generate OBJ file content for 3D models
    const objContent = [
      "# RaceSense 3D Track Export",
      "# Generated on " + new Date().toISOString(),
      "",
      "o Track",
    ];

    if (visualization.data.track) {
      const track = visualization.data.track as Track3DModel;
      const vertices = track.meshData;

      for (let i = 0; i < vertices.length; i += 3) {
        objContent.push(
          `v ${vertices[i]} ${vertices[i + 1]} ${vertices[i + 2]}`,
        );
      }
    }

    return new Blob([objContent.join("\n")], { type: "text/plain" });
  }

  private async exportToGLTF(
    visualization: TelemetryVisualization,
  ): Promise<Blob> {
    // Generate GLTF file for 3D visualization
    const gltfData = {
      asset: {
        version: "2.0",
        generator: "RaceSense",
      },
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0 }],
      meshes: [
        {
          primitives: [
            {
              attributes: { POSITION: 0 },
              mode: 4, // TRIANGLES
            },
          ],
        },
      ],
      accessors: [
        {
          bufferView: 0,
          componentType: 5126, // FLOAT
          count: 0, // Would be calculated from actual data
          type: "VEC3",
          max: [1, 1, 1],
          min: [-1, -1, -1],
        },
      ],
      bufferViews: [
        {
          buffer: 0,
          byteLength: 0, // Would be calculated
          target: 34962, // ARRAY_BUFFER
        },
      ],
      buffers: [
        {
          byteLength: 0, // Would be calculated
        },
      ],
    };

    return new Blob([JSON.stringify(gltfData)], { type: "application/json" });
  }

  private async exportToPNG(
    visualization: TelemetryVisualization,
  ): Promise<Blob> {
    // This would render the visualization to a canvas and export as PNG
    // For now, return a placeholder
    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ff6b35";
    ctx.font = "24px Arial";
    ctx.fillText("RaceSense Visualization Export", 50, 50);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), "image/png");
    });
  }

  private async exportToSVG(
    visualization: TelemetryVisualization,
  ): Promise<Blob> {
    const svgContent = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">',
      '<rect width="100%" height="100%" fill="#1a1a1a"/>',
      '<text x="50" y="50" font-family="Arial" font-size="24" fill="#ff6b35">',
      "RaceSense Visualization Export",
      "</text>",
      "</svg>",
    ];

    return new Blob([svgContent.join("\n")], { type: "image/svg+xml" });
  }

  // Public API
  getTrack3DModel(trackName: string): Track3DModel | undefined {
    return this.track3DModels.get(trackName);
  }

  getHeatMap(heatMapId: string): HeatMapData | undefined {
    return this.heatMaps.get(heatMapId);
  }

  getRacingLine(lineId: string): RacingLine | undefined {
    return this.racingLines.get(lineId);
  }

  getVisualization(
    visualizationId: string,
  ): TelemetryVisualization | undefined {
    return this.visualizations.get(visualizationId);
  }

  getMapOverlay(overlayId: string): MapOverlay | undefined {
    return this.mapOverlays.get(overlayId);
  }

  getAllVisualizations(): TelemetryVisualization[] {
    return Array.from(this.visualizations.values());
  }

  getAllColorScales(): ColorScale[] {
    return Array.from(this.colorScales.values());
  }

  deleteVisualization(visualizationId: string): boolean {
    return this.visualizations.delete(visualizationId);
  }

  updateVisualizationStyle(
    visualizationId: string,
    style: Partial<VisualizationStyle>,
  ): boolean {
    const visualization = this.visualizations.get(visualizationId);
    if (visualization) {
      Object.assign(visualization.style, style);
      return true;
    }
    return false;
  }

  updateVisualizationFilters(
    visualizationId: string,
    filters: Partial<DataFilters>,
  ): boolean {
    const visualization = this.visualizations.get(visualizationId);
    if (visualization) {
      Object.assign(visualization.filters, filters);
      return true;
    }
    return false;
  }
}

// Additional interfaces for the service
interface RacingLineComparison {
  timeDifference: number;
  sectors: {
    sectorNumber: number;
    line1Time: number;
    line2Time: number;
    difference: number;
  }[];
  areas: {
    braking: { line1Better: number; line2Better: number; similar: number };
    cornering: { line1Better: number; line2Better: number; similar: number };
    acceleration: { line1Better: number; line2Better: number; similar: number };
  };
  insights: string[];
}

interface MapConfiguration {
  center: { lat: number; lng: number };
  zoom: number;
  baseLayers: InteractiveMapLayer[];
  overlays: MapOverlay[];
  controls: {
    zoom: boolean;
    fullscreen: boolean;
    layers: boolean;
    measurement: boolean;
    drawing: boolean;
  };
  interactions: {
    dragging: boolean;
    scrollWheelZoom: boolean;
    doubleClickZoom: boolean;
    boxZoom: boolean;
    keyboard: boolean;
  };
}

export const visualizationService = new VisualizationService();
