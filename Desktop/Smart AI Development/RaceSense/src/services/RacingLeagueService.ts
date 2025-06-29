import { SessionData } from "./DataManagementService";
import { TeamMember } from "./TeamService";

export interface RacingLeague {
  id: string;
  name: string;
  description: string;
  type: "professional" | "amateur" | "sim" | "karting" | "formula" | "touring";
  category: string;
  country: string;
  website?: string;
  logoUrl?: string;
  isOfficial: boolean;
  participants: LeagueParticipant[];
  seasons: Season[];
  currentSeason?: string;
  rules: LeagueRules;
  pointsSystem: PointsSystem;
  calendar: EventCalendar;
  standings: Championship[];
  statistics: LeagueStatistics;
  createdAt: Date;
  status: "active" | "inactive" | "completed" | "suspended";
}

export interface LeagueParticipant {
  id: string;
  type: "driver" | "team" | "constructor";
  name: string;
  displayName: string;
  country: string;
  avatar?: string;
  licenseNumber?: string;
  joinedAt: Date;
  status: "active" | "inactive" | "suspended";
  statistics: ParticipantStatistics;
  achievements: Achievement[];
}

export interface Season {
  id: string;
  name: string;
  year: number;
  startDate: Date;
  endDate: Date;
  status: "upcoming" | "active" | "completed" | "cancelled";
  races: Race[];
  participants: string[];
  pointsLeader?: string;
  championshipDecided: boolean;
  regulations: SeasonRegulations;
}

export interface Race {
  id: string;
  name: string;
  track: string;
  country: string;
  date: Date;
  status:
    | "scheduled"
    | "practice"
    | "qualifying"
    | "race"
    | "completed"
    | "cancelled";
  sessions: RaceSession[];
  results: RaceResult[];
  weather: WeatherConditions;
  attendance?: number;
  broadcastInfo?: BroadcastInfo;
}

export interface RaceSession {
  id: string;
  type: "practice1" | "practice2" | "practice3" | "qualifying" | "race";
  name: string;
  date: Date;
  duration: number;
  status: "scheduled" | "active" | "completed" | "cancelled";
  results: SessionResult[];
  conditions: SessionConditions;
}

export interface SessionResult {
  participantId: string;
  position: number;
  fastestLap?: number;
  bestSector1?: number;
  bestSector2?: number;
  bestSector3?: number;
  lapsCompleted: number;
  timeGap?: number;
  status: "completed" | "dnf" | "dsq" | "dns";
  penalties: Penalty[];
  telemetryData?: SessionData;
}

export interface RaceResult {
  participantId: string;
  position: number;
  points: number;
  fastestLap?: number;
  timeGap?: number;
  lapsCompleted: number;
  status: "completed" | "dnf" | "dsq" | "dns";
  penalties: Penalty[];
  reason?: string;
}

export interface Penalty {
  id: string;
  type: "time" | "grid" | "dsq" | "warning" | "fine";
  amount: number;
  reason: string;
  appliedAt: Date;
  stewardDecision: string;
}

export interface Championship {
  seasonId: string;
  type: "drivers" | "constructors" | "teams";
  standings: ChampionshipStanding[];
  lastUpdated: Date;
}

export interface ChampionshipStanding {
  participantId: string;
  position: number;
  points: number;
  wins: number;
  podiums: number;
  fastestLaps: number;
  poles: number;
  dnfs: number;
  penalties: number;
  bestFinish: number;
  worstFinish: number;
  averageFinish: number;
  pointsPerRace: number;
  trend: "up" | "down" | "stable";
}

export interface LeagueRules {
  vehicleSpecs: {
    category: string;
    restrictions: VehicleRestriction[];
    mandatoryEquipment: string[];
    allowedModifications: string[];
  };
  eligibility: {
    minimumAge: number;
    licenseRequired: boolean;
    experienceLevel: string;
    medicalRequirements: string[];
  };
  conduct: {
    drivingStandards: string[];
    penaltySystem: string[];
    appealProcess: string;
  };
  technical: {
    fuelRestrictions: string[];
    tireRegulations: string[];
    weightLimits: { minimum: number; maximum: number };
    powerLimits?: { minimum: number; maximum: number };
  };
}

export interface VehicleRestriction {
  component: string;
  limitation: string;
  value?: number;
  unit?: string;
}

export interface PointsSystem {
  name: string;
  positions: { position: number; points: number }[];
  bonusPoints: {
    fastestLap: number;
    pole: number;
    grandSlam: number;
    leadMostLaps: number;
  };
  penalties: {
    dnf: number;
    dsq: number;
    gridPenalty: number;
  };
}

export interface EventCalendar {
  seasonId: string;
  events: CalendarEvent[];
  timezone: string;
  lastUpdated: Date;
}

export interface CalendarEvent {
  id: string;
  raceId?: string;
  type: "race" | "test" | "meeting" | "deadline" | "announcement";
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  track?: string;
  isPublic: boolean;
  participants: string[];
  resources: EventResource[];
}

export interface EventResource {
  type: "document" | "video" | "image" | "link" | "file";
  name: string;
  url: string;
  description?: string;
}

export interface Achievement {
  id: string;
  type:
    | "championship"
    | "race_win"
    | "podium"
    | "pole"
    | "fastest_lap"
    | "milestone"
    | "special";
  title: string;
  description: string;
  iconUrl?: string;
  achievedAt: Date;
  seasonId?: string;
  raceId?: string;
  value?: number;
  isPublic: boolean;
}

export interface ParticipantStatistics {
  seasons: number;
  races: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  dnfs: number;
  totalPoints: number;
  averagePoints: number;
  bestFinish: number;
  worstFinish: number;
  averageFinish: number;
  winRate: number;
  podiumRate: number;
  completionRate: number;
  championshipsWon: number;
  currentStreak: { type: string; count: number };
}

export interface LeagueStatistics {
  totalRaces: number;
  totalParticipants: number;
  seasonsCompleted: number;
  averageRaceAttendance: number;
  mostSuccessfulParticipant: string;
  closestChampionship: { seasonId: string; margin: number };
  fastestLapRecord: { time: number; participantId: string; track: string };
  longestRace: { duration: number; raceId: string };
  weather: { dry: number; wet: number; mixed: number };
}

export interface WeatherConditions {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  trackTemperature: number;
  conditions: "dry" | "wet" | "mixed";
  forecast: WeatherForecast[];
}

export interface WeatherForecast {
  time: Date;
  temperature: number;
  precipitationChance: number;
  conditions: string;
}

export interface SessionConditions {
  weather: WeatherConditions;
  trackStatus: "green" | "yellow" | "red" | "wet";
  safetyCarDeployments: number;
  redFlagPeriods: number;
  averageLapTime: number;
  fastestLap: { time: number; participantId: string };
}

export interface BroadcastInfo {
  isLive: boolean;
  platforms: string[];
  startTime: Date;
  endTime?: Date;
  commentators: string[];
  languages: string[];
  viewerCount?: number;
}

export interface SeasonRegulations {
  vehicleSpecs: any;
  pointsSystem: PointsSystem;
  raceFormat: {
    sessionStructure: string[];
    qualifyingFormat: string;
    raceDistance: number;
    mandatoryPitStops: number;
  };
  penalties: {
    speedingInPitLane: Penalty;
    unsafeRelease: Penalty;
    trackLimitsViolation: Penalty;
    causingCollision: Penalty;
  };
}

export class RacingLeagueService {
  private leagues: Map<string, RacingLeague> = new Map();
  private userParticipations: Map<string, string[]> = new Map();
  private raceResults: Map<string, SessionResult[]> = new Map();
  private notifications: Map<string, LeagueNotification[]> = new Map();

  constructor() {
    this.initializeBuiltInLeagues();
    this.loadUserData();
  }

  // League Management
  async createLeague(
    name: string,
    description: string,
    type: RacingLeague["type"],
    rules: Partial<LeagueRules>,
  ): Promise<RacingLeague> {
    const leagueId = this.generateId();
    const league: RacingLeague = {
      id: leagueId,
      name,
      description,
      type,
      category: this.getCategoryFromType(type),
      country: "International",
      isOfficial: false,
      participants: [],
      seasons: [],
      rules: this.mergeWithDefaultRules(rules),
      pointsSystem: this.getDefaultPointsSystem(),
      calendar: {
        seasonId: "",
        events: [],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        lastUpdated: new Date(),
      },
      standings: [],
      statistics: this.getDefaultLeagueStatistics(),
      createdAt: new Date(),
      status: "active",
    };

    this.leagues.set(leagueId, league);
    return league;
  }

  async joinLeague(
    leagueId: string,
    participant: Omit<LeagueParticipant, "id" | "joinedAt" | "statistics">,
  ): Promise<boolean> {
    const league = this.leagues.get(leagueId);
    if (!league) {
      return false;
    }

    const newParticipant: LeagueParticipant = {
      ...participant,
      id: this.generateId(),
      joinedAt: new Date(),
      statistics: this.getDefaultParticipantStatistics(),
      achievements: [],
    };

    league.participants.push(newParticipant);

    // Add to user participations
    const userId = "current_user"; // Would be from authentication
    const userLeagues = this.userParticipations.get(userId) || [];
    userLeagues.push(leagueId);
    this.userParticipations.set(userId, userLeagues);

    this.saveLeagueData();
    return true;
  }

  async leaveLeague(leagueId: string, participantId: string): Promise<boolean> {
    const league = this.leagues.get(leagueId);
    if (!league) {
      return false;
    }

    const participantIndex = league.participants.findIndex(
      (p) => p.id === participantId,
    );
    if (participantIndex === -1) {
      return false;
    }

    league.participants.splice(participantIndex, 1);
    this.saveLeagueData();
    return true;
  }

  // Season Management
  async createSeason(
    leagueId: string,
    name: string,
    year: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Season> {
    const league = this.leagues.get(leagueId);
    if (!league) {
      throw new Error("League not found");
    }

    const seasonId = this.generateId();
    const season: Season = {
      id: seasonId,
      name,
      year,
      startDate,
      endDate,
      status: "upcoming",
      races: [],
      participants: league.participants.map((p) => p.id),
      championshipDecided: false,
      regulations: this.getDefaultSeasonRegulations(),
    };

    league.seasons.push(season);
    if (!league.currentSeason) {
      league.currentSeason = seasonId;
    }

    this.saveLeagueData();
    return season;
  }

  async addRaceToSeason(
    leagueId: string,
    seasonId: string,
    raceInfo: {
      name: string;
      track: string;
      country: string;
      date: Date;
    },
  ): Promise<Race> {
    const league = this.leagues.get(leagueId);
    if (!league) {
      throw new Error("League not found");
    }

    const season = league.seasons.find((s) => s.id === seasonId);
    if (!season) {
      throw new Error("Season not found");
    }

    const raceId = this.generateId();
    const race: Race = {
      id: raceId,
      ...raceInfo,
      status: "scheduled",
      sessions: this.generateRaceSessions(raceId, raceInfo.date),
      results: [],
      weather: this.generateWeatherConditions(),
    };

    season.races.push(race);
    this.updateCalendar(league, race);
    this.saveLeagueData();

    return race;
  }

  // Race Results Management
  async submitRaceResult(
    leagueId: string,
    seasonId: string,
    raceId: string,
    sessionType: RaceSession["type"],
    results: Omit<SessionResult, "id">[],
  ): Promise<boolean> {
    const league = this.leagues.get(leagueId);
    if (!league) {
      return false;
    }

    const season = league.seasons.find((s) => s.id === seasonId);
    if (!season) {
      return false;
    }

    const race = season.races.find((r) => r.id === raceId);
    if (!race) {
      return false;
    }

    const session = race.sessions.find((s) => s.type === sessionType);
    if (!session) {
      return false;
    }

    // Process and validate results
    const processedResults = results.map((result, index) => ({
      ...result,
      position: result.position || index + 1,
    }));

    session.results = processedResults;
    session.status = "completed";

    // If this was the race session, update championship standings
    if (sessionType === "race") {
      this.updateChampionshipStandings(league, seasonId, processedResults);
      race.results = this.convertToRaceResults(processedResults, league);
      race.status = "completed";
    }

    // Update participant statistics
    this.updateParticipantStatistics(league, processedResults);

    // Check for achievements
    this.checkForAchievements(league, seasonId, raceId, processedResults);

    this.saveLeagueData();
    return true;
  }

  // Championship Management
  getChampionshipStandings(
    leagueId: string,
    seasonId: string,
    type: Championship["type"] = "drivers",
  ): ChampionshipStanding[] {
    const league = this.leagues.get(leagueId);
    if (!league) {
      return [];
    }

    const championship = league.standings.find(
      (c) => c.seasonId === seasonId && c.type === type,
    );

    return championship?.standings || [];
  }

  async updateChampionshipStandings(
    league: RacingLeague,
    seasonId: string,
    raceResults: SessionResult[],
  ): Promise<void> {
    let championship = league.standings.find(
      (c) => c.seasonId === seasonId && c.type === "drivers",
    );

    if (!championship) {
      championship = {
        seasonId,
        type: "drivers",
        standings: [],
        lastUpdated: new Date(),
      };
      league.standings.push(championship);
    }

    // Update points for each participant
    raceResults.forEach((result) => {
      let standing = championship!.standings.find(
        (s) => s.participantId === result.participantId,
      );

      if (!standing) {
        standing = {
          participantId: result.participantId,
          position: 0,
          points: 0,
          wins: 0,
          podiums: 0,
          fastestLaps: 0,
          poles: 0,
          dnfs: 0,
          penalties: 0,
          bestFinish: 999,
          worstFinish: 0,
          averageFinish: 0,
          pointsPerRace: 0,
          trend: "stable",
        };
        championship!.standings.push(standing);
      }

      // Award points based on position
      const points = this.calculatePoints(
        result.position,
        league.pointsSystem,
        result.fastestLap !== undefined,
      );
      standing.points += points;

      // Update statistics
      if (result.position === 1) standing.wins++;
      if (result.position <= 3) standing.podiums++;
      if (result.fastestLap) standing.fastestLaps++;
      if (result.status === "dnf") standing.dnfs++;
      standing.penalties += result.penalties.length;

      standing.bestFinish = Math.min(standing.bestFinish, result.position);
      standing.worstFinish = Math.max(standing.worstFinish, result.position);
    });

    // Sort standings by points
    championship.standings.sort((a, b) => b.points - a.points);

    // Update positions and trends
    championship.standings.forEach((standing, index) => {
      const previousPosition = standing.position;
      standing.position = index + 1;

      if (previousPosition === 0) {
        standing.trend = "stable";
      } else if (standing.position < previousPosition) {
        standing.trend = "up";
      } else if (standing.position > previousPosition) {
        standing.trend = "down";
      } else {
        standing.trend = "stable";
      }

      // Calculate average finish and points per race
      const participant = league.participants.find(
        (p) => p.id === standing.participantId,
      );
      if (participant) {
        const raceCount = participant.statistics.races;
        standing.averageFinish =
          raceCount > 0 ? standing.points / raceCount : 0;
        standing.pointsPerRace =
          raceCount > 0 ? standing.points / raceCount : 0;
      }
    });

    championship.lastUpdated = new Date();
  }

  // Analytics and Statistics
  getLeagueAnalytics(leagueId: string): LeagueAnalytics {
    const league = this.leagues.get(leagueId);
    if (!league) {
      throw new Error("League not found");
    }

    const analytics: LeagueAnalytics = {
      overview: {
        totalParticipants: league.participants.length,
        activeSeasons: league.seasons.filter((s) => s.status === "active")
          .length,
        completedRaces: league.seasons.reduce(
          (total, season) =>
            total + season.races.filter((r) => r.status === "completed").length,
          0,
        ),
        averageRaceAttendance: this.calculateAverageAttendance(league),
      },
      participation: {
        byCountry: this.groupParticipantsByCountry(league.participants),
        byType: this.groupParticipantsByType(league.participants),
        activityTrend: this.calculateActivityTrend(league),
        retentionRate: this.calculateRetentionRate(league),
      },
      performance: {
        fastestLaps: this.getFastestLaps(league),
        closestFinishes: this.getClosestFinishes(league),
        mostCompetitiveRaces: this.getMostCompetitiveRaces(league),
        dominanceIndex: this.calculateDominanceIndex(league),
      },
      trends: {
        participantGrowth: this.calculateParticipantGrowth(league),
        raceFrequency: this.calculateRaceFrequency(league),
        competitivenessIndex: this.calculateCompetitivenessIndex(league),
        popularTracks: this.getPopularTracks(league),
      },
    };

    return analytics;
  }

  getParticipantAnalytics(
    leagueId: string,
    participantId: string,
  ): ParticipantAnalytics {
    const league = this.leagues.get(leagueId);
    if (!league) {
      throw new Error("League not found");
    }

    const participant = league.participants.find((p) => p.id === participantId);
    if (!participant) {
      throw new Error("Participant not found");
    }

    const analytics: ParticipantAnalytics = {
      overview: participant.statistics,
      performance: {
        lapTimeProgression: this.calculateLapTimeProgression(
          league,
          participantId,
        ),
        consistencyRating: this.calculateConsistencyRating(
          league,
          participantId,
        ),
        trackSpecificPerformance: this.getTrackSpecificPerformance(
          league,
          participantId,
        ),
        weatherPerformance: this.getWeatherPerformance(league, participantId),
      },
      comparison: {
        vsChampion: this.compareToChampion(league, participantId),
        vsAverage: this.compareToAverage(league, participantId),
        vsTeammates: this.compareToTeammates(league, participantId),
      },
      insights: this.generateParticipantInsights(league, participantId),
    };

    return analytics;
  }

  // Event Management
  async scheduleEvent(
    leagueId: string,
    event: Omit<CalendarEvent, "id">,
  ): Promise<string> {
    const league = this.leagues.get(leagueId);
    if (!league) {
      throw new Error("League not found");
    }

    const eventId = this.generateId();
    const calendarEvent: CalendarEvent = {
      ...event,
      id: eventId,
    };

    league.calendar.events.push(calendarEvent);
    league.calendar.lastUpdated = new Date();

    // Send notifications to participants
    await this.sendEventNotification(league, calendarEvent);

    this.saveLeagueData();
    return eventId;
  }

  getUpcomingEvents(leagueId: string, days = 30): CalendarEvent[] {
    const league = this.leagues.get(leagueId);
    if (!league) {
      return [];
    }

    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return league.calendar.events
      .filter(
        (event) => event.startDate >= now && event.startDate <= futureDate,
      )
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  // Regulatory Compliance
  async checkRegulationsCompliance(
    leagueId: string,
    sessionData: SessionData,
  ): Promise<ComplianceReport> {
    const league = this.leagues.get(leagueId);
    if (!league) {
      throw new Error("League not found");
    }

    const report: ComplianceReport = {
      sessionId: sessionData.id,
      leagueId,
      isCompliant: true,
      violations: [],
      warnings: [],
      recommendations: [],
      checkedAt: new Date(),
    };

    // Check various regulations
    this.checkVehicleCompliance(league, sessionData, report);
    this.checkDrivingStandardsCompliance(league, sessionData, report);
    this.checkTechnicalCompliance(league, sessionData, report);

    return report;
  }

  // Utility Methods
  private initializeBuiltInLeagues(): void {
    const builtInLeagues = [
      {
        name: "Formula RaceSense Championship",
        description: "Premier open-wheel racing championship",
        type: "formula" as const,
        category: "Formula Cars",
        country: "International",
        isOfficial: true,
      },
      {
        name: "RaceSense Touring Car Series",
        description: "Production-based touring car racing",
        type: "touring" as const,
        category: "Touring Cars",
        country: "International",
        isOfficial: true,
      },
      {
        name: "Karting Development League",
        description: "Entry-level karting championship",
        type: "karting" as const,
        category: "Karting",
        country: "International",
        isOfficial: true,
      },
      {
        name: "Sim Racing Championship",
        description: "Virtual racing championship",
        type: "sim" as const,
        category: "Simulation",
        country: "International",
        isOfficial: true,
      },
    ];

    builtInLeagues.forEach((config) => {
      const league: RacingLeague = {
        id: this.generateId(),
        ...config,
        logoUrl: `/logos/${config.name.toLowerCase().replace(/\s+/g, "-")}.png`,
        participants: [],
        seasons: [],
        rules: this.getDefaultRules(config.type),
        pointsSystem: this.getDefaultPointsSystem(),
        calendar: {
          seasonId: "",
          events: [],
          timezone: "UTC",
          lastUpdated: new Date(),
        },
        standings: [],
        statistics: this.getDefaultLeagueStatistics(),
        createdAt: new Date(),
        status: "active",
      };

      // Create a current season for each league
      const currentSeason = this.createCurrentSeason(league);
      league.seasons.push(currentSeason);
      league.currentSeason = currentSeason.id;

      this.leagues.set(league.id, league);
    });
  }

  private createCurrentSeason(league: RacingLeague): Season {
    const currentYear = new Date().getFullYear();
    const season: Season = {
      id: this.generateId(),
      name: `${currentYear} Season`,
      year: currentYear,
      startDate: new Date(currentYear, 2, 1), // March 1st
      endDate: new Date(currentYear, 10, 30), // November 30th
      status: "active",
      races: [],
      participants: [],
      championshipDecided: false,
      regulations: this.getDefaultSeasonRegulations(),
    };

    // Add some sample races
    const sampleTracks = [
      { name: "Monaco Grand Prix", track: "Monaco", country: "Monaco" },
      { name: "British Grand Prix", track: "Silverstone", country: "UK" },
      {
        name: "Belgian Grand Prix",
        track: "Spa-Francorchamps",
        country: "Belgium",
      },
      { name: "Italian Grand Prix", track: "Monza", country: "Italy" },
      { name: "German Grand Prix", track: "Nürburgring", country: "Germany" },
    ];

    sampleTracks.forEach((trackInfo, index) => {
      const raceDate = new Date(currentYear, 3 + index * 2, 15); // Bi-monthly races
      const race: Race = {
        id: this.generateId(),
        name: trackInfo.name,
        track: trackInfo.track,
        country: trackInfo.country,
        date: raceDate,
        status: raceDate < new Date() ? "completed" : "scheduled",
        sessions: this.generateRaceSessions(this.generateId(), raceDate),
        results: [],
        weather: this.generateWeatherConditions(),
      };

      season.races.push(race);
    });

    return season;
  }

  private generateRaceSessions(raceId: string, raceDate: Date): RaceSession[] {
    const sessions: RaceSession[] = [];
    const sessionTypes: RaceSession["type"][] = [
      "practice1",
      "practice2",
      "practice3",
      "qualifying",
      "race",
    ];

    sessionTypes.forEach((type, index) => {
      const sessionDate = new Date(raceDate);
      sessionDate.setHours(sessionDate.getHours() + index * 2);

      sessions.push({
        id: this.generateId(),
        type,
        name: this.getSessionName(type),
        date: sessionDate,
        duration: this.getSessionDuration(type),
        status: sessionDate < new Date() ? "completed" : "scheduled",
        results: [],
        conditions: {
          weather: this.generateWeatherConditions(),
          trackStatus: "green",
          safetyCarDeployments: 0,
          redFlagPeriods: 0,
          averageLapTime: 90000 + Math.random() * 10000,
          fastestLap: { time: 85000 + Math.random() * 5000, participantId: "" },
        },
      });
    });

    return sessions;
  }

  private getSessionName(type: RaceSession["type"]): string {
    const names = {
      practice1: "Practice 1",
      practice2: "Practice 2",
      practice3: "Practice 3",
      qualifying: "Qualifying",
      race: "Race",
    };
    return names[type];
  }

  private getSessionDuration(type: RaceSession["type"]): number {
    const durations = {
      practice1: 90 * 60 * 1000, // 90 minutes
      practice2: 90 * 60 * 1000,
      practice3: 60 * 60 * 1000, // 60 minutes
      qualifying: 60 * 60 * 1000,
      race: 120 * 60 * 1000, // 120 minutes
    };
    return durations[type];
  }

  private generateWeatherConditions(): WeatherConditions {
    return {
      temperature: 20 + Math.random() * 15,
      humidity: 40 + Math.random() * 40,
      windSpeed: Math.random() * 20,
      windDirection: Math.random() * 360,
      precipitation: Math.random() > 0.8 ? Math.random() * 10 : 0,
      trackTemperature: 25 + Math.random() * 25,
      conditions: Math.random() > 0.8 ? "wet" : "dry",
      forecast: [],
    };
  }

  private calculatePoints(
    position: number,
    pointsSystem: PointsSystem,
    hasFastestLap: boolean,
  ): number {
    const positionPoints =
      pointsSystem.positions.find((p) => p.position === position)?.points || 0;
    const fastestLapBonus = hasFastestLap
      ? pointsSystem.bonusPoints.fastestLap
      : 0;
    return positionPoints + fastestLapBonus;
  }

  private convertToRaceResults(
    sessionResults: SessionResult[],
    league: RacingLeague,
  ): RaceResult[] {
    return sessionResults.map((result) => ({
      participantId: result.participantId,
      position: result.position,
      points: this.calculatePoints(
        result.position,
        league.pointsSystem,
        result.fastestLap !== undefined,
      ),
      fastestLap: result.fastestLap,
      timeGap: result.timeGap,
      lapsCompleted: result.lapsCompleted,
      status: result.status,
      penalties: result.penalties,
    }));
  }

  private updateParticipantStatistics(
    league: RacingLeague,
    results: SessionResult[],
  ): void {
    results.forEach((result) => {
      const participant = league.participants.find(
        (p) => p.id === result.participantId,
      );
      if (participant) {
        participant.statistics.races++;
        if (result.position === 1) participant.statistics.wins++;
        if (result.position <= 3) participant.statistics.podiums++;
        if (result.fastestLap) participant.statistics.fastestLaps++;
        if (result.status === "dnf") participant.statistics.dnfs++;

        // Update best/worst finish
        if (
          participant.statistics.bestFinish === 0 ||
          result.position < participant.statistics.bestFinish
        ) {
          participant.statistics.bestFinish = result.position;
        }
        if (result.position > participant.statistics.worstFinish) {
          participant.statistics.worstFinish = result.position;
        }

        // Recalculate averages
        const totalFinishes =
          participant.statistics.races - participant.statistics.dnfs;
        if (totalFinishes > 0) {
          // This is simplified - in reality you'd track all finishes
          participant.statistics.averageFinish =
            (participant.statistics.averageFinish * (totalFinishes - 1) +
              result.position) /
            totalFinishes;
        }

        // Update rates
        participant.statistics.winRate =
          participant.statistics.wins / participant.statistics.races;
        participant.statistics.podiumRate =
          participant.statistics.podiums / participant.statistics.races;
        participant.statistics.completionRate =
          1 - participant.statistics.dnfs / participant.statistics.races;
      }
    });
  }

  private checkForAchievements(
    league: RacingLeague,
    seasonId: string,
    raceId: string,
    results: SessionResult[],
  ): void {
    results.forEach((result) => {
      const participant = league.participants.find(
        (p) => p.id === result.participantId,
      );
      if (!participant) return;

      const achievements: Achievement[] = [];

      // First win
      if (result.position === 1 && participant.statistics.wins === 1) {
        achievements.push({
          id: this.generateId(),
          type: "race_win",
          title: "First Victory",
          description: "Congratulations on your first race win!",
          achievedAt: new Date(),
          seasonId,
          raceId,
          isPublic: true,
        });
      }

      // Pole position
      if (result.fastestLap && result.position === 1) {
        achievements.push({
          id: this.generateId(),
          type: "special",
          title: "Grand Slam",
          description: "Pole position, fastest lap, and race win!",
          achievedAt: new Date(),
          seasonId,
          raceId,
          isPublic: true,
        });
      }

      // Milestone achievements
      if (participant.statistics.races === 50) {
        achievements.push({
          id: this.generateId(),
          type: "milestone",
          title: "Veteran Driver",
          description: "Completed 50 races",
          achievedAt: new Date(),
          value: 50,
          isPublic: true,
        });
      }

      participant.achievements.push(...achievements);
    });
  }

  // Helper methods for analytics
  private calculateAverageAttendance(league: RacingLeague): number {
    const completedRaces = league.seasons.flatMap((season) =>
      season.races.filter((race) => race.status === "completed"),
    );

    if (completedRaces.length === 0) return 0;

    const totalAttendance = completedRaces.reduce(
      (sum, race) => sum + (race.attendance || 0),
      0,
    );

    return totalAttendance / completedRaces.length;
  }

  private groupParticipantsByCountry(
    participants: LeagueParticipant[],
  ): Record<string, number> {
    return participants.reduce(
      (groups, participant) => {
        groups[participant.country] = (groups[participant.country] || 0) + 1;
        return groups;
      },
      {} as Record<string, number>,
    );
  }

  private groupParticipantsByType(
    participants: LeagueParticipant[],
  ): Record<string, number> {
    return participants.reduce(
      (groups, participant) => {
        groups[participant.type] = (groups[participant.type] || 0) + 1;
        return groups;
      },
      {} as Record<string, number>,
    );
  }

  private calculateActivityTrend(league: RacingLeague): number[] {
    // Return activity trend over the last 12 months
    const trends: number[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthlyRaces = league.seasons
        .flatMap((season) => season.races)
        .filter(
          (race) => race.date >= monthStart && race.date <= monthEnd,
        ).length;

      trends.push(monthlyRaces);
    }

    return trends;
  }

  private calculateRetentionRate(league: RacingLeague): number {
    const activeParticipants = league.participants.filter(
      (p) => p.status === "active",
    ).length;
    const totalParticipants = league.participants.length;

    return totalParticipants > 0 ? activeParticipants / totalParticipants : 0;
  }

  private getFastestLaps(league: RacingLeague): any[] {
    const fastestLaps: any[] = [];

    league.seasons.forEach((season) => {
      season.races.forEach((race) => {
        race.sessions.forEach((session) => {
          if (session.conditions.fastestLap.time > 0) {
            fastestLaps.push({
              time: session.conditions.fastestLap.time,
              participantId: session.conditions.fastestLap.participantId,
              track: race.track,
              sessionType: session.type,
              date: race.date,
            });
          }
        });
      });
    });

    return fastestLaps.sort((a, b) => a.time - b.time).slice(0, 10);
  }

  private getClosestFinishes(league: RacingLeague): any[] {
    const closestFinishes: any[] = [];

    league.seasons.forEach((season) => {
      season.races.forEach((race) => {
        if (race.results.length >= 2) {
          const winner = race.results[0];
          const secondPlace = race.results[1];

          if (secondPlace.timeGap && secondPlace.timeGap < 5000) {
            // Less than 5 seconds
            closestFinishes.push({
              margin: secondPlace.timeGap,
              winner: winner.participantId,
              runnerUp: secondPlace.participantId,
              track: race.track,
              date: race.date,
            });
          }
        }
      });
    });

    return closestFinishes.sort((a, b) => a.margin - b.margin).slice(0, 10);
  }

  // Additional helper methods would continue here...
  // For brevity, I'm including the essential structure

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getCategoryFromType(type: RacingLeague["type"]): string {
    const categories = {
      professional: "Professional Racing",
      amateur: "Amateur Racing",
      sim: "Simulation Racing",
      karting: "Karting",
      formula: "Formula Cars",
      touring: "Touring Cars",
    };
    return categories[type] || "General Racing";
  }

  private getDefaultRules(type: RacingLeague["type"]): LeagueRules {
    return {
      vehicleSpecs: {
        category: this.getCategoryFromType(type),
        restrictions: [],
        mandatoryEquipment: [
          "Safety harness",
          "Fire extinguisher",
          "Roll cage",
        ],
        allowedModifications: [
          "Engine tuning",
          "Suspension setup",
          "Aerodynamics",
        ],
      },
      eligibility: {
        minimumAge: type === "karting" ? 12 : 18,
        licenseRequired: true,
        experienceLevel: "Novice",
        medicalRequirements: ["Medical certificate", "Vision test"],
      },
      conduct: {
        drivingStandards: [
          "Fair play",
          "Respect for competitors",
          "Safety first",
        ],
        penaltySystem: [
          "Warning",
          "Time penalty",
          "Grid penalty",
          "Disqualification",
        ],
        appealProcess: "Submit appeal within 24 hours to stewards",
      },
      technical: {
        fuelRestrictions: ["Pump fuel only", "No additives"],
        tireRegulations: ["Control tire", "Maximum 2 sets per race"],
        weightLimits: { minimum: 600, maximum: 800 },
        powerLimits:
          type === "karting" ? { minimum: 5, maximum: 15 } : undefined,
      },
    };
  }

  private mergeWithDefaultRules(rules: Partial<LeagueRules>): LeagueRules {
    const defaultRules = this.getDefaultRules("amateur");
    return {
      vehicleSpecs: { ...defaultRules.vehicleSpecs, ...rules.vehicleSpecs },
      eligibility: { ...defaultRules.eligibility, ...rules.eligibility },
      conduct: { ...defaultRules.conduct, ...rules.conduct },
      technical: { ...defaultRules.technical, ...rules.technical },
    };
  }

  private getDefaultPointsSystem(): PointsSystem {
    return {
      name: "Standard F1 System",
      positions: [
        { position: 1, points: 25 },
        { position: 2, points: 18 },
        { position: 3, points: 15 },
        { position: 4, points: 12 },
        { position: 5, points: 10 },
        { position: 6, points: 8 },
        { position: 7, points: 6 },
        { position: 8, points: 4 },
        { position: 9, points: 2 },
        { position: 10, points: 1 },
      ],
      bonusPoints: {
        fastestLap: 1,
        pole: 0,
        grandSlam: 0,
        leadMostLaps: 0,
      },
      penalties: {
        dnf: 0,
        dsq: -10,
        gridPenalty: 0,
      },
    };
  }

  private getDefaultLeagueStatistics(): LeagueStatistics {
    return {
      totalRaces: 0,
      totalParticipants: 0,
      seasonsCompleted: 0,
      averageRaceAttendance: 0,
      mostSuccessfulParticipant: "",
      closestChampionship: { seasonId: "", margin: 0 },
      fastestLapRecord: { time: 0, participantId: "", track: "" },
      longestRace: { duration: 0, raceId: "" },
      weather: { dry: 0, wet: 0, mixed: 0 },
    };
  }

  private getDefaultParticipantStatistics(): ParticipantStatistics {
    return {
      seasons: 0,
      races: 0,
      wins: 0,
      podiums: 0,
      poles: 0,
      fastestLaps: 0,
      dnfs: 0,
      totalPoints: 0,
      averagePoints: 0,
      bestFinish: 0,
      worstFinish: 0,
      averageFinish: 0,
      winRate: 0,
      podiumRate: 0,
      completionRate: 0,
      championshipsWon: 0,
      currentStreak: { type: "none", count: 0 },
    };
  }

  private getDefaultSeasonRegulations(): SeasonRegulations {
    return {
      vehicleSpecs: {},
      pointsSystem: this.getDefaultPointsSystem(),
      raceFormat: {
        sessionStructure: ["Practice 1", "Practice 2", "Qualifying", "Race"],
        qualifyingFormat: "Knockout",
        raceDistance: 100, // km
        mandatoryPitStops: 1,
      },
      penalties: {
        speedingInPitLane: {
          id: "",
          type: "time",
          amount: 5000,
          reason: "Speeding in pit lane",
          appliedAt: new Date(),
          stewardDecision: "5 second time penalty",
        },
        unsafeRelease: {
          id: "",
          type: "time",
          amount: 10000,
          reason: "Unsafe release from pit",
          appliedAt: new Date(),
          stewardDecision: "10 second time penalty",
        },
        trackLimitsViolation: {
          id: "",
          type: "warning",
          amount: 0,
          reason: "Track limits violation",
          appliedAt: new Date(),
          stewardDecision:
            "Warning - further violations will result in penalty",
        },
        causingCollision: {
          id: "",
          type: "grid",
          amount: 3,
          reason: "Causing collision",
          appliedAt: new Date(),
          stewardDecision: "3 place grid penalty for next race",
        },
      },
    };
  }

  private updateCalendar(league: RacingLeague, race: Race): void {
    const calendarEvent: CalendarEvent = {
      id: this.generateId(),
      raceId: race.id,
      type: "race",
      title: race.name,
      description: `${race.name} at ${race.track}`,
      startDate: race.date,
      endDate: new Date(race.date.getTime() + 3 * 60 * 60 * 1000), // 3 hours later
      location: `${race.track}, ${race.country}`,
      track: race.track,
      isPublic: true,
      participants: league.participants.map((p) => p.id),
      resources: [],
    };

    league.calendar.events.push(calendarEvent);
    league.calendar.lastUpdated = new Date();
  }

  private async sendEventNotification(
    league: RacingLeague,
    event: CalendarEvent,
  ): Promise<void> {
    const notification: LeagueNotification = {
      id: this.generateId(),
      type: "event_scheduled",
      title: `New Event: ${event.title}`,
      message: `${event.title} has been scheduled for ${event.startDate.toLocaleDateString()}`,
      leagueId: league.id,
      eventId: event.id,
      createdAt: new Date(),
      isRead: false,
      priority: "normal",
    };

    // Add notification for each participant
    league.participants.forEach((participant) => {
      const participantNotifications =
        this.notifications.get(participant.id) || [];
      participantNotifications.push(notification);
      this.notifications.set(participant.id, participantNotifications);
    });
  }

  private checkVehicleCompliance(
    league: RacingLeague,
    sessionData: SessionData,
    report: ComplianceReport,
  ): void {
    // Check vehicle setup against regulations
    const rules = league.rules.technical;
    const setup = sessionData.setupData;

    // Weight check
    const estimatedWeight = 750; // This would be calculated from telemetry
    if (estimatedWeight < rules.weightLimits.minimum) {
      report.violations.push({
        type: "technical",
        severity: "major",
        description: `Vehicle underweight: ${estimatedWeight}kg (minimum: ${rules.weightLimits.minimum}kg)`,
        penalty: "Disqualification",
      });
      report.isCompliant = false;
    }

    // Power check (if applicable)
    if (rules.powerLimits) {
      const estimatedPower = 12; // This would be calculated from telemetry
      if (estimatedPower > rules.powerLimits.maximum) {
        report.violations.push({
          type: "technical",
          severity: "major",
          description: `Power exceeds limit: ${estimatedPower}hp (maximum: ${rules.powerLimits.maximum}hp)`,
          penalty: "Disqualification",
        });
        report.isCompliant = false;
      }
    }
  }

  private checkDrivingStandardsCompliance(
    league: RacingLeague,
    sessionData: SessionData,
    report: ComplianceReport,
  ): void {
    // Analyze telemetry for driving standards violations
    const telemetry = sessionData.telemetryData;

    // Check for excessive speed in certain areas (simplified)
    const speedViolations = telemetry.filter((point) => point.speed > 300);
    if (speedViolations.length > 10) {
      report.warnings.push({
        type: "conduct",
        severity: "minor",
        description: "Excessive speed detected in multiple sectors",
        penalty: "Warning",
      });
    }

    // Check for erratic driving patterns
    const steeringInputs = telemetry.map((point) => Math.abs(point.steering));
    const averageSteering =
      steeringInputs.reduce((sum, val) => sum + val, 0) / steeringInputs.length;

    if (averageSteering > 50) {
      report.warnings.push({
        type: "conduct",
        severity: "minor",
        description:
          "Erratic steering inputs detected - please maintain control",
        penalty: "Warning",
      });
    }
  }

  private checkTechnicalCompliance(
    league: RacingLeague,
    sessionData: SessionData,
    report: ComplianceReport,
  ): void {
    // Check technical data integrity
    const telemetry = sessionData.telemetryData;

    // Data consistency checks
    const dataGaps = telemetry.filter(
      (point, index) =>
        index > 0 && point.timestamp - telemetry[index - 1].timestamp > 1000,
    );

    if (dataGaps.length > 5) {
      report.warnings.push({
        type: "technical",
        severity: "minor",
        description:
          "Data gaps detected in telemetry - ensure consistent data logging",
        penalty: "None",
      });
    }

    // Sensor validation
    const invalidRPM = telemetry.filter(
      (point) => point.rpm < 0 || point.rpm > 15000,
    );
    if (invalidRPM.length > 0) {
      report.violations.push({
        type: "technical",
        severity: "minor",
        description: "Invalid RPM readings detected",
        penalty: "Data correction required",
      });
    }
  }

  private loadUserData(): void {
    try {
      const stored = localStorage.getItem("racesense_league_data");
      if (stored) {
        const data = JSON.parse(stored);
        if (data.leagues) {
          Object.entries(data.leagues).forEach(
            ([id, league]: [string, any]) => {
              this.leagues.set(id, {
                ...league,
                createdAt: new Date(league.createdAt),
                seasons: league.seasons.map((season: any) => ({
                  ...season,
                  startDate: new Date(season.startDate),
                  endDate: new Date(season.endDate),
                  races: season.races.map((race: any) => ({
                    ...race,
                    date: new Date(race.date),
                    sessions: race.sessions.map((session: any) => ({
                      ...session,
                      date: new Date(session.date),
                    })),
                  })),
                })),
              });
            },
          );
        }
      }
    } catch (error) {
      console.error("Failed to load league data:", error);
    }
  }

  private saveLeagueData(): void {
    try {
      const data = {
        leagues: Object.fromEntries(this.leagues.entries()),
        userParticipations: Object.fromEntries(
          this.userParticipations.entries(),
        ),
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem("racesense_league_data", JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save league data:", error);
    }
  }

  // Public API
  getAllLeagues(): RacingLeague[] {
    return Array.from(this.leagues.values());
  }

  getLeague(leagueId: string): RacingLeague | undefined {
    return this.leagues.get(leagueId);
  }

  getUserLeagues(userId?: string): RacingLeague[] {
    const userLeagueIds =
      this.userParticipations.get(userId || "current_user") || [];
    return userLeagueIds
      .map((id) => this.leagues.get(id))
      .filter((league): league is RacingLeague => league !== undefined);
  }

  searchLeagues(
    query: string,
    filters?: {
      type?: RacingLeague["type"];
      country?: string;
      status?: RacingLeague["status"];
    },
  ): RacingLeague[] {
    const allLeagues = Array.from(this.leagues.values());

    return allLeagues.filter((league) => {
      const matchesQuery =
        league.name.toLowerCase().includes(query.toLowerCase()) ||
        league.description.toLowerCase().includes(query.toLowerCase());

      const matchesType = !filters?.type || league.type === filters.type;
      const matchesCountry =
        !filters?.country || league.country === filters.country;
      const matchesStatus =
        !filters?.status || league.status === filters.status;

      return matchesQuery && matchesType && matchesCountry && matchesStatus;
    });
  }

  getLeagueNotifications(userId?: string): LeagueNotification[] {
    return this.notifications.get(userId || "current_user") || [];
  }

  markNotificationAsRead(notificationId: string, userId?: string): boolean {
    const userNotifications =
      this.notifications.get(userId || "current_user") || [];
    const notification = userNotifications.find((n) => n.id === notificationId);

    if (notification) {
      notification.isRead = true;
      return true;
    }

    return false;
  }
}

// Additional interfaces
interface LeagueAnalytics {
  overview: {
    totalParticipants: number;
    activeSeasons: number;
    completedRaces: number;
    averageRaceAttendance: number;
  };
  participation: {
    byCountry: Record<string, number>;
    byType: Record<string, number>;
    activityTrend: number[];
    retentionRate: number;
  };
  performance: {
    fastestLaps: any[];
    closestFinishes: any[];
    mostCompetitiveRaces: any[];
    dominanceIndex: number;
  };
  trends: {
    participantGrowth: number[];
    raceFrequency: number[];
    competitivenessIndex: number;
    popularTracks: string[];
  };
}

interface ParticipantAnalytics {
  overview: ParticipantStatistics;
  performance: {
    lapTimeProgression: any[];
    consistencyRating: number;
    trackSpecificPerformance: any[];
    weatherPerformance: any[];
  };
  comparison: {
    vsChampion: any;
    vsAverage: any;
    vsTeammates: any[];
  };
  insights: string[];
}

interface ComplianceReport {
  sessionId: string;
  leagueId: string;
  isCompliant: boolean;
  violations: ComplianceViolation[];
  warnings: ComplianceViolation[];
  recommendations: string[];
  checkedAt: Date;
}

interface ComplianceViolation {
  type: "technical" | "conduct" | "administrative";
  severity: "minor" | "major" | "critical";
  description: string;
  penalty: string;
}

interface LeagueNotification {
  id: string;
  type:
    | "event_scheduled"
    | "results_posted"
    | "penalty_issued"
    | "announcement";
  title: string;
  message: string;
  leagueId: string;
  eventId?: string;
  createdAt: Date;
  isRead: boolean;
  priority: "low" | "normal" | "high";
}

export const racingLeagueService = new RacingLeagueService();
