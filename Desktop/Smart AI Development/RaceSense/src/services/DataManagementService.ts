// Data Management Service
// Compatible with existing DataManagement page and enhanced with professional export capabilities

import { dataExportService, ExportFormat } from "./DataExportService";

export interface TelemetryPoint {
  timestamp: number;
  position: {
    lat: number;
    lng: number;
  };
  speed: number; // km/h
  rpm?: number;
  throttle?: number; // 0-100%
  brake?: number; // 0-100%
  gear?: number;
  engineTemp?: number; // Celsius
  gForce?: {
    lateral: number;
    longitudinal: number;
    vertical: number;
  };
  tireTemps?: {
    frontLeft: number;
    frontRight: number;
    rearLeft: number;
    rearRight: number;
  };
}

export interface SessionData {
  id: string;
  name: string;
  track: string;
  type: "practice" | "qualifying" | "race" | "test";
  date: Date;
  duration: number; // seconds
  bestLapTime?: number; // milliseconds
  totalLaps: number;
  notes: string;
  telemetryData?: TelemetryPoint[];
  gpsData?: any[];
  metadata: {
    weather?: string;
    temperature?: number;
    trackCondition?: string;
    vehicleSetup?: any;
    importSource?: string;
    maxSpeed?: number;
    dataPoints?: number;
    vehicle?: string;
    channels?: string[];
  };
  syncStatus?: {
    isUploaded: boolean;
    cloudProvider?: string;
    lastSync?: Date;
  };
}

interface SessionAnalytics {
  totalSessions: number;
  totalTrackTime: number; // seconds
  bestLapTime?: number; // milliseconds
  tracksVisited: string[];
  averageSessionDuration: number;
  totalDistance: number; // kilometers
  recentActivity: {
    lastSessionDate?: Date;
    sessionsThisWeek: number;
    sessionsThisMonth: number;
  };
}

class DataManagementService {
  private sessions: Map<string, SessionData> = new Map();
  private exportFormats: ExportFormat[] = [];

  constructor() {
    this.loadSessions();
    this.exportFormats = dataExportService.getSupportedFormats();
  }

  // Session Management
  getAllSessions(): SessionData[] {
    const sessions = Array.from(this.sessions.values()).sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
    
    console.log(`=== Getting all sessions ===`);
    console.log(`Total sessions in Map: ${this.sessions.size}`);
    console.log(`Returning ${sessions.length} sessions`);
    
    sessions.forEach((session, index) => {
      console.log(`Session ${index + 1}: ${session.name} (ID: ${session.id})`);
      console.log(`  - Telemetry data length: ${session.telemetryData?.length || 0}`);
      console.log(`  - Has telemetry data: ${!!session.telemetryData}`);
      console.log(`  - Session object keys:`, Object.keys(session));
    });
    
    return sessions;
  }

  getSession(sessionId: string): SessionData | null {
    console.log(`=== Getting session: ${sessionId} ===`);
    const session = this.sessions.get(sessionId);
    if (session) {
      console.log(`✓ Retrieved session: ${session.name}`);
      console.log(`Session ID: ${session.id}`);
      console.log(`Telemetry data length: ${session.telemetryData?.length || 0}`);
      console.log(`Has telemetry data: ${!!session.telemetryData}`);
      console.log(`Session object keys:`, Object.keys(session));
      
      if (session.telemetryData && session.telemetryData.length > 0) {
        console.log(`First telemetry point:`, {
          timestamp: session.telemetryData[0].timestamp,
          position: session.telemetryData[0].position,
          speed: session.telemetryData[0].speed
        });
      } else {
        console.warn(`⚠️ Session has no telemetry data!`);
      }
    } else {
      console.log(`✗ Session not found: ${sessionId}`);
      console.log(`Available session IDs:`, Array.from(this.sessions.keys()));
    }
    return session || null;
  }

  addSession(session: Omit<SessionData, "id">): string {
    const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newSession: SessionData = {
      ...session,
      id,
    };

    console.log(`=== Adding session: ${newSession.name} ===`);
    console.log(`Session ID: ${id}`);
    console.log(`Telemetry data length: ${newSession.telemetryData?.length || 0}`);
    console.log(`Has telemetry data: ${!!newSession.telemetryData}`);
    console.log(`Session object keys:`, Object.keys(newSession));
    
    if (newSession.telemetryData && newSession.telemetryData.length > 0) {
      console.log(`First telemetry point:`, {
        timestamp: newSession.telemetryData[0].timestamp,
        position: newSession.telemetryData[0].position,
        speed: newSession.telemetryData[0].speed
      });
    }
    
    this.sessions.set(id, newSession);
    console.log(`Session added to Map. Map size: ${this.sessions.size}`);
    
    this.saveSessions();
    console.log(`Session saved to localStorage`);
    
    // Verify the session was saved correctly
    const savedSession = this.getSession(id);
    if (savedSession) {
      console.log(`✓ Session verified after save: ${savedSession.name} with ${savedSession.telemetryData?.length || 0} telemetry points`);
    } else {
      console.error(`✗ Failed to retrieve session after save: ${id}`);
    }
    
    console.log(`Session saved with ID: ${id}`);
    return id;
  }

  updateSession(sessionId: string, updates: Partial<SessionData>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const updatedSession = { ...session, ...updates };
    this.sessions.set(sessionId, updatedSession);
    this.saveSessions();
    return true;
  }

  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      this.saveSessions();
    }
    return deleted;
  }

  // Export functionality
  async exportSession(sessionId: string, format: string): Promise<Blob> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Use the comprehensive DataExportService
    return await dataExportService.exportSession(sessionId, format, {
      format,
      includeRawData: true,
      includeTelemetry: true,
      includeAnalysis: true,
      includeCharts: false, // Charts would be too large for individual exports
    });
  }

  async generateSessionReport(
    sessionId: string,
    format: "pdf" | "html" | "docx" = "pdf",
  ): Promise<Blob> {
    return await dataExportService.generateSessionReport(sessionId, format);
  }

  // Import functionality
  async importSession(file: File): Promise<string> {
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (!fileExtension) {
      throw new Error("Invalid file format");
    }

    const fileContent = await this.readFileContent(file);

    let sessionData: Partial<SessionData>;

    switch (fileExtension) {
      case "json":
        sessionData = await this.importFromJSON(fileContent);
        break;
      case "csv":
        sessionData = await this.importFromCSV(fileContent);
        break;
      case "ld":
      case "ldx":
        sessionData = await this.importFromMoTeC(fileContent);
        break;
      case "xrk":
      case "drk":
        sessionData = await this.importFromAiM(fileContent);
        break;
      default:
        throw new Error(`Unsupported file format: ${fileExtension}`);
    }

    // Validate and add session
    if (!sessionData.name || !sessionData.track) {
      throw new Error("Invalid session data - missing required fields");
    }

    const sessionId = this.addSession({
      name: sessionData.name,
      track: sessionData.track,
      type: sessionData.type || "test",
      date: sessionData.date || new Date(),
      duration: sessionData.duration || 0,
      bestLapTime: sessionData.bestLapTime,
      totalLaps: sessionData.totalLaps || 0,
      notes: sessionData.notes || "",
      telemetryData: sessionData.telemetryData,
      gpsData: sessionData.gpsData,
      metadata: sessionData.metadata || {},
    });

    return sessionId;
  }

  // Analytics
  getSessionAnalytics(): SessionAnalytics {
    const sessions = this.getAllSessions();

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalTrackTime: 0,
        tracksVisited: [],
        averageSessionDuration: 0,
        totalDistance: 0,
        recentActivity: {
          sessionsThisWeek: 0,
          sessionsThisMonth: 0,
        },
      };
    }

    const totalTrackTime = sessions.reduce((sum, s) => sum + s.duration, 0);
    const bestLapTimes = sessions
      .map((s) => s.bestLapTime)
      .filter(Boolean) as number[];
    const bestLapTime =
      bestLapTimes.length > 0 ? Math.min(...bestLapTimes) : undefined;

    const tracksVisited = Array.from(new Set(sessions.map((s) => s.track)));

    // Calculate recent activity
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const sessionsThisWeek = sessions.filter(
      (s) => s.date >= oneWeekAgo,
    ).length;
    const sessionsThisMonth = sessions.filter(
      (s) => s.date >= oneMonthAgo,
    ).length;

    // Estimate total distance (assuming average track length of 4km)
    const totalDistance = sessions.reduce(
      (sum, s) => sum + s.totalLaps * 4, // 4km average track length
      0,
    );

    return {
      totalSessions: sessions.length,
      totalTrackTime,
      bestLapTime,
      tracksVisited,
      averageSessionDuration: totalTrackTime / sessions.length,
      totalDistance,
      recentActivity: {
        lastSessionDate: sessions.length > 0 ? sessions[0].date : undefined,
        sessionsThisWeek,
        sessionsThisMonth,
      },
    };
  }

  // Search and filter
  searchSessions(
    query: string,
    filters: {
      type?: SessionData["type"];
      track?: string;
      dateRange?: { start: Date; end: Date };
    } = {},
  ): SessionData[] {
    let sessions = this.getAllSessions();

    // Apply text search
    if (query) {
      const lowerQuery = query.toLowerCase();
      sessions = sessions.filter(
        (session) =>
          session.name.toLowerCase().includes(lowerQuery) ||
          session.track.toLowerCase().includes(lowerQuery) ||
          session.notes.toLowerCase().includes(lowerQuery),
      );
    }

    // Apply filters
    if (filters.type) {
      sessions = sessions.filter((session) => session.type === filters.type);
    }

    if (filters.track) {
      sessions = sessions.filter((session) => session.track === filters.track);
    }

    if (filters.dateRange) {
      sessions = sessions.filter(
        (session) =>
          session.date >= filters.dateRange!.start &&
          session.date <= filters.dateRange!.end,
      );
    }

    return sessions;
  }

  // Backup and restore
  async createBackup(): Promise<Blob> {
    return await dataExportService.createBackup();
  }

  async restoreFromBackup(backupFile: File): Promise<void> {
    return await dataExportService.restoreFromBackup(backupFile);
  }

  // Storage management
  private loadSessions(): void {
    try {
      const stored = localStorage.getItem("racesense-sessions");
      const hasSampleData = localStorage.getItem("racesense-has-sample-data");
      
      if (stored) {
        console.log("Loading sessions from localStorage...");
        const sessionsData = JSON.parse(stored);
        let loadedCount = 0;
        
        Object.entries(sessionsData).forEach(([id, data]: [string, any]) => {
          try {
            // Convert date strings back to Date objects
            data.date = new Date(data.date);
            if (data.syncStatus?.lastSync) {
              data.syncStatus.lastSync = new Date(data.syncStatus.lastSync);
            }
            this.sessions.set(id, data);
            loadedCount++;
            
            console.log(`Loaded session: ${data.name} with ${data.telemetryData?.length || 0} telemetry points`);
          } catch (sessionError) {
            console.error(`Failed to load session ${id}:`, sessionError);
          }
        });
        
        console.log(`Successfully loaded ${loadedCount} sessions from localStorage`);
      } else if (hasSampleData) {
        console.log("Sample data flag found but no sessions in localStorage - this indicates an issue");
        console.log("Not loading demo data to avoid conflicts");
      } else {
        console.log("No sessions found in localStorage, loading demo data...");
        this.loadDemoData();
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
      const hasSampleData = localStorage.getItem("racesense-has-sample-data");
      if (!hasSampleData) {
        console.log("Falling back to demo data...");
        this.loadDemoData();
      } else {
        console.log("Sample data flag found, not loading demo data to avoid conflicts");
      }
    }
  }

  private saveSessions(): void {
    try {
      // Convert Map to object properly
      const sessionsData: Record<string, SessionData> = {};
      this.sessions.forEach((session, id) => {
        sessionsData[id] = session;
      });
      
      const serializedData = JSON.stringify(sessionsData);
      localStorage.setItem("racesense-sessions", serializedData);
      
      console.log(`Saved ${this.sessions.size} sessions to localStorage`);
    } catch (error) {
      console.error("Failed to save sessions:", error);
      console.error("Sessions data:", this.sessions);
    }
  }

  private loadDemoData(): void {
    console.log("=== Loading demo data ===");
    
    // Check if we should skip demo data loading
    const hasSampleData = localStorage.getItem("racesense-has-sample-data");
    if (hasSampleData) {
      console.log("Sample data flag found, skipping demo data loading to avoid conflicts");
      return;
    }
    
    console.log("Creating demo sessions with basic telemetry data...");
    
    // Create some demo sessions with basic telemetry data
    const demoSessions: Omit<SessionData, "id">[] = [
      {
        name: "Morning Practice",
        track: "Silverstone GP",
        type: "practice",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        duration: 1800, // 30 minutes
        bestLapTime: 83250, // 1:23.250
        totalLaps: 15,
        notes: "Good session, worked on setup balance",
        telemetryData: this.generateBasicTelemetryData(1800), // Add basic telemetry
        metadata: {
          weather: "Clear",
          temperature: 22,
          trackCondition: "Dry",
        },
      },
      {
        name: "Setup Testing",
        track: "Silverstone GP",
        type: "test",
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        duration: 3600, // 1 hour
        bestLapTime: 84100, // 1:24.100
        totalLaps: 35,
        notes: "Testing aerodynamic package, positive results",
        telemetryData: this.generateBasicTelemetryData(3600), // Add basic telemetry
        metadata: {
          weather: "Clear",
          temperature: 25,
          trackCondition: "Dry",
        },
      },
    ];

    demoSessions.forEach((session) => {
      console.log(`Creating demo session: ${session.name} with ${session.telemetryData?.length || 0} telemetry points`);
      this.addSession(session);
    });
    
    console.log("Demo data loading complete");
  }

  // Generate basic telemetry data for demo sessions
  private generateBasicTelemetryData(durationSeconds: number): TelemetryPoint[] {
    const telemetryData: TelemetryPoint[] = [];
    const interval = 100; // 100ms intervals
    const totalPoints = Math.floor(durationSeconds * 1000 / interval);
    const startTime = Date.now() - (durationSeconds * 1000);
    
    console.log(`Generating ${totalPoints} basic telemetry points for ${durationSeconds}s session`);
    
    for (let i = 0; i < totalPoints; i++) {
      const timestamp = startTime + (i * interval);
      telemetryData.push({
        timestamp,
        position: {
          lat: 52.0736 + (i * 0.0001), // Moving north
          lng: -1.0169 + (i * 0.0001), // Moving east
        },
        speed: 100 + (Math.random() * 50), // 100-150 km/h
        rpm: 3000 + (Math.random() * 2000),
        throttle: 50 + (Math.random() * 50),
        brake: Math.random() * 20,
        gear: 3 + Math.floor(Math.random() * 3),
        engineTemp: 85 + Math.random() * 15,
        gForce: {
          lateral: (Math.random() - 0.5) * 2,
          longitudinal: (Math.random() - 0.5) * 1.5,
          vertical: 1 + (Math.random() - 0.5) * 0.2,
        },
        tireTemps: {
          frontLeft: 80 + Math.random() * 20,
          frontRight: 80 + Math.random() * 20,
          rearLeft: 75 + Math.random() * 20,
          rearRight: 75 + Math.random() * 20,
        },
      });
    }
    
    return telemetryData;
  }

  // File reading utilities
  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }

  // Import format handlers
  private async importFromJSON(content: string): Promise<Partial<SessionData>> {
    try {
      const data = JSON.parse(content);

      // Handle different JSON formats
      if (data.session) {
        // RaceSense export format
        return this.convertFromRaceSenseFormat(data.session);
      } else if (data.sessions) {
        // Multiple sessions - take the first one
        return this.convertFromRaceSenseFormat(data.sessions[0]);
      } else {
        // Direct session format
        return this.convertFromRaceSenseFormat(data);
      }
    } catch (error) {
      throw new Error("Invalid JSON format");
    }
  }

  private async importFromCSV(content: string): Promise<Partial<SessionData>> {
    // Parse CSV telemetry data
    const lines = content.split("\n");
    const headers = lines[0].split(",");

    if (headers.length < 3) {
      throw new Error("Invalid CSV format - insufficient columns");
    }

    // Extract basic session info from CSV data
    const telemetryData = lines
      .slice(1)
      .filter((line) => line.trim())
      .map((line) => {
        const values = line.split(",");
        const dataPoint: any = {};
        headers.forEach((header, index) => {
          dataPoint[header.trim()] = values[index]?.trim();
        });
        return dataPoint;
      });

    // Calculate session statistics
    const speeds = telemetryData
      .map((point) => parseFloat(point.Speed || point.speed || "0"))
      .filter((speed) => !isNaN(speed));

    const duration = telemetryData.length * 0.1; // Assuming 10Hz data
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

    return {
      name: "Imported CSV Session",
      track: "Unknown Track",
      type: "test",
      date: new Date(),
      duration: Math.round(duration),
      totalLaps: Math.max(1, Math.round(duration / 90)), // Estimate laps
      notes: `Imported from CSV file - ${telemetryData.length} data points`,
      telemetryData,
      metadata: {
        importSource: "CSV",
        maxSpeed,
        dataPoints: telemetryData.length,
      },
    };
  }

  private async importFromMoTeC(
    content: string,
  ): Promise<Partial<SessionData>> {
    // Parse MoTeC format (simplified)
    try {
      const data = JSON.parse(content);

      return {
        name: "MoTeC Import",
        track: data.header?.track || "Unknown Track",
        type: "test",
        date: data.header?.date ? new Date(data.header.date) : new Date(),
        duration: data.data?.length * 0.1 || 0,
        totalLaps: 1,
        notes: "Imported from MoTeC format",
        telemetryData: data.data || [],
        metadata: {
          importSource: "MoTeC",
          vehicle: data.header?.vehicle,
          channels: data.header?.channels,
        },
      };
    } catch (error) {
      throw new Error("Invalid MoTeC format");
    }
  }

  private async importFromAiM(content: string): Promise<Partial<SessionData>> {
    // Parse AiM format (simplified)
    try {
      const data = JSON.parse(content);

      return {
        name: "AiM Import",
        track: data.track || "Unknown Track",
        type: "test",
        date: new Date(),
        duration: 0,
        totalLaps: 1,
        notes: "Imported from AiM format",
        telemetryData: data.telemetry || [],
        metadata: {
          importSource: "AiM",
        },
      };
    } catch (error) {
      throw new Error("Invalid AiM format");
    }
  }

  private convertFromRaceSenseFormat(data: any): Partial<SessionData> {
    return {
      name: data.name || data.sessionId || "Imported Session",
      track: data.trackId || data.track || "Unknown Track",
      type: data.type || "test",
      date: data.date
        ? new Date(data.date)
        : new Date(data.startTime || Date.now()),
      duration: data.duration || 0,
      bestLapTime: data.bestLap?.lapTime || data.bestLapTime,
      totalLaps: data.laps?.length || data.totalLaps || 0,
      notes: data.notes || "",
      telemetryData: data.telemetryData || data.telemetry,
      gpsData: data.gpsData || data.laps?.flatMap((lap: any) => lap.gpsPoints),
      metadata: data.metadata || {},
    };
  }

  // Export format getters
  getSupportedExportFormats(): ExportFormat[] {
    return this.exportFormats;
  }

  getSupportedImportFormats(): string[] {
    return ["json", "csv", "ld", "ldx", "xrk", "drk"];
  }
}

// Global instance
export const dataManagementService = new DataManagementService();
