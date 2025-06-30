# 🚗 RaceSense Hardware Integration Testing Guide

## 📋 Table of Contents
1. [Browser Testing](#browser-testing)
2. [Node.js Backend Setup](#nodejs-backend-setup)
3. [Hardware Requirements](#hardware-requirements)
4. [Troubleshooting](#troubleshooting)
5. [Advanced Features](#advanced-features)

---

## 🌐 Browser Testing

### Prerequisites
- **Chrome 89+** or **Edge 89+** (for Web Serial/Bluetooth APIs)
- **HTTPS** required for production (localhost works without HTTPS)
- **Hardware devices** (OBD-II adapter, GPS device, etc.)

### Step 1: Access the Testing Page
1. Open your browser and navigate to: `http://localhost:5173/hardware-testing`
2. You'll see the comprehensive testing interface with tabs for:
   - **Connection Tests**: Test individual hardware connections
   - **Live Data**: View real-time telemetry data
   - **Test Logs**: Monitor connection attempts and errors
   - **Help & Troubleshooting**: Get guidance for common issues

### Step 2: Test GPS Connection
1. Click the **"Test GPS"** button
2. Allow location access when prompted by your browser
3. Check the **Live Data** tab to see GPS coordinates
4. Verify accuracy and signal strength

### Step 3: Test OBD-II Connection (USB)
1. Connect your OBD-II adapter to your computer
2. Ensure your vehicle ignition is on (or engine running)
3. Click **"Test OBD-II"** button
4. Select the correct USB port when prompted
5. Check the **Live Data** tab for vehicle telemetry

### Step 4: Test Bluetooth Connection
1. Pair your Bluetooth OBD-II adapter with your computer
2. Click **"Test Bluetooth"** button
3. Select your device from the list
4. Monitor connection status and data flow

### Step 5: Run All Tests
1. Click **"Run All Tests"** to test all hardware simultaneously
2. Monitor the **Test Logs** tab for detailed feedback
3. Check browser compatibility indicators

---

## ⚙️ Node.js Backend Setup

### Prerequisites
- **Node.js 16+** installed
- **Administrator/sudo access** (for hardware permissions)
- **Hardware devices** connected

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment
Create a `.env` file in the backend directory:
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
LOG_LEVEL=debug
```

### Step 3: Start the Backend Server
```bash
npm run dev
```

You should see:
```
🚀 RaceSense Backend Server running on port 3001
📡 WebSocket server ready for connections
🔧 Hardware services initialized
📊 Data logging enabled
```

### Step 4: Test Backend API
```bash
# Health check
curl http://localhost:3001/api/health

# Hardware status
curl http://localhost:3001/api/hardware/status

# Available ports
curl http://localhost:3001/api/hardware/ports
```

### Step 5: Connect Frontend to Backend
Update your frontend to connect to the backend WebSocket:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to backend');
});

socket.on('vehicle-data', (data) => {
  console.log('Vehicle data:', data);
});
```

---

## 🔧 Hardware Requirements

### OBD-II Adapters
**USB Adapters:**
- ELM327 USB adapter
- OBDLink SX
- Any ELM327-compatible adapter

**Bluetooth Adapters:**
- ELM327 Bluetooth adapter
- OBDLink LX
- Vgate iCar Pro

### GPS Devices
**Built-in GPS:**
- Most modern laptops and tablets
- Smartphones (via browser)

**External GPS:**
- USB GPS receivers
- Bluetooth GPS modules
- Serial GPS devices

### System Requirements
- **Windows**: Windows 10+ with USB drivers
- **macOS**: 10.14+ with USB permissions
- **Linux**: Kernel 4.0+ with udev rules

---

## 🔍 Troubleshooting

### Common OBD-II Issues

**"No device found"**
- Check USB connection
- Install device drivers
- Try different USB ports
- Verify vehicle ignition is on

**"Communication error"**
- Check OBD-II port connection
- Verify adapter compatibility
- Try different baud rates
- Check vehicle OBD-II protocol

**"Permission denied"**
- Run as administrator (Windows)
- Use sudo (Linux/macOS)
- Check USB permissions
- Add user to dialout group (Linux)

### Common GPS Issues

**"Location access denied"**
- Allow location in browser settings
- Check system location permissions
- Enable GPS in device settings
- Try outdoor location

**"Poor accuracy"**
- Move to outdoor location
- Wait for GPS signal acquisition
- Check for interference
- Update GPS drivers

### Common Bluetooth Issues

**"Device not found"**
- Ensure Bluetooth is enabled
- Pair device first in system settings
- Check device battery level
- Try re-pairing

**"Connection failed"**
- Check device compatibility
- Verify PIN/passcode
- Restart Bluetooth service
- Update Bluetooth drivers

### Browser Compatibility Issues

**"Web Serial API not supported"**
- Use Chrome 89+ or Edge 89+
- Enable experimental features
- Check for HTTPS requirement
- Try different browser

**"Web Bluetooth API not supported"**
- Use Chrome 56+ or Edge 79+
- Enable Bluetooth permissions
- Check for HTTPS requirement
- Verify device compatibility

---

## 🚀 Advanced Features

### Data Logging
The backend automatically logs all telemetry data:
```bash
# Export data as JSON
curl "http://localhost:3001/api/data/export?format=json"

# Export data as CSV
curl "http://localhost:3001/api/data/export?format=csv"

# Export with date range
curl "http://localhost:3001/api/data/export?format=json&startDate=2024-01-01&endDate=2024-01-31"
```

### Auto-Reconnection
Enable automatic reconnection for lost connections:
```javascript
// Frontend
socket.emit('enable-auto-reconnect');

// Backend automatically handles reconnection
```

### Custom OBD Commands
Send custom OBD-II commands:
```javascript
// Frontend
socket.emit('send-obd-command', { command: '010D' });

// Backend
socket.on('obd-response', (response) => {
  console.log('OBD Response:', response);
});
```

### Real-time Data Streaming
Monitor real-time data with WebSocket events:
```javascript
socket.on('vehicle-data', (data) => {
  // Update UI with vehicle telemetry
  updateSpeedometer(data.speed);
  updateTachometer(data.rpm);
  updateTemperature(data.engineTemp);
});

socket.on('gps-data', (data) => {
  // Update map with GPS coordinates
  updateMapPosition(data.latitude, data.longitude);
});
```

---

## 📊 Performance Monitoring

### Data Rates
- **OBD-II**: 10Hz (100ms intervals)
- **GPS**: 1Hz (1 second intervals)
- **Bluetooth**: Variable based on device

### Memory Usage
- **Frontend**: ~50MB typical
- **Backend**: ~100MB with data logging
- **Database**: Grows with logged data

### Network Usage
- **WebSocket**: ~1KB/s per connection
- **HTTP API**: Minimal for status checks
- **Data Export**: Variable based on data size

---

## 🔒 Security Considerations

### HTTPS Requirements
- Web Serial/Bluetooth APIs require HTTPS in production
- Localhost development works without HTTPS
- Use Let's Encrypt for free SSL certificates

### Permission Management
- Only request necessary permissions
- Implement proper error handling
- Provide clear user feedback
- Respect user privacy choices

### Data Protection
- Encrypt sensitive data in transit
- Implement proper authentication
- Regular security updates
- Follow GDPR/privacy regulations

---

## 📞 Support

### Getting Help
1. Check the **Help & Troubleshooting** tab in the testing interface
2. Review browser console for error messages
3. Check backend logs for detailed error information
4. Verify hardware compatibility and connections

### Common Error Codes
- `EACCES`: Permission denied
- `ENOENT`: Device not found
- `ETIMEDOUT`: Connection timeout
- `ECONNREFUSED`: Connection refused

### Debug Mode
Enable debug logging:
```bash
# Backend
NODE_ENV=development LOG_LEVEL=debug npm run dev

# Frontend
# Check browser console for detailed logs
```

---

## 🎯 Next Steps

1. **Test all hardware connections** using the testing interface
2. **Set up the Node.js backend** for advanced features
3. **Configure data logging** for session analysis
4. **Implement real-time dashboards** with live telemetry
5. **Add custom OBD commands** for specific vehicle data
6. **Deploy to production** with proper security measures

For additional support or feature requests, please refer to the project documentation or create an issue in the repository. 