import { SessionData } from "./DataManagementService";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "driver" | "engineer" | "team_manager" | "coach" | "analyst";
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  permissions: Permission[];
  statistics: MemberStatistics;
  joinedAt: Date;
  timezone: string;
}

export interface Permission {
  type:
    | "view_telemetry"
    | "edit_setup"
    | "manage_sessions"
    | "coach_drivers"
    | "manage_team"
    | "export_data";
  granted: boolean;
  grantedBy: string;
  grantedAt: Date;
}

export interface MemberStatistics {
  sessionsAnalyzed: number;
  feedbackGiven: number;
  setupsCreated: number;
  totalOnlineTime: number;
  lastActivity: Date;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: Date;
  settings: TeamSettings;
  subscriptionTier: "free" | "pro" | "enterprise";
  statistics: TeamStatistics;
}

export interface TeamSettings {
  allowGuestAccess: boolean;
  dataRetentionDays: number;
  requireApprovalForJoin: boolean;
  enableRealTimeSharing: boolean;
  defaultPermissions: Permission[];
  timezone: string;
  sessionTypes: string[];
}

export interface TeamStatistics {
  totalSessions: number;
  totalLaps: number;
  totalMembers: number;
  averageSessionLength: number;
  mostActiveDriver: string;
  bestLapTime: number;
  totalDistanceCovered: number;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  teamName: string;
  invitedBy: string;
  invitedEmail: string;
  role: TeamMember["role"];
  permissions: Permission[];
  createdAt: Date;
  expiresAt: Date;
  status: "pending" | "accepted" | "declined" | "expired";
  message?: string;
}

export interface RealTimeMessage {
  id: string;
  teamId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: "text" | "telemetry_share" | "setup_share" | "session_alert" | "system";
  timestamp: Date;
  metadata?: {
    sessionId?: string;
    setupId?: string;
    telemetryData?: any;
    targetMemberId?: string;
  };
  reactions: MessageReaction[];
  isRead: boolean;
}

export interface MessageReaction {
  memberId: string;
  memberName: string;
  emoji: string;
  timestamp: Date;
}

export interface SessionShare {
  id: string;
  sessionId: string;
  sessionName: string;
  sharedBy: string;
  sharedWith: string[];
  teamId: string;
  permissions: "view" | "comment" | "edit";
  expiresAt?: Date;
  createdAt: Date;
  viewCount: number;
  comments: SessionComment[];
}

export interface SessionComment {
  id: string;
  sessionShareId: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: Date;
  lapNumber?: number;
  sector?: number;
  telemetryTimestamp?: number;
  mentions: string[];
  replies: SessionComment[];
}

export class TeamService {
  private currentUser: TeamMember | null = null;
  private currentTeam: Team | null = null;
  private teams: Team[] = [];
  private invitations: TeamInvitation[] = [];
  private messages: RealTimeMessage[] = [];
  private sessionShares: SessionShare[] = [];
  private websocket: WebSocket | null = null;
  private messageListeners: Set<(message: RealTimeMessage) => void> = new Set();
  private presenceListeners: Set<(members: TeamMember[]) => void> = new Set();

  constructor() {
    this.loadUserData();
    this.loadTeamData();
    this.initializeWebSocket();
    this.setupPresenceTracking();
  }

  // User Management
  async createUser(
    name: string,
    email: string,
    role: TeamMember["role"],
  ): Promise<TeamMember> {
    const user: TeamMember = {
      id: this.generateId(),
      name,
      email,
      role,
      isOnline: true,
      lastSeen: new Date(),
      permissions: this.getDefaultPermissions(role),
      statistics: {
        sessionsAnalyzed: 0,
        feedbackGiven: 0,
        setupsCreated: 0,
        totalOnlineTime: 0,
        lastActivity: new Date(),
      },
      joinedAt: new Date(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    this.currentUser = user;
    this.saveUserData();
    return user;
  }

  getCurrentUser(): TeamMember | null {
    return this.currentUser;
  }

  async updateUserProfile(updates: Partial<TeamMember>): Promise<boolean> {
    if (!this.currentUser) return false;

    Object.assign(this.currentUser, updates);
    this.saveUserData();
    await this.broadcastPresenceUpdate();
    return true;
  }

  // Team Management
  async createTeam(
    name: string,
    description: string,
    settings?: Partial<TeamSettings>,
  ): Promise<Team> {
    if (!this.currentUser) {
      throw new Error("User must be logged in to create a team");
    }

    const team: Team = {
      id: this.generateId(),
      name,
      description,
      ownerId: this.currentUser.id,
      members: [this.currentUser],
      createdAt: new Date(),
      settings: {
        allowGuestAccess: false,
        dataRetentionDays: 90,
        requireApprovalForJoin: true,
        enableRealTimeSharing: true,
        defaultPermissions: this.getDefaultPermissions("driver"),
        timezone: this.currentUser.timezone,
        sessionTypes: ["practice", "qualifying", "race", "test"],
        ...settings,
      },
      subscriptionTier: "free",
      statistics: {
        totalSessions: 0,
        totalLaps: 0,
        totalMembers: 1,
        averageSessionLength: 0,
        mostActiveDriver: this.currentUser.id,
        bestLapTime: 0,
        totalDistanceCovered: 0,
      },
    };

    this.teams.push(team);
    this.currentTeam = team;
    this.saveTeamData();
    return team;
  }

  async joinTeam(teamId: string): Promise<boolean> {
    if (!this.currentUser) return false;

    const team = this.teams.find((t) => t.id === teamId);
    if (!team) return false;

    // Check if user is already a member
    if (team.members.some((m) => m.id === this.currentUser!.id)) {
      this.currentTeam = team;
      return true;
    }

    // Add user to team
    team.members.push(this.currentUser);
    team.statistics.totalMembers++;
    this.currentTeam = team;

    this.saveTeamData();
    await this.broadcastTeamUpdate(team);
    return true;
  }

  async leaveTeam(teamId: string): Promise<boolean> {
    if (!this.currentUser) return false;

    const team = this.teams.find((t) => t.id === teamId);
    if (!team) return false;

    // Remove user from team
    const memberIndex = team.members.findIndex(
      (m) => m.id === this.currentUser!.id,
    );
    if (memberIndex !== -1) {
      team.members.splice(memberIndex, 1);
      team.statistics.totalMembers--;

      if (team.ownerId === this.currentUser.id && team.members.length > 0) {
        // Transfer ownership to the next member
        team.ownerId = team.members[0].id;
      }

      if (this.currentTeam?.id === teamId) {
        this.currentTeam = null;
      }

      this.saveTeamData();
      return true;
    }

    return false;
  }

  getCurrentTeam(): Team | null {
    return this.currentTeam;
  }

  getUserTeams(): Team[] {
    if (!this.currentUser) return [];

    return this.teams.filter((team) =>
      team.members.some((member) => member.id === this.currentUser!.id),
    );
  }

  // Team Invitations
  async inviteToTeam(
    teamId: string,
    email: string,
    role: TeamMember["role"],
    message?: string,
  ): Promise<TeamInvitation> {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team || !this.currentUser) {
      throw new Error("Team not found or user not authenticated");
    }

    const invitation: TeamInvitation = {
      id: this.generateId(),
      teamId,
      teamName: team.name,
      invitedBy: this.currentUser.id,
      invitedEmail: email,
      role,
      permissions: this.getDefaultPermissions(role),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: "pending",
      message,
    };

    this.invitations.push(invitation);
    this.saveInvitations();

    // Simulate sending email
    console.log(`Invitation sent to ${email} for team ${team.name}`);

    return invitation;
  }

  async respondToInvitation(
    invitationId: string,
    response: "accept" | "decline",
  ): Promise<boolean> {
    const invitation = this.invitations.find((inv) => inv.id === invitationId);
    if (!invitation || invitation.status !== "pending") {
      return false;
    }

    invitation.status = response === "accept" ? "accepted" : "declined";
    this.saveInvitations();

    if (response === "accept") {
      await this.joinTeam(invitation.teamId);
    }

    return true;
  }

  getPendingInvitations(email?: string): TeamInvitation[] {
    return this.invitations.filter((inv) => {
      if (email) {
        return inv.invitedEmail === email && inv.status === "pending";
      }
      return inv.status === "pending";
    });
  }

  // Real-Time Communication
  async sendMessage(
    content: string,
    type: RealTimeMessage["type"] = "text",
    metadata?: RealTimeMessage["metadata"],
  ): Promise<RealTimeMessage> {
    if (!this.currentUser || !this.currentTeam) {
      throw new Error("User must be in a team to send messages");
    }

    const message: RealTimeMessage = {
      id: this.generateId(),
      teamId: this.currentTeam.id,
      senderId: this.currentUser.id,
      senderName: this.currentUser.name,
      content,
      type,
      timestamp: new Date(),
      metadata,
      reactions: [],
      isRead: false,
    };

    this.messages.push(message);
    this.saveMessages();

    // Broadcast message to team members
    await this.broadcastMessage(message);

    return message;
  }

  async shareSession(
    sessionId: string,
    sessionName: string,
    memberIds: string[],
    permissions: "view" | "comment" | "edit" = "view",
    expiresInHours?: number,
  ): Promise<SessionShare> {
    if (!this.currentUser || !this.currentTeam) {
      throw new Error("User must be in a team to share sessions");
    }

    const share: SessionShare = {
      id: this.generateId(),
      sessionId,
      sessionName,
      sharedBy: this.currentUser.id,
      sharedWith: memberIds,
      teamId: this.currentTeam.id,
      permissions,
      expiresAt: expiresInHours
        ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
        : undefined,
      createdAt: new Date(),
      viewCount: 0,
      comments: [],
    };

    this.sessionShares.push(share);
    this.saveSessionShares();

    // Send notification message
    await this.sendMessage(
      `${this.currentUser.name} shared session "${sessionName}"`,
      "session_alert",
      { sessionId, targetMemberId: memberIds.join(",") },
    );

    return share;
  }

  async addSessionComment(
    shareId: string,
    content: string,
    lapNumber?: number,
    sector?: number,
    telemetryTimestamp?: number,
    replyToId?: string,
  ): Promise<SessionComment> {
    if (!this.currentUser) {
      throw new Error("User must be authenticated to comment");
    }

    const share = this.sessionShares.find((s) => s.id === shareId);
    if (!share) {
      throw new Error("Session share not found");
    }

    const comment: SessionComment = {
      id: this.generateId(),
      sessionShareId: shareId,
      authorId: this.currentUser.id,
      authorName: this.currentUser.name,
      content,
      timestamp: new Date(),
      lapNumber,
      sector,
      telemetryTimestamp,
      mentions: this.extractMentions(content),
      replies: [],
    };

    if (replyToId) {
      const parentComment = this.findCommentById(share.comments, replyToId);
      if (parentComment) {
        parentComment.replies.push(comment);
      }
    } else {
      share.comments.push(comment);
    }

    this.saveSessionShares();

    // Notify mentioned users
    for (const mentionedId of comment.mentions) {
      await this.sendMessage(
        `${this.currentUser.name} mentioned you in a comment`,
        "system",
        { sessionId: share.sessionId, targetMemberId: mentionedId },
      );
    }

    return comment;
  }

  // Permission Management
  async updateMemberPermissions(
    teamId: string,
    memberId: string,
    permissions: Permission[],
  ): Promise<boolean> {
    if (!this.currentUser) return false;

    const team = this.teams.find((t) => t.id === teamId);
    if (!team || team.ownerId !== this.currentUser.id) {
      return false;
    }

    const member = team.members.find((m) => m.id === memberId);
    if (!member) return false;

    member.permissions = permissions;
    this.saveTeamData();
    return true;
  }

  hasPermission(permission: Permission["type"]): boolean {
    if (!this.currentUser) return false;

    return this.currentUser.permissions.some(
      (p) => p.type === permission && p.granted,
    );
  }

  // WebSocket Communication
  private initializeWebSocket(): void {
    if (typeof window === "undefined") return;

    // Simulate WebSocket connection for real-time features
    // In production, this would connect to your real-time server
    setInterval(() => {
      if (this.currentTeam) {
        this.simulateRealTimeActivity();
      }
    }, 30000); // Every 30 seconds
  }

  private async broadcastMessage(message: RealTimeMessage): Promise<void> {
    // Simulate broadcasting to team members
    this.messageListeners.forEach((listener) => listener(message));
  }

  private async broadcastPresenceUpdate(): Promise<void> {
    if (!this.currentTeam) return;

    // Update current user's last seen time
    if (this.currentUser) {
      this.currentUser.lastSeen = new Date();
      this.currentUser.isOnline = true;
    }

    this.presenceListeners.forEach((listener) =>
      listener(this.currentTeam!.members),
    );
  }

  private async broadcastTeamUpdate(team: Team): Promise<void> {
    console.log(`Broadcasting team update for ${team.name}`);
  }

  private setupPresenceTracking(): void {
    // Track user presence
    setInterval(() => {
      if (this.currentUser) {
        this.currentUser.lastSeen = new Date();
        this.currentUser.statistics.totalOnlineTime += 30;
        this.saveUserData();
      }
    }, 30000);

    // Update other members' online status
    setInterval(() => {
      if (this.currentTeam) {
        this.currentTeam.members.forEach((member) => {
          if (member.id !== this.currentUser?.id) {
            const timeSinceLastSeen = Date.now() - member.lastSeen.getTime();
            member.isOnline = timeSinceLastSeen < 5 * 60 * 1000; // 5 minutes
          }
        });
        this.broadcastPresenceUpdate();
      }
    }, 60000); // Every minute
  }

  private simulateRealTimeActivity(): void {
    if (!this.currentTeam || this.currentTeam.members.length < 2) return;

    // Simulate random team member activity
    const otherMembers = this.currentTeam.members.filter(
      (m) => m.id !== this.currentUser?.id,
    );

    if (otherMembers.length > 0 && Math.random() > 0.7) {
      const randomMember =
        otherMembers[Math.floor(Math.random() * otherMembers.length)];
      randomMember.lastSeen = new Date();
      randomMember.isOnline = Math.random() > 0.3;

      if (Math.random() > 0.8) {
        // Simulate a message
        const mockMessage: RealTimeMessage = {
          id: this.generateId(),
          teamId: this.currentTeam.id,
          senderId: randomMember.id,
          senderName: randomMember.name,
          content: this.generateMockMessage(),
          type: "text",
          timestamp: new Date(),
          reactions: [],
          isRead: false,
        };

        this.messages.push(mockMessage);
        this.broadcastMessage(mockMessage);
      }
    }
  }

  // Event Listeners
  onMessage(callback: (message: RealTimeMessage) => void): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  onPresenceUpdate(callback: (members: TeamMember[]) => void): () => void {
    this.presenceListeners.add(callback);
    return () => this.presenceListeners.delete(callback);
  }

  // Utility Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getDefaultPermissions(role: TeamMember["role"]): Permission[] {
    const basePermissions: Permission[] = [
      {
        type: "view_telemetry",
        granted: true,
        grantedBy: "system",
        grantedAt: new Date(),
      },
    ];

    switch (role) {
      case "team_manager":
        return [
          ...basePermissions,
          {
            type: "manage_team",
            granted: true,
            grantedBy: "system",
            grantedAt: new Date(),
          },
          {
            type: "manage_sessions",
            granted: true,
            grantedBy: "system",
            grantedAt: new Date(),
          },
          {
            type: "export_data",
            granted: true,
            grantedBy: "system",
            grantedAt: new Date(),
          },
        ];

      case "engineer":
        return [
          ...basePermissions,
          {
            type: "edit_setup",
            granted: true,
            grantedBy: "system",
            grantedAt: new Date(),
          },
          {
            type: "manage_sessions",
            granted: true,
            grantedBy: "system",
            grantedAt: new Date(),
          },
        ];

      case "coach":
        return [
          ...basePermissions,
          {
            type: "coach_drivers",
            granted: true,
            grantedBy: "system",
            grantedAt: new Date(),
          },
        ];

      case "analyst":
        return [
          ...basePermissions,
          {
            type: "export_data",
            granted: true,
            grantedBy: "system",
            grantedAt: new Date(),
          },
        ];

      default: // driver
        return basePermissions;
    }
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  private findCommentById(
    comments: SessionComment[],
    id: string,
  ): SessionComment | null {
    for (const comment of comments) {
      if (comment.id === id) return comment;

      const reply = this.findCommentById(comment.replies, id);
      if (reply) return reply;
    }
    return null;
  }

  private generateMockMessage(): string {
    const messages = [
      "Great lap time on sector 2!",
      "Check the tire pressures for the next stint",
      "Weather update: rain expected in 20 minutes",
      "Setup changes working well",
      "Brake temperatures looking good",
      "Ready for qualifying session",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Data Persistence
  private loadUserData(): void {
    try {
      const stored = localStorage.getItem("racesense_user");
      if (stored) {
        const userData = JSON.parse(stored);
        this.currentUser = {
          ...userData,
          lastSeen: new Date(userData.lastSeen),
          joinedAt: new Date(userData.joinedAt),
          statistics: {
            ...userData.statistics,
            lastActivity: new Date(userData.statistics.lastActivity),
          },
        };
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  }

  private saveUserData(): void {
    try {
      if (this.currentUser) {
        localStorage.setItem(
          "racesense_user",
          JSON.stringify(this.currentUser),
        );
      }
    } catch (error) {
      console.error("Failed to save user data:", error);
    }
  }

  private loadTeamData(): void {
    try {
      const stored = localStorage.getItem("racesense_teams");
      if (stored) {
        this.teams = JSON.parse(stored).map((team: any) => ({
          ...team,
          createdAt: new Date(team.createdAt),
          members: team.members.map((member: any) => ({
            ...member,
            lastSeen: new Date(member.lastSeen),
            joinedAt: new Date(member.joinedAt),
            statistics: {
              ...member.statistics,
              lastActivity: new Date(member.statistics.lastActivity),
            },
          })),
        }));
      }
    } catch (error) {
      console.error("Failed to load team data:", error);
    }
  }

  private saveTeamData(): void {
    try {
      localStorage.setItem("racesense_teams", JSON.stringify(this.teams));
    } catch (error) {
      console.error("Failed to save team data:", error);
    }
  }

  private saveInvitations(): void {
    try {
      localStorage.setItem(
        "racesense_invitations",
        JSON.stringify(this.invitations),
      );
    } catch (error) {
      console.error("Failed to save invitations:", error);
    }
  }

  private saveMessages(): void {
    try {
      // Keep only the last 1000 messages to avoid storage bloat
      const messagesToSave = this.messages.slice(-1000);
      localStorage.setItem(
        "racesense_messages",
        JSON.stringify(messagesToSave),
      );
    } catch (error) {
      console.error("Failed to save messages:", error);
    }
  }

  private saveSessionShares(): void {
    try {
      localStorage.setItem(
        "racesense_session_shares",
        JSON.stringify(this.sessionShares),
      );
    } catch (error) {
      console.error("Failed to save session shares:", error);
    }
  }

  // Public API
  getTeamMessages(teamId: string, limit = 50): RealTimeMessage[] {
    return this.messages
      .filter((msg) => msg.teamId === teamId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getSessionShares(teamId: string): SessionShare[] {
    return this.sessionShares.filter((share) => share.teamId === teamId);
  }

  async addMessageReaction(messageId: string, emoji: string): Promise<boolean> {
    if (!this.currentUser) return false;

    const message = this.messages.find((msg) => msg.id === messageId);
    if (!message) return false;

    const existingReaction = message.reactions.find(
      (r) => r.memberId === this.currentUser!.id && r.emoji === emoji,
    );

    if (existingReaction) {
      // Remove reaction
      const index = message.reactions.indexOf(existingReaction);
      message.reactions.splice(index, 1);
    } else {
      // Add reaction
      message.reactions.push({
        memberId: this.currentUser.id,
        memberName: this.currentUser.name,
        emoji,
        timestamp: new Date(),
      });
    }

    this.saveMessages();
    return true;
  }

  markMessageAsRead(messageId: string): void {
    const message = this.messages.find((msg) => msg.id === messageId);
    if (message) {
      message.isRead = true;
      this.saveMessages();
    }
  }

  getUnreadMessageCount(teamId: string): number {
    return this.messages.filter((msg) => msg.teamId === teamId && !msg.isRead)
      .length;
  }
}

export const teamService = new TeamService();
