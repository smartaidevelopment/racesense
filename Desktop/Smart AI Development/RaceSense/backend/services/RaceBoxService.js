const { EventEmitter } = require('events');
const bluetooth = require('node-ble');

class RaceBoxService extends EventEmitter {
  constructor() {
    super();
    this.device = null;
    this.isConnected = false;
    this.currentDevice = null;
    this.dataInterval = null;
    this.reconnectInterval = null;
    this.autoReconnect = false;
    
    // RaceBox Mini specific characteristics
    this.RACEBOX_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
    this.RACEBOX_CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
    
    // RaceBox Mini device name pattern
    this.DEVICE_NAME_PATTERN = /RaceBox Mini/i;
    this.DEVICE_ID_PATTERN = /1221405318/i;
  }

  async connect(deviceId = null) {
    try {
      console.log('Connecting to RaceBox Mini...');
      
      // If deviceId is provided, try to connect directly
      if (deviceId) {
        return await this.connectToDevice(deviceId);
      }
      
      // Otherwise, scan for RaceBox Mini devices
      const devices = await this.scanForDevices();
      const raceBoxDevice = devices.find(device => 
        this.DEVICE_NAME_PATTERN.test(device.name) || 
        this.DEVICE_ID_PATTERN.test(device.id)
      );
      
      if (!raceBoxDevice) {
        throw new Error('RaceBox Mini not found. Please ensure it is powered on and in pairing mode.');
      }
      
      console.log(`Found RaceBox Mini: ${raceBoxDevice.name} (${raceBoxDevice.id})`);
      return await this.connectToDevice(raceBoxDevice.id);
      
    } catch (error) {
      console.error('RaceBox connection error:', error);
      throw error;
    }
  }

  async scanForDevices() {
    return new Promise((resolve, reject) => {
      const devices = [];
      const scanTimeout = setTimeout(() => {
        resolve(devices);
      }, 10000); // 10 second scan

      bluetooth.startScanning((device) => {
        if (device.name && (this.DEVICE_NAME_PATTERN.test(device.name) || this.DEVICE_ID_PATTERN.test(device.id))) {
          devices.push({
            id: device.id,
            name: device.name,
            address: device.address,
            rssi: device.rssi
          });
        }
      });

      bluetooth.on('error', (error) => {
        clearTimeout(scanTimeout);
        reject(error);
      });
    });
  }

  async connectToDevice(deviceId) {
    return new Promise((resolve, reject) => {
      bluetooth.connect(deviceId, (device) => {
        this.device = device;
        this.currentDevice = deviceId;
        
        console.log(`Connected to RaceBox Mini: ${deviceId}`);
        
        // Discover services
        device.discoverServices([this.RACEBOX_SERVICE_UUID], (services) => {
          if (services.length === 0) {
            reject(new Error('RaceBox service not found'));
            return;
          }
          
          const service = services[0];
          
          // Discover characteristics
          service.discoverCharacteristics([this.RACEBOX_CHARACTERISTIC_UUID], (characteristics) => {
            if (characteristics.length === 0) {
              reject(new Error('RaceBox characteristic not found'));
              return;
            }
            
            const characteristic = characteristics[0];
            
            // Subscribe to notifications
            characteristic.subscribe((data) => {
              this.parseRaceBoxData(data);
            });
            
            this.isConnected = true;
            this.startDataCollection();
            this.emit('connected', deviceId);
            resolve(true);
          });
        });
      });
      
      bluetooth.on('error', (error) => {
        reject(error);
      });
    });
  }

  parseRaceBoxData(data) {
    try {
      // RaceBox Mini sends NMEA-like data
      const dataString = data.toString('utf8');
      const lines = dataString.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('$GPGGA')) {
          // GPS fix data
          const gpsData = this.parseGPGGA(line);
          if (gpsData) {
            this.emit('data', gpsData);
          }
        } else if (line.startsWith('$GPRMC')) {
          // Recommended minimum data
          const rmcData = this.parseGPRMC(line);
          if (rmcData) {
            this.emit('data', rmcData);
          }
        } else if (line.startsWith('$GPVTG')) {
          // Track made good and ground speed
          const vtgData = this.parseGPVTG(line);
          if (vtgData) {
            this.emit('data', vtgData);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing RaceBox data:', error);
    }
  }

  parseGPGGA(line) {
    // $GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47
    const parts = line.split(',');
    if (parts.length < 15) return null;
    
    const time = parts[1];
    const latitude = this.parseCoordinate(parts[2], parts[3]);
    const longitude = this.parseCoordinate(parts[4], parts[5]);
    const fixQuality = parseInt(parts[6]);
    const satellites = parseInt(parts[7]);
    const hdop = parseFloat(parts[8]);
    const altitude = parseFloat(parts[9]);
    const geoidHeight = parseFloat(parts[11]);
    
    return {
      type: 'gps',
      timestamp: Date.now(),
      time: time,
      latitude: latitude,
      longitude: longitude,
      fixQuality: fixQuality,
      satellites: satellites,
      hdop: hdop,
      altitude: altitude,
      geoidHeight: geoidHeight,
      accuracy: this.calculateAccuracy(hdop, satellites)
    };
  }

  parseGPRMC(line) {
    // $GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A
    const parts = line.split(',');
    if (parts.length < 12) return null;
    
    const time = parts[1];
    const status = parts[2];
    const latitude = this.parseCoordinate(parts[3], parts[4]);
    const longitude = this.parseCoordinate(parts[5], parts[6]);
    const speed = parseFloat(parts[7]) * 1.852; // Convert knots to km/h
    const heading = parseFloat(parts[8]);
    const date = parts[9];
    
    return {
      type: 'gps',
      timestamp: Date.now(),
      time: time,
      status: status,
      latitude: latitude,
      longitude: longitude,
      speed: speed,
      heading: heading,
      date: date
    };
  }

  parseGPVTG(line) {
    // $GPVTG,054.7,T,034.4,M,005.5,N,010.2,K*48
    const parts = line.split(',');
    if (parts.length < 9) return null;
    
    const trueHeading = parseFloat(parts[1]);
    const magneticHeading = parseFloat(parts[3]);
    const speedKnots = parseFloat(parts[5]);
    const speedKmh = parseFloat(parts[7]);
    
    return {
      type: 'gps',
      timestamp: Date.now(),
      trueHeading: trueHeading,
      magneticHeading: magneticHeading,
      speedKnots: speedKnots,
      speedKmh: speedKmh
    };
  }

  parseCoordinate(value, direction) {
    if (!value || !direction) return 0;
    
    const degrees = parseInt(value.substring(0, value.length - 7));
    const minutes = parseFloat(value.substring(value.length - 7));
    let coordinate = degrees + (minutes / 60);
    
    if (direction === 'S' || direction === 'W') {
      coordinate = -coordinate;
    }
    
    return coordinate;
  }

  calculateAccuracy(hdop, satellites) {
    if (satellites < 4) return 100; // Poor accuracy
    if (hdop < 1) return 1; // Excellent
    if (hdop < 2) return 2; // Good
    if (hdop < 5) return 5; // Fair
    return 10; // Poor
  }

  startDataCollection() {
    if (this.dataInterval) {
      clearInterval(this.dataInterval);
    }

    // RaceBox Mini sends data automatically, so we just monitor the connection
    this.dataInterval = setInterval(() => {
      if (!this.isConnected) {
        this.handleDisconnection();
      }
    }, 5000);
  }

  async getAvailableDevices() {
    try {
      const devices = await this.scanForDevices();
      return devices.map(device => ({
        id: device.id,
        name: device.name,
        address: device.address,
        rssi: device.rssi,
        type: 'racebox'
      }));
    } catch (error) {
      console.error('Error scanning for RaceBox devices:', error);
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

    if (this.device) {
      bluetooth.disconnect(this.device.id);
      this.device = null;
    }

    this.currentDevice = null;
    this.emit('disconnected');
  }

  handleDisconnection() {
    this.isConnected = false;
    this.emit('disconnected');
    
    if (this.autoReconnect) {
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }

    this.reconnectInterval = setInterval(async () => {
      if (!this.isConnected && this.currentDevice) {
        console.log('Attempting to reconnect RaceBox Mini...');
        try {
          await this.connect(this.currentDevice);
        } catch (error) {
          console.error('RaceBox reconnection failed:', error);
        }
      }
    }, 5000);
  }

  enableAutoReconnect() {
    this.autoReconnect = true;
    console.log('RaceBox auto-reconnect enabled');
  }

  disableAutoReconnect() {
    this.autoReconnect = false;
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    console.log('RaceBox auto-reconnect disabled');
  }

  isConnected() {
    return this.isConnected;
  }

  getCurrentDevice() {
    return this.currentDevice;
  }
}

module.exports = RaceBoxService; 