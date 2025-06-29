// Mobile Racing Companion Interface
// Native mobile app functionality with offline sync and Bluetooth OBD-II

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Smartphone,
  Bluetooth,
  Wifi,
  WifiOff,
  Download,
  Upload,
  Battery,
  Signal,
  Settings,
  Play,
  Square,
  AlertTriangle,
  CheckCircle,
  Clock,
  Thermometer,
  Gauge,
  Navigation,
} from "lucide-react";

import mobileRacingService, {
  MobileDevice,
  BluetoothOBDDevice,
  TracksidemInterface,
  MobileNotification,
  MobileSession,
} from "../services/MobileRacingService";

const MobileRacingPage: React.FC = () => {
  const [device, setDevice] = useState<MobileDevice | null>(null);
  const [bluetoothDevices, setBluetoothDevices] = useState<
    BluetoothOBDDevice[]
  >([]);
  const [tracksidemData, setTracksidemData] =
    useState<TracksidemInterface | null>(null);
  const [currentSession, setCurrentSession] = useState<MobileSession | null>(
    null,
  );
  const [offlineMode, setOfflineMode] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);

  useEffect(() => {
    initializeMobileService();
  }, []);

  const initializeMobileService = async () => {
    try {
      const detectedDevice = await mobileRacingService.detectDevice();
      setDevice(detectedDevice);

      // Enable offline mode
      await mobileRacingService.enableOfflineMode();

      // Listen for trackside updates
      window.addEventListener("trackside-update", handleTracksidemUpdate);
    } catch (error) {
      console.error("Failed to initialize mobile service:", error);
    }
  };

  const handleTracksidemUpdate = (event: any) => {
    setTracksidemData(event.detail);
  };

  const scanBluetoothDevices = async () => {
    try {
      const devices = await mobileRacingService.scanForBluetoothDevices();
      setBluetoothDevices(devices);
    } catch (error) {
      console.error("Bluetooth scan failed:", error);
      alert("Bluetooth scan failed. Make sure Bluetooth is enabled.");
    }
  };

  const connectToDevice = async (deviceId: string) => {
    try {
      await mobileRacingService.connectToBluetoothDevice(deviceId);
      const updatedDevices = mobileRacingService.getBluetoothDevices();
      setBluetoothDevices(updatedDevices);

      sendNotification({
        type: "performance_alert",
        priority: "medium",
        title: "Device Connected",
        message: "OBD-II device connected successfully",
        actionRequired: false,
        autoAcknowledge: true,
      });
    } catch (error) {
      console.error("Connection failed:", error);
      alert("Failed to connect to device");
    }
  };

  const syncOfflineData = async () => {
    if (syncInProgress) return;

    setSyncInProgress(true);
    try {
      await mobileRacingService.syncOfflineData();
      sendNotification({
        type: "performance_alert",
        priority: "low",
        title: "Sync Complete",
        message: "All offline data has been synchronized",
        actionRequired: false,
        autoAcknowledge: true,
      });
    } catch (error) {
      console.error("Sync failed:", error);
      alert("Sync failed. Will retry automatically.");
    } finally {
      setSyncInProgress(false);
    }
  };

  const startTracksidemMode = async () => {
    try {
      const sessionId = currentSession?.id || "demo-session";
      const data = await mobileRacingService.startTracksidemMode(sessionId);
      setTracksidemData(data);
    } catch (error) {
      console.error("Failed to start trackside mode:", error);
    }
  };

  const stopTracksidemMode = async () => {
    try {
      await mobileRacingService.stopTracksidemMode();
      setTracksidemData(null);
    } catch (error) {
      console.error("Failed to stop trackside mode:", error);
    }
  };

  const startMobileSession = async () => {
    try {
      const session = await mobileRacingService.startMobileSession(
        "silverstone-gp",
        offlineMode,
      );
      setCurrentSession(session);
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const endMobileSession = async () => {
    try {
      const session = await mobileRacingService.endMobileSession();
      setCurrentSession(null);
      if (session) {
        sendNotification({
          type: "performance_alert",
          priority: "medium",
          title: "Session Ended",
          message: `Session completed with ${session.dataPoints} data points`,
          actionRequired: false,
          autoAcknowledge: true,
        });
      }
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  };

  const sendNotification = async (
    notification: Omit<MobileNotification, "id" | "timestamp">,
  ) => {
    try {
      await mobileRacingService.sendMobileNotification(notification);
      const fullNotification: MobileNotification = {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date(),
      };
      setNotifications((prev) => [fullNotification, ...prev.slice(0, 4)]);
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-400";
      case "offline":
        return "text-red-400";
      case "limited":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "pairing":
        return "bg-yellow-500";
      case "disconnected":
        return "bg-gray-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Mobile Racing Companion
          </h1>
          <p className="text-gray-400">
            Native mobile app with offline sync and Bluetooth OBD-II
          </p>
        </div>

        <Tabs defaultValue="device" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger value="device">Device</TabsTrigger>
            <TabsTrigger value="bluetooth">Bluetooth</TabsTrigger>
            <TabsTrigger value="trackside">Trackside</TabsTrigger>
            <TabsTrigger value="sync">Sync</TabsTrigger>
            <TabsTrigger value="session">Session</TabsTrigger>
          </TabsList>

          {/* Device Tab */}
          <TabsContent value="device" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-blue-400" />
                  Device Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {device ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-400">Device Type</div>
                        <div className="font-semibold">{device.type}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Version</div>
                        <div className="font-semibold">{device.version}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">
                          Network Status
                        </div>
                        <div
                          className={getDeviceStatusColor(device.networkStatus)}
                        >
                          {device.networkStatus}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Last Sync</div>
                        <div className="font-semibold">
                          {device.lastSync.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-blue-400">
                        Device Capabilities
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(device.capabilities).map(
                          ([capability, supported]) => (
                            <div
                              key={capability}
                              className="flex items-center justify-between p-2 bg-gray-700 rounded"
                            >
                              <span className="capitalize">
                                {capability.replace("_", " ")}
                              </span>
                              {supported ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-red-400" />
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    {device.batteryLevel && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">
                            Battery Level
                          </span>
                          <span className="text-sm">
                            {device.batteryLevel}%
                          </span>
                        </div>
                        <Progress value={device.batteryLevel} className="h-2" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Detecting device...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Offline Mode Toggle */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {offlineMode ? (
                    <WifiOff className="h-5 w-5 text-orange-400" />
                  ) : (
                    <Wifi className="h-5 w-5 text-green-400" />
                  )}
                  Offline Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300 mb-1">
                      Enable offline data collection
                    </p>
                    <p className="text-xs text-gray-500">
                      Data will be synced when connection is restored
                    </p>
                  </div>
                  <Switch
                    checked={offlineMode}
                    onCheckedChange={setOfflineMode}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bluetooth Tab */}
          <TabsContent value="bluetooth" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bluetooth className="h-5 w-5 text-blue-400" />
                  Bluetooth OBD-II Devices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={scanBluetoothDevices}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Scan for Devices
                </Button>

                {bluetoothDevices.length > 0 ? (
                  <div className="space-y-3">
                    {bluetoothDevices.map((device) => (
                      <div
                        key={device.id}
                        className="p-4 bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold">{device.name}</div>
                            <div className="text-sm text-gray-400">
                              {device.protocol}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`${getConnectionStatusColor(device.connectionStatus)} text-white`}
                            >
                              {device.connectionStatus}
                            </Badge>
                            <Signal className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>

                        {device.connectionStatus === "disconnected" && (
                          <Button
                            onClick={() => connectToDevice(device.id)}
                            size="sm"
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            Connect
                          </Button>
                        )}

                        {device.connectionStatus === "connected" && (
                          <div className="mt-2 text-xs text-gray-400">
                            <div>Signal: {device.signalStrength} dBm</div>
                            <div>
                              Supported PIDs: {device.supportedPIDs.length}
                            </div>
                            <div>
                              Last Activity:{" "}
                              {device.lastActivity.toLocaleTimeString()}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Bluetooth className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No Bluetooth devices found</p>
                    <p className="text-sm">
                      Make sure your OBD-II adapter is in pairing mode
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trackside Tab */}
          <TabsContent value="trackside" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-green-400" />
                  Trackside Interface
                  {tracksidemData && (
                    <Badge className="bg-green-500 text-white ml-2">LIVE</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  {!tracksidemData ? (
                    <Button
                      onClick={startTracksidemMode}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Trackside Mode
                    </Button>
                  ) : (
                    <Button onClick={stopTracksidemMode} variant="destructive">
                      <Square className="h-4 w-4 mr-2" />
                      Stop Trackside Mode
                    </Button>
                  )}
                </div>

                {tracksidemData && (
                  <div className="space-y-4">
                    {/* Live Racing Data */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-gray-700 border-gray-600">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-400">
                            {Math.round(tracksidemData.currentSpeed)}
                          </div>
                          <div className="text-xs text-gray-400">KM/H</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-700 border-gray-600">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-400">
                            {tracksidemData.currentLap}
                          </div>
                          <div className="text-xs text-gray-400">LAP</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-700 border-gray-600">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-400">
                            {tracksidemData.position}
                          </div>
                          <div className="text-xs text-gray-400">POSITION</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-700 border-gray-600">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-orange-400">
                            {tracksidemData.fuelRemaining}%
                          </div>
                          <div className="text-xs text-gray-400">FUEL</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Tire Temperatures */}
                    <Card className="bg-gray-700 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Tire Temperatures
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Front Left</span>
                              <span className="font-mono">
                                {Math.round(tracksidemData.tireTemps.frontLeft)}
                                °C
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Front Right</span>
                              <span className="font-mono">
                                {Math.round(
                                  tracksidemData.tireTemps.frontRight,
                                )}
                                °C
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Rear Left</span>
                              <span className="font-mono">
                                {Math.round(tracksidemData.tireTemps.rearLeft)}
                                °C
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Rear Right</span>
                              <span className="font-mono">
                                {Math.round(tracksidemData.tireTemps.rearRight)}
                                °C
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Weather Conditions */}
                    <Card className="bg-gray-700 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Weather Conditions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Thermometer className="h-4 w-4" />
                              <span>
                                Air:{" "}
                                {tracksidemData.weatherConditions.temperature}°C
                              </span>
                            </div>
                            <div>
                              Track:{" "}
                              {tracksidemData.weatherConditions.trackTemp}°C
                            </div>
                          </div>
                          <div>
                            <div className="mb-2">
                              Humidity:{" "}
                              {tracksidemData.weatherConditions.humidity}%
                            </div>
                            <div>
                              Wind: {tracksidemData.weatherConditions.windSpeed}{" "}
                              km/h
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sync Tab */}
          <TabsContent value="sync" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-400" />
                  Data Synchronization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded">
                  <div>
                    <div className="font-semibold">Offline Queue</div>
                    <div className="text-sm text-gray-400">
                      {mobileRacingService.getOfflineQueueSize()} items pending
                    </div>
                  </div>
                  <Badge className="bg-orange-500 text-white">
                    {mobileRacingService.getOfflineQueueSize()}
                  </Badge>
                </div>

                <Button
                  onClick={syncOfflineData}
                  disabled={syncInProgress}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {syncInProgress ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Sync Now
                    </>
                  )}
                </Button>

                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-300">
                    Sync Status
                  </div>
                  <div className="text-xs text-gray-400">
                    {syncInProgress
                      ? "Synchronization in progress..."
                      : "Ready to sync"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Session Tab */}
          <TabsContent value="session" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-400" />
                  Mobile Session Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!currentSession ? (
                  <Button
                    onClick={startMobileSession}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Session
                  </Button>
                ) : (
                  <>
                    <div className="p-4 bg-gray-700 rounded">
                      <div className="font-semibold mb-2">
                        {currentSession.name}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Started:</span>
                          <div>
                            {currentSession.startTime.toLocaleTimeString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Data Points:</span>
                          <div>{currentSession.dataPoints}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Sync Status:</span>
                          <div>
                            <Badge
                              className={
                                currentSession.syncStatus === "synced"
                                  ? "bg-green-500"
                                  : "bg-orange-500"
                              }
                            >
                              {currentSession.syncStatus}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Mode:</span>
                          <div>
                            {currentSession.offlineMode ? "Offline" : "Online"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={endMobileSession}
                      variant="destructive"
                      className="w-full"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      End Session
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            {notifications.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm">
                    Recent Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="p-3 bg-gray-700 rounded text-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold">
                            {notification.title}
                          </span>
                          <Badge
                            className={
                              notification.priority === "critical"
                                ? "bg-red-500"
                                : notification.priority === "high"
                                  ? "bg-orange-500"
                                  : "bg-blue-500"
                            }
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                        <div className="text-gray-400">
                          {notification.message}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {notification.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MobileRacingPage;
