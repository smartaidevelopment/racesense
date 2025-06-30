const { SerialPort } = require('serialport');
const { EventEmitter } = require('events');

class OBDService extends EventEmitter {
  constructor() {
    super();
    this.port = null;
    this.isConnected = false;
    this.currentPort = null;
    this.dataInterval = null;
    this.reconnectInterval = null;
    this.autoReconnect = false;
    this._connectInProgress = false;
    this._abortConnect = false;
  }

  abortConnect() {
    if (this._connectInProgress) {
      this._abortConnect = true;
      if (this.port && this.port.isOpen) {
        this.port.close(() => {});
      }
      this.emit('connect-aborted');
    }
  }

  async connect(portPath = '/dev/tty.usbserial') {
    if (this._connectInProgress) {
      this.abortConnect();
      throw new Error('Previous OBD connect attempt aborted. Try again.');
    }
    this._connectInProgress = true;
    this._abortConnect = false;
    try {
      // Disconnect existing connection
      if (this.port) {
        this.disconnect();
      }

      this.port = new SerialPort({
        path: portPath,
        baudRate: 38400,
        autoOpen: false,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      });

      return new Promise((resolve, reject) => {
        this.port.open((err) => {
          if (this._abortConnect) {
            this._connectInProgress = false;
            reject(new Error('OBD connect aborted by user.'));
            return;
          }
          if (err) {
            console.error('OBD connection error:', err);
            this._connectInProgress = false;
            reject(new Error('OBD connection error: ' + err.message));
            return;
          }

          console.log(`OBD connected to ${portPath}`);
          this.isConnected = true;
          this.currentPort = portPath;
          
          // Initialize OBD adapter
          this.initializeOBD()
            .then(() => {
              this.startDataCollection();
              this.emit('connected', portPath);
              this._connectInProgress = false;
              resolve(true);
            })
            .catch((error) => {
              console.error('OBD initialization error:', error);
              this._connectInProgress = false;
              reject(new Error('OBD initialization error: ' + error.message));
            });
        });

        this.port.on('error', (err) => {
          console.error('OBD port error:', err);
          this._connectInProgress = false;
          this.handleError(new Error('OBD port error: ' + err.message));
        });

        this.port.on('close', () => {
          console.log('OBD port closed');
          this.handleDisconnection();
          this._connectInProgress = false;
        });
      });
    } catch (error) {
      console.error('OBD connection failed:', error);
      this._connectInProgress = false;
      throw error;
    }
  }

  async initializeOBD() {
    // Reset OBD adapter
    await this.sendCommand('ATZ');
    await this.delay(1000);
    
    // Set echo off
    await this.sendCommand('ATE0');
    await this.delay(100);
    
    // Set linefeeds off
    await this.sendCommand('ATL0');
    await this.delay(100);
    
    // Set spaces off
    await this.sendCommand('ATS0');
    await this.delay(100);
    
    // Set headers off
    await this.sendCommand('ATH0');
    await this.delay(100);
    
    // Test connection
    const response = await this.sendCommand('0100');
    if (!response || response.includes('NO DATA')) {
      throw new Error('OBD adapter not responding or no data received');
    }
    
    console.log('OBD adapter initialized successfully');
  }

  async sendCommand(command) {
    if (!this.port || !this.isConnected) {
      throw new Error('OBD not connected');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('OBD command timeout for command: ' + command));
      }, 5000);

      this.port.write(command + '\r', (err) => {
        if (err) {
          clearTimeout(timeout);
          reject(new Error('OBD write error: ' + err.message));
          return;
        }

        let response = '';
        const dataHandler = (data) => {
          response += data.toString();
          if (response.includes('>')) {
            clearTimeout(timeout);
            this.port.removeListener('data', dataHandler);
            resolve(response.trim());
          }
        };

        this.port.on('data', dataHandler);
      });
    });
  }

  startDataCollection() {
    if (this.dataInterval) {
      clearInterval(this.dataInterval);
    }

    this.dataInterval = setInterval(async () => {
      if (this.isConnected) {
        try {
          const vehicleData = await this.readVehicleData();
          if (vehicleData) {
            this.emit('data', vehicleData);
          }
        } catch (error) {
          console.error('OBD data collection error:', error.message);
        }
      }
    }, 100); // 10Hz data rate
  }

  async readVehicleData() {
    try {
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

      const data = {
        timestamp: Date.now(),
        speed: 0,
        rpm: 0,
        engineTemp: 0,
        throttlePosition: 0,
        fuelLevel: 0,
        batteryVoltage: 0,
        oilPressure: 0,
        boostPressure: 0
      };

      for (const command of commands) {
        try {
          const response = await this.sendCommand(command);
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
        } catch (error) {
          console.warn(`Failed to read ${command}:`, error.message);
        }
      }

      return data;
    } catch (error) {
      console.error('Error reading vehicle data:', error.message);
      return null;
    }
  }

  parseOBDResponse(command, response) {
    // Clean response
    const cleanResponse = response.replace(/\s/g, '').replace(/>$/, '');
    const data = cleanResponse.match(/[0-9A-F]{2}/g);
    
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
      case '010A': // Fuel Pressure
        return parseInt(values[0], 16) * 3;
      case '010B': // Intake Manifold Pressure
        return parseInt(values[0], 16);
      default:
        return 0;
    }
  }

  async getAvailablePorts() {
    try {
      const ports = await SerialPort.list();
      return ports.map(port => ({
        path: port.path,
        manufacturer: port.manufacturer,
        serialNumber: port.serialNumber,
        pnpId: port.pnpId,
        locationId: port.locationId,
        productId: port.productId,
        vendorId: port.vendorId
      }));
    } catch (error) {
      console.error('Error getting available ports:', error);
      return [];
    }
  }

  disconnect() {
    this.isConnected = false;
    this.autoReconnect = false;
    
    if (this.dataInterval) {
      clearInterval(this.dataInterval);
      this.dataInterval = null;
    }

    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.port) {
      // Remove all listeners
      this.port.removeAllListeners('data');
      this.port.removeAllListeners('error');
      this.port.removeAllListeners('close');
      this.port.close((err) => {
        if (err) {
          console.error('Error closing OBD port:', err.message);
        } else {
          console.log('OBD port closed successfully');
        }
      });
      this.port = null;
    }

    this.currentPort = null;
    this.emit('disconnected');
    this._connectInProgress = false;
    this._abortConnect = false;
  }

  handleError(error) {
    console.error('OBD error:', error);
    this.emit('error', error);
    
    if (this.autoReconnect) {
      this.scheduleReconnect();
    }
  }

  handleDisconnection() {
    this.isConnected = false;
    this.emit('disconnected');
    
    if (this.autoReconnect) {
      this.scheduleReconnect();
    }
    this._connectInProgress = false;
    this._abortConnect = false;
  }

  scheduleReconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }

    this.reconnectInterval = setInterval(async () => {
      if (!this.isConnected && this.currentPort) {
        console.log('Attempting to reconnect OBD...');
        try {
          await this.connect(this.currentPort);
        } catch (error) {
          console.error('OBD reconnection failed:', error);
        }
      }
    }, 5000);
  }

  enableAutoReconnect() {
    this.autoReconnect = true;
    console.log('OBD auto-reconnect enabled');
  }

  disableAutoReconnect() {
    this.autoReconnect = false;
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    console.log('OBD auto-reconnect disabled');
  }

  isConnected() {
    return this.isConnected;
  }

  getCurrentPort() {
    return this.currentPort;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = OBDService; 