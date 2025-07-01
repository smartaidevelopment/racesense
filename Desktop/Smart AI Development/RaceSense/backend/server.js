const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import hardware services
const OBDService = require('./services/OBDService');
const GPSService = require('./services/GPSService');
const BluetoothService = require('./services/BluetoothService');
const RaceBoxService = require('./services/RaceBoxService');
const DataLogger = require('./services/DataLogger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Initialize hardware services
const obdService = new OBDService();
const gpsService = new GPSService();
const bluetoothService = new BluetoothService();
const raceBoxService = new RaceBoxService();
const dataLogger = new DataLogger();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle hardware connection requests
  socket.on('connect-obd', async (data) => {
    try {
      const result = await obdService.connect(data.port || '/dev/tty.usbserial');
      socket.emit('obd-status', { connected: result, error: null });
      
      if (result) {
        // Start data streaming
        obdService.on('data', (vehicleData) => {
          socket.emit('vehicle-data', vehicleData);
          dataLogger.logVehicleData(vehicleData);
        });
      }
    } catch (error) {
      socket.emit('obd-status', { connected: false, error: error && error.message ? error.message : String(error) });
    }
  });

  // Allow client to abort/cancel a pending OBD connection
  socket.on('cancel-obd-connect', () => {
    obdService.abortConnect();
    socket.emit('obd-status', { connected: false, error: 'OBD connection aborted by user.' });
  });

  socket.on('connect-gps', async () => {
    try {
      const result = await gpsService.connect();
      socket.emit('gps-status', { connected: result, error: null });
      
      if (result) {
        gpsService.on('data', (gpsData) => {
          socket.emit('gps-data', gpsData);
          dataLogger.logGPSData(gpsData);
        });
      }
    } catch (error) {
      socket.emit('gps-status', { connected: false, error: error.message });
    }
  });

  socket.on('connect-bluetooth', async (data) => {
    try {
      const result = await bluetoothService.connect(data.deviceId);
      socket.emit('bluetooth-status', { connected: result, error: null });
      
      if (result) {
        bluetoothService.on('data', (bluetoothData) => {
          socket.emit('bluetooth-data', bluetoothData);
          dataLogger.logBluetoothData(bluetoothData);
        });
      }
    } catch (error) {
      socket.emit('bluetooth-status', { connected: false, error: error.message });
    }
  });

  socket.on('disconnect-hardware', () => {
    obdService.disconnect();
    gpsService.disconnect();
    bluetoothService.disconnect();
    socket.emit('hardware-disconnected');
  });

  socket.on('get-available-ports', async () => {
    try {
      const ports = await obdService.getAvailablePorts();
      socket.emit('available-ports', ports);
    } catch (error) {
      socket.emit('available-ports', []);
    }
  });

  socket.on('get-bluetooth-devices', async () => {
    try {
      const devices = await bluetoothService.getAvailableDevices();
      socket.emit('bluetooth-devices', devices);
    } catch (error) {
      socket.emit('bluetooth-devices', []);
    }
  });

  // RaceBox Mini specific events
  socket.on('connect-racebox', async (data) => {
    try {
      const result = await raceBoxService.connect(data.deviceId);
      socket.emit('racebox-status', { connected: result, error: null });
      
      if (result) {
        raceBoxService.on('data', (gpsData) => {
          socket.emit('racebox-data', gpsData);
          dataLogger.logGPSData(gpsData);
        });
      }
    } catch (error) {
      socket.emit('racebox-status', { connected: false, error: error.message });
    }
  });

  socket.on('get-racebox-devices', async () => {
    try {
      const devices = await raceBoxService.getAvailableDevices();
      socket.emit('racebox-devices', devices);
    } catch (error) {
      socket.emit('racebox-devices', []);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// REST API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      obd: obdService.isConnected(),
      gps: gpsService.isConnected(),
      bluetooth: bluetoothService.isConnected()
    }
  });
});

app.get('/api/hardware/status', (req, res) => {
  res.json({
    obd: {
      connected: obdService.isConnected(),
      port: obdService.getCurrentPort()
    },
    gps: {
      connected: gpsService.isConnected(),
      lastUpdate: gpsService.getLastUpdate()
    },
    bluetooth: {
      connected: bluetoothService.isConnected(),
      device: bluetoothService.getCurrentDevice()
    },
    racebox: {
      connected: raceBoxService.isConnected(),
      device: raceBoxService.getCurrentDevice()
    }
  });
});

app.post('/api/hardware/connect', async (req, res) => {
  try {
    const { type, config } = req.body;
    let result = false;

    switch (type) {
      case 'obd':
        result = await obdService.connect(config.port);
        break;
      case 'gps':
        result = await gpsService.connect();
        break;
      case 'bluetooth':
        result = await bluetoothService.connect(config.deviceId);
        break;
      case 'racebox':
        result = await raceBoxService.connect(config.deviceId);
        break;
      default:
        return res.status(400).json({ error: 'Invalid hardware type' });
    }

    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error && error.message ? error.message : String(error) });
  }
});

// REST endpoint to abort/cancel a pending OBD connection
app.post('/api/hardware/cancel-obd-connect', (req, res) => {
  try {
    obdService.abortConnect();
    res.json({ success: true, error: 'OBD connection aborted by user.' });
  } catch (error) {
    res.status(500).json({ error: error && error.message ? error.message : String(error) });
  }
});

app.post('/api/hardware/disconnect', async (req, res) => {
  try {
    const { type } = req.body;

    switch (type) {
      case 'obd':
        obdService.disconnect();
        res.json({ success: true, error: null });
        return;
      case 'gps':
        gpsService.disconnect();
        break;
      case 'bluetooth':
        bluetoothService.disconnect();
        break;
      case 'racebox':
        raceBoxService.disconnect();
        break;
      case 'all':
        obdService.disconnect();
        gpsService.disconnect();
        bluetoothService.disconnect();
        raceBoxService.disconnect();
        break;
      default:
        return res.status(400).json({ error: 'Invalid hardware type' });
    }

    res.json({ success: true, error: null });
  } catch (error) {
    res.status(500).json({ error: error && error.message ? error.message : String(error) });
  }
});

app.get('/api/data/export', async (req, res) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;
    const data = await dataLogger.exportData(format, startDate, endDate);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=racesense-data.csv');
    } else {
      res.setHeader('Content-Type', 'application/json');
    }
    
    res.send(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RaceBox specific endpoints
app.get('/api/racebox/devices', async (req, res) => {
  try {
    const devices = await raceBoxService.getAvailableDevices();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/racebox/connect', async (req, res) => {
  try {
    const { deviceId } = req.body;
    const result = await raceBoxService.connect(deviceId);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/racebox/disconnect', async (req, res) => {
  try {
    raceBoxService.disconnect();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- AI/ML Endpoints Scaffold ---
app.post('/api/ai/optimize-track', (req, res) => {
  res.json({ status: 'ok', input: req.body, message: 'Track optimization endpoint hit (scaffold).' });
});

app.post('/api/ai/predict-setup', (req, res) => {
  res.json({ status: 'ok', input: req.body, message: 'Setup prediction endpoint hit (scaffold).' });
});

app.post('/api/ai/computer-vision', (req, res) => {
  res.json({ status: 'ok', input: req.body, message: 'Computer vision analysis endpoint hit (scaffold).' });
});

app.post('/api/ai/real-time-strategy', (req, res) => {
  res.json({ status: 'ok', input: req.body, message: 'Real-time strategy endpoint hit (scaffold).' });
});

app.post('/api/ai/performance-prediction', (req, res) => {
  res.json({ status: 'ok', input: req.body, message: 'Performance prediction endpoint hit (scaffold).' });
});

app.post('/api/ai/coaching-recommendations', (req, res) => {
  res.json({ status: 'ok', input: req.body, message: 'Coaching recommendations endpoint hit (scaffold).' });
});

// --- AI Coach Endpoints ---
app.post('/api/ai/coach/insight', (req, res) => {
  // Return an array of AIInsight objects (mock)
  res.json([
    {
      id: `insight-${Date.now()}`,
      timestamp: Date.now(),
      type: "improvement",
      priority: "medium",
      title: "Mock Insight",
      description: "This is a mock AI insight for testing.",
      recommendation: "Try braking later in sector 2.",
      potentialTimeGain: 0.3,
      category: "braking",
      confidence: 0.8,
    },
  ]);
});

app.post('/api/ai/coach/analysis', (req, res) => {
  // Return a PerformanceAnalysis object (mock)
  res.json({
    sessionId: req.body.sessionId || `session-${Date.now()}`,
    lapCount: req.body.sessionLaps ? req.body.sessionLaps.length : 3,
    overallRating: 85,
    consistency: {
      rating: 80,
      lapTimeVariance: 0.5,
      sectorConsistency: [90, 85, 80],
    },
    racingLineEfficiency: {
      rating: 78,
      deviationMetrics: [2.1, 1.8, 2.5],
    },
    strengths: ["Good throttle control", "Consistent lap times"],
    improvementAreas: [
      {
        category: "Braking",
        impact: "medium",
        timeGain: 0.2,
        description: "Brake later in sector 2 for better lap times.",
      },
    ],
  });
});

app.post('/api/ai/coach/prediction', (req, res) => {
  // Return a PredictiveLapTime object (mock)
  res.json({
    sessionId: req.body.sessionId || `session-${Date.now()}`,
    predictedTime: 85.123,
    optimisticTime: 84.500,
    conservativeTime: 86.000,
    confidence: 92,
    factorsConsidered: {
      driverForm: 80,
      trackConditions: 85,
      vehicleSetup: 78,
      weatherImpact: 90,
      consistency: 0.02,
    },
    improvementPotential: 0.6,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 RaceSense Backend Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`🔧 Hardware services initialized`);
  console.log(`📊 Data logging enabled`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  obdService.disconnect();
  gpsService.disconnect();
  bluetoothService.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  obdService.disconnect();
  gpsService.disconnect();
  bluetoothService.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io }; 