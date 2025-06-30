import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Bluetooth, 
  Wifi, 
  Usb, 
  Gauge, 
  MapPin, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Play,
  Square,
  RefreshCw,
  Settings,
  Zap,
  Thermometer,
  Fuel,
  Battery
} from "lucide-react";
import { realHardwareService, VehicleData, GPSData, HardwareStatus } from "@/services/RealHardwareService";

export default function HardwareIntegration() {
  const [status, setStatus] = useState<HardwareStatus>({
    obdConnected: false,
    gpsConnected: false,
    bluetoothConnected: false,
    lastUpdate: Date.now()
  });
  
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [gpsData, setGpsData] = useState<GPSData | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [autoReconnect, setAutoReconnect] = useState(false);

  useEffect(() => {
    // Listen for hardware events
    realHardwareService.on('status', setStatus);
    realHardwareService.on('telemetry', (data: VehicleData | GPSData) => {
      if ('latitude' in data) {
        setGpsData(data as GPSData);
      } else {
        setVehicleData(data as VehicleData);
      }
    });

    return () => {
      realHardwareService.removeAllListeners();
    };
  }, []);

  const handleConnectAll = async () => {
    setIsConnecting(true);
    try {
      await realHardwareService.connectAll();
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    realHardwareService.disconnect();
  };

  const handleAutoReconnect = () => {
    if (autoReconnect) {
      realHardwareService.disableAutoReconnect();
      setAutoReconnect(false);
    } else {
      realHardwareService.enableAutoReconnect();
      setAutoReconnect(true);
    }
  };

  const getConnectionStatus = (connected: boolean) => {
    return connected ? (
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hardware Integration</h1>
          <p className="text-muted-foreground">
            Connect to real OBD-II, GPS, and Bluetooth devices for live telemetry
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleConnectAll}
            disabled={isConnecting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isConnecting ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isConnecting ? "Connecting..." : "Connect All"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDisconnect}
            disabled={!status.obdConnected && !status.gpsConnected && !status.bluetoothConnected}
          >
            <Square className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Usb className="w-5 h-5" />
              OBD-II Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getConnectionStatus(status.obdConnected)}
              <p className="text-sm text-muted-foreground">
                USB or Serial connection to vehicle OBD-II port
              </p>
              {status.error && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{status.error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              GPS Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getConnectionStatus(status.gpsConnected)}
              <p className="text-sm text-muted-foreground">
                Browser GPS or external GPS device
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Bluetooth className="w-5 h-5" />
              Bluetooth Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getConnectionStatus(status.bluetoothConnected)}
              <p className="text-sm text-muted-foreground">
                Wireless OBD-II adapter connection
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto Reconnect Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Auto Reconnect
          </CardTitle>
          <CardDescription>
            Automatically attempt to reconnect if connection is lost
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant={autoReconnect ? "default" : "outline"}
            onClick={handleAutoReconnect}
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoReconnect ? 'animate-spin' : ''}`} />
            {autoReconnect ? "Auto Reconnect Enabled" : "Enable Auto Reconnect"}
          </Button>
        </CardContent>
      </Card>

      {/* Live Data Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              Vehicle Telemetry
            </CardTitle>
            <CardDescription>
              Real-time vehicle data from OBD-II
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {vehicleData ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Speed</span>
                    </div>
                    <div className="text-2xl font-bold">{vehicleData.speed} km/h</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium">RPM</span>
                    </div>
                    <div className="text-2xl font-bold">{vehicleData.rpm.toFixed(0)}</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">Engine Temp</span>
                    </div>
                    <span className="font-medium">{vehicleData.engineTemp}°C</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Throttle</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={vehicleData.throttlePosition} className="w-20" />
                      <span className="font-medium">{vehicleData.throttlePosition.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Fuel Level</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={vehicleData.fuelLevel} className="w-20" />
                      <span className="font-medium">{vehicleData.fuelLevel.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Battery className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">Battery</span>
                    </div>
                    <span className="font-medium">{vehicleData.batteryVoltage.toFixed(1)}V</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Gauge className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No vehicle data available</p>
                <p className="text-sm">Connect to OBD-II device to see live telemetry</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* GPS Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              GPS Data
            </CardTitle>
            <CardDescription>
              Real-time location and movement data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {gpsData ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">GPS Speed</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {(gpsData.speed * 3.6).toFixed(1)} km/h
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Heading</span>
                    </div>
                    <div className="text-2xl font-bold">{gpsData.heading.toFixed(0)}°</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Latitude</span>
                    <span className="font-mono text-sm">{gpsData.latitude.toFixed(6)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Longitude</span>
                    <span className="font-mono text-sm">{gpsData.longitude.toFixed(6)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Altitude</span>
                    <span className="font-medium">{gpsData.altitude.toFixed(1)}m</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Accuracy</span>
                    <span className="font-medium">±{gpsData.accuracy.toFixed(1)}m</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Last update: {new Date(gpsData.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No GPS data available</p>
                <p className="text-sm">Enable GPS to see location data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Connection Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Instructions</CardTitle>
          <CardDescription>
            How to connect your hardware devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Usb className="w-4 h-4" />
                OBD-II USB
              </h4>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Plug OBD-II adapter into vehicle port</li>
                <li>2. Connect USB cable to computer</li>
                <li>3. Click "Connect All" button</li>
                <li>4. Select USB port when prompted</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Bluetooth className="w-4 h-4" />
                Bluetooth OBD-II
              </h4>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Turn on Bluetooth adapter</li>
                <li>2. Pair with your device</li>
                <li>3. Click "Connect All" button</li>
                <li>4. Select device from list</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                GPS Location
              </h4>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Allow location access in browser</li>
                <li>2. Ensure GPS is enabled</li>
                <li>3. Click "Connect All" button</li>
                <li>4. Wait for GPS signal</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 