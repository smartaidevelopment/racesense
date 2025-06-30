import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bluetooth, 
  MapPin, 
  Play, 
  Square, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info,
  Gauge,
  Activity,
  Clock,
  RefreshCw,
  Settings,
  Zap,
  Satellite,
  Navigation,
  Target,
  Compass
} from "lucide-react";

interface RaceBoxData {
  type: 'gps';
  timestamp: number;
  time?: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  satellites?: number;
  hdop?: number;
  accuracy?: number;
  fixQuality?: number;
  status?: string;
  trueHeading?: number;
  magneticHeading?: number;
  speedKnots?: number;
  speedKmh?: number;
}

interface RaceBoxDevice {
  id: string;
  name: string;
  address: string;
  rssi: number;
  type: 'racebox';
}

export default function RaceBoxIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<RaceBoxDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsData, setGpsData] = useState<RaceBoxData | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Initialize WebSocket connection to backend
    const socket = new WebSocket('ws://localhost:3001');
    
    socket.onopen = () => {
      addLog('Connected to backend server');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'racebox-status':
          setIsConnected(data.connected);
          if (data.error) {
            setError(data.error);
            addLog(`Connection error: ${data.error}`);
          } else {
            setError(null);
            addLog('RaceBox connected successfully');
          }
          break;
          
        case 'racebox-devices':
          setAvailableDevices(data.devices);
          addLog(`Found ${data.devices.length} RaceBox devices`);
          break;
          
        case 'racebox-data':
          setGpsData(data.data);
          addLog(`GPS data received: ${data.data.latitude?.toFixed(6)}, ${data.data.longitude?.toFixed(6)}`);
          break;
      }
    };

    socket.onerror = (error) => {
      addLog(`WebSocket error: ${error}`);
    };

    socket.onclose = () => {
      addLog('Disconnected from backend server');
    };

    return () => {
      socket.close();
    };
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-49), `[${timestamp}] ${message}`]);
  };

  const scanForDevices = async () => {
    setIsScanning(true);
    addLog('Scanning for RaceBox Mini devices...');
    
    try {
      const response = await fetch('http://localhost:3001/api/racebox/devices');
      const devices = await response.json();
      setAvailableDevices(devices);
      addLog(`Found ${devices.length} RaceBox devices`);
    } catch (error) {
      addLog(`Scan error: ${error}`);
      setError('Failed to scan for devices');
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async (deviceId: string) => {
    setIsConnecting(true);
    setError(null);
    addLog(`Connecting to RaceBox Mini: ${deviceId}`);
    
    try {
      const response = await fetch('http://localhost:3001/api/racebox/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceId }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIsConnected(true);
        setCurrentDevice(deviceId);
        addLog('RaceBox Mini connected successfully');
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      addLog(`Connection error: ${error}`);
      setError('Failed to connect to RaceBox Mini');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await fetch('http://localhost:3001/api/racebox/disconnect', {
        method: 'POST',
      });
      
      setIsConnected(false);
      setCurrentDevice(null);
      setGpsData(null);
      addLog('RaceBox Mini disconnected');
    } catch (error) {
      addLog(`Disconnect error: ${error}`);
    }
  };

  const getConnectionStatus = () => {
    return isConnected ? (
      <Badge variant="default" className="bg-green-500">
        <CheckCircle className="w-3 h-3 mr-1" />
        Connected
      </Badge>
    ) : (
      <Badge variant="secondary">
        <XCircle className="w-3 h-3 mr-1" />
        Disconnected
      </Badge>
    );
  };

  const getFixQualityText = (quality: number) => {
    switch (quality) {
      case 0: return 'Invalid';
      case 1: return 'GPS Fix';
      case 2: return 'DGPS Fix';
      case 4: return 'RTK Fix';
      case 5: return 'Float RTK';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RaceBox Mini Integration</h1>
          <p className="text-muted-foreground">
            Connect to your RaceBox Mini GPS tracker (ID: 1221405318) for high-precision racing telemetry
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={scanForDevices}
            disabled={isScanning}
            variant="outline"
          >
            {isScanning ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Bluetooth className="w-4 h-4 mr-2" />
            )}
            {isScanning ? "Scanning..." : "Scan for Devices"}
          </Button>
          <Button
            onClick={disconnect}
            disabled={!isConnected}
            variant="outline"
          >
            <Square className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bluetooth className="w-5 h-5" />
            RaceBox Mini Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connection Status:</span>
              {getConnectionStatus()}
            </div>
            
            {currentDevice && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connected Device:</span>
                <span className="font-mono text-sm">{currentDevice}</span>
              </div>
            )}
            
            {error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Available Devices</TabsTrigger>
          <TabsTrigger value="data">GPS Data</TabsTrigger>
          <TabsTrigger value="logs">Connection Logs</TabsTrigger>
          <TabsTrigger value="help">Help & Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available RaceBox Devices</CardTitle>
              <CardDescription>
                Found {availableDevices.length} RaceBox Mini device(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableDevices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bluetooth className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No RaceBox devices found</p>
                  <p className="text-sm">Click "Scan for Devices" to search for your RaceBox Mini</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableDevices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{device.name}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {device.id}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Signal: {device.rssi} dBm
                        </div>
                      </div>
                      <Button
                        onClick={() => connectToDevice(device.id)}
                        disabled={isConnecting || isConnected}
                        size="sm"
                      >
                        {isConnecting && currentDevice === device.id ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 mr-2" />
                        )}
                        {isConnecting && currentDevice === device.id ? "Connecting..." : "Connect"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic GPS Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  GPS Coordinates
                </CardTitle>
                <CardDescription>
                  High-precision location data from RaceBox Mini
                </CardDescription>
              </CardHeader>
              <CardContent>
                {gpsData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium">Latitude</span>
                        </div>
                        <div className="text-xl font-mono">{gpsData.latitude?.toFixed(6)}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium">Longitude</span>
                        </div>
                        <div className="text-xl font-mono">{gpsData.longitude?.toFixed(6)}</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Altitude</span>
                        <span className="font-medium">{gpsData.altitude?.toFixed(1)}m</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Speed</span>
                        <span className="font-medium">{gpsData.speed?.toFixed(1)} km/h</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Heading</span>
                        <span className="font-medium">{gpsData.heading?.toFixed(1)}°</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No GPS data available</p>
                    <p className="text-sm">Connect to RaceBox Mini to see live data</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Advanced GPS Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Satellite className="w-5 h-5" />
                  GPS Quality & Status
                </CardTitle>
                <CardDescription>
                  Signal quality and satellite information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {gpsData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Satellite className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium">Satellites</span>
                        </div>
                        <div className="text-2xl font-bold">{gpsData.satellites || 0}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium">HDOP</span>
                        </div>
                        <div className="text-2xl font-bold">{gpsData.hdop?.toFixed(1) || 0}</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Fix Quality</span>
                        <Badge variant="outline">
                          {getFixQualityText(gpsData.fixQuality || 0)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Accuracy</span>
                        <span className="font-medium">±{gpsData.accuracy?.toFixed(1) || 0}m</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Status</span>
                        <Badge variant={gpsData.status === 'A' ? "default" : "destructive"}>
                          {gpsData.status === 'A' ? 'Active' : 'Void'}
                        </Badge>
                      </div>
                      
                      {gpsData.time && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">GPS Time</span>
                          <span className="font-mono text-sm">{gpsData.time}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Satellite className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No quality data available</p>
                    <p className="text-sm">Connect to RaceBox Mini to see signal quality</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Logs</CardTitle>
              <CardDescription>
                Real-time logs from RaceBox Mini connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground">No logs yet. Connect to RaceBox Mini to see activity.</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>RaceBox Mini Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Device Information</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Device ID: 1221405318</li>
                    <li>• Bluetooth Low Energy (BLE)</li>
                    <li>• High-precision GPS</li>
                    <li>• 10Hz data rate</li>
                    <li>• ±0.5m accuracy</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Connection Steps</h4>
                  <ol className="text-sm space-y-1 text-muted-foreground">
                    <li>1. Power on your RaceBox Mini</li>
                    <li>2. Ensure Bluetooth is enabled</li>
                    <li>3. Click "Scan for Devices"</li>
                    <li>4. Select your RaceBox Mini from the list</li>
                    <li>5. Click "Connect" to establish connection</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Troubleshooting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Common Issues</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Device not found: Check if powered on</li>
                    <li>• Connection failed: Try re-pairing</li>
                    <li>• Poor signal: Move to outdoor location</li>
                    <li>• No GPS data: Wait for satellite lock</li>
                    <li>• Bluetooth error: Restart device</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Performance Tips</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Use outdoors for best GPS signal</li>
                    <li>• Keep device within 10m range</li>
                    <li>• Ensure clear line of sight to sky</li>
                    <li>• Wait 30-60 seconds for initial lock</li>
                    <li>• Check battery level regularly</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 