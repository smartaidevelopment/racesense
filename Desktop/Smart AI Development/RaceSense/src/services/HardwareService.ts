interface OBDData {
  engineRPM: number;
  vehicleSpeed: number; // km/h
  throttlePosition: number; // percentage
  engineLoad: number; // percentage
  coolantTemperature: number; // Celsius
  intakeAirTemperature: number; // Celsius
  manifoldPressure: number; // kPa
  fuelLevel: number; // percentage
  oilTemperature?: number; // Celsius
  oilPressure?: number; // kPa
  fuelPressure?: number; // kPa
  timestamp: number;
}

interface SensorData {
  accelerometerX: number; // G-force
  accelerometerY: number; // G-force
  accelerometerZ: number; // G-force
  gyroscopeX: number; // deg/s
  gyroscopeY: number; // deg/s
  gyroscopeZ: number; // deg/s
  magnetometerX?: number;
  magnetometerY?: number;
  magnetometerZ?: number;
  timestamp: number;
}

interface RacingTelemetry extends OBDData {
  sensors: SensorData;
  gpsData?: {
    speed: number;
    latitude: number;
    longitude: number;
    altitude: number;
    accuracy: number;
  };
  calculatedValues: {
    lateralG: number;
    longitudinalG: number;
    verticalG: number;
    totalG: number;
    powerToWeightRatio: number;
    estimatedPower: number; // HP
    fuelConsumption: number; // L/100km
  };
}

type HardwareListener = (data: RacingTelemetry) => void;
type ConnectionListener = (connected: boolean, device?: string) => void;

class HardwareService {
  private isConnected = false;
  private currentDevice: string | null = null;
  private dataInterval: NodeJS.Timeout | null = null;
  private simulationMode = true;

  private hardwareListeners: HardwareListener[] = [];
  private connectionListeners: ConnectionListener[] = [];

  // Web APIs for hardware access
  private serialPort: SerialPort | null = null;
  private bluetoothDevice: BluetoothDevice | null = null;

  // Vehicle parameters for calculations
  private vehicleParams = {
    weight: 1200, // kg
    aerodynamicDragCoefficient: 0.35,
    frontalArea: 2.2, // m²
    tireDiameter: 0.65, // meters
    fuelTankCapacity: 60, // liters
  };

  constructor() {
    this.checkHardwareSupport();
  }

  // Check what hardware APIs are available
  private checkHardwareSupport(): { [key: string]: boolean } {
    const support = {
      webSerial: "serial" in navigator,
      webBluetooth: "bluetooth" in navigator,
      webUSB: "usb" in navigator,
      sensors: "Accelerometer" in window || "DeviceMotionEvent" in window,
      gamepad: "getGamepads" in navigator,
    };

    console.log("Hardware support:", support);
    return support;
  }

  // Connect to OBD-II via Web Serial API
  async connectOBD(): Promise<void> {
    if (!("serial" in navigator)) {
      throw new Error("Web Serial API not supported");
    }

    try {
      // Request serial port access
      this.serialPort = await (navigator as any).serial.requestPort({
        filters: [
          { usbVendorId: 0x1a86, usbProductId: 0x7523 }, // Common OBD-II adapter
          { usbVendorId: 0x0403, usbProductId: 0x6001 }, // FTDI
        ],
      });

      await this.serialPort.open({ baudRate: 38400 });

      this.isConnected = true;
      this.currentDevice = "OBD-II Serial";
      this.startDataCollection();
      this.notifyConnectionListeners(true, this.currentDevice);

      console.log("OBD-II connected via Serial");
    } catch (error) {
      console.error("OBD-II connection failed:", error);
      throw new Error(`OBD-II connection failed: ${(error as Error).message}`);
    }
  }

  // Connect to Bluetooth racing sensors
  async connectBluetooth(): Promise<void> {
    if (!("bluetooth" in navigator)) {
      throw new Error("Web Bluetooth API not supported");
    }

    try {
      this.bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: "RaceBox" },
          { namePrefix: "AIM" },
          { namePrefix: "VBOX" },
          { services: ["0000180f-0000-1000-8000-00805f9b34fb"] }, // Battery Service
        ],
        optionalServices: [
          "0000180a-0000-1000-8000-00805f9b34fb", // Device Information
          "12345678-1234-1234-1234-123456789abc", // Custom telemetry service
        ],
      });

      const server = await this.bluetoothDevice.gatt!.connect();
      console.log("Bluetooth device connected:", this.bluetoothDevice.name);

      this.isConnected = true;
      this.currentDevice = `Bluetooth: ${this.bluetoothDevice.name}`;
      this.startDataCollection();
      this.notifyConnectionListeners(true, this.currentDevice);
    } catch (error) {
      console.error("Bluetooth connection failed:", error);
      throw new Error(
        `Bluetooth connection failed: ${(error as Error).message}`,
      );
    }
  }

  // Start simulation mode (for demo/testing)
  startSimulation(): void {
    this.simulationMode = true;
    this.isConnected = true;
    this.currentDevice = "Simulation Mode";
    this.startDataCollection();
    this.notifyConnectionListeners(true, this.currentDevice);
    console.log("Hardware simulation started");
  }

  // Start collecting sensor data
  private startDataCollection(): void {
    if (this.dataInterval) {
      clearInterval(this.dataInterval);
    }

    // Collect data every 100ms (10Hz)
    this.dataInterval = setInterval(() => {
      if (this.simulationMode) {
        const telemetryData = this.generateSimulatedData();
        this.notifyHardwareListeners(telemetryData);
      } else {
        this.collectRealHardwareData();
      }
    }, 100);
  }

  // Generate realistic simulated racing data
  private generateSimulatedData(): RacingTelemetry {
    const time = Date.now();
    const cycleTime = (time / 1000) % 60; // 60-second cycle

    // Simulate a racing scenario (acceleration, braking, cornering)
    const isAccelerating = cycleTime < 10;
    const isBraking = cycleTime > 15 && cycleTime < 20;
    const isCornering = cycleTime > 25 && cycleTime < 35;

    // Base values
    let rpm = 2000 + Math.sin(cycleTime * 0.5) * 1500 + Math.random() * 200;
    let speed = 60 + Math.sin(cycleTime * 0.3) * 40 + Math.random() * 10;
    let throttle = 50 + Math.random() * 20;

    // Scenario adjustments
    if (isAccelerating) {
      rpm = Math.min(7000, rpm + 1000);
      throttle = 80 + Math.random() * 20;
      speed = Math.min(200, speed + 30);
    } else if (isBraking) {
      throttle = Math.random() * 10;
      speed = Math.max(30, speed - 20);
    } else if (isCornering) {
      throttle = 40 + Math.random() * 30;
      speed = Math.max(40, speed - 10);
    }

    // OBD data
    const obdData: OBDData = {
      engineRPM: Math.round(rpm),
      vehicleSpeed: Math.round(speed),
      throttlePosition: Math.round(throttle),
      engineLoad: Math.round(throttle * 0.8 + Math.random() * 10),
      coolantTemperature: 85 + Math.random() * 15,
      intakeAirTemperature: 25 + Math.random() * 10,
      manifoldPressure: 100 + (throttle / 100) * 50 + Math.random() * 5,
      fuelLevel: 75 - ((time % 3600000) / 3600000) * 20, // Decreases over time
      oilTemperature: 90 + Math.random() * 20,
      oilPressure: 250 + Math.random() * 50,
      fuelPressure: 300 + Math.random() * 20,
      timestamp: time,
    };

    // Sensor data (accelerometer, gyroscope)
    let lateralG = 0;
    let longitudinalG = 0;

    if (isAccelerating) {
      longitudinalG = 0.3 + Math.random() * 0.4; // Forward acceleration
    } else if (isBraking) {
      longitudinalG = -(0.5 + Math.random() * 0.8); // Braking deceleration
    }

    if (isCornering) {
      lateralG = (Math.random() - 0.5) * 1.2; // Side G-forces
    }

    const sensorData: SensorData = {
      accelerometerX: lateralG + (Math.random() - 0.5) * 0.1,
      accelerometerY: longitudinalG + (Math.random() - 0.5) * 0.1,
      accelerometerZ: 1.0 + (Math.random() - 0.5) * 0.05, // Gravity + bumps
      gyroscopeX: (Math.random() - 0.5) * 10, // Roll
      gyroscopeY: (Math.random() - 0.5) * 5, // Pitch
      gyroscopeZ: isCornering
        ? (Math.random() - 0.5) * 30
        : (Math.random() - 0.5) * 5, // Yaw
      timestamp: time,
    };

    // Calculate derived values
    const totalG = Math.sqrt(
      lateralG * lateralG + longitudinalG * longitudinalG,
    );
    const estimatedPower = this.calculatePower(obdData);
    const powerToWeightRatio = estimatedPower / this.vehicleParams.weight;
    const fuelConsumption = this.calculateFuelConsumption(obdData);

    return {
      ...obdData,
      sensors: sensorData,
      calculatedValues: {
        lateralG: Math.round(lateralG * 100) / 100,
        longitudinalG: Math.round(longitudinalG * 100) / 100,
        verticalG: Math.round(sensorData.accelerometerZ * 100) / 100,
        totalG: Math.round(totalG * 100) / 100,
        powerToWeightRatio: Math.round(powerToWeightRatio * 100) / 100,
        estimatedPower: Math.round(estimatedPower),
        fuelConsumption: Math.round(fuelConsumption * 10) / 10,
      },
    };
  }

  // Calculate estimated engine power from OBD data
  private calculatePower(data: OBDData): number {
    // Simplified power calculation based on RPM, load, and vehicle characteristics
    const baseHP = 300; // Base engine power
    const loadFactor = data.engineLoad / 100;
    const rpmFactor = Math.min(1.2, data.engineRPM / 6000);
    const throttleFactor = data.throttlePosition / 100;

    return baseHP * loadFactor * rpmFactor * throttleFactor;
  }

  // Calculate fuel consumption
  private calculateFuelConsumption(data: OBDData): number {
    // Simplified fuel consumption calculation (L/100km)
    const baseConsumption = 8; // Base consumption
    const loadFactor = 1 + (data.engineLoad / 100) * 0.5;
    const speedFactor = data.vehicleSpeed > 100 ? 1.3 : 1.0;
    const throttleFactor = 1 + (data.throttlePosition / 100) * 0.4;

    return baseConsumption * loadFactor * speedFactor * throttleFactor;
  }

  // Collect data from real hardware (when connected)
  private async collectRealHardwareData(): Promise<void> {
    try {
      if (this.serialPort) {
        // Read OBD-II data via serial
        await this.readOBDData();
      }

      if (this.bluetoothDevice) {
        // Read sensor data via Bluetooth
        await this.readBluetoothSensorData();
      }

      // Access device motion sensors
      this.readDeviceMotionSensors();
    } catch (error) {
      console.error("Hardware data collection error:", error);
    }
  }

  private async readOBDData(): Promise<void> {
    if (!this.serialPort) return;

    // Send OBD-II commands and parse responses
    // This is a simplified example - real implementation would be more complex
    const commands = [
      "010C", // Engine RPM
      "010D", // Vehicle Speed
      "0111", // Throttle position
      "0104", // Engine load
      "0105", // Coolant temperature
    ];

    // In a real implementation, you would send these commands and parse responses
    console.log("Reading OBD-II data...");
  }

  private async readBluetoothSensorData(): Promise<void> {
    if (!this.bluetoothDevice) return;

    // Read characteristics from Bluetooth device
    // This would contain actual sensor readings
    console.log("Reading Bluetooth sensor data...");
  }

  private readDeviceMotionSensors(): void {
    // Use device motion events for accelerometer/gyroscope
    if ("DeviceMotionEvent" in window) {
      window.addEventListener("devicemotion", (event) => {
        if (event.acceleration && event.rotationRate) {
          // Process motion sensor data
          const sensorData: SensorData = {
            accelerometerX: event.acceleration.x || 0,
            accelerometerY: event.acceleration.y || 0,
            accelerometerZ: event.acceleration.z || 0,
            gyroscopeX: event.rotationRate.beta || 0,
            gyroscopeY: event.rotationRate.gamma || 0,
            gyroscopeZ: event.rotationRate.alpha || 0,
            timestamp: Date.now(),
          };

          // Process and combine with other telemetry data
        }
      });
    }
  }

  // Disconnect from hardware
  disconnect(): void {
    if (this.dataInterval) {
      clearInterval(this.dataInterval);
      this.dataInterval = null;
    }

    if (this.serialPort) {
      this.serialPort.close();
      this.serialPort = null;
    }

    if (this.bluetoothDevice) {
      this.bluetoothDevice.gatt?.disconnect();
      this.bluetoothDevice = null;
    }

    this.isConnected = false;
    this.currentDevice = null;
    this.simulationMode = false;
    this.notifyConnectionListeners(false);

    console.log("Hardware disconnected");
  }

  // Event notification methods
  private notifyHardwareListeners(data: RacingTelemetry): void {
    this.hardwareListeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.warn("Hardware listener error:", error);
      }
    });
  }

  private notifyConnectionListeners(connected: boolean, device?: string): void {
    this.connectionListeners.forEach((listener) => {
      try {
        listener(connected, device);
      } catch (error) {
        console.warn("Connection listener error:", error);
      }
    });
  }

  // Public methods
  isHardwareConnected(): boolean {
    return this.isConnected;
  }

  getCurrentDevice(): string | null {
    return this.currentDevice;
  }

  getVehicleParams(): typeof this.vehicleParams {
    return { ...this.vehicleParams };
  }

  updateVehicleParams(params: Partial<typeof this.vehicleParams>): void {
    this.vehicleParams = { ...this.vehicleParams, ...params };
    console.log("Vehicle parameters updated:", this.vehicleParams);
  }

  // Event listeners
  onHardwareData(listener: HardwareListener): () => void {
    this.hardwareListeners.push(listener);
    return () => {
      const index = this.hardwareListeners.indexOf(listener);
      if (index > -1) this.hardwareListeners.splice(index, 1);
    };
  }

  onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.push(listener);
    return () => {
      const index = this.connectionListeners.indexOf(listener);
      if (index > -1) this.connectionListeners.splice(index, 1);
    };
  }

  // Get hardware capabilities
  getHardwareCapabilities(): {
    canConnectSerial: boolean;
    canConnectBluetooth: boolean;
    canConnectUSB: boolean;
    hasMotionSensors: boolean;
    hasGamepad: boolean;
  } {
    return {
      canConnectSerial: "serial" in navigator,
      canConnectBluetooth: "bluetooth" in navigator,
      canConnectUSB: "usb" in navigator,
      hasMotionSensors: "DeviceMotionEvent" in window,
      hasGamepad: "getGamepads" in navigator,
    };
  }
}

export const hardwareService = new HardwareService();
export type { OBDData, SensorData, RacingTelemetry };
