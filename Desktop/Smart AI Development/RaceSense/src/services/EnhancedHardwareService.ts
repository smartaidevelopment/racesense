export interface HardwareDevice {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  type: "data_logger" | "gps" | "accelerometer" | "obd" | "can_bus" | "sensor";
  connectionType: "bluetooth" | "wifi" | "usb" | "serial" | "can" | "wireless";
  isConnected: boolean;
  batteryLevel?: number;
  signalStrength?: number;
  lastSeen: Date;
  firmwareVersion?: string;
  supportedChannels: DataChannel[];
  configuration: DeviceConfiguration;
  status: DeviceStatus;
}

export interface DataChannel {
  id: string;
  name: string;
  unit: string;
  dataType: "float" | "integer" | "boolean" | "string";
  sampleRate: number;
  range: { min: number; max: number };
  precision: number;
  isEnabled: boolean;
  calibration?: ChannelCalibration;
  alarms?: ChannelAlarm[];
}

export interface ChannelCalibration {
  offset: number;
  multiplier: number;
  polynomial?: number[];
  calibrationTable?: { input: number; output: number }[];
  lastCalibrated: Date;
  calibratedBy: string;
}

export interface ChannelAlarm {
  type: "min" | "max" | "rate_of_change" | "stuck_value";
  threshold: number;
  duration: number;
  enabled: boolean;
  message: string;
}

export interface DeviceConfiguration {
  sampleRate: number;
  enabledChannels: string[];
  dataFormat: "binary" | "ascii" | "json";
  compressionEnabled: boolean;
  bufferSize: number;
  autoStartLogging: boolean;
  storageLocation: "internal" | "external" | "cloud";
  syncSettings: {
    autoSync: boolean;
    syncInterval: number;
    wifiOnly: boolean;
  };
}

export interface DeviceStatus {
  isLogging: boolean;
  storageUsed: number;
  storageTotal: number;
  temperature: number;
  errors: DeviceError[];
  uptime: number;
  lastDataReceived: Date;
  packetsReceived: number;
  packetsLost: number;
}

export interface DeviceError {
  id: string;
  timestamp: Date;
  severity: "info" | "warning" | "error" | "critical";
  code: string;
  message: string;
  channel?: string;
  resolved: boolean;
}

export interface SensorReading {
  deviceId: string;
  channelId: string;
  timestamp: number;
  value: number;
  quality: "good" | "questionable" | "bad";
  flags: string[];
}

export interface DeviceGroup {
  id: string;
  name: string;
  description: string;
  devices: string[];
  synchronizedLogging: boolean;
  masterDevice?: string;
  createdAt: Date;
}

export interface CalibrationSession {
  id: string;
  deviceId: string;
  channelId: string;
  type: "zero_point" | "span" | "linearity" | "temperature_compensation";
  referenceValues: number[];
  measuredValues: number[];
  status: "in_progress" | "completed" | "failed";
  startedAt: Date;
  completedAt?: Date;
  calibrationResult?: ChannelCalibration;
  notes: string;
}

export class EnhancedHardwareService {
  private devices: Map<string, HardwareDevice> = new Map();
  private deviceGroups: Map<string, DeviceGroup> = new Map();
  private dataBuffer: Map<string, SensorReading[]> = new Map();
  private calibrationSessions: Map<string, CalibrationSession> = new Map();
  private isScanning = false;
  private connections: Map<string, any> = new Map();
  private dataListeners: Set<(reading: SensorReading) => void> = new Set();
  private deviceListeners: Set<(device: HardwareDevice) => void> = new Set();

  constructor() {
    this.initializeBuiltInDevices();
    this.setupDeviceMonitoring();
  }

  // Device Discovery and Connection
  async scanForDevices(
    types?: HardwareDevice["type"][],
    timeout = 30000,
  ): Promise<HardwareDevice[]> {
    this.isScanning = true;
    const discoveredDevices: HardwareDevice[] = [];

    try {
      // Scan for Bluetooth devices
      if (this.supportsWebBluetooth()) {
        const bluetoothDevices = await this.scanBluetoothDevices(types);
        discoveredDevices.push(...bluetoothDevices);
      }

      // Scan for Serial/USB devices
      if (this.supportsWebSerial()) {
        const serialDevices = await this.scanSerialDevices(types);
        discoveredDevices.push(...serialDevices);
      }

      // Scan for WiFi devices
      const wifiDevices = await this.scanWiFiDevices(types);
      discoveredDevices.push(...wifiDevices);

      // Scan for OBD-II devices
      const obdDevices = await this.scanOBDDevices();
      discoveredDevices.push(...obdDevices);

      return discoveredDevices;
    } finally {
      this.isScanning = false;
    }
  }

  async connectDevice(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    try {
      switch (device.connectionType) {
        case "bluetooth":
          return this.connectBluetoothDevice(device);
        case "usb":
        case "serial":
          return this.connectSerialDevice(device);
        case "wifi":
          return this.connectWiFiDevice(device);
        case "can":
          return this.connectCANDevice(device);
        default:
          throw new Error(
            `Unsupported connection type: ${device.connectionType}`,
          );
      }
    } catch (error) {
      console.error(`Failed to connect to device ${deviceId}:`, error);
      this.addDeviceError(
        deviceId,
        "error",
        "CONNECTION_FAILED",
        `Failed to connect: ${error}`,
      );
      return false;
    }
  }

  async disconnectDevice(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device || !device.isConnected) {
      return false;
    }

    try {
      const connection = this.connections.get(deviceId);
      if (connection) {
        await this.closeConnection(connection, device.connectionType);
        this.connections.delete(deviceId);
      }

      device.isConnected = false;
      device.status.isLogging = false;
      this.notifyDeviceListeners(device);

      return true;
    } catch (error) {
      console.error(`Failed to disconnect device ${deviceId}:`, error);
      return false;
    }
  }

  // Device Configuration
  async configureDevice(
    deviceId: string,
    configuration: Partial<DeviceConfiguration>,
  ): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device) {
      return false;
    }

    try {
      Object.assign(device.configuration, configuration);

      if (device.isConnected) {
        await this.sendConfiguration(device);
      }

      this.saveDeviceConfiguration(device);
      return true;
    } catch (error) {
      console.error(`Failed to configure device ${deviceId}:`, error);
      return false;
    }
  }

  async configureChannel(
    deviceId: string,
    channelId: string,
    config: Partial<DataChannel>,
  ): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device) {
      return false;
    }

    const channel = device.supportedChannels.find((c) => c.id === channelId);
    if (!channel) {
      return false;
    }

    Object.assign(channel, config);

    if (device.isConnected) {
      await this.sendChannelConfiguration(device, channel);
    }

    this.saveDeviceConfiguration(device);
    return true;
  }

  // Data Logging
  async startLogging(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device || !device.isConnected) {
      return false;
    }

    try {
      await this.sendCommand(deviceId, "START_LOGGING");
      device.status.isLogging = true;
      device.status.lastDataReceived = new Date();
      this.notifyDeviceListeners(device);
      return true;
    } catch (error) {
      console.error(`Failed to start logging on device ${deviceId}:`, error);
      return false;
    }
  }

  async stopLogging(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device) {
      return false;
    }

    try {
      await this.sendCommand(deviceId, "STOP_LOGGING");
      device.status.isLogging = false;
      this.notifyDeviceListeners(device);
      return true;
    } catch (error) {
      console.error(`Failed to stop logging on device ${deviceId}:`, error);
      return false;
    }
  }

  async startGroupLogging(groupId: string): Promise<boolean> {
    const group = this.deviceGroups.get(groupId);
    if (!group) {
      return false;
    }

    const results = await Promise.all(
      group.devices.map((deviceId) => this.startLogging(deviceId)),
    );

    return results.every((result) => result);
  }

  async stopGroupLogging(groupId: string): Promise<boolean> {
    const group = this.deviceGroups.get(groupId);
    if (!group) {
      return false;
    }

    const results = await Promise.all(
      group.devices.map((deviceId) => this.stopLogging(deviceId)),
    );

    return results.every((result) => result);
  }

  // Calibration
  async startCalibration(
    deviceId: string,
    channelId: string,
    type: CalibrationSession["type"],
    referenceValues: number[],
  ): Promise<string> {
    const device = this.devices.get(deviceId);
    if (!device || !device.isConnected) {
      throw new Error("Device not connected");
    }

    const channel = device.supportedChannels.find((c) => c.id === channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    const sessionId = this.generateId();
    const session: CalibrationSession = {
      id: sessionId,
      deviceId,
      channelId,
      type,
      referenceValues,
      measuredValues: [],
      status: "in_progress",
      startedAt: new Date(),
      notes: "",
    };

    this.calibrationSessions.set(sessionId, session);

    // Start calibration on device
    await this.sendCommand(deviceId, "START_CALIBRATION", {
      channelId,
      type,
      sessionId,
    });

    return sessionId;
  }

  async addCalibrationPoint(
    sessionId: string,
    measuredValue: number,
  ): Promise<boolean> {
    const session = this.calibrationSessions.get(sessionId);
    if (!session || session.status !== "in_progress") {
      return false;
    }

    session.measuredValues.push(measuredValue);

    // Check if calibration is complete
    if (session.measuredValues.length >= session.referenceValues.length) {
      await this.completeCalibration(sessionId);
    }

    return true;
  }

  async completeCalibration(sessionId: string): Promise<boolean> {
    const session = this.calibrationSessions.get(sessionId);
    if (!session) {
      return false;
    }

    try {
      const calibration = this.calculateCalibration(
        session.referenceValues,
        session.measuredValues,
        session.type,
      );

      session.calibrationResult = calibration;
      session.status = "completed";
      session.completedAt = new Date();

      // Apply calibration to channel
      const device = this.devices.get(session.deviceId);
      if (device) {
        const channel = device.supportedChannels.find(
          (c) => c.id === session.channelId,
        );
        if (channel) {
          channel.calibration = calibration;
          await this.sendChannelConfiguration(device, channel);
        }
      }

      return true;
    } catch (error) {
      session.status = "failed";
      console.error(`Calibration failed for session ${sessionId}:`, error);
      return false;
    }
  }

  // Device Groups
  createDeviceGroup(
    name: string,
    description: string,
    deviceIds: string[],
  ): string {
    const groupId = this.generateId();
    const group: DeviceGroup = {
      id: groupId,
      name,
      description,
      devices: deviceIds,
      synchronizedLogging: false,
      createdAt: new Date(),
    };

    this.deviceGroups.set(groupId, group);
    return groupId;
  }

  addDeviceToGroup(groupId: string, deviceId: string): boolean {
    const group = this.deviceGroups.get(groupId);
    if (!group || group.devices.includes(deviceId)) {
      return false;
    }

    group.devices.push(deviceId);
    return true;
  }

  removeDeviceFromGroup(groupId: string, deviceId: string): boolean {
    const group = this.deviceGroups.get(groupId);
    if (!group) {
      return false;
    }

    const index = group.devices.indexOf(deviceId);
    if (index !== -1) {
      group.devices.splice(index, 1);
      return true;
    }

    return false;
  }

  // Data Processing
  processRawData(deviceId: string, rawData: ArrayBuffer): SensorReading[] {
    const device = this.devices.get(deviceId);
    if (!device) {
      return [];
    }

    const readings: SensorReading[] = [];

    try {
      switch (device.configuration.dataFormat) {
        case "binary":
          return this.processBinaryData(device, rawData);
        case "ascii":
          return this.processASCIIData(device, rawData);
        case "json":
          return this.processJSONData(device, rawData);
        default:
          return [];
      }
    } catch (error) {
      console.error(`Failed to process data from device ${deviceId}:`, error);
      this.addDeviceError(
        deviceId,
        "error",
        "DATA_PROCESSING_ERROR",
        `Data processing failed: ${error}`,
      );
      return [];
    }
  }

  // Connection Type Implementations
  private async scanBluetoothDevices(
    types?: HardwareDevice["type"][],
  ): Promise<HardwareDevice[]> {
    if (!this.supportsWebBluetooth()) {
      return [];
    }

    const devices: HardwareDevice[] = [];

    try {
      // Simulate Bluetooth device discovery
      const deviceConfigs = [
        {
          name: "RaceBox Pro",
          manufacturer: "RaceBox",
          model: "RB-PRO-2024",
          type: "gps" as const,
        },
        {
          name: "AiM Solo 2 DL",
          manufacturer: "AiM",
          model: "Solo-2-DL",
          type: "data_logger" as const,
        },
        {
          name: "VBOX Sport",
          manufacturer: "Racelogic",
          model: "VBOX-Sport",
          type: "gps" as const,
        },
        {
          name: "Garmin Catalyst",
          manufacturer: "Garmin",
          model: "Catalyst-2024",
          type: "data_logger" as const,
        },
      ];

      for (const config of deviceConfigs) {
        if (!types || types.includes(config.type)) {
          const device = this.createDevice(config, "bluetooth");
          devices.push(device);
          this.devices.set(device.id, device);
        }
      }
    } catch (error) {
      console.error("Bluetooth scan failed:", error);
    }

    return devices;
  }

  private async scanSerialDevices(
    types?: HardwareDevice["type"][],
  ): Promise<HardwareDevice[]> {
    if (!this.supportsWebSerial()) {
      return [];
    }

    const devices: HardwareDevice[] = [];

    try {
      // Simulate Serial device discovery
      const deviceConfigs = [
        {
          name: "ELM327 OBD-II",
          manufacturer: "ELM Electronics",
          model: "ELM327-v2.1",
          type: "obd" as const,
        },
        {
          name: "Arduino Data Logger",
          manufacturer: "Arduino",
          model: "Nano-33-IoT",
          type: "sensor" as const,
        },
      ];

      for (const config of deviceConfigs) {
        if (!types || types.includes(config.type)) {
          const device = this.createDevice(config, "serial");
          devices.push(device);
          this.devices.set(device.id, device);
        }
      }
    } catch (error) {
      console.error("Serial scan failed:", error);
    }

    return devices;
  }

  private async scanWiFiDevices(
    types?: HardwareDevice["type"][],
  ): Promise<HardwareDevice[]> {
    const devices: HardwareDevice[] = [];

    try {
      // Simulate WiFi device discovery
      const deviceConfigs = [
        {
          name: "MoTeC M1",
          manufacturer: "MoTeC",
          model: "M1-Build",
          type: "data_logger" as const,
        },
        {
          name: "Pi Motorsport",
          manufacturer: "Raspberry Pi",
          model: "Pi-4B-Racing",
          type: "data_logger" as const,
        },
      ];

      for (const config of deviceConfigs) {
        if (!types || types.includes(config.type)) {
          const device = this.createDevice(config, "wifi");
          devices.push(device);
          this.devices.set(device.id, device);
        }
      }
    } catch (error) {
      console.error("WiFi scan failed:", error);
    }

    return devices;
  }

  private async scanOBDDevices(): Promise<HardwareDevice[]> {
    const devices: HardwareDevice[] = [];

    try {
      // Simulate OBD-II device discovery
      const obdDevice = this.createOBDDevice();
      devices.push(obdDevice);
      this.devices.set(obdDevice.id, obdDevice);
    } catch (error) {
      console.error("OBD scan failed:", error);
    }

    return devices;
  }

  // Device Creation Helpers
  private createDevice(
    config: {
      name: string;
      manufacturer: string;
      model: string;
      type: HardwareDevice["type"];
    },
    connectionType: HardwareDevice["connectionType"],
  ): HardwareDevice {
    const deviceId = this.generateId();

    return {
      id: deviceId,
      ...config,
      connectionType,
      isConnected: false,
      batteryLevel: Math.floor(Math.random() * 100),
      signalStrength: Math.floor(Math.random() * 100),
      lastSeen: new Date(),
      firmwareVersion: "1.0.0",
      supportedChannels: this.getChannelsForDeviceType(config.type),
      configuration: this.getDefaultConfiguration(),
      status: this.getDefaultStatus(),
    };
  }

  private createOBDDevice(): HardwareDevice {
    return {
      id: this.generateId(),
      name: "Vehicle OBD-II Port",
      manufacturer: "Generic",
      model: "OBD-II",
      type: "obd",
      connectionType: "can",
      isConnected: false,
      lastSeen: new Date(),
      supportedChannels: this.getOBDChannels(),
      configuration: this.getDefaultConfiguration(),
      status: this.getDefaultStatus(),
    };
  }

  private getChannelsForDeviceType(
    type: HardwareDevice["type"],
  ): DataChannel[] {
    switch (type) {
      case "gps":
        return [
          {
            id: "latitude",
            name: "Latitude",
            unit: "deg",
            dataType: "float",
            sampleRate: 10,
            range: { min: -90, max: 90 },
            precision: 6,
            isEnabled: true,
          },
          {
            id: "longitude",
            name: "Longitude",
            unit: "deg",
            dataType: "float",
            sampleRate: 10,
            range: { min: -180, max: 180 },
            precision: 6,
            isEnabled: true,
          },
          {
            id: "speed",
            name: "GPS Speed",
            unit: "km/h",
            dataType: "float",
            sampleRate: 10,
            range: { min: 0, max: 400 },
            precision: 2,
            isEnabled: true,
          },
          {
            id: "heading",
            name: "GPS Heading",
            unit: "deg",
            dataType: "float",
            sampleRate: 10,
            range: { min: 0, max: 360 },
            precision: 2,
            isEnabled: true,
          },
        ];

      case "accelerometer":
        return [
          {
            id: "accel_x",
            name: "Lateral G-Force",
            unit: "g",
            dataType: "float",
            sampleRate: 100,
            range: { min: -5, max: 5 },
            precision: 3,
            isEnabled: true,
          },
          {
            id: "accel_y",
            name: "Longitudinal G-Force",
            unit: "g",
            dataType: "float",
            sampleRate: 100,
            range: { min: -5, max: 5 },
            precision: 3,
            isEnabled: true,
          },
          {
            id: "accel_z",
            name: "Vertical G-Force",
            unit: "g",
            dataType: "float",
            sampleRate: 100,
            range: { min: -5, max: 5 },
            precision: 3,
            isEnabled: true,
          },
        ];

      case "data_logger":
        return [
          ...this.getChannelsForDeviceType("gps"),
          ...this.getChannelsForDeviceType("accelerometer"),
          {
            id: "rpm",
            name: "Engine RPM",
            unit: "rpm",
            dataType: "integer",
            sampleRate: 50,
            range: { min: 0, max: 12000 },
            precision: 0,
            isEnabled: true,
          },
          {
            id: "throttle",
            name: "Throttle Position",
            unit: "%",
            dataType: "float",
            sampleRate: 50,
            range: { min: 0, max: 100 },
            precision: 1,
            isEnabled: true,
          },
          {
            id: "brake",
            name: "Brake Pressure",
            unit: "bar",
            dataType: "float",
            sampleRate: 50,
            range: { min: 0, max: 200 },
            precision: 2,
            isEnabled: true,
          },
        ];

      default:
        return [];
    }
  }

  private getOBDChannels(): DataChannel[] {
    return [
      {
        id: "engine_rpm",
        name: "Engine RPM",
        unit: "rpm",
        dataType: "integer",
        sampleRate: 10,
        range: { min: 0, max: 8000 },
        precision: 0,
        isEnabled: true,
      },
      {
        id: "vehicle_speed",
        name: "Vehicle Speed",
        unit: "km/h",
        dataType: "integer",
        sampleRate: 10,
        range: { min: 0, max: 300 },
        precision: 0,
        isEnabled: true,
      },
      {
        id: "throttle_pos",
        name: "Throttle Position",
        unit: "%",
        dataType: "float",
        sampleRate: 10,
        range: { min: 0, max: 100 },
        precision: 1,
        isEnabled: true,
      },
      {
        id: "engine_temp",
        name: "Engine Temperature",
        unit: "°C",
        dataType: "integer",
        sampleRate: 1,
        range: { min: -40, max: 215 },
        precision: 0,
        isEnabled: true,
      },
      {
        id: "fuel_level",
        name: "Fuel Level",
        unit: "%",
        dataType: "float",
        sampleRate: 1,
        range: { min: 0, max: 100 },
        precision: 1,
        isEnabled: true,
      },
    ];
  }

  // ... Additional helper methods continued in next message due to length

  private getDefaultConfiguration(): DeviceConfiguration {
    return {
      sampleRate: 50,
      enabledChannels: [],
      dataFormat: "json",
      compressionEnabled: false,
      bufferSize: 1024,
      autoStartLogging: false,
      storageLocation: "internal",
      syncSettings: {
        autoSync: true,
        syncInterval: 300, // 5 minutes
        wifiOnly: false,
      },
    };
  }

  private getDefaultStatus(): DeviceStatus {
    return {
      isLogging: false,
      storageUsed: 0,
      storageTotal: 1024 * 1024 * 1024, // 1GB
      temperature: 25,
      errors: [],
      uptime: 0,
      lastDataReceived: new Date(),
      packetsReceived: 0,
      packetsLost: 0,
    };
  }

  // Connection Helpers
  private supportsWebBluetooth(): boolean {
    return "bluetooth" in navigator;
  }

  private supportsWebSerial(): boolean {
    return "serial" in navigator;
  }

  private async connectBluetoothDevice(
    device: HardwareDevice,
  ): Promise<boolean> {
    try {
      // Simulate Bluetooth connection
      console.log(`Connecting to Bluetooth device: ${device.name}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      device.isConnected = true;
      device.signalStrength = 85 + Math.floor(Math.random() * 15);
      device.lastSeen = new Date();

      this.notifyDeviceListeners(device);
      return true;
    } catch (error) {
      console.error(`Bluetooth connection failed: ${error}`);
      return false;
    }
  }

  private async connectSerialDevice(device: HardwareDevice): Promise<boolean> {
    try {
      // Simulate Serial connection
      console.log(`Connecting to Serial device: ${device.name}`);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      device.isConnected = true;
      device.lastSeen = new Date();

      this.notifyDeviceListeners(device);
      return true;
    } catch (error) {
      console.error(`Serial connection failed: ${error}`);
      return false;
    }
  }

  private async connectWiFiDevice(device: HardwareDevice): Promise<boolean> {
    try {
      // Simulate WiFi connection
      console.log(`Connecting to WiFi device: ${device.name}`);
      await new Promise((resolve) => setTimeout(resolve, 3000));

      device.isConnected = true;
      device.signalStrength = 70 + Math.floor(Math.random() * 30);
      device.lastSeen = new Date();

      this.notifyDeviceListeners(device);
      return true;
    } catch (error) {
      console.error(`WiFi connection failed: ${error}`);
      return false;
    }
  }

  private async connectCANDevice(device: HardwareDevice): Promise<boolean> {
    try {
      // Simulate CAN bus connection
      console.log(`Connecting to CAN device: ${device.name}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      device.isConnected = true;
      device.lastSeen = new Date();

      this.notifyDeviceListeners(device);
      return true;
    } catch (error) {
      console.error(`CAN connection failed: ${error}`);
      return false;
    }
  }

  // Utility Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async sendCommand(
    deviceId: string,
    command: string,
    data?: any,
  ): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device?.isConnected) {
      throw new Error("Device not connected");
    }

    console.log(`Sending command to ${device.name}: ${command}`, data);
    // Simulate command sending
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private async sendConfiguration(device: HardwareDevice): Promise<void> {
    console.log(
      `Sending configuration to ${device.name}`,
      device.configuration,
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  private async sendChannelConfiguration(
    device: HardwareDevice,
    channel: DataChannel,
  ): Promise<void> {
    console.log(
      `Configuring channel ${channel.name} on ${device.name}`,
      channel,
    );
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  private async closeConnection(
    connection: any,
    type: HardwareDevice["connectionType"],
  ): Promise<void> {
    console.log(`Closing ${type} connection`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private addDeviceError(
    deviceId: string,
    severity: DeviceError["severity"],
    code: string,
    message: string,
  ): void {
    const device = this.devices.get(deviceId);
    if (!device) return;

    const error: DeviceError = {
      id: this.generateId(),
      timestamp: new Date(),
      severity,
      code,
      message,
      resolved: false,
    };

    device.status.errors.push(error);

    // Keep only the last 100 errors
    if (device.status.errors.length > 100) {
      device.status.errors = device.status.errors.slice(-100);
    }

    this.notifyDeviceListeners(device);
  }

  private calculateCalibration(
    referenceValues: number[],
    measuredValues: number[],
    type: CalibrationSession["type"],
  ): ChannelCalibration {
    // Simple linear calibration calculation
    if (
      referenceValues.length !== measuredValues.length ||
      referenceValues.length < 2
    ) {
      throw new Error("Invalid calibration data");
    }

    // Calculate linear regression
    const n = referenceValues.length;
    const sumX = referenceValues.reduce((sum, val) => sum + val, 0);
    const sumY = measuredValues.reduce((sum, val) => sum + val, 0);
    const sumXY = referenceValues.reduce(
      (sum, val, i) => sum + val * measuredValues[i],
      0,
    );
    const sumXX = referenceValues.reduce((sum, val) => sum + val * val, 0);

    const multiplier = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const offset = (sumY - multiplier * sumX) / n;

    return {
      offset,
      multiplier,
      lastCalibrated: new Date(),
      calibratedBy: "system",
    };
  }

  private processBinaryData(
    device: HardwareDevice,
    data: ArrayBuffer,
  ): SensorReading[] {
    // Simplified binary data processing
    const view = new DataView(data);
    const readings: SensorReading[] = [];
    const timestamp = Date.now();

    // Process based on device configuration
    let offset = 0;
    for (const channel of device.supportedChannels) {
      if (channel.isEnabled && offset + 4 <= data.byteLength) {
        const value = view.getFloat32(offset, true);
        readings.push({
          deviceId: device.id,
          channelId: channel.id,
          timestamp,
          value,
          quality: "good",
          flags: [],
        });
        offset += 4;
      }
    }

    return readings;
  }

  private processASCIIData(
    device: HardwareDevice,
    data: ArrayBuffer,
  ): SensorReading[] {
    const text = new TextDecoder().decode(data);
    const lines = text.trim().split("\n");
    const readings: SensorReading[] = [];

    for (const line of lines) {
      const values = line.split(",").map((v) => parseFloat(v.trim()));
      if (values.length >= device.supportedChannels.length) {
        const timestamp = Date.now();
        device.supportedChannels.forEach((channel, index) => {
          if (channel.isEnabled && !isNaN(values[index])) {
            readings.push({
              deviceId: device.id,
              channelId: channel.id,
              timestamp,
              value: values[index],
              quality: "good",
              flags: [],
            });
          }
        });
      }
    }

    return readings;
  }

  private processJSONData(
    device: HardwareDevice,
    data: ArrayBuffer,
  ): SensorReading[] {
    try {
      const text = new TextDecoder().decode(data);
      const jsonData = JSON.parse(text);
      const readings: SensorReading[] = [];
      const timestamp = Date.now();

      for (const channel of device.supportedChannels) {
        if (channel.isEnabled && jsonData[channel.id] !== undefined) {
          readings.push({
            deviceId: device.id,
            channelId: channel.id,
            timestamp,
            value: jsonData[channel.id],
            quality: "good",
            flags: [],
          });
        }
      }

      return readings;
    } catch (error) {
      console.error("Failed to parse JSON data:", error);
      return [];
    }
  }

  private saveDeviceConfiguration(device: HardwareDevice): void {
    try {
      const configs = JSON.parse(
        localStorage.getItem("racesense_device_configs") || "{}",
      );
      configs[device.id] = {
        configuration: device.configuration,
        supportedChannels: device.supportedChannels,
      };
      localStorage.setItem("racesense_device_configs", JSON.stringify(configs));
    } catch (error) {
      console.error("Failed to save device configuration:", error);
    }
  }

  private initializeBuiltInDevices(): void {
    // Initialize with built-in device motion sensors
    if (typeof window !== "undefined" && window.DeviceMotionEvent) {
      const motionDevice = this.createDevice(
        {
          name: "Device Motion Sensor",
          manufacturer: "Built-in",
          model: "Browser-API",
          type: "accelerometer",
        },
        "wireless",
      );

      motionDevice.isConnected = true;
      this.devices.set(motionDevice.id, motionDevice);
    }
  }

  private setupDeviceMonitoring(): void {
    // Monitor device status and generate simulated data
    setInterval(() => {
      this.devices.forEach((device) => {
        if (device.isConnected && device.status.isLogging) {
          this.simulateDeviceData(device);
        }
      });
    }, 100); // 10Hz data rate

    // Update device status
    setInterval(() => {
      this.devices.forEach((device) => {
        if (device.isConnected) {
          device.status.uptime += 60;
          device.status.temperature = 25 + Math.random() * 10;

          if (device.batteryLevel !== undefined) {
            device.batteryLevel = Math.max(0, device.batteryLevel - 0.1);
          }

          this.notifyDeviceListeners(device);
        }
      });
    }, 60000); // Every minute
  }

  private simulateDeviceData(device: HardwareDevice): void {
    const timestamp = Date.now();
    const readings: SensorReading[] = [];

    for (const channel of device.supportedChannels) {
      if (channel.isEnabled) {
        let value: number;

        // Generate realistic data based on channel type
        switch (channel.id) {
          case "speed":
          case "vehicle_speed":
            value = 50 + Math.sin(timestamp / 10000) * 30 + Math.random() * 5;
            break;
          case "rpm":
          case "engine_rpm":
            value =
              3000 + Math.sin(timestamp / 8000) * 2000 + Math.random() * 100;
            break;
          case "throttle":
          case "throttle_pos":
            value = 50 + Math.sin(timestamp / 5000) * 40 + Math.random() * 5;
            break;
          case "brake":
            value = Math.max(
              0,
              20 - Math.sin(timestamp / 5000) * 20 + Math.random() * 5,
            );
            break;
          case "accel_x":
            value = Math.sin(timestamp / 3000) * 2 + Math.random() * 0.1;
            break;
          case "accel_y":
            value = Math.sin(timestamp / 4000) * 1.5 + Math.random() * 0.1;
            break;
          case "accel_z":
            value = 1 + Math.sin(timestamp / 6000) * 0.3 + Math.random() * 0.05;
            break;
          default:
            value =
              Math.random() * (channel.range.max - channel.range.min) +
              channel.range.min;
        }

        // Apply calibration if available
        if (channel.calibration) {
          value =
            value * channel.calibration.multiplier + channel.calibration.offset;
        }

        readings.push({
          deviceId: device.id,
          channelId: channel.id,
          timestamp,
          value,
          quality: "good",
          flags: [],
        });

        device.status.packetsReceived++;
        device.status.lastDataReceived = new Date();
      }
    }

    // Store in buffer
    if (!this.dataBuffer.has(device.id)) {
      this.dataBuffer.set(device.id, []);
    }

    const buffer = this.dataBuffer.get(device.id)!;
    buffer.push(...readings);

    // Keep buffer size manageable
    if (buffer.length > 10000) {
      buffer.splice(0, buffer.length - 10000);
    }

    // Notify listeners
    readings.forEach((reading) => {
      this.dataListeners.forEach((listener) => listener(reading));
    });
  }

  private notifyDeviceListeners(device: HardwareDevice): void {
    this.deviceListeners.forEach((listener) => listener(device));
  }

  // Event Listeners
  onDataReceived(callback: (reading: SensorReading) => void): () => void {
    this.dataListeners.add(callback);
    return () => this.dataListeners.delete(callback);
  }

  onDeviceUpdate(callback: (device: HardwareDevice) => void): () => void {
    this.deviceListeners.add(callback);
    return () => this.deviceListeners.delete(callback);
  }

  // Public API
  getConnectedDevices(): HardwareDevice[] {
    return Array.from(this.devices.values()).filter(
      (device) => device.isConnected,
    );
  }

  getAllDevices(): HardwareDevice[] {
    return Array.from(this.devices.values());
  }

  getDevice(deviceId: string): HardwareDevice | undefined {
    return this.devices.get(deviceId);
  }

  getDeviceGroups(): DeviceGroup[] {
    return Array.from(this.deviceGroups.values());
  }

  getCalibrationSessions(deviceId?: string): CalibrationSession[] {
    const sessions = Array.from(this.calibrationSessions.values());
    return deviceId
      ? sessions.filter((s) => s.deviceId === deviceId)
      : sessions;
  }

  getRecentData(
    deviceId: string,
    channelId?: string,
    limit = 1000,
  ): SensorReading[] {
    const buffer = this.dataBuffer.get(deviceId) || [];
    const filtered = channelId
      ? buffer.filter((r) => r.channelId === channelId)
      : buffer;
    return filtered.slice(-limit);
  }

  getScanningStatus(): boolean {
    return this.isScanning;
  }

  async updateFirmware(deviceId: string, firmwareFile: File): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device || !device.isConnected) {
      return false;
    }

    try {
      // Simulate firmware update
      console.log(`Updating firmware for ${device.name}`);
      await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 second update

      device.firmwareVersion = "1.1.0";
      this.notifyDeviceListeners(device);
      return true;
    } catch (error) {
      console.error(`Firmware update failed for ${deviceId}:`, error);
      return false;
    }
  }

  exportDeviceConfiguration(deviceId: string): string {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error("Device not found");
    }

    return JSON.stringify(
      {
        deviceInfo: {
          name: device.name,
          manufacturer: device.manufacturer,
          model: device.model,
          type: device.type,
        },
        configuration: device.configuration,
        channels: device.supportedChannels,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    );
  }

  async importDeviceConfiguration(
    deviceId: string,
    configJson: string,
  ): Promise<boolean> {
    try {
      const config = JSON.parse(configJson);
      const device = this.devices.get(deviceId);

      if (!device) {
        return false;
      }

      if (config.configuration) {
        await this.configureDevice(deviceId, config.configuration);
      }

      if (config.channels) {
        for (const channelConfig of config.channels) {
          await this.configureChannel(
            deviceId,
            channelConfig.id,
            channelConfig,
          );
        }
      }

      return true;
    } catch (error) {
      console.error("Failed to import device configuration:", error);
      return false;
    }
  }
}

export const enhancedHardwareService = new EnhancedHardwareService();
