// Real-world hardware integration for racing applications

interface DeviceCapabilities {
  gps: boolean;
  accelerometer: boolean;
  gyroscope: boolean;
  bluetooth: boolean;
  usb: boolean;
  wireless: boolean;
}

interface SensorReading {
  timestamp: number;
  source: string;
  type: "gps" | "accelerometer" | "gyroscope" | "obd2" | "custom";
  data: Record<string, any>;
  accuracy?: number;
}

interface ConnectedDevice {
  id: string;
  name: string;
  type: "smartphone" | "gps_logger" | "obd2_adapter" | "racing_app" | "custom";
  connectionType: "bluetooth" | "usb" | "wifi" | "web_serial" | "websocket";
  capabilities: DeviceCapabilities;
  status: "connected" | "disconnected" | "connecting" | "error";
  lastSeen: number;
  batteryLevel?: number;
}

class RealWorldHardwareService {
  private devices: Map<string, ConnectedDevice> = new Map();
  private sensorListeners: Set<(reading: SensorReading) => void> = new Set();
  private isCapturingData = false;
  private dataStream: SensorReading[] = [];

  constructor() {
    this.initializeWebAPIs();
  }

  // Initialize available Web APIs for hardware access
  private async initializeWebAPIs() {
    // Check for available APIs
    const capabilities: DeviceCapabilities = {
      gps: "geolocation" in navigator,
      accelerometer: "DeviceMotionEvent" in window,
      gyroscope: "DeviceOrientationEvent" in window,
      bluetooth: "bluetooth" in navigator,
      usb: "usb" in navigator,
      wireless: "serviceWorker" in navigator,
    };

    console.log("Available hardware capabilities:", capabilities);

    // Request permissions for mobile sensors
    if (capabilities.accelerometer) {
      await this.requestMotionPermissions();
    }
  }

  // Request motion sensor permissions (iOS 13+)
  private async requestMotionPermissions() {
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== "granted") {
          console.warn("Motion sensor permission denied");
        }
      } catch (error) {
        console.warn("Could not request motion permission:", error);
      }
    }
  }

  // GPS and Location Services
  async startGPSTracking(options?: PositionOptions): Promise<void> {
    if (!("geolocation" in navigator)) {
      throw new Error("GPS not available on this device");
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
      ...options,
    };

    return new Promise((resolve, reject) => {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const reading: SensorReading = {
            timestamp: Date.now(),
            source: "browser-gps",
            type: "gps",
            data: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              altitude: position.coords.altitude,
              speed: position.coords.speed, // m/s
              heading: position.coords.heading,
              accuracy: position.coords.accuracy,
            },
            accuracy: position.coords.accuracy,
          };

          this.broadcastSensorReading(reading);
          resolve();
        },
        (error) => {
          console.error("GPS error:", error);
          reject(error);
        },
        defaultOptions,
      );

      // Store watch ID for cleanup
      this.devices.set("browser-gps", {
        id: "browser-gps",
        name: "Device GPS",
        type: "smartphone",
        connectionType: "web_serial",
        capabilities: {
          gps: true,
          accelerometer: false,
          gyroscope: false,
          bluetooth: false,
          usb: false,
          wireless: false,
        },
        status: "connected",
        lastSeen: Date.now(),
      });
    });
  }

  // Motion Sensors (Accelerometer, Gyroscope)
  startMotionTracking(): void {
    if ("DeviceMotionEvent" in window) {
      window.addEventListener(
        "devicemotion",
        this.handleDeviceMotion.bind(this),
      );
    }

    if ("DeviceOrientationEvent" in window) {
      window.addEventListener(
        "deviceorientation",
        this.handleDeviceOrientation.bind(this),
      );
    }

    this.devices.set("device-motion", {
      id: "device-motion",
      name: "Device Sensors",
      type: "smartphone",
      connectionType: "web_serial",
      capabilities: {
        gps: false,
        accelerometer: true,
        gyroscope: true,
        bluetooth: false,
        usb: false,
        wireless: false,
      },
      status: "connected",
      lastSeen: Date.now(),
    });
  }

  private handleDeviceMotion(event: DeviceMotionEvent): void {
    if (!event.acceleration) return;

    const reading: SensorReading = {
      timestamp: Date.now(),
      source: "device-motion",
      type: "accelerometer",
      data: {
        x: event.acceleration.x || 0,
        y: event.acceleration.y || 0,
        z: event.acceleration.z || 0,
        rotationRateAlpha: event.rotationRate?.alpha || 0,
        rotationRateBeta: event.rotationRate?.beta || 0,
        rotationRateGamma: event.rotationRate?.gamma || 0,
        interval: event.interval,
      },
    };

    this.broadcastSensorReading(reading);
  }

  private handleDeviceOrientation(event: DeviceOrientationEvent): void {
    const reading: SensorReading = {
      timestamp: Date.now(),
      source: "device-orientation",
      type: "gyroscope",
      data: {
        alpha: event.alpha || 0, // Z axis
        beta: event.beta || 0, // X axis
        gamma: event.gamma || 0, // Y axis
        absolute: event.absolute,
      },
    };

    this.broadcastSensorReading(reading);
  }

  // Web Bluetooth Integration
  async connectBluetoothDevice(serviceUUID?: string): Promise<ConnectedDevice> {
    if (!("bluetooth" in navigator)) {
      throw new Error("Web Bluetooth not supported");
    }

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: serviceUUID ? [{ services: [serviceUUID] }] : undefined,
        acceptAllDevices: !serviceUUID,
        optionalServices: ["battery_service", "device_information"],
      });

      const server = await device.gatt.connect();

      const connectedDevice: ConnectedDevice = {
        id: device.id,
        name: device.name || "Unknown Bluetooth Device",
        type: "custom",
        connectionType: "bluetooth",
        capabilities: {
          gps: false,
          accelerometer: false,
          gyroscope: false,
          bluetooth: true,
          usb: false,
          wireless: true,
        },
        status: "connected",
        lastSeen: Date.now(),
      };

      this.devices.set(device.id, connectedDevice);

      // Try to get battery level
      try {
        const batteryService =
          await server.getPrimaryService("battery_service");
        const batteryLevel =
          await batteryService.getCharacteristic("battery_level");
        const level = await batteryLevel.readValue();
        connectedDevice.batteryLevel = level.getUint8(0);
      } catch (e) {
        // Battery service not available
      }

      return connectedDevice;
    } catch (error) {
      console.error("Bluetooth connection error:", error);
      throw error;
    }
  }

  // Web Serial API for direct hardware communication
  async connectSerialDevice(): Promise<ConnectedDevice> {
    if (!("serial" in navigator)) {
      throw new Error("Web Serial API not supported");
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });

      const device: ConnectedDevice = {
        id: `serial-${Date.now()}`,
        name: "Serial Device",
        type: "custom",
        connectionType: "usb",
        capabilities: {
          gps: true,
          accelerometer: true,
          gyroscope: true,
          bluetooth: false,
          usb: true,
          wireless: false,
        },
        status: "connected",
        lastSeen: Date.now(),
      };

      this.devices.set(device.id, device);

      // Set up data reading
      this.readSerialData(port, device.id);

      return device;
    } catch (error) {
      console.error("Serial connection error:", error);
      throw error;
    }
  }

  private async readSerialData(port: any, deviceId: string): Promise<void> {
    const reader = port.readable.getReader();

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Parse incoming data (example for NMEA GPS format)
        const text = new TextDecoder().decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("$GPGGA")) {
            // Parse NMEA GPS data
            const parts = line.split(",");
            if (parts.length >= 6) {
              const reading: SensorReading = {
                timestamp: Date.now(),
                source: deviceId,
                type: "gps",
                data: {
                  latitude: this.parseNMEACoordinate(parts[2], parts[3]),
                  longitude: this.parseNMEACoordinate(parts[4], parts[5]),
                  quality: parseInt(parts[6]) || 0,
                  satellites: parseInt(parts[7]) || 0,
                  altitude: parseFloat(parts[9]) || 0,
                },
              };

              this.broadcastSensorReading(reading);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private parseNMEACoordinate(coord: string, direction: string): number {
    if (!coord || !direction) return 0;

    const degrees = Math.floor(parseFloat(coord) / 100);
    const minutes = parseFloat(coord) % 100;
    let result = degrees + minutes / 60;

    if (direction === "S" || direction === "W") {
      result = -result;
    }

    return result;
  }

  // Data Management
  startDataCapture(): void {
    this.isCapturingData = true;
    this.dataStream = [];
  }

  stopDataCapture(): SensorReading[] {
    this.isCapturingData = false;
    return [...this.dataStream];
  }

  exportDataAsCSV(data: SensorReading[]): string {
    if (data.length === 0) return "";

    // Get all unique data keys
    const allKeys = new Set<string>();
    data.forEach((reading) => {
      Object.keys(reading.data).forEach((key) => allKeys.add(key));
    });

    const headers = ["timestamp", "source", "type", ...Array.from(allKeys)];
    const csvContent = [
      headers.join(","),
      ...data.map((reading) => {
        const row = [
          reading.timestamp,
          reading.source,
          reading.type,
          ...Array.from(allKeys).map((key) => reading.data[key] || ""),
        ];
        return row.join(",");
      }),
    ].join("\n");

    return csvContent;
  }

  // Data Import (for popular racing formats)
  importFromRaceRender(data: string): SensorReading[] {
    // Parse RaceRender CSV format
    const lines = data.split("\n");
    const headers = lines[0].split(",");
    const readings: SensorReading[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      if (values.length === headers.length) {
        readings.push({
          timestamp: parseFloat(values[0]) * 1000, // Convert to ms
          source: "racerender-import",
          type: "gps",
          data: {
            latitude: parseFloat(values[1]) || 0,
            longitude: parseFloat(values[2]) || 0,
            speed: parseFloat(values[3]) || 0,
            altitude: parseFloat(values[4]) || 0,
          },
        });
      }
    }

    return readings;
  }

  // Event Management
  onSensorReading(callback: (reading: SensorReading) => void): () => void {
    this.sensorListeners.add(callback);
    return () => this.sensorListeners.delete(callback);
  }

  private broadcastSensorReading(reading: SensorReading): void {
    if (this.isCapturingData) {
      this.dataStream.push(reading);
    }

    this.sensorListeners.forEach((callback) => {
      try {
        callback(reading);
      } catch (error) {
        console.error("Error in sensor reading callback:", error);
      }
    });
  }

  // Device Management
  getConnectedDevices(): ConnectedDevice[] {
    return Array.from(this.devices.values());
  }

  disconnectDevice(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.status = "disconnected";
      this.devices.delete(deviceId);
    }
  }

  // Utility Methods
  calculateSpeed(
    currentPos: { lat: number; lon: number },
    previousPos: { lat: number; lon: number },
    timeDelta: number,
  ): number {
    // Calculate speed from GPS coordinates using Haversine formula
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (currentPos.lat * Math.PI) / 180;
    const φ2 = (previousPos.lat * Math.PI) / 180;
    const Δφ = ((currentPos.lat - previousPos.lat) * Math.PI) / 180;
    const Δλ = ((currentPos.lon - previousPos.lon) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in meters
    const speed = distance / (timeDelta / 1000); // Speed in m/s

    return speed;
  }

  calculateGForce(acceleration: { x: number; y: number; z: number }): number {
    // Calculate total G-force from acceleration data
    const totalAccel = Math.sqrt(
      acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2,
    );

    return totalAccel / 9.81; // Convert to G-force
  }
}

// Global instance
export const hardwareIntegration = new RealWorldHardwareService();

// React hooks for hardware integration
export function useGPSTracking() {
  const [position, setPosition] = React.useState<GeolocationPosition | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsubscribe = hardwareIntegration.onSensorReading((reading) => {
      if (reading.type === "gps" && reading.source === "browser-gps") {
        // Mock GeolocationPosition object
        const mockPosition = {
          coords: {
            latitude: reading.data.latitude,
            longitude: reading.data.longitude,
            altitude: reading.data.altitude,
            accuracy: reading.accuracy || 0,
            altitudeAccuracy: null,
            heading: reading.data.heading,
            speed: reading.data.speed,
          },
          timestamp: reading.timestamp,
        } as GeolocationPosition;

        setPosition(mockPosition);
      }
    });

    hardwareIntegration.startGPSTracking().catch(setError);

    return unsubscribe;
  }, []);

  return { position, error };
}

export function useDeviceMotion() {
  const [motion, setMotion] = React.useState<DeviceMotionEvent | null>(null);

  React.useEffect(() => {
    const unsubscribe = hardwareIntegration.onSensorReading((reading) => {
      if (reading.type === "accelerometer") {
        setMotion(reading.data as any);
      }
    });

    hardwareIntegration.startMotionTracking();

    return unsubscribe;
  }, []);

  return motion;
}
