// Mobile Racing Companion Service
// Native mobile app functionality with offline sync and Bluetooth OBD-II

export interface MobileDevice {
  id: string;
  name: string;
  type: "iOS" | "Android" | "PWA";
  version: string;
  capabilities: {
    bluetooth: boolean;
    gps: boolean;
    camera: boolean;
    gyroscope: boolean;
    accelerometer: boolean;
    magnetometer: boolean;
  };
  batteryLevel?: number;
  networkStatus: "online" | "offline" | "limited";
  lastSync: Date;
}

export interface OfflineSyncData {
  sessions: any[];
  telemetryData: any[];
  trackData: any[];
  userSettings: any;
  syncTimestamp: number;
  dataSize: number; // bytes
}

export interface BluetoothOBDDevice {
  id: string;
  name: string;
  macAddress: string;
  protocol: "ELM327" | "STN1110" | "OBDLink" | "Generic";
  connectionStatus: "connected" | "disconnected" | "pairing" | "error";
  signalStrength: number; // -100 to 0 dBm
  supportedPIDs: string[];
  lastActivity: Date;
}

export interface TracksidemInterface {
  id: string;
  sessionId: string;
  mode: "practice" | "qualifying" | "race";
  currentLap: number;
  position: number;
  gapToLeader: number; // seconds
  gapToNext: number; // seconds
  currentSpeed: number;
  lastLapTime: number;
  bestLapTime: number;
  fuelRemaining: number;
  tireTemps: {
    frontLeft: number;
    frontRight: number;
    rearLeft: number;
    rearRight: number;
  };
  weatherConditions: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    trackTemp: number;
    rainProbability: number;
  };
}

export interface MobileNotification {
  id: string;
  type:
    | "pit_window"
    | "fuel_warning"
    | "tire_degradation"
    | "weather_change"
    | "performance_alert";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  timestamp: Date;
  actionRequired: boolean;
  autoAcknowledge: boolean;
}

export interface MobileSession {
  id: string;
  name: string;
  trackId: string;
  startTime: Date;
  endTime?: Date;
  dataPoints: number;
  syncStatus: "pending" | "syncing" | "synced" | "conflict";
  offlineMode: boolean;
  compressionLevel: number;
  encryptionEnabled: boolean;
}

class MobileRacingService {
  private device: MobileDevice | null = null;
  private bluetoothDevices: Map<string, BluetoothOBDDevice> = new Map();
  private offlineQueue: any[] = [];
  private syncInProgress = false;
  private tracksidemActive = false;
  private currentSession: MobileSession | null = null;

  // Device Detection and Capabilities
  async detectDevice(): Promise<MobileDevice> {
    const device: MobileDevice = {
      id: this.generateDeviceId(),
      name: this.getDeviceName(),
      type: this.getDeviceType(),
      version: this.getDeviceVersion(),
      capabilities: await this.detectCapabilities(),
      networkStatus: this.getNetworkStatus(),
      lastSync: new Date(),
    };

    this.device = device;
    return device;
  }

  private getDeviceType(): "iOS" | "Android" | "PWA" {
    const userAgent = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(userAgent)) return "iOS";
    if (/Android/.test(userAgent)) return "Android";
    return "PWA";
  }

  private getDeviceName(): string {
    const type = this.getDeviceType();
    const timestamp = Date.now().toString().slice(-4);
    return `${type}-Device-${timestamp}`;
  }

  private getDeviceVersion(): string {
    const userAgent = navigator.userAgent;
    if (this.getDeviceType() === "iOS") {
      const match = userAgent.match(/OS (\d+)_(\d+)/);
      return match ? `${match[1]}.${match[2]}` : "Unknown";
    } else if (this.getDeviceType() === "Android") {
      const match = userAgent.match(/Android (\d+\.?\d*)/);
      return match ? match[1] : "Unknown";
    }
    return "PWA-1.0";
  }

  private async detectCapabilities() {
    return {
      bluetooth: "bluetooth" in navigator,
      gps: "geolocation" in navigator,
      camera:
        "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices,
      gyroscope: "DeviceOrientationEvent" in window,
      accelerometer: "DeviceMotionEvent" in window,
      magnetometer: "ondeviceorientationabsolute" in window,
    };
  }

  private getNetworkStatus(): "online" | "offline" | "limited" {
    if (!navigator.onLine) return "offline";

    // Check connection quality
    const connection = (navigator as any).connection;
    if (connection) {
      if (connection.effectiveType === "2g" || connection.downlink < 1) {
        return "limited";
      }
    }

    return "online";
  }

  // Bluetooth OBD-II Integration
  async scanForBluetoothDevices(): Promise<BluetoothOBDDevice[]> {
    if (!("bluetooth" in navigator)) {
      throw new Error("Bluetooth not supported on this device");
    }

    try {
      // Request Bluetooth device with OBD-II service
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { services: ["0000fff0-0000-1000-8000-00805f9b34fb"] }, // Common OBD service
          { namePrefix: "OBDII" },
          { namePrefix: "ELM327" },
          { namePrefix: "OBDLink" },
        ],
        optionalServices: ["battery_service", "device_information"],
      });

      const obdDevice: BluetoothOBDDevice = {
        id: device.id,
        name: device.name || "Unknown OBD Device",
        macAddress: device.id, // Approximation for Bluetooth LE
        protocol: this.detectOBDProtocol(device.name),
        connectionStatus: "disconnected",
        signalStrength: -50, // Default value
        supportedPIDs: [],
        lastActivity: new Date(),
      };

      this.bluetoothDevices.set(device.id, obdDevice);
      return [obdDevice];
    } catch (error) {
      console.error("Bluetooth scan failed:", error);
      throw new Error("Failed to scan for Bluetooth devices");
    }
  }

  private detectOBDProtocol(
    deviceName: string,
  ): BluetoothOBDDevice["protocol"] {
    const name = deviceName?.toLowerCase() || "";
    if (name.includes("elm327")) return "ELM327";
    if (name.includes("stn1110")) return "STN1110";
    if (name.includes("obdlink")) return "OBDLink";
    return "Generic";
  }

  async connectToBluetoothDevice(deviceId: string): Promise<void> {
    const device = this.bluetoothDevices.get(deviceId);
    if (!device) {
      throw new Error("Device not found");
    }

    try {
      // Simulate connection process
      device.connectionStatus = "pairing";
      this.bluetoothDevices.set(deviceId, device);

      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      device.connectionStatus = "connected";
      device.lastActivity = new Date();
      device.supportedPIDs = await this.querySupportedPIDs(deviceId);

      this.bluetoothDevices.set(deviceId, device);
      console.log(`Connected to OBD device: ${device.name}`);
    } catch (error) {
      device.connectionStatus = "error";
      this.bluetoothDevices.set(deviceId, device);
      throw new Error(`Failed to connect to device: ${error.message}`);
    }
  }

  private async querySupportedPIDs(deviceId: string): Promise<string[]> {
    // Simulate querying supported PIDs
    return [
      "0100", // Supported PIDs 01-20
      "010C", // Engine RPM
      "010D", // Vehicle Speed
      "0105", // Engine Coolant Temperature
      "010B", // Intake Manifold Pressure
      "0111", // Throttle Position
      "010F", // Intake Air Temperature
      "0142", // Control Module Voltage
    ];
  }

  // Offline Synchronization
  async enableOfflineMode(): Promise<void> {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Worker not supported");
    }

    try {
      // Register service worker for offline caching
      await navigator.serviceWorker.register("/sw.js");
      console.log("Offline mode enabled");
    } catch (error) {
      throw new Error("Failed to enable offline mode");
    }
  }

  async syncOfflineData(): Promise<void> {
    if (this.syncInProgress) {
      console.log("Sync already in progress");
      return;
    }

    this.syncInProgress = true;

    try {
      // Upload pending data
      await this.uploadPendingData();

      // Download latest data
      await this.downloadLatestData();

      // Clear offline queue
      this.offlineQueue = [];

      console.log("Offline sync completed successfully");
    } catch (error) {
      console.error("Sync failed:", error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async uploadPendingData(): Promise<void> {
    for (const item of this.offlineQueue) {
      try {
        // Simulate upload to server
        await this.uploadDataItem(item);
      } catch (error) {
        console.error("Failed to upload item:", error);
        // Keep in queue for retry
      }
    }
  }

  private async downloadLatestData(): Promise<void> {
    // Simulate downloading latest track data, settings, etc.
    const latestData = await this.fetchLatestData();
    await this.storeDataLocally(latestData);
  }

  private async uploadDataItem(item: any): Promise<void> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }

  private async fetchLatestData(): Promise<any> {
    // Simulate fetching latest data
    return {
      tracks: [],
      settings: {},
      timestamp: Date.now(),
    };
  }

  private async storeDataLocally(data: any): Promise<void> {
    try {
      localStorage.setItem("racesense_offline_data", JSON.stringify(data));
    } catch (error) {
      console.error("Failed to store data locally:", error);
    }
  }

  // Trackside Interface
  async startTracksidemMode(sessionId: string): Promise<TracksidemInterface> {
    this.tracksidemActive = true;

    const tracksidemData: TracksidemInterface = {
      id: this.generateId(),
      sessionId,
      mode: "practice",
      currentLap: 0,
      position: 1,
      gapToLeader: 0,
      gapToNext: 0,
      currentSpeed: 0,
      lastLapTime: 0,
      bestLapTime: 0,
      fuelRemaining: 100,
      tireTemps: {
        frontLeft: 25,
        frontRight: 25,
        rearLeft: 25,
        rearRight: 25,
      },
      weatherConditions: {
        temperature: 22,
        humidity: 65,
        windSpeed: 5,
        trackTemp: 28,
        rainProbability: 10,
      },
    };

    // Start real-time updates
    this.startTracksidemUpdates(tracksidemData);

    return tracksidemData;
  }

  private startTracksidemUpdates(data: TracksidemInterface): void {
    const updateInterval = setInterval(() => {
      if (!this.tracksidemActive) {
        clearInterval(updateInterval);
        return;
      }

      // Simulate real-time updates
      data.currentSpeed = 50 + Math.random() * 200;
      data.tireTemps.frontLeft += (Math.random() - 0.5) * 2;
      data.tireTemps.frontRight += (Math.random() - 0.5) * 2;
      data.tireTemps.rearLeft += (Math.random() - 0.5) * 2;
      data.tireTemps.rearRight += (Math.random() - 0.5) * 2;

      // Trigger update event
      this.notifyTracksidemUpdate(data);
    }, 1000);
  }

  private notifyTracksidemUpdate(data: TracksidemInterface): void {
    // Emit update event for UI components
    window.dispatchEvent(new CustomEvent("trackside-update", { detail: data }));
  }

  async stopTracksidemMode(): Promise<void> {
    this.tracksidemActive = false;
    console.log("Trackside mode stopped");
  }

  // Mobile Notifications
  async sendMobileNotification(
    notification: Omit<MobileNotification, "id" | "timestamp">,
  ): Promise<void> {
    if (!("Notification" in window)) {
      console.warn("Notifications not supported");
      return;
    }

    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("Notification permission denied");
        return;
      }
    }

    const fullNotification: MobileNotification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
    };

    // Show browser notification
    const browserNotification = new Notification(fullNotification.title, {
      body: fullNotification.message,
      icon: "/icon-192x192.png",
      badge: "/icon-96x96.png",
      tag: fullNotification.type,
      requireInteraction: fullNotification.priority === "critical",
    });

    // Auto-acknowledge if configured
    if (fullNotification.autoAcknowledge) {
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }

  // Session Management
  async startMobileSession(
    trackId: string,
    offlineMode = false,
  ): Promise<MobileSession> {
    const session: MobileSession = {
      id: this.generateId(),
      name: `Mobile Session ${new Date().toLocaleString()}`,
      trackId,
      startTime: new Date(),
      dataPoints: 0,
      syncStatus: offlineMode ? "pending" : "synced",
      offlineMode,
      compressionLevel: 6,
      encryptionEnabled: true,
    };

    this.currentSession = session;

    if (offlineMode) {
      this.offlineQueue.push({
        type: "session_start",
        data: session,
        timestamp: Date.now(),
      });
    }

    return session;
  }

  async endMobileSession(): Promise<MobileSession | null> {
    if (!this.currentSession) {
      return null;
    }

    this.currentSession.endTime = new Date();

    if (this.currentSession.offlineMode) {
      this.offlineQueue.push({
        type: "session_end",
        data: this.currentSession,
        timestamp: Date.now(),
      });
    }

    const session = this.currentSession;
    this.currentSession = null;

    return session;
  }

  // Utility Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateDeviceId(): string {
    // Generate consistent device ID
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("Device fingerprint", 2, 2);

    const fingerprint = canvas.toDataURL();
    return btoa(fingerprint).substr(0, 16);
  }

  // Getters
  getCurrentDevice(): MobileDevice | null {
    return this.device;
  }

  getBluetoothDevices(): BluetoothOBDDevice[] {
    return Array.from(this.bluetoothDevices.values());
  }

  getCurrentSession(): MobileSession | null {
    return this.currentSession;
  }

  isTracksidemActive(): boolean {
    return this.tracksidemActive;
  }

  getOfflineQueueSize(): number {
    return this.offlineQueue.length;
  }

  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }
}

export const mobileRacingService = new MobileRacingService();
export default mobileRacingService;
