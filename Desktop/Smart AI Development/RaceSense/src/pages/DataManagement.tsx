import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Database,
  Download,
  Upload,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  FileText,
  Share2,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  BarChart3,
  CloudUpload,
  HardDrive,
  Wifi,
} from "lucide-react";
import {
  dataManagementService,
  SessionData,
} from "@/services/DataManagementService";
import { cloudSyncService } from "@/services/CloudSyncService";

interface DataManagementState {
  sessions: SessionData[];
  selectedSessions: Set<string>;
  searchQuery: string;
  sortBy: "date" | "name" | "track" | "duration" | "bestLap";
  sortOrder: "asc" | "desc";
  filterBy: "all" | "practice" | "qualifying" | "race" | "test";
  isLoading: boolean;
  exportFormat: string;
  showExportDialog: boolean;
  showImportDialog: boolean;
  analytics: any;
  syncStatus: any;
  cloudProviders: any[];
}

class DataManagement extends React.Component<{}, DataManagementState> {
  private fileInputRef = React.createRef<HTMLInputElement>();

  constructor(props: {}) {
    super(props);
    this.state = {
      sessions: [],
      selectedSessions: new Set(),
      searchQuery: "",
      sortBy: "date",
      sortOrder: "desc",
      filterBy: "all",
      isLoading: true,
      exportFormat: "json",
      showExportDialog: false,
      showImportDialog: false,
      analytics: null,
      syncStatus: null,
      cloudProviders: [],
    };
  }

  componentDidMount() {
    this.loadData();
  }

  private loadData = async () => {
    try {
      this.setState({ isLoading: true });

      const sessions = dataManagementService.getAllSessions();
      const analytics = dataManagementService.getSessionAnalytics();
      const syncStatus = cloudSyncService.getSyncStatus();
      const cloudProviders = cloudSyncService.getProviders();

      this.setState({
        sessions,
        analytics,
        syncStatus,
        cloudProviders,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to load data:", error);
      this.setState({ isLoading: false });
    }
  };

  private handleSearch = (query: string) => {
    this.setState({ searchQuery: query });
  };

  private handleSort = (sortBy: DataManagementState["sortBy"]) => {
    const { sortBy: currentSort, sortOrder } = this.state;
    const newOrder =
      currentSort === sortBy && sortOrder === "asc" ? "desc" : "asc";

    this.setState({ sortBy, sortOrder: newOrder });
  };

  private handleFilter = (filterBy: DataManagementState["filterBy"]) => {
    this.setState({ filterBy });
  };

  private toggleSessionSelection = (sessionId: string) => {
    const { selectedSessions } = this.state;
    const newSelection = new Set(selectedSessions);

    if (newSelection.has(sessionId)) {
      newSelection.delete(sessionId);
    } else {
      newSelection.add(sessionId);
    }

    this.setState({ selectedSessions: newSelection });
  };

  private selectAllSessions = () => {
    const { sessions } = this.state;
    const allSessionIds = new Set(sessions.map((s) => s.id));
    this.setState({ selectedSessions: allSessionIds });
  };

  private clearSelection = () => {
    this.setState({ selectedSessions: new Set() });
  };

  private deleteSession = async (sessionId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this session? This action cannot be undone.",
      )
    ) {
      const success = dataManagementService.deleteSession(sessionId);
      if (success) {
        this.loadData();
      }
    }
  };

  private deleteSelectedSessions = async () => {
    const { selectedSessions } = this.state;

    if (selectedSessions.size === 0) return;

    const message = `Are you sure you want to delete ${selectedSessions.size} session(s)? This action cannot be undone.`;
    if (confirm(message)) {
      for (const sessionId of selectedSessions) {
        dataManagementService.deleteSession(sessionId);
      }
      this.setState({ selectedSessions: new Set() });
      this.loadData();
    }
  };

  private exportSession = async (sessionId: string, format: string) => {
    try {
      const blob = await dataManagementService.exportSession(sessionId, format);
      const session = dataManagementService.getSession(sessionId);

      if (session) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${session.name}_${session.track}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    }
  };

  private exportSelectedSessions = async () => {
    const { selectedSessions, exportFormat } = this.state;

    if (selectedSessions.size === 0) return;

    try {
      for (const sessionId of selectedSessions) {
        await this.exportSession(sessionId, exportFormat);
        // Add small delay to avoid overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error("Bulk export failed:", error);
      alert("Some exports may have failed. Please check downloads.");
    }
  };

  private handleFileImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      for (const file of Array.from(files)) {
        await dataManagementService.importSession(file);
      }

      this.loadData();
      this.setState({ showImportDialog: false });

      // Reset file input
      if (this.fileInputRef.current) {
        this.fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Import failed:", error);
      alert("Import failed. Please check the file format and try again.");
    }
  };

  private syncToCloud = async (sessionId: string) => {
    try {
      const success = await cloudSyncService.syncSession(sessionId);
      if (success) {
        this.loadData();
      }
    } catch (error) {
      console.error("Cloud sync failed:", error);
      alert("Cloud sync failed. Please check your connection and try again.");
    }
  };

  private getFilteredAndSortedSessions = (): SessionData[] => {
    const { sessions, searchQuery, sortBy, sortOrder, filterBy } = this.state;

    let filtered = sessions;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (session) =>
          session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          session.track.toLowerCase().includes(searchQuery.toLowerCase()) ||
          session.notes.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply type filter
    if (filterBy !== "all") {
      filtered = filtered.filter((session) => session.type === filterBy);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "track":
          comparison = a.track.localeCompare(b.track);
          break;
        case "duration":
          comparison = a.duration - b.duration;
          break;
        case "bestLap":
          comparison =
            (a.bestLapTime || Infinity) - (b.bestLapTime || Infinity);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  };

  private formatTime = (milliseconds: number): string => {
    if (!milliseconds) return "N/A";

    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const ms = Math.floor((milliseconds % 1000) / 10);

    return `${minutes}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  private formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  private getSessionTypeColor = (type: SessionData["type"]): string => {
    const colors = {
      practice: "bg-blue-500",
      qualifying: "bg-yellow-500",
      race: "bg-red-500",
      test: "bg-green-500",
    };
    return colors[type] || "bg-gray-500";
  };

  render() {
    const {
      sessions,
      selectedSessions,
      searchQuery,
      sortBy,
      sortOrder,
      filterBy,
      isLoading,
      exportFormat,
      showExportDialog,
      showImportDialog,
      analytics,
      syncStatus,
      cloudProviders,
    } = this.state;

    const filteredSessions = this.getFilteredAndSortedSessions();
    const connectedProviders = cloudProviders.filter((p) => p.isConnected);

    if (isLoading) {
      return (
        <div className="min-h-screen bg-racing-dark text-white p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-racing-orange border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading sessions...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-racing-dark text-white">
        {/* Header */}
        <div className="border-b border-gray-800 bg-black/50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-racing-orange flex items-center gap-3">
                  <Database className="h-8 w-8" />
                  Data Management
                </h1>
                <p className="text-muted-foreground mt-2">
                  Manage your racing sessions, export data, and sync to cloud
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => this.setState({ showImportDialog: true })}
                  variant="outline"
                  className="bg-racing-dark border-gray-600 hover:bg-gray-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>

                <Button
                  onClick={() => this.setState({ showExportDialog: true })}
                  disabled={selectedSessions.size === 0}
                  className="bg-racing-orange hover:bg-racing-orange/80"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export ({selectedSessions.size})
                </Button>
              </div>
            </div>

            {/* Analytics Overview */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Sessions
                        </p>
                        <p className="text-2xl font-bold text-racing-orange">
                          {analytics.totalSessions}
                        </p>
                      </div>
                      <Database className="h-8 w-8 text-racing-orange/60" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Track Time
                        </p>
                        <p className="text-2xl font-bold text-blue-400">
                          {this.formatDuration(analytics.totalTrackTime)}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-400/60" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Best Lap Time
                        </p>
                        <p className="text-2xl font-bold text-green-400">
                          {this.formatTime(analytics.bestLapTime)}
                        </p>
                      </div>
                      <Trophy className="h-8 w-8 text-green-400/60" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Tracks Visited
                        </p>
                        <p className="text-2xl font-bold text-purple-400">
                          {analytics.tracksVisited.length}
                        </p>
                      </div>
                      <MapPin className="h-8 w-8 text-purple-400/60" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Cloud Sync Status */}
            {syncStatus && connectedProviders.length > 0 && (
              <Card className="bg-gray-800 border-gray-700 mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CloudUpload className="h-4 w-4" />
                    Cloud Sync Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-3 h-3 rounded-full ${syncStatus.isOnline ? "bg-green-500" : "bg-red-500"}`}
                      ></div>
                      <span className="text-sm">
                        {syncStatus.isOnline ? "Online" : "Offline"} •
                        {connectedProviders.length} provider(s) connected
                      </span>
                      {syncStatus.lastSyncTime && (
                        <span className="text-xs text-muted-foreground">
                          Last sync:{" "}
                          {syncStatus.lastSyncTime.toLocaleTimeString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {syncStatus.pendingUploads > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {syncStatus.pendingUploads} pending
                        </Badge>
                      )}
                      {syncStatus.isSyncing && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-racing-orange border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs">Syncing...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Filters and Search */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => this.handleSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-racing-orange focus:border-transparent"
                />
              </div>

              <select
                value={filterBy}
                onChange={(e) => this.handleFilter(e.target.value as any)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-racing-orange"
              >
                <option value="all">All Types</option>
                <option value="practice">Practice</option>
                <option value="qualifying">Qualifying</option>
                <option value="race">Race</option>
                <option value="test">Test</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {selectedSessions.size > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedSessions.size} selected
                  </span>
                  <Button
                    onClick={this.clearSelection}
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-600"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={this.deleteSelectedSessions}
                    variant="outline"
                    size="sm"
                    className="bg-red-900 border-red-700 hover:bg-red-800"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </>
              )}

              <Button
                onClick={this.selectAllSessions}
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-600"
              >
                Select All
              </Button>
            </div>
          </div>

          {/* Sessions Table */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Racing Sessions ({filteredSessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No sessions found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || filterBy !== "all"
                      ? "Try adjusting your filters"
                      : "Start a new session to see data here"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-2">
                          <input
                            type="checkbox"
                            checked={
                              selectedSessions.size ===
                                filteredSessions.length &&
                              filteredSessions.length > 0
                            }
                            onChange={() => {
                              if (
                                selectedSessions.size ===
                                filteredSessions.length
                              ) {
                                this.clearSelection();
                              } else {
                                this.selectAllSessions();
                              }
                            }}
                            className="rounded border-gray-600"
                          />
                        </th>
                        <th
                          className="text-left py-3 px-4 cursor-pointer hover:text-racing-orange"
                          onClick={() => this.handleSort("name")}
                        >
                          Session Name
                          {sortBy === "name" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </th>
                        <th
                          className="text-left py-3 px-4 cursor-pointer hover:text-racing-orange"
                          onClick={() => this.handleSort("track")}
                        >
                          Track
                          {sortBy === "track" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </th>
                        <th className="text-left py-3 px-4">Type</th>
                        <th
                          className="text-left py-3 px-4 cursor-pointer hover:text-racing-orange"
                          onClick={() => this.handleSort("date")}
                        >
                          Date
                          {sortBy === "date" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </th>
                        <th
                          className="text-left py-3 px-4 cursor-pointer hover:text-racing-orange"
                          onClick={() => this.handleSort("duration")}
                        >
                          Duration
                          {sortBy === "duration" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </th>
                        <th
                          className="text-left py-3 px-4 cursor-pointer hover:text-racing-orange"
                          onClick={() => this.handleSort("bestLap")}
                        >
                          Best Lap
                          {sortBy === "bestLap" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map((session) => (
                        <tr
                          key={session.id}
                          className="border-b border-gray-700 hover:bg-gray-700/50"
                        >
                          <td className="py-3 px-2">
                            <input
                              type="checkbox"
                              checked={selectedSessions.has(session.id)}
                              onChange={() =>
                                this.toggleSessionSelection(session.id)
                              }
                              className="rounded border-gray-600"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-white">
                                {session.name}
                              </p>
                              {session.notes && (
                                <p className="text-sm text-muted-foreground truncate max-w-xs">
                                  {session.notes}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {session.track}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={`${this.getSessionTypeColor(session.type)} text-white`}
                            >
                              {session.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {session.date.toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {this.formatDuration(session.duration)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-muted-foreground" />
                              {this.formatTime(session.bestLapTime)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                                onClick={() =>
                                  console.log("View session:", session.id)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                                onClick={() =>
                                  this.exportSession(session.id, "json")
                                }
                              >
                                <Download className="h-4 w-4" />
                              </Button>

                              {connectedProviders.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-blue-900 border-blue-700 hover:bg-blue-800"
                                  onClick={() => this.syncToCloud(session.id)}
                                >
                                  <CloudUpload className="h-4 w-4" />
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-red-900 border-red-700 hover:bg-red-800"
                                onClick={() => this.deleteSession(session.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Export Dialog */}
        {showExportDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
              <CardHeader>
                <CardTitle>Export Sessions</CardTitle>
                <CardDescription>
                  Choose the format for exporting {selectedSessions.size}{" "}
                  session(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Export Format
                    </label>
                    <select
                      value={exportFormat}
                      onChange={(e) =>
                        this.setState({ exportFormat: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="json">JSON (Complete Data)</option>
                      <option value="csv">CSV (Telemetry Data)</option>
                      <option value="motec">MoTeC (.ld)</option>
                      <option value="aim">AiM (.xrk)</option>
                      <option value="datalog">Datalog (.log)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => this.setState({ showExportDialog: false })}
                      variant="outline"
                      className="flex-1 bg-gray-700 border-gray-600"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        this.exportSelectedSessions();
                        this.setState({ showExportDialog: false });
                      }}
                      className="flex-1 bg-racing-orange hover:bg-racing-orange/80"
                    >
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Import Dialog */}
        {showImportDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
              <CardHeader>
                <CardTitle>Import Sessions</CardTitle>
                <CardDescription>
                  Select files to import (JSON, CSV, MoTeC .ld, AiM .xrk)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <input
                      ref={this.fileInputRef}
                      type="file"
                      multiple
                      accept=".json,.csv,.ld,.xrk"
                      onChange={this.handleFileImport}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-racing-orange file:text-white"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => this.setState({ showImportDialog: false })}
                      variant="outline"
                      className="flex-1 bg-gray-700 border-gray-600"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }
}

export default DataManagement;
