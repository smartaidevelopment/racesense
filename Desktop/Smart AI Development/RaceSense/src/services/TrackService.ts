// Comprehensive track service for RaceSense
// Professional track database operations and management

import {
  RacingTrack,
  TrackSearchFilters,
  TrackDetectionResult,
  TrackStatistics,
  TrackPoint,
} from "../types/track";
import {
  RACING_TRACKS,
  TRACKS_BY_TYPE,
  TRACKS_BY_REGION,
} from "../data/tracks";

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface TrackSearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: "name" | "length" | "established" | "country";
  sortOrder?: "asc" | "desc";
}

class TrackService {
  private tracksCache: Map<string, RacingTrack> = new Map();
  private searchIndexes: Map<string, string[]> = new Map();

  constructor() {
    this.initializeService();
  }

  // Initialize service and build search indexes
  private initializeService(): void {
    // Cache all tracks
    RACING_TRACKS.forEach((track) => {
      this.tracksCache.set(track.id, track);
    });

    // Build search indexes
    this.buildSearchIndexes();
  }

  // Build search indexes for efficient searching
  private buildSearchIndexes(): void {
    const nameIndex: string[] = [];
    const countryIndex: string[] = [];
    const typeIndex: string[] = [];

    RACING_TRACKS.forEach((track) => {
      nameIndex.push(track.name.toLowerCase());
      countryIndex.push(track.country.toLowerCase());
      typeIndex.push(track.type.toLowerCase());
    });

    this.searchIndexes.set("name", nameIndex);
    this.searchIndexes.set("country", countryIndex);
    this.searchIndexes.set("type", typeIndex);
  }

  // Get all tracks
  getAllTracks(): RacingTrack[] {
    return [...RACING_TRACKS];
  }

  // Get track by ID
  getTrackById(id: string): RacingTrack | null {
    return this.tracksCache.get(id) || null;
  }

  // Get tracks by type
  getTracksByType(type: RacingTrack["type"]): RacingTrack[] {
    return TRACKS_BY_TYPE[type] || [];
  }

  // Get tracks by region
  getTracksByRegion(region: string): RacingTrack[] {
    return TRACKS_BY_REGION[region] || [];
  }

  // Get tracks by country
  getTracksByCountry(country: string): RacingTrack[] {
    return RACING_TRACKS.filter(
      (track) => track.country.toLowerCase() === country.toLowerCase(),
    );
  }

  // Search tracks with filters
  searchTracks(
    query: string = "",
    filters: TrackSearchFilters = {},
    options: TrackSearchOptions = {},
  ): RacingTrack[] {
    let results = [...RACING_TRACKS];

    // Apply text search
    if (query.trim()) {
      const searchQuery = query.toLowerCase();
      results = results.filter(
        (track) =>
          track.name.toLowerCase().includes(searchQuery) ||
          track.shortName.toLowerCase().includes(searchQuery) ||
          track.country.toLowerCase().includes(searchQuery) ||
          track.city.toLowerCase().includes(searchQuery),
      );
    }

    // Apply filters
    if (filters.country) {
      results = results.filter(
        (track) =>
          track.country.toLowerCase() === filters.country!.toLowerCase(),
      );
    }

    if (filters.type) {
      results = results.filter((track) => track.type === filters.type);
    }

    if (filters.category) {
      results = results.filter((track) => track.category === filters.category);
    }

    if (filters.fiaGrade) {
      results = results.filter(
        (track) => track.metadata.safety.fiaGrade === filters.fiaGrade,
      );
    }

    if (filters.minLength !== undefined) {
      results = results.filter(
        (track) => track.metadata.length >= filters.minLength!,
      );
    }

    if (filters.maxLength !== undefined) {
      results = results.filter(
        (track) => track.metadata.length <= filters.maxLength!,
      );
    }

    if (filters.surface) {
      results = results.filter(
        (track) => track.metadata.surface === filters.surface,
      );
    }

    // Apply sorting
    const { sortBy = "name", sortOrder = "asc" } = options;
    results.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "length":
          aValue = a.metadata.length;
          bValue = b.metadata.length;
          break;
        case "established":
          aValue = a.established;
          bValue = b.established;
          break;
        case "country":
          aValue = a.country;
          bValue = b.country;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const { limit, offset = 0 } = options;
    if (limit !== undefined) {
      results = results.slice(offset, offset + limit);
    }

    return results;
  }

  // Detect track based on GPS position
  async detectTrack(position: GPSPosition): Promise<TrackDetectionResult[]> {
    const detectionResults: TrackDetectionResult[] = [];
    const maxDetectionDistance = 10000; // 10km

    for (const track of RACING_TRACKS) {
      // Skip generic/placeholder tracks
      if (
        track.id.includes("generic") ||
        track.id.includes("autocross-generic")
      ) {
        continue;
      }

      const distance = this.calculateDistance(
        position.latitude,
        position.longitude,
        track.startFinishLine.point1.lat,
        track.startFinishLine.point1.lng,
      );

      if (distance <= maxDetectionDistance) {
        // Calculate confidence based on distance and GPS accuracy
        const maxConfidenceDistance = 1000; // 1km for max confidence
        let confidence = Math.max(
          0,
          (maxConfidenceDistance - distance) / maxConfidenceDistance,
        );

        // Adjust confidence based on GPS accuracy
        if (position.accuracy) {
          const accuracyFactor = Math.max(
            0.1,
            Math.min(1, 100 / position.accuracy),
          );
          confidence *= accuracyFactor;
        }

        detectionResults.push({
          track,
          confidence,
          distance,
        });
      }
    }

    // Sort by confidence (highest first)
    detectionResults.sort((a, b) => b.confidence - a.confidence);

    return detectionResults;
  }

  // Get nearest tracks to a position
  getNearestTracks(
    position: GPSPosition,
    limit: number = 5,
  ): TrackDetectionResult[] {
    const results: TrackDetectionResult[] = [];

    for (const track of RACING_TRACKS) {
      const distance = this.calculateDistance(
        position.latitude,
        position.longitude,
        track.startFinishLine.point1.lat,
        track.startFinishLine.point1.lng,
      );

      results.push({
        track,
        confidence: 1 / (1 + distance / 1000), // Distance-based confidence
        distance,
      });
    }

    // Sort by distance (nearest first)
    results.sort((a, b) => a.distance - b.distance);

    return results.slice(0, limit);
  }

  // Check if position is within track boundaries
  isPositionOnTrack(
    position: GPSPosition,
    trackId: string,
    tolerance: number = 50,
  ): boolean {
    const track = this.getTrackById(trackId);
    if (!track) return false;

    // Check if position is near any point on the track map
    for (const trackPoint of track.trackMap) {
      const distance = this.calculateDistance(
        position.latitude,
        position.longitude,
        trackPoint.lat,
        trackPoint.lng,
      );

      if (distance <= tolerance) {
        return true;
      }
    }

    return false;
  }

  // Check if position is near start/finish line
  isNearStartFinish(
    position: GPSPosition,
    trackId: string,
    tolerance: number = 30,
  ): boolean {
    const track = this.getTrackById(trackId);
    if (!track) return false;

    const distance = this.calculateDistance(
      position.latitude,
      position.longitude,
      track.startFinishLine.point1.lat,
      track.startFinishLine.point1.lng,
    );

    return distance <= tolerance;
  }

  // Get track statistics
  getTrackStatistics(): TrackStatistics {
    const byCountry: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    let longest = RACING_TRACKS[0];
    let shortest = RACING_TRACKS[0];

    for (const track of RACING_TRACKS) {
      // Count by country
      byCountry[track.country] = (byCountry[track.country] || 0) + 1;

      // Count by type
      byType[track.type] = (byType[track.type] || 0) + 1;

      // Count by category
      byCategory[track.category] = (byCategory[track.category] || 0) + 1;

      // Find longest and shortest
      if (track.metadata.length > longest.metadata.length) {
        longest = track;
      }
      if (track.metadata.length < shortest.metadata.length) {
        shortest = track;
      }
    }

    return {
      totalTracks: RACING_TRACKS.length,
      byCountry,
      byType,
      byCategory,
      longest,
      shortest,
    };
  }

  // Calculate distance between two GPS points
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Convert degrees to radians
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get track configurations (if available)
  getTrackConfigurations(trackId: string): string[] {
    const track = this.getTrackById(trackId);
    if (!track || !track.configurations) {
      return [];
    }
    return Object.keys(track.configurations);
  }

  // Get specific track configuration
  getTrackConfiguration(trackId: string, configName: string) {
    const track = this.getTrackById(trackId);
    if (!track || !track.configurations) {
      return null;
    }
    return track.configurations[configName] || null;
  }

  // Check if track supports specific racing series
  isTrackSuitableForSeries(trackId: string, series: string): boolean {
    const track = this.getTrackById(trackId);
    if (!track) return false;

    const seriesRequirements: Record<string, any> = {
      formula1: {
        minLength: 3000,
        fiaGrade: ["1"],
        surface: ["asphalt"],
      },
      motogp: {
        minLength: 3000,
        fiaGrade: ["1", "2"],
        surface: ["asphalt"],
      },
      indycar: {
        minLength: 2000,
        surface: ["asphalt", "concrete"],
      },
      nascar: {
        minLength: 2000,
        surface: ["asphalt", "concrete"],
      },
    };

    const requirements = seriesRequirements[series.toLowerCase()];
    if (!requirements) return true; // No specific requirements

    // Check length requirement
    if (
      requirements.minLength &&
      track.metadata.length < requirements.minLength
    ) {
      return false;
    }

    // Check FIA grade requirement
    if (requirements.fiaGrade && track.metadata.safety.fiaGrade) {
      if (!requirements.fiaGrade.includes(track.metadata.safety.fiaGrade)) {
        return false;
      }
    }

    // Check surface requirement
    if (
      requirements.surface &&
      !requirements.surface.includes(track.metadata.surface)
    ) {
      return false;
    }

    return true;
  }

  // Get famous tracks (Formula 1, MotoGP, etc.)
  getFamousTracks(): RacingTrack[] {
    return RACING_TRACKS.filter(
      (track) =>
        track.type === "formula1" ||
        track.type === "motogp" ||
        track.type === "indycar" ||
        track.type === "nascar",
    );
  }

  // Get club racing tracks
  getClubTracks(): RacingTrack[] {
    return RACING_TRACKS.filter((track) => track.category === "club");
  }

  // Get professional racing tracks
  getProfessionalTracks(): RacingTrack[] {
    return RACING_TRACKS.filter((track) => track.category === "professional");
  }
}

// Export singleton instance
export const trackService = new TrackService();
export default trackService;
