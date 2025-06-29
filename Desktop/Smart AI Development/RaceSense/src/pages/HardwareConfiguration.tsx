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
// Progress component removed to prevent hook issues in class component
// Radix UI Tabs removed to fix hook errors in class component
import {
  HardDrive,
  Bluetooth,
  Wifi,
  Usb,
  Settings,
  Play,
  Square,
  Search,
  RefreshCw,
  Battery,
  Signal,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Upload,
  Download,
  Gauge,
  Thermometer,
  Zap,
  Activity,
  MapPin,
  Clock,
  Wrench,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import {
  enhancedHardwareService,
  HardwareDevice,
  DeviceGroup,
  CalibrationSession,
} from "@/services/EnhancedHardwareService";

interface HardwareConfigState {
  devices: any[];
  deviceGroups: any[];
  selectedDevice: string;
  isScanning: boolean;
  isLogging: boolean;
  connectedDevices: any[];
  calibrationSessions: any[];
  activeCalibration: string;
  deviceFilter: string;
  connectionType: string;
  recentData: any[];
  deviceErrors: any[];
  firmwareUpdates: any[];
  configurationBackups: any[];
  activeTab: string;
}

class HardwareConfiguration extends React.Component<{}, HardwareConfigState> {
  private dataUpdateInterval: NodeJS.Timeout | null = null;

  constructor(props: {}) {
    super(props);
    this.state = {
      devices: [],
      deviceGroups: [],
      selectedDevice: "",
      isScanning: false,
      isLogging: false,
      connectedDevices: [],
      calibrationSessions: [],
      activeCalibration: "",
      deviceFilter: "all",
      connectionType: "all",
      recentData: [],
      deviceErrors: [],
      firmwareUpdates: [],
      configurationBackups: [],
      activeTab: "overview",
    };
  }

  componentDidMount() {
    this.loadData();
    this.setupDataUpdates();
  }

  componentWillUnmount() {
    if (this.dataUpdateInterval) {
      clearInterval(this.dataUpdateInterval);
    }
  }

  private loadData = async () => {
    try {
      const devices = enhancedHardwareService.getAllDevices();
      const connectedDevices = enhancedHardwareService.getConnectedDevices();
      const deviceGroups = enhancedHardwareService.getDeviceGroups();
      const calibrationSessions =
        enhancedHardwareService.getCalibrationSessions();

      this.setState({
        devices,
        connectedDevices,
        deviceGroups,
        calibrationSessions,
        deviceErrors: this.getDeviceErrors(devices),
      });
    } catch (error) {
      console.error("Failed to load hardware data:", error);
    }
  };

  private setupDataUpdates = () => {
    // Set up real-time data updates
    enhancedHardwareService.onDataReceived((reading) => {
      this.setState((prevState) => ({
        recentData: [reading, ...prevState.recentData.slice(0, 99)], // Keep last 100 readings
      }));
    });

    enhancedHardwareService.onDeviceUpdate((device) => {
      this.setState((prevState) => ({
        devices: prevState.devices.map((d) =>
          d.id === device.id ? device : d,
        ),
        connectedDevices: prevState.connectedDevices.map((d) =>
          d.id === device.id ? device : d,
        ),
      }));
    });

    // Update device list every 5 seconds
    this.dataUpdateInterval = setInterval(() => {
      const connectedDevices = enhancedHardwareService.getConnectedDevices();
      this.setState({ connectedDevices });
    }, 5000);
  };

  private scanForDevices = async () => {
    try {
      this.setState({ isScanning: true });

      const deviceTypes =
        this.state.deviceFilter !== "all"
          ? [this.state.deviceFilter as any]
          : undefined;
      const discoveredDevices =
        await enhancedHardwareService.scanForDevices(deviceTypes);

      this.setState({
        devices: [...this.state.devices, ...discoveredDevices],
        isScanning: false,
      });
    } catch (error) {
      console.error("Device scan failed:", error);
      this.setState({ isScanning: false });
    }
  };

  private connectDevice = async (deviceId: string) => {
    try {
      const success = await enhancedHardwareService.connectDevice(deviceId);
      if (success) {
        this.loadData();
      }
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  private disconnectDevice = async (deviceId: string) => {
    try {
      await enhancedHardwareService.disconnectDevice(deviceId);
      this.loadData();
    } catch (error) {
      console.error("Disconnection failed:", error);
    }
  };

  private renderCustomProgress = (value: number, className?: string) => {
    return (
      <div className={`w-full bg-gray-700 rounded-full h-2 ${className || ""}`}>
        <div
          className="bg-racing-blue h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    );
  };

  private startLogging = async (deviceId: string) => {
    try {
      const success = await enhancedHardwareService.startLogging(deviceId);
      if (success) {
        this.setState({ isLogging: true });
        this.loadData();
      }
    } catch (error) {
      console.error("Failed to start logging:", error);
    }
  };

  private stopLogging = async (deviceId: string) => {
    try {
      const success = await enhancedHardwareService.stopLogging(deviceId);
      if (success) {
        this.setState({ isLogging: false });
        this.loadData();
      }
    } catch (error) {
      console.error("Failed to stop logging:", error);
    }
  };

  private startCalibration = async (deviceId: string, channelId: string) => {
    try {
      const device = this.state.devices.find((d) => d.id === deviceId);
      if (!device) return;

      const referenceValues = [0, 25, 50, 75, 100]; // Example reference values
      const sessionId = await enhancedHardwareService.startCalibration(
        deviceId,
        channelId,
        "linearity",
        referenceValues,
      );

      this.setState({ activeCalibration: sessionId });
      this.loadData();
    } catch (error) {
      console.error("Failed to start calibration:", error);
    }
  };

  private addCalibrationPoint = async (measuredValue: number) => {
    if (!this.state.activeCalibration) return;

    try {
      await enhancedHardwareService.addCalibrationPoint(
        this.state.activeCalibration,
        measuredValue,
      );
      this.loadData();
    } catch (error) {
      console.error("Failed to add calibration point:", error);
    }
  };

  private configureDevice = async (deviceId: string, config: any) => {
    try {
      const success = await enhancedHardwareService.configureDevice(
        deviceId,
        config,
      );
      if (success) {
        this.loadData();
      }
    } catch (error) {
      console.error("Configuration failed:", error);
    }
  };

  private getDeviceErrors = (devices: HardwareDevice[]): any[] => {
    const errors: any[] = [];

    devices.forEach((device) => {
      device.status.errors.forEach((error) => {
        if (!error.resolved) {
          errors.push({
            ...error,
            deviceName: device.name,
            deviceId: device.id,
          });
        }
      });
    });

    return errors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  private getFilteredDevices = (): HardwareDevice[] => {
    const { devices, deviceFilter, connectionType } = this.state;

    return devices.filter((device) => {
      const matchesType =
        deviceFilter === "all" || device.type === deviceFilter;
      const matchesConnection =
        connectionType === "all" || device.connectionType === connectionType;

      return matchesType && matchesConnection;
    });
  };

  private getConnectionIcon = (type: string) => {
    switch (type) {
      case "bluetooth":
        return <Bluetooth className="h-4 w-4" />;
      case "wifi":
        return <Wifi className="h-4 w-4" />;
      case "usb":
      case "serial":
        return <Usb className="h-4 w-4" />;
      default:
        return <HardDrive className="h-4 w-4" />;
    }
  };

  private getDeviceStatusColor = (device: HardwareDevice): string => {
    if (!device.isConnected) return "bg-gray-500";
    if (device.status.errors.length > 0) return "bg-red-500";
    if (device.status.isLogging) return "bg-green-500";
    return "bg-blue-500";
  };

  private formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  private exportDeviceConfig = (deviceId: string) => {
    try {
      const config =
        enhancedHardwareService.exportDeviceConfiguration(deviceId);
      const blob = new Blob([config], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const device = this.state.devices.find((d) => d.id === deviceId);
      const filename = `${device?.name || "device"}_config.json`;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  render() {
    const {
      devices,
      deviceGroups,
      selectedDevice,
      isScanning,
      isLogging,
      connectedDevices,
      calibrationSessions,
      activeCalibration,
      deviceFilter,
      connectionType,
      recentData,
      deviceErrors,
    } = this.state;

    const filteredDevices = this.getFilteredDevices();
    const selectedDeviceData = devices.find((d) => d.id === selectedDevice);

    return (
      <div className="min-h-screen bg-racing-dark text-white">
        {/* Header */}
        <div className="border-b border-gray-800 bg-black/50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-racing-orange flex items-center gap-3">
                  <HardDrive className="h-8 w-8" />
                  Hardware Configuration
                </h1>
                <p className="text-muted-foreground mt-2">
                  Manage racing hardware, sensors, and data acquisition systems
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={this.scanForDevices}
                  disabled={isScanning}
                  variant="outline"
                  className="bg-racing-dark border-gray-600 hover:bg-gray-700"
                >
                  {isScanning ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {isScanning ? "Scanning..." : "Scan Devices"}
                </Button>
              </div>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Connected Devices
                      </p>
                      <p className="text-2xl font-bold text-green-400">
                        {connectedDevices.length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-400/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Logging Active
                      </p>
                      <p className="text-2xl font-bold text-blue-400">
                        {
                          connectedDevices.filter((d) => d.status.isLogging)
                            .length
                        }
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-400/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Device Errors
                      </p>
                      <p className="text-2xl font-bold text-red-400">
                        {deviceErrors.length}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-400/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Data Points/s
                      </p>
                      <p className="text-2xl font-bold text-purple-400">
                        {recentData.length > 0
                          ? Math.round(recentData.length / 10)
                          : 0}
                      </p>
                    </div>
                    <Gauge className="h-8 w-8 text-purple-400/60" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-200px)]">
          {/* Device List */}
          <div className="w-80 border-r border-gray-800 bg-gray-900/50 overflow-y-auto">
            <div className="p-4">
              <div className="space-y-4">
                {/* Filters */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Device Type</label>
                  <select
                    value={deviceFilter}
                    onChange={(e) =>
                      this.setState({ deviceFilter: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="data_logger">Data Loggers</option>
                    <option value="gps">GPS Devices</option>
                    <option value="accelerometer">Accelerometers</option>
                    <option value="obd">OBD-II</option>
                    <option value="can_bus">CAN Bus</option>
                    <option value="sensor">Sensors</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Connection</label>
                  <select
                    value={connectionType}
                    onChange={(e) =>
                      this.setState({ connectionType: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
                  >
                    <option value="all">All Connections</option>
                    <option value="bluetooth">Bluetooth</option>
                    <option value="wifi">Wi-Fi</option>
                    <option value="usb">USB</option>
                    <option value="serial">Serial</option>
                    <option value="can">CAN Bus</option>
                  </select>
                </div>
              </div>

              {/* Device List */}
              <div className="mt-6 space-y-2">
                {filteredDevices.map((device) => (
                  <Card
                    key={device.id}
                    className={`cursor-pointer transition-colors ${
                      selectedDevice === device.id
                        ? "bg-racing-orange/20 border-racing-orange"
                        : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                    }`}
                    onClick={() => this.setState({ selectedDevice: device.id })}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {this.getConnectionIcon(device.connectionType)}
                            <span className="font-medium text-sm truncate">
                              {device.name}
                            </span>
                            <div
                              className={`w-2 h-2 rounded-full ${this.getDeviceStatusColor(device)}`}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {device.manufacturer} {device.model}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className="text-xs px-1 py-0"
                            >
                              {device.type}
                            </Badge>
                            {device.isConnected && (
                              <Badge className="text-xs px-1 py-0 bg-green-600">
                                Connected
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {device.isConnected && (
                        <div className="mt-2 space-y-1">
                          {device.batteryLevel !== undefined && (
                            <div className="flex items-center gap-2">
                              <Battery className="h-3 w-3" />
                              {this.renderCustomProgress(device.batteryLevel)}
                            </div>
                          )}
                          {device.signalStrength !== undefined && (
                            <div className="flex items-center gap-2">
                              <Signal className="h-3 w-3" />
                              {this.renderCustomProgress(device.signalStrength)}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {filteredDevices.length === 0 && (
                  <div className="text-center py-8">
                    <HardDrive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No devices found</p>
                    <p className="text-sm text-muted-foreground">
                      Try scanning for devices or adjust filters
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Device Details */}
          <div className="flex-1 overflow-y-auto">
            {selectedDeviceData ? (
              <div className="p-6">
                <div className="w-full">
                  {/* Custom Tab Navigation */}
                  <div className="grid w-full grid-cols-5 bg-gray-800 rounded-lg p-1 mb-6">
                    {[
                      { value: "overview", label: "Overview" },
                      { value: "channels", label: "Channels" },
                      { value: "configuration", label: "Configuration" },
                      { value: "calibration", label: "Calibration" },
                      { value: "data", label: "Data" },
                    ].map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() => this.setState({ activeTab: tab.value })}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                          this.state.activeTab === tab.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Overview Tab */}
                  {this.state.activeTab === "overview" && (
                    <div className="space-y-6">
                      {/* Device Header */}
                      <Card className="bg-gray-800 border-gray-700">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-3">
                                {this.getConnectionIcon(
                                  selectedDeviceData.connectionType,
                                )}
                                {selectedDeviceData.name}
                                <div
                                  className={`w-3 h-3 rounded-full ${this.getDeviceStatusColor(selectedDeviceData)}`}
                                ></div>
                              </CardTitle>
                              <CardDescription>
                                {selectedDeviceData.manufacturer}{" "}
                                {selectedDeviceData.model} • Firmware:{" "}
                                {selectedDeviceData.firmwareVersion}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              {!selectedDeviceData.isConnected ? (
                                <Button
                                  onClick={() =>
                                    this.connectDevice(selectedDeviceData.id)
                                  }
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Connect
                                </Button>
                              ) : (
                                <>
                                  {!selectedDeviceData.status.isLogging ? (
                                    <Button
                                      onClick={() =>
                                        this.startLogging(selectedDeviceData.id)
                                      }
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      <Play className="h-4 w-4 mr-2" />
                                      Start Logging
                                    </Button>
                                  ) : (
                                    <Button
                                      onClick={() =>
                                        this.stopLogging(selectedDeviceData.id)
                                      }
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      <Square className="h-4 w-4 mr-2" />
                                      Stop Logging
                                    </Button>
                                  )}
                                  <Button
                                    onClick={() =>
                                      this.disconnectDevice(
                                        selectedDeviceData.id,
                                      )
                                    }
                                    variant="outline"
                                    className="bg-gray-700 border-gray-600"
                                  >
                                    Disconnect
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Connection Type
                              </p>
                              <p className="font-medium capitalize">
                                {selectedDeviceData.connectionType}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Device Type
                              </p>
                              <p className="font-medium capitalize">
                                {selectedDeviceData.type.replace("_", " ")}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Last Seen
                              </p>
                              <p className="font-medium">
                                {selectedDeviceData.lastSeen.toLocaleTimeString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Uptime
                              </p>
                              <p className="font-medium">
                                {Math.round(
                                  selectedDeviceData.status.uptime / 60,
                                )}
                                m
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Status Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gray-800 border-gray-700">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">
                              Storage Usage
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Used</span>
                                <span>
                                  {this.formatBytes(
                                    selectedDeviceData.status.storageUsed,
                                  )}
                                </span>
                              </div>
                              {this.renderCustomProgress(
                                (setting.currentValue / setting.maxValue) * 100,
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gray-800 border-gray-700">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">
                              Data Quality
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Packets Received</span>
                                <span>
                                  {selectedDeviceData.status.packetsReceived}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Packets Lost</span>
                                <span>
                                  {selectedDeviceData.status.packetsLost}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Success Rate</span>
                                <span>
                                  {selectedDeviceData.status.packetsReceived > 0
                                    ? Math.round(
                                        (selectedDeviceData.status
                                          .packetsReceived /
                                          (selectedDeviceData.status
                                            .packetsReceived +
                                            selectedDeviceData.status
                                              .packetsLost)) *
                                          100,
                                      )
                                    : 0}
                                  %
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gray-800 border-gray-700">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">
                              Temperature
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-center">
                              <div className="text-3xl font-bold text-blue-400 mb-2">
                                {Math.round(
                                  selectedDeviceData.status.temperature,
                                )}
                                °C
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Operating normally
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Device Errors */}
                      {selectedDeviceData.status.errors.filter(
                        (e) => !e.resolved,
                      ).length > 0 && (
                        <Card className="bg-red-900/20 border-red-700">
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              Device Errors
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {selectedDeviceData.status.errors
                                .filter((e) => !e.resolved)
                                .slice(0, 3)
                                .map((error) => (
                                  <div
                                    key={error.id}
                                    className="flex items-center justify-between p-2 bg-red-900/30 rounded"
                                  >
                                    <div>
                                      <p className="text-sm font-medium">
                                        {error.message}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {error.timestamp.toLocaleString()}
                                      </p>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {error.severity}
                                    </Badge>
                                  </div>
                                ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Channels Tab */}
                  {this.state.activeTab === "channels" && (
                    <div className="space-y-4">
                      <Card className="bg-gray-800 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-sm">
                            Supported Channels
                          </CardTitle>
                          <CardDescription>
                            Configure data channels and sample rates
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {selectedDeviceData.supportedChannels.map(
                              (channel) => (
                                <div
                                  key={channel.id}
                                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <span className="font-medium">
                                        {channel.name}
                                      </span>
                                      <Badge
                                        variant={
                                          channel.enabled
                                            ? "default"
                                            : "secondary"
                                        }
                                        className={
                                          channel.enabled ? "bg-green-600" : ""
                                        }
                                      >
                                        {channel.enabled
                                          ? "Active"
                                          : "Inactive"}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Sample Rate: {channel.sampleRate}Hz •
                                      Unit: {channel.unit}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-gray-600 border-gray-500"
                                    >
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-blue-600 border-blue-500"
                                      onClick={() =>
                                        this.startCalibration(
                                          selectedDeviceData.id,
                                          channel.id,
                                        )
                                      }
                                    >
                                      <Gauge className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Configuration Tab */}
                  {this.state.activeTab === "configuration" && (
                    <div className="space-y-4">
                      <Card className="bg-gray-800 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-sm">
                            Device Configuration
                          </CardTitle>
                          <CardDescription>
                            Adjust device settings and data format
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Sample Rate (Hz)
                              </label>
                              <input
                                type="number"
                                value={
                                  selectedDeviceData.configuration.sampleRate
                                }
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Data Format
                              </label>
                              <select
                                value={
                                  selectedDeviceData.configuration.dataFormat
                                }
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                              >
                                <option value="json">JSON</option>
                                <option value="binary">Binary</option>
                                <option value="ascii">ASCII</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Storage Location
                            </label>
                            <select
                              value={
                                selectedDeviceData.configuration.storageLocation
                              }
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            >
                              <option value="internal">Internal Memory</option>
                              <option value="external">External Storage</option>
                              <option value="cloud">Cloud Storage</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Auto-start Logging
                            </span>
                            <Button
                              size="sm"
                              variant={
                                selectedDeviceData.configuration
                                  .autoStartLogging
                                  ? "default"
                                  : "outline"
                              }
                              className={
                                selectedDeviceData.configuration
                                  .autoStartLogging
                                  ? "bg-green-600"
                                  : "bg-gray-700"
                              }
                            >
                              {selectedDeviceData.configuration.autoStartLogging
                                ? "Enabled"
                                : "Disabled"}
                            </Button>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Compression
                            </span>
                            <Button
                              size="sm"
                              variant={
                                selectedDeviceData.configuration
                                  .compressionEnabled
                                  ? "default"
                                  : "outline"
                              }
                              className={
                                selectedDeviceData.configuration
                                  .compressionEnabled
                                  ? "bg-green-600"
                                  : "bg-gray-700"
                              }
                            >
                              {selectedDeviceData.configuration
                                .compressionEnabled
                                ? "Enabled"
                                : "Disabled"}
                            </Button>
                          </div>

                          <div className="flex items-center gap-3 pt-4">
                            <Button className="bg-racing-orange hover:bg-racing-orange/80">
                              Apply Configuration
                            </Button>
                            <Button
                              variant="outline"
                              className="bg-gray-700 border-gray-600"
                              onClick={() =>
                                this.exportDeviceConfig(selectedDeviceData.id)
                              }
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Export Config
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Calibration Tab */}
                  {this.state.activeTab === "calibration" && (
                    <div className="space-y-4">
                      <Card className="bg-gray-800 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-sm">
                            Calibration Sessions
                          </CardTitle>
                          <CardDescription>
                            Calibrate sensors for accurate measurements
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {calibrationSessions.filter(
                            (s) => s.deviceId === selectedDeviceData.id,
                          ).length === 0 ? (
                            <div className="text-center py-8">
                              <Gauge className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">
                                No calibration sessions
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Start calibration from the Channels tab
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {calibrationSessions
                                .filter(
                                  (s) => s.deviceId === selectedDeviceData.id,
                                )
                                .map((session) => (
                                  <div
                                    key={session.id}
                                    className="p-3 bg-gray-700 rounded-lg"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium">
                                          {session.channelId}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {session.type} • Started:{" "}
                                          {session.startedAt.toLocaleString()}
                                        </p>
                                      </div>
                                      <Badge
                                        variant={
                                          session.status === "completed"
                                            ? "default"
                                            : session.status === "in_progress"
                                              ? "outline"
                                              : "destructive"
                                        }
                                      >
                                        {session.status}
                                      </Badge>
                                    </div>
                                    <div className="mt-2">
                                      <Progress
                                        value={
                                          (session.measuredValues.length /
                                            session.referenceValues.length) *
                                          100
                                        }
                                        className="h-2"
                                      />
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {session.measuredValues.length} /{" "}
                                        {session.referenceValues.length} points
                                        completed
                                      </p>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Data Tab */}
                  {this.state.activeTab === "data" && (
                    <div className="space-y-4">
                      <Card className="bg-gray-800 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-sm">
                            Live Data Stream
                          </CardTitle>
                          <CardDescription>
                            Real-time sensor readings and telemetry
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {selectedDeviceData.status.isLogging ? (
                            <div className="space-y-3">
                              {recentData
                                .filter(
                                  (d) => d.deviceId === selectedDeviceData.id,
                                )
                                .slice(0, 10)
                                .map((reading, index) => (
                                  <div
                                    key={`${reading.timestamp}-${index}`}
                                    className="flex items-center justify-between p-2 bg-gray-700 rounded"
                                  >
                                    <div>
                                      <span className="font-medium">
                                        {reading.channelId}
                                      </span>
                                      <span className="text-sm text-muted-foreground ml-2">
                                        {new Date(
                                          reading.timestamp,
                                        ).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="font-mono text-lg">
                                        {reading.value.toFixed(2)}
                                      </span>
                                      <Badge
                                        variant={
                                          reading.quality === "good"
                                            ? "default"
                                            : reading.quality === "questionable"
                                              ? "outline"
                                              : "destructive"
                                        }
                                        className="ml-2 text-xs"
                                      >
                                        {reading.quality}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">
                                No live data
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Start logging to see real-time sensor data
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <HardDrive className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-xl font-medium text-muted-foreground">
                    Select a device
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Choose a device from the list to view details and configure
                    settings
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default HardwareConfiguration;
