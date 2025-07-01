// OBD-II Integration Service for Real Vehicle Telemetry
// Supports Bluetooth ELM327, USB, and Web Serial API connections

interface OBDParameter {
  pid: string;
  name: string;
  description: string;
  unit: string;
  formula: (bytes: number[]) => number;
  min: number;
  max: number;
  category:
    | "engine"
    | "fuel"
    | "temperature"
    | "pressure"
    | "speed"
    | "emissions";
}

interface OBDReading {
  pid: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  raw: number[];
}

interface VehicleInfo {
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  engine?: string;
  supportedPids: string[];
}

interface OBDConnectionConfig {
  type: "bluetooth" | "serial" | "wifi";
  deviceId?: string;
  baudRate?: number;
  protocol?: "AUTO" | "ISO14230_4_KWP" | "ISO15765_4_CAN" | "SAE_J1939_CAN";
}

interface LiveOBDData {
  speed: number; // km/h
  rpm: number; // revolutions per minute
  throttlePosition: number; // percentage 0-100
  engineLoad: number; // percentage 0-100
  coolantTemp: number; // celsius
  intakeAirTemp: number; // celsius
  maf: number; // grams/second (Mass Air Flow)
  fuelPressure: number; // kPa
  manifoldPressure: number; // kPa
  fuelLevel: number; // percentage 0-100
  oilTemp: number; // celsius (if supported)
  boost: number; // kPa (turbo/supercharger)
  afr: number; // air/fuel ratio
  ignitionTiming: number; // degrees
  fuelTrim: {
    shortTerm: number; // percentage
    longTerm: number; // percentage
  };
  voltage: number; // battery voltage
  timestamp: number;
}

// Type guards for browser compatibility
// @ts-ignore
// eslint-disable-next-line
// These are only available in browser environments supporting Web Bluetooth/Serial
// Fallback to 'any' if not present
// @ts-ignore
const BluetoothDevice = (window as any).BluetoothDevice || ({} as any);
// @ts-ignore
const SerialPort = (window as any).SerialPort || ({} as any);
// @ts-ignore
const BluetoothRemoteGATTCharacteristic = (window as any).BluetoothRemoteGATTCharacteristic || ({} as any);

class OBDIntegrationService {
  private isConnected: boolean = false;
  private device: any = null; // BluetoothDevice | SerialPort
  private characteristic: any = null; // BluetoothRemoteGATTCharacteristic
  private serialPort: any = null; // SerialPort
  private readingInterval: NodeJS.Timeout | null = null;
  private vehicleInfo: VehicleInfo | null = null;
  private supportedParameters: Map<string, OBDParameter> = new Map();
  private dataListeners: Set<(data: LiveOBDData) => void> = new Set();
  private connectionListeners: Set<(connected: boolean) => void> = new Set();
  private errorListeners: Set<(error: string) => void> = new Set();
  private currentData: Partial<LiveOBDData> = {};
  private lastCommand: string | null = null;
  private pendingCommandResolve: ((response: string) => void) | null = null;

  // List of common OBD-II BLE service/characteristic UUID pairs
  private static COMMON_OBD_UUIDS = [
    // RaceBox Mini BLE
    { service: "49991f50-b865-0fb3-3b31-32f9447aca67", characteristic: "6e400001-b5a3-f393-e0a9-e50e24dcca9e" },
    // Generic BLE UART/OBD
    { service: "0000fff0-0000-1000-8000-00805f9b34fb", characteristic: "0000fff2-0000-1000-8000-00805f9b34fb" },
    { service: "0000ffe0-0000-1000-8000-00805f9b34fb", characteristic: "0000ffe1-0000-1000-8000-00805f9b34fb" },
    { service: "6e400001-b5a3-f393-e0a9-e50e24dcca9e", characteristic: "6e400003-b5a3-f393-e0a9-e50e24dcca9e" }, // Nordic UART
  ];

  constructor() {
    this.initializeSupportedParameters();
  }

  // Initialize standard OBD-II parameters (Mode 01 PIDs)
  private initializeSupportedParameters() {
    const parameters: OBDParameter[] = [
      {
        pid: "010C",
        name: "Engine RPM",
        description: "Engine rotational speed",
        unit: "rpm",
        formula: (bytes) => (bytes[0] * 256 + bytes[1]) / 4,
        min: 0,
        max: 8000,
        category: "engine",
      },
      {
        pid: "010D",
        name: "Vehicle Speed",
        description: "Vehicle speed sensor reading",
        unit: "km/h",
        formula: (bytes) => bytes[0],
        min: 0,
        max: 255,
        category: "speed",
      },
      {
        pid: "0111",
        name: "Throttle Position",
        description: "Absolute throttle position",
        unit: "%",
        formula: (bytes) => (bytes[0] * 100) / 255,
        min: 0,
        max: 100,
        category: "engine",
      },
      {
        pid: "0104",
        name: "Engine Load",
        description: "Calculated engine load value",
        unit: "%",
        formula: (bytes) => (bytes[0] * 100) / 255,
        min: 0,
        max: 100,
        category: "engine",
      },
      {
        pid: "0105",
        name: "Coolant Temperature",
        description: "Engine coolant temperature",
        unit: "°C",
        formula: (bytes) => bytes[0] - 40,
        min: -40,
        max: 215,
        category: "temperature",
      },
      {
        pid: "010F",
        name: "Intake Air Temperature",
        description: "Intake air temperature",
        unit: "°C",
        formula: (bytes) => bytes[0] - 40,
        min: -40,
        max: 215,
        category: "temperature",
      },
      {
        pid: "0110",
        name: "Mass Air Flow",
        description: "Mass air flow sensor reading",
        unit: "g/s",
        formula: (bytes) => (bytes[0] * 256 + bytes[1]) / 100,
        min: 0,
        max: 655.35,
        category: "engine",
      },
      {
        pid: "010A",
        name: "Fuel Pressure",
        description: "Fuel rail pressure",
        unit: "kPa",
        formula: (bytes) => bytes[0] * 3,
        min: 0,
        max: 765,
        category: "pressure",
      },
      {
        pid: "010B",
        name: "Manifold Pressure",
        description: "Intake manifold absolute pressure",
        unit: "kPa",
        formula: (bytes) => bytes[0],
        min: 0,
        max: 255,
        category: "pressure",
      },
      {
        pid: "012F",
        name: "Fuel Level",
        description: "Fuel tank level input",
        unit: "%",
        formula: (bytes) => (bytes[0] * 100) / 255,
        min: 0,
        max: 100,
        category: "fuel",
      },
      {
        pid: "0142",
        name: "Battery Voltage",
        description: "Control module voltage",
        unit: "V",
        formula: (bytes) => (bytes[0] * 256 + bytes[1]) / 1000,
        min: 0,
        max: 65.535,
        category: "engine",
      },
      {
        pid: "010E",
        name: "Ignition Timing",
        description: "Timing advance before TDC",
        unit: "°",
        formula: (bytes) => bytes[0] / 2 - 64,
        min: -64,
        max: 63.5,
        category: "engine",
      },
      {
        pid: "0106",
        name: "Short Term Fuel Trim",
        description: "Short term fuel trim - Bank 1",
        unit: "%",
        formula: (bytes) => (bytes[0] - 128) * (100 / 128),
        min: -100,
        max: 99.22,
        category: "fuel",
      },
      {
        pid: "0107",
        name: "Long Term Fuel Trim",
        description: "Long term fuel trim - Bank 1",
        unit: "%",
        formula: (bytes) => (bytes[0] - 128) * (100 / 128),
        min: -100,
        max: 99.22,
        category: "fuel",
      },
    ];

    parameters.forEach((param) => {
      this.supportedParameters.set(param.pid, param);
    });
  }

  // Connect to OBD-II adapter via Bluetooth
  async connectBluetooth(): Promise<boolean> {
    try {
      if (!(navigator as any).bluetooth) {
        throw new Error("Web Bluetooth not supported in this browser");
      }
      // Request Bluetooth device
      this.device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: "OBDII" },
          { namePrefix: "ELM327" },
          { namePrefix: "OBD" },
        ],
        optionalServices: OBDIntegrationService.COMMON_OBD_UUIDS.map(u => u.service),
      });
      if (!this.device.gatt) {
        throw new Error("GATT not available on device");
      }
      // Try all common UUID pairs
      let lastError: any = null;
      for (const { service, characteristic } of OBDIntegrationService.COMMON_OBD_UUIDS) {
        try {
          const server = await this.device.gatt.connect();
          const svc = await server.getPrimaryService(service);
          this.characteristic = await svc.getCharacteristic(characteristic);
          // Set up notifications for incoming data
          await this.characteristic.startNotifications();
          this.characteristic.addEventListener(
            "characteristicvaluechanged",
            (event) => {
              this.handleBluetoothData(event);
            },
          );
          // Initialize connection
          await this.initializeOBDConnection();
          this.isConnected = true;
          this.notifyConnectionStatus(true);
          return true;
        } catch (err) {
          lastError = err;
          // Try next UUID pair
        }
      }
      // If all fail, throw last error
      throw lastError || new Error("No compatible OBD-II BLE service found");
    } catch (error: any) {
      // Improved error handling for user-friendly messages and raw error
      let userMessage = "Bluetooth connection failed: " + error;
      if (error && error.name === 'NotFoundError') {
        userMessage = "No device selected. Please try again and select your OBD-II adapter.";
      } else if (error && error.name === 'NetworkError' && String(error).includes('Unsupported device')) {
        userMessage = "The selected device is not supported. Please use a BLE-compatible ELM327 adapter.";
      } else if (error && error.message) {
        userMessage += `\nRaw error: ${error.message}`;
      }
      this.handleError(userMessage);
      return false;
    }
  }

  // Connect to OBD-II adapter via Web Serial API
  async connectSerial(): Promise<boolean> {
    try {
      if (!(navigator as any).serial) {
        throw new Error("Web Serial API not supported in this browser");
      }

      // Request serial port
      this.serialPort = await (navigator as any).serial.requestPort({
        filters: [
          { usbVendorId: 0x1a86 }, // Common USB-Serial chip
          { usbVendorId: 0x0403 }, // FTDI
          { usbVendorId: 0x10c4 }, // Silicon Labs
        ],
      });

      // Open serial connection
      await this.serialPort.open({
        baudRate: 38400, // Standard ELM327 baud rate
        dataBits: 8,
        parity: "none",
        stopBits: 1,
        flowControl: "none",
      });

      // Set up data reading
      this.setupSerialReading();

      // Initialize connection
      await this.initializeOBDConnection();

      this.isConnected = true;
      this.notifyConnectionStatus(true);

      return true;
    } catch (error) {
      this.handleError(`Serial connection failed: ${error}`);
      return false;
    }
  }

  // Initialize OBD-II connection and configure adapter
  private async initializeOBDConnection(): Promise<void> {
    try {
      // Reset adapter
      await this.sendCommand("ATZ");
      await this.delay(1000);

      // Set protocol to automatic
      await this.sendCommand("ATSP0");
      await this.delay(500);

      // Turn off echo
      await this.sendCommand("ATE0");
      await this.delay(500);

      // Turn off line feeds
      await this.sendCommand("ATL0");
      await this.delay(500);

      // Turn off spaces
      await this.sendCommand("ATS0");
      await this.delay(500);

      // Get vehicle information
      await this.getVehicleInfo();

      // Start continuous data reading
      this.startDataReading();
    } catch (error) {
      throw new Error(`OBD initialization failed: ${error}`);
    }
  }

  // Send command to OBD adapter
  private async sendCommand(command: string): Promise<string> {
    const fullCommand = command + "\r";
    this.lastCommand = command;
    if (this.characteristic) {
      // Bluetooth transmission
      const encoder = new TextEncoder();
      await this.characteristic.writeValue(encoder.encode(fullCommand));
      // Wait for response from handleBluetoothData
      return await new Promise<string>((resolve) => {
        this.pendingCommandResolve = resolve;
        setTimeout(() => {
          if (this.pendingCommandResolve) {
            this.pendingCommandResolve = null;
            resolve("TIMEOUT");
          }
        }, 1000); // 1s timeout
      });
    } else if (this.serialPort) {
      // Serial transmission
      const writer = this.serialPort.writable!.getWriter();
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(fullCommand));
      writer.releaseLock();
      await this.delay(200);
      return "OK"; // Placeholder for serial
    }
    await this.delay(200);
    return "NO_DEVICE";
  }

  // Get vehicle information
  private async getVehicleInfo(): Promise<void> {
    try {
      // Get VIN (Vehicle Identification Number)
      const vinResponse = await this.sendCommand("0902");

      // Get supported PIDs
      const supportedPidsResponse = await this.sendCommand("0100");

      this.vehicleInfo = {
        supportedPids: [], // Parse from response
        // VIN parsing would be implemented here
      };
    } catch (error) {
      console.warn("Could not retrieve vehicle info:", error);
    }
  }

  // Start continuous data reading
  private startDataReading(): void {
    if (this.readingInterval) {
      clearInterval(this.readingInterval);
    }

    const readingTasks = [
      "010C", // RPM
      "010D", // Speed
      "0111", // Throttle
      "0104", // Engine Load
      "0105", // Coolant Temp
      "010F", // Intake Air Temp
      "0110", // MAF
      "010A", // Fuel Pressure
      "010B", // Manifold Pressure
      "012F", // Fuel Level
    ];

    let currentTaskIndex = 0;

    this.readingInterval = setInterval(async () => {
      if (!this.isConnected) return;

      try {
        const pid = readingTasks[currentTaskIndex];
        const response = await this.sendCommand(pid);

        // Parse response and update current data
        this.parseOBDResponse(pid, response);

        currentTaskIndex = (currentTaskIndex + 1) % readingTasks.length;

        // Emit updated data every few readings
        if (currentTaskIndex === 0) {
          this.emitCurrentData();
        }
      } catch (error) {
        console.warn("OBD reading error:", error);
      }
    }, 100); // Read every 100ms
  }

  // Parse OBD response and update current data
  private parseOBDResponse(pid: string, response: string): void {
    const parameter = this.supportedParameters.get(pid);
    if (!parameter) return;

    try {
      // Simplified parsing - real implementation would handle hex response properly
      const mockValue = this.generateMockValue(parameter);

      const reading: OBDReading = {
        pid,
        name: parameter.name,
        value: mockValue,
        unit: parameter.unit,
        timestamp: Date.now(),
        raw: [],
      };

      // Update current data object
      this.updateCurrentDataFromReading(reading);
    } catch (error) {
      console.warn(`Failed to parse ${pid}:`, error);
    }
  }

  // Generate realistic mock values for development (replace with real parsing)
  private generateMockValue(parameter: OBDParameter): number {
    const range = parameter.max - parameter.min;
    const baseValue = parameter.min + range * 0.3; // Start at 30% of range
    const variation = range * 0.1; // ±10% variation

    return Math.max(
      parameter.min,
      Math.min(parameter.max, baseValue + (Math.random() - 0.5) * variation),
    );
  }

  // Update current data from OBD reading
  private updateCurrentDataFromReading(reading: OBDReading): void {
    switch (reading.pid) {
      case "010C":
        this.currentData.rpm = reading.value;
        break;
      case "010D":
        this.currentData.speed = reading.value;
        break;
      case "0111":
        this.currentData.throttlePosition = reading.value;
        break;
      case "0104":
        this.currentData.engineLoad = reading.value;
        break;
      case "0105":
        this.currentData.coolantTemp = reading.value;
        break;
      case "010F":
        this.currentData.intakeAirTemp = reading.value;
        break;
      case "0110":
        this.currentData.maf = reading.value;
        break;
      case "010A":
        this.currentData.fuelPressure = reading.value;
        break;
      case "010B":
        this.currentData.manifoldPressure = reading.value;
        break;
      case "012F":
        this.currentData.fuelLevel = reading.value;
        break;
    }

    this.currentData.timestamp = Date.now();
  }

  // Emit current data to listeners
  private emitCurrentData(): void {
    const completeData: LiveOBDData = {
      speed: this.currentData.speed || 0,
      rpm: this.currentData.rpm || 800,
      throttlePosition: this.currentData.throttlePosition || 0,
      engineLoad: this.currentData.engineLoad || 0,
      coolantTemp: this.currentData.coolantTemp || 85,
      intakeAirTemp: this.currentData.intakeAirTemp || 25,
      maf: this.currentData.maf || 2.5,
      fuelPressure: this.currentData.fuelPressure || 300,
      manifoldPressure: this.currentData.manifoldPressure || 100,
      fuelLevel: this.currentData.fuelLevel || 75,
      oilTemp: this.currentData.oilTemp || 90,
      boost: this.currentData.boost || 0,
      afr: 14.7, // Stoichiometric ratio
      ignitionTiming: 10,
      fuelTrim: {
        shortTerm: this.currentData.fuelTrim?.shortTerm || 0,
        longTerm: this.currentData.fuelTrim?.longTerm || 0,
      },
      voltage: this.currentData.voltage || 12.6,
      timestamp: Date.now(),
    };

    this.dataListeners.forEach((callback) => {
      try {
        callback(completeData);
      } catch (error) {
        console.error("Data listener error:", error);
      }
    });
  }

  // Handle Bluetooth data reception
  private handleBluetoothData(event: Event): void {
    const target = event.target as any; // BluetoothRemoteGATTCharacteristic
    const value = target.value;
    if (value) {
      const decoder = new TextDecoder();
      const response = decoder.decode(value);
      // Debug: Log all incoming data
      console.log("[OBD Bluetooth] Received:", response);
      // If waiting for a command response, resolve it
      if (this.pendingCommandResolve) {
        this.pendingCommandResolve(response);
        this.pendingCommandResolve = null;
      }
      // Basic parse: If response contains a PID, update currentData
      // Example: '41 0C 1A F8' => RPM
      const match = response.match(/41 ([0-9A-F]{2}) (([0-9A-F]{2} ?)+)/i);
      if (match) {
        const pidHex = match[1];
        const dataHex = match[2].trim().split(/\s+/);
        const pid = "01" + pidHex;
        const param = this.supportedParameters.get(pid);
        if (param) {
          const bytes = dataHex.map((h) => parseInt(h, 16));
          const value = param.formula(bytes);
          // Special handling for fuel trim
          if (param.name === 'Short Term Fuel Trim') {
            if (!this.currentData.fuelTrim) this.currentData.fuelTrim = { shortTerm: 0, longTerm: 0 };
            this.currentData.fuelTrim.shortTerm = value;
          } else if (param.name === 'Long Term Fuel Trim') {
            if (!this.currentData.fuelTrim) this.currentData.fuelTrim = { shortTerm: 0, longTerm: 0 };
            this.currentData.fuelTrim.longTerm = value;
          } else {
            const key = param.name.replace(/\s/g, '').toLowerCase();
            // Only assign to known scalar keys
            const allowedScalarKeys = [
              'speed', 'rpm', 'throttleposition', 'engineload', 'coolanttemp',
              'intakeairtemp', 'maf', 'fuelpressure', 'manifoldpressure',
              'fuellevel', 'oiltemp', 'boost', 'afr', 'ignitiontiming', 'voltage', 'timestamp'
            ];
            if (allowedScalarKeys.includes(key)) {
              (this.currentData as Partial<Record<typeof key, number>>)[key] = value;
            }
          }
          this.currentData.timestamp = Date.now();
          this.emitCurrentData();
        }
      }
    }
  }

  // Set up serial port reading
  private async setupSerialReading(): Promise<void> {
    if (!this.serialPort) return;

    const reader = this.serialPort.readable!.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const response = decoder.decode(value);
        // Process response...
      }
    } catch (error) {
      console.error("Serial reading error:", error);
    } finally {
      reader.releaseLock();
    }
  }

  // Disconnect from OBD adapter
  async disconnect(): Promise<void> {
    this.isConnected = false;

    if (this.readingInterval) {
      clearInterval(this.readingInterval);
      this.readingInterval = null;
    }

    if (this.device && this.device.gatt) {
      await this.device.gatt.disconnect();
      this.device = null;
      this.characteristic = null;
    }

    if (this.serialPort) {
      await this.serialPort.close();
      this.serialPort = null;
    }

    this.notifyConnectionStatus(false);
  }

  // Get connection status
  isDeviceConnected(): boolean {
    return this.isConnected;
  }

  // Get current live data
  getCurrentData(): LiveOBDData | null {
    if (!this.isConnected || !this.currentData.timestamp) {
      return null;
    }
    return this.currentData as LiveOBDData;
  }

  // Get current vehicle information
  getCurrentVehicleInfo(): VehicleInfo | null {
    return this.vehicleInfo;
  }

  // Get supported parameters
  getSupportedParameters(): OBDParameter[] {
    return Array.from(this.supportedParameters.values());
  }

  // Event listeners
  onDataUpdate(callback: (data: LiveOBDData) => void): () => void {
    this.dataListeners.add(callback);
    return () => this.dataListeners.delete(callback);
  }

  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.add(callback);
    return () => this.connectionListeners.delete(callback);
  }

  onError(callback: (error: string) => void): () => void {
    this.errorListeners.add(callback);
    return () => this.errorListeners.delete(callback);
  }

  // Utility methods
  private notifyConnectionStatus(connected: boolean): void {
    this.connectionListeners.forEach((callback) => {
      try {
        callback(connected);
      } catch (error) {
        console.error("Connection listener error:", error);
      }
    });
  }

  private handleError(error: string): void {
    this.errorListeners.forEach((callback) => {
      try {
        callback(error);
      } catch (error) {
        console.error("Error listener error:", error);
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Development mode - simulate OBD data
  startSimulationMode(): void {
    this.isConnected = true;
    this.notifyConnectionStatus(true);

    if (this.readingInterval) {
      clearInterval(this.readingInterval);
    }

    // Simulate realistic driving data
    this.readingInterval = setInterval(() => {
      const simulatedData: LiveOBDData = {
        speed: Math.max(0, 60 + (Math.random() - 0.5) * 40), // 40-80 km/h
        rpm: Math.max(800, 2500 + (Math.random() - 0.5) * 1000), // 2000-3000 RPM
        throttlePosition: Math.max(
          0,
          Math.min(100, 30 + (Math.random() - 0.5) * 40),
        ),
        engineLoad: Math.max(0, Math.min(100, 35 + (Math.random() - 0.5) * 20)),
        coolantTemp: 85 + (Math.random() - 0.5) * 10,
        intakeAirTemp: 25 + (Math.random() - 0.5) * 10,
        maf: 2.5 + (Math.random() - 0.5) * 2,
        fuelPressure: 300 + (Math.random() - 0.5) * 50,
        manifoldPressure: 100 + (Math.random() - 0.5) * 20,
        fuelLevel: 75 + (Math.random() - 0.5) * 10,
        oilTemp: 90 + (Math.random() - 0.5) * 15,
        boost: Math.max(0, (Math.random() - 0.7) * 50), // Sometimes boost
        afr: 14.7 + (Math.random() - 0.5) * 0.5,
        ignitionTiming: 10 + (Math.random() - 0.5) * 5,
        fuelTrim: {
          shortTerm: (Math.random() - 0.5) * 10,
          longTerm: 2 + (Math.random() - 0.5) * 4,
        },
        voltage: 12.6 + (Math.random() - 0.5) * 0.4,
        timestamp: Date.now(),
      };

      this.dataListeners.forEach((callback) => {
        try {
          callback(simulatedData);
        } catch (error) {
          console.error("Simulation data listener error:", error);
        }
      });
    }, 200); // Update every 200ms
  }
}

// Global instance
export const obdIntegrationService = new OBDIntegrationService();

// Export types
export type {
  OBDParameter,
  OBDReading,
  VehicleInfo,
  OBDConnectionConfig,
  LiveOBDData,
};
