// Browser-compatible hardware service using Web APIs
export interface VehicleData {
  speed: number;
  rpm: number;
  engineTemp: number;
  throttlePosition: number;
  fuelLevel: number;
  batteryVoltage: number;
  oilPressure: number;
  boostPressure?: number;
  gear?: number;
  timestamp: number;
}

export interface GPSData {
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: number;
}

export interface HardwareStatus {
  obdConnected: boolean;
  gpsConnected: boolean;
  bluetoothConnected: boolean;
  lastUpdate: number;
  error?: string;
}

// Simple event emitter for browser
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  emit(event: string, ...args: any[]) {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(...args));
    }
  }

  removeAllListeners() {
    this.events = {};
  }
}

export class RealHardwareService extends EventEmitter {
  private obdPort: any = null;
  private gpsDevice: any = null;
  private bluetoothDevice: any = null;
  private isConnected = false;
  private dataInterval: number | null = null;
  private reconnectInterval: number | null = null;

  constructor() {
    super();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Handle hardware events
    this.on('data', (data: VehicleData | GPSData) => {
      this.emit('telemetry', data);
    });

    this.on('error', (error: string) => {
      console.error('Hardware error:', error);
      this.emit('status', { error });
    });
  }

  // OBD-II Connection Methods using Web Serial API
  async connectOBD(): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && 'serial' in navigator) {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 38400 });
        this.obdPort = port;
        this.isConnected = true;
        this.startDataCollection();
        this.emit('status', { obdConnected: true });
        return true;
      } else {
        this.emit('error', 'Web Serial API not supported in this browser');
        return false;
      }
    } catch (error) {
      this.emit('error', `OBD connection error: ${error}`);
      return false;
    }
  }

  // GPS Connection Methods using browser GPS
  async connectGPS(): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        // Use browser GPS
        navigator.geolocation.watchPosition(
          (position) => {
            const gpsData: GPSData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              altitude: position.coords.altitude || 0,
              speed: position.coords.speed || 0,
              heading: position.coords.heading || 0,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };
            this.emit('data', gpsData);
          },
          (error) => {
            this.emit('error', `GPS error: ${error.message}`);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 1000
          }
        );
        this.gpsDevice = true;
        this.emit('status', { gpsConnected: true });
        return true;
      } else {
        this.emit('error', 'GPS not supported in this browser');
        return false;
      }
    } catch (error) {
      this.emit('error', `GPS connection error: ${error}`);
      return false;
    }
  }

  // Bluetooth Connection Methods using Web Bluetooth API
  async connectBluetooth(): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
        const device = await (navigator as any).bluetooth.requestDevice({
          filters: [
            { services: ['obd2'] },
            { namePrefix: 'OBD' },
            { namePrefix: 'ELM' }
          ]
        });

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('obd2');
        const characteristic = await service.getCharacteristic('obd2_data');
        
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
          const value = event.target.value;
          const data = this.parseOBDData(value);
          this.emit('data', data);
        });

        this.bluetoothDevice = device;
        this.emit('status', { bluetoothConnected: true });
        return true;
      } else {
        this.emit('error', 'Web Bluetooth API not supported in this browser');
        return false;
      }
    } catch (error) {
      this.emit('error', `Bluetooth connection error: ${error}`);
      return false;
    }
  }

  // Data Collection
  private startDataCollection() {
    if (this.dataInterval) {
      clearInterval(this.dataInterval);
    }

    this.dataInterval = window.setInterval(async () => {
      if (this.isConnected) {
        try {
          const vehicleData = await this.readVehicleData();
          if (vehicleData) {
            this.emit('data', vehicleData);
          }
        } catch (error) {
          this.emit('error', `Data collection error: ${error}`);
        }
      }
    }, 100); // 10Hz data rate
  }

  private async readVehicleData(): Promise<VehicleData | null> {
    if (!this.obdPort) return null;

    try {
      // OBD-II PIDs for common data
      const commands = [
        '010D', // Vehicle Speed
        '010C', // Engine RPM
        '0105', // Engine Coolant Temperature
        '0111', // Throttle Position
        '012F', // Fuel Level
        '0142', // Control Module Voltage
        '010A', // Fuel Pressure
        '010B'  // Intake Manifold Pressure
      ];

      const data: Partial<VehicleData> = {
        timestamp: Date.now()
      };

      for (const command of commands) {
        const response = await this.sendOBDCommand(command);
        if (response) {
          const value = this.parseOBDResponse(command, response);
          switch (command) {
            case '010D': data.speed = value; break;
            case '010C': data.rpm = value; break;
            case '0105': data.engineTemp = value; break;
            case '0111': data.throttlePosition = value; break;
            case '012F': data.fuelLevel = value; break;
            case '0142': data.batteryVoltage = value; break;
            case '010A': data.oilPressure = value; break;
            case '010B': data.boostPressure = value; break;
          }
        }
      }

      return data as VehicleData;
    } catch (error) {
      console.error('Error reading vehicle data:', error);
      return null;
    }
  }

  private async sendOBDCommand(command: string): Promise<string | null> {
    if (!this.obdPort) return null;

    try {
      // Web Serial API
      const writer = this.obdPort.writable.getWriter();
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(command + '\r'));
      writer.releaseLock();

      const reader = this.obdPort.readable.getReader();
      const decoder = new TextDecoder();
      let response = '';
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        response += decoder.decode(value);
        if (response.includes('>')) break;
      }
      
      reader.releaseLock();
      return response.trim();
    } catch (error) {
      console.error('Error sending OBD command:', error);
      return null;
    }
  }

  private parseOBDResponse(command: string, response: string): number {
    // Basic OBD-II response parsing
    const data = response.replace(/\s/g, '').match(/[0-9A-F]{2}/g);
    if (!data || data.length < 3) return 0;

    const mode = data[0];
    const pid = data[1];
    const values = data.slice(2);

    switch (command) {
      case '010D': // Speed
        return parseInt(values[0], 16);
      case '010C': // RPM
        return (parseInt(values[0], 16) * 256 + parseInt(values[1], 16)) / 4;
      case '0105': // Engine Temp
        return parseInt(values[0], 16) - 40;
      case '0111': // Throttle Position
        return (parseInt(values[0], 16) * 100) / 255;
      case '012F': // Fuel Level
        return (parseInt(values[0], 16) * 100) / 255;
      case '0142': // Battery Voltage
        return (parseInt(values[0], 16) * 256 + parseInt(values[1], 16)) / 1000;
      default:
        return 0;
    }
  }

  private parseOBDData(value: DataView): VehicleData {
    // Parse Bluetooth OBD data
    const bytes = new Uint8Array(value.buffer);
    return {
      speed: bytes[0],
      rpm: (bytes[1] * 256 + bytes[2]) / 4,
      engineTemp: bytes[3] - 40,
      throttlePosition: (bytes[4] * 100) / 255,
      fuelLevel: (bytes[5] * 100) / 255,
      batteryVoltage: (bytes[6] * 256 + bytes[7]) / 1000,
      oilPressure: bytes[8],
      timestamp: Date.now()
    };
  }

  // Public Methods
  async connectAll(): Promise<HardwareStatus> {
    const status: HardwareStatus = {
      obdConnected: false,
      gpsConnected: false,
      bluetoothConnected: false,
      lastUpdate: Date.now()
    };

    try {
      // Try OBD connection first
      status.obdConnected = await this.connectOBD();
      
      // Try GPS connection
      status.gpsConnected = await this.connectGPS();
      
      // Try Bluetooth connection
      status.bluetoothConnected = await this.connectBluetooth();
      
      status.lastUpdate = Date.now();
      this.emit('status', status);
      
      return status;
    } catch (error) {
      status.error = error as string;
      this.emit('status', status);
      return status;
    }
  }

  disconnect(): void {
    this.isConnected = false;
    
    if (this.dataInterval) {
      clearInterval(this.dataInterval);
      this.dataInterval = null;
    }

    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.obdPort) {
      if (typeof this.obdPort.close === 'function') {
        this.obdPort.close();
      }
      this.obdPort = null;
    }

    this.emit('status', {
      obdConnected: false,
      gpsConnected: false,
      bluetoothConnected: false,
      lastUpdate: Date.now()
    });
  }

  getStatus(): HardwareStatus {
    return {
      obdConnected: !!this.obdPort,
      gpsConnected: !!this.gpsDevice,
      bluetoothConnected: !!this.bluetoothDevice,
      lastUpdate: Date.now()
    };
  }

  // Auto-reconnect functionality
  enableAutoReconnect(interval: number = 5000): void {
    this.reconnectInterval = window.setInterval(async () => {
      const status = this.getStatus();
      if (!status.obdConnected && !status.gpsConnected && !status.bluetoothConnected) {
        console.log('Attempting to reconnect hardware...');
        await this.connectAll();
      }
    }, interval);
  }

  disableAutoReconnect(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }
}

// Export singleton instance
export const realHardwareService = new RealHardwareService(); 