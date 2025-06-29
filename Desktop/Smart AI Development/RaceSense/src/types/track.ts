// Comprehensive track type definitions for RaceSense

export interface TrackPoint {
  lat: number;
  lng: number;
  elevation?: number;
}

export interface TrackSector {
  id: number;
  name: string;
  startPoint: TrackPoint;
  endPoint: TrackPoint;
  length: number; // meters
  type: "straight" | "corner" | "chicane" | "complex";
  difficulty: "easy" | "medium" | "hard" | "extreme";
}

export interface StartFinishLine {
  point1: TrackPoint;
  point2: TrackPoint;
  bearing: number; // degrees, direction perpendicular to start/finish line
  width: number; // meters
}

export interface TrackMetadata {
  length: number; // meters
  elevation: number; // total elevation change in meters
  surface: "asphalt" | "concrete" | "gravel" | "mixed" | "dirt";
  direction: "clockwise" | "counterclockwise" | "point-to-point";
  lapRecord?: {
    time: number; // milliseconds
    driver: string;
    vehicle: string;
    year: number;
  };
  safety: {
    fiaGrade?: "1" | "2" | "3" | "4";
    barriers: ("armco" | "tecpro" | "tire" | "concrete")[];
    runoffAreas: boolean;
  };
  facilities: {
    pitBoxes: number;
    grandstands: number;
    capacity: number;
  };
}

export interface WeatherZone {
  id: string;
  name: string;
  coordinates: TrackPoint;
  radius: number; // meters
}

export interface RacingTrack {
  id: string;
  name: string;
  shortName: string;
  country: string;
  region: string;
  city: string;
  type:
    | "formula1"
    | "indycar"
    | "nascar"
    | "motogp"
    | "wec"
    | "circuit"
    | "autocross"
    | "hillclimb"
    | "drag"
    | "rally"
    | "karting"
    | "drifting";
  category: "professional" | "club" | "private" | "street";
  startFinishLine: StartFinishLine;
  sectors: TrackSector[];
  trackMap: TrackPoint[]; // Complete track outline
  pitLane?: {
    entry: TrackPoint;
    exit: TrackPoint;
    speedLimit: number; // km/h
    boxes: TrackPoint[];
  };
  metadata: TrackMetadata;
  weatherZones: WeatherZone[];
  timezone: string;
  website?: string;
  established: number; // year
  configurations?: {
    [name: string]: {
      length: number;
      sectors: TrackSector[];
      trackMap: TrackPoint[];
    };
  };
}

export interface TrackSearchFilters {
  country?: string;
  type?: RacingTrack["type"];
  category?: RacingTrack["category"];
  fiaGrade?: TrackMetadata["safety"]["fiaGrade"];
  minLength?: number;
  maxLength?: number;
  surface?: TrackMetadata["surface"];
}

export interface TrackDetectionResult {
  track: RacingTrack;
  confidence: number; // 0-1
  distance: number; // meters from current position
}

export interface TrackStatistics {
  totalTracks: number;
  byCountry: Record<string, number>;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  longest: RacingTrack;
  shortest: RacingTrack;
}
