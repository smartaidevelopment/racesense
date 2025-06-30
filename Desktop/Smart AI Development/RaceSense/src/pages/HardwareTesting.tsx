import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Usb, 
  Bluetooth, 
  MapPin, 
  Play, 
  Square, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info,
  Wifi,
  Gauge,
  Activity,
  Thermometer,
  Fuel,
  Battery,
  Zap,
  Clock,
  RefreshCw
} from "lucide-react";
import { realHardwareService, VehicleData, GPSData, HardwareStatus } from "@/services/RealHardwareService";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function HardwareTesting() {
  const [status, setStatus] = useState<HardwareStatus>({
    obdConnected: false,
    gpsConnected: false,
    bluetoothConnected: false,
    lastUpdate: Date.now()
  });
  
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [gpsData, setGpsData] = useState<GPSData | null>(null);
  const [testResults, setTestResults] = useState<any>({});
  const [isTesting, setIsTesting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Listen for hardware events
    realHardwareService.on('status', (newStatus) => {
      setStatus(newStatus);
      addLog(`Status update: ${JSON.stringify(newStatus)}`);
    });
    
    realHardwareService.on('telemetry', (data: VehicleData | GPSData) => {
      if ('latitude' in data) {
        setGpsData(data as GPSData);
        addLog(`GPS data received: ${data.latitude}, ${data.longitude}`);
      } else {
        setVehicleData(data as VehicleData);
        addLog(`Vehicle data received: Speed ${data.speed} km/h, RPM ${data.rpm}`);
      }
    });

    realHardwareService.on('error', (error) => {
      addLog(`Error: ${error}`);
    });

    return () => {
      realHardwareService.removeAllListeners();
    };
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-49), `[${timestamp}] ${message}`]);
  };

  const testOBDConnection = async () => {
    setIsTesting(true);
    addLog("Testing OBD-II connection...");
    
    try {
      const result = await realHardwareService.connectOBD();
      setTestResults(prev => ({ ...prev, obd: result }));
      addLog(`OBD test result: ${result ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      addLog(`OBD test error: ${error}`);
      setTestResults(prev => ({ ...prev, obd: false }));
    } finally {
      setIsTesting(false);
    }
  };

  const testGPSConnection = async () => {
    setIsTesting(true);
    addLog("Testing GPS connection...");
    
    try {
      const result = await realHardwareService.connectGPS();
      setTestResults(prev => ({ ...prev, gps: result }));
      addLog(`GPS test result: ${result ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      addLog(`GPS test error: ${error}`);
      setTestResults(prev => ({ ...prev, gps: false }));
    } finally {
      setIsTesting(false);
    }
  };

  const testBluetoothConnection = async () => {
    setIsTesting(true);
    addLog("Testing Bluetooth connection...");
    
    try {
      const result = await realHardwareService.connectBluetooth();
      setTestResults(prev => ({ ...prev, bluetooth: result }));
      addLog(`Bluetooth test result: ${result ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      addLog(`Bluetooth test error: ${error}`);
      setTestResults(prev => ({ ...prev, bluetooth: false }));
    } finally {
      setIsTesting(false);
    }
  };

  const runAllTests = async () => {
    setIsTesting(true);
    addLog("Running all hardware tests...");
    
    await testOBDConnection();
    await testGPSConnection();
    await testBluetoothConnection();
    
    addLog("All tests completed");
    setIsTesting(false);
  };

  const disconnectAll = () => {
    realHardwareService.disconnect();
    addLog("All connections disconnected");
  };

  const getTestStatus = (testName: string) => {
    const result = testResults[testName];
    if (result === undefined) return 'pending';
    return result ? 'success' : 'failed';
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  // Helper: Animated status dot
  const StatusDot = ({ connected }: { connected: boolean }) => (
    <span
      className={cn(
        "inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle",
        connected
          ? "bg-green-500 animate-pulse"
          : "bg-red-500 animate-pulse-slow"
      )}
      aria-label={connected ? "Connected" : "Disconnected"}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hardware Testing</h1>
          <p className="text-muted-foreground">
            Test and validate hardware connections for OBD-II, GPS, and Bluetooth
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runAllTests}
            disabled={isTesting}
            className="bg-blue-600 hover:bg-blue-700"
            aria-label="Run all hardware tests"
          >
            {isTesting ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isTesting ? "Testing..." : "Run All Tests"}
          </Button>
          <Button
            variant="outline"
            onClick={disconnectAll}
            disabled={!status.obdConnected && !status.gpsConnected && !status.bluetoothConnected}
            aria-label="Disconnect all hardware"
          >
            <Square className="w-4 h-4 mr-2" />
            Disconnect All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tests">Connection Tests</TabsTrigger>
          <TabsTrigger value="data">Live Data</TabsTrigger>
          <TabsTrigger value="logs">Test Logs</TabsTrigger>
          <TabsTrigger value="help">Help & Troubleshooting</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* OBD-II Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Usb className="w-5 h-5" />
                  OBD-II Test
                </CardTitle>
                <CardDescription>Test USB/Serial OBD-II connection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">Connection Status:</span>
                  <span aria-live="polite" className="flex items-center gap-1">
                    <StatusDot connected={status.obdConnected} />
                    <Badge variant={status.obdConnected ? "default" : "secondary"}>
                      {getStatusIcon(status.obdConnected)}
                      {status.obdConnected ? "Connected" : "Disconnected"}
                    </Badge>
                    {!status.obdConnected && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-muted-foreground ml-1 cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <span>Check OBD-II adapter power and cable. Try reconnecting.</span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </span>
                  {!status.obdConnected && (
                    <Button
                      size="sm"
                      className="ml-2"
                      onClick={testOBDConnection}
                      disabled={isTesting}
                      aria-label="Connect OBD-II"
                    >
                      {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      Connect
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">Test Result:</span>
                  <Badge
                    variant={
                      getTestStatus('obd') === 'success' ? 'default' :
                      getTestStatus('obd') === 'failed' ? 'destructive' : 'secondary'
                    }
                  >
                    {getTestStatus('obd') === 'success' ? 'PASS' :
                      getTestStatus('obd') === 'failed' ? 'FAIL' : 'PENDING'}
                  </Badge>
                </div>
                <Button
                  onClick={testOBDConnection}
                  disabled={isTesting}
                  aria-label="Test OBD-II Connection"
                  className="mt-2"
                >
                  {isTesting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                  Test OBD-II
                </Button>
              </CardContent>
            </Card>

            {/* GPS Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  GPS Test
                </CardTitle>
                <CardDescription>
                  Test browser GPS location
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Connection Status:</span>
                  <Badge variant={status.gpsConnected ? "default" : "secondary"}>
                    {getStatusIcon(status.gpsConnected)}
                    {status.gpsConnected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Test Result:</span>
                  <Badge variant={
                    getTestStatus('gps') === 'success' ? 'default' :
                    getTestStatus('gps') === 'failed' ? 'destructive' : 'secondary'
                  }>
                    {getTestStatus('gps') === 'success' ? 'PASS' :
                     getTestStatus('gps') === 'failed' ? 'FAIL' : 'PENDING'}
                  </Badge>
                </div>

                <Button
                  onClick={testGPSConnection}
                  disabled={isTesting}
                  className="w-full"
                  variant="outline"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Test GPS
                </Button>
              </CardContent>
            </Card>

            {/* Bluetooth Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bluetooth className="w-5 h-5" />
                  Bluetooth Test
                </CardTitle>
                <CardDescription>Test Bluetooth OBD-II connection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">Connection Status:</span>
                  <span aria-live="polite" className="flex items-center gap-1">
                    <StatusDot connected={status.bluetoothConnected} />
                    <Badge variant={status.bluetoothConnected ? "default" : "secondary"}>
                      {getStatusIcon(status.bluetoothConnected)}
                      {status.bluetoothConnected ? "Connected" : "Disconnected"}
                    </Badge>
                    {!status.bluetoothConnected && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-muted-foreground ml-1 cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <span>Ensure Bluetooth is enabled and adapter is paired.</span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </span>
                  {!status.bluetoothConnected && (
                    <Button
                      size="sm"
                      className="ml-2"
                      onClick={testBluetoothConnection}
                      disabled={isTesting}
                      aria-label="Connect Bluetooth"
                    >
                      {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      Connect
                    </Button>
                  )}
                </div>
                {typeof navigator !== 'undefined' && !('bluetooth' in navigator) && (
                  <Alert variant="destructive" className="mb-2">
                    <AlertDescription>
                      <span>Your browser does not support the Web Bluetooth API. Please use Chrome or Edge on desktop.</span>
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">Test Result:</span>
                  <Badge
                    variant={
                      getTestStatus('bluetooth') === 'success' ? 'default' :
                      getTestStatus('bluetooth') === 'failed' ? 'destructive' : 'secondary'
                    }
                  >
                    {getTestStatus('bluetooth') === 'success' ? 'PASS' :
                      getTestStatus('bluetooth') === 'failed' ? 'FAIL' : 'PENDING'}
                  </Badge>
                </div>
                <Button
                  onClick={testBluetoothConnection}
                  disabled={isTesting}
                  aria-label="Test Bluetooth Connection"
                  className="mt-2"
                >
                  {isTesting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                  Test Bluetooth
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Browser Compatibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Browser Compatibility
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Web Serial API</h4>
                  <Badge variant={typeof navigator !== 'undefined' && 'serial' in navigator ? 'default' : 'destructive'}>
                    {typeof navigator !== 'undefined' && 'serial' in navigator ? 'Supported' : 'Not Supported'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Chrome 89+, Edge 89+
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Web Bluetooth API</h4>
                  <Badge variant={typeof navigator !== 'undefined' && 'bluetooth' in navigator ? 'default' : 'destructive'}>
                    {typeof navigator !== 'undefined' && 'bluetooth' in navigator ? 'Supported' : 'Not Supported'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Chrome 56+, Edge 79+
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Geolocation API</h4>
                  <Badge variant={typeof navigator !== 'undefined' && 'geolocation' in navigator ? 'default' : 'destructive'}>
                    {typeof navigator !== 'undefined' && 'geolocation' in navigator ? 'Supported' : 'Not Supported'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    All modern browsers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vehicle Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-5 h-5" />
                  Vehicle Telemetry
                </CardTitle>
                <CardDescription>
                  Real-time OBD-II data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {vehicleData ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-500">{vehicleData.speed}</div>
                        <div className="text-sm text-muted-foreground">Speed (km/h)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-500">{vehicleData.rpm.toFixed(0)}</div>
                        <div className="text-sm text-muted-foreground">RPM</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
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
                        <span className="font-medium">{vehicleData.throttlePosition.toFixed(1)}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Fuel className="w-4 h-4 text-green-500" />
                          <span className="text-sm">Fuel Level</span>
                        </div>
                        <span className="font-medium">{vehicleData.fuelLevel.toFixed(1)}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Battery className="w-4 h-4 text-purple-500" />
                          <span className="text-sm">Battery</span>
                        </div>
                        <span className="font-medium">{vehicleData.batteryVoltage.toFixed(1)}V</span>
                      </div>
                    </div>
                  </div>
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
                  Real-time location data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {gpsData ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-500">
                          {(gpsData.speed * 3.6).toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">GPS Speed (km/h)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">{gpsData.heading.toFixed(0)}°</div>
                        <div className="text-sm text-muted-foreground">Heading</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
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
                  </div>
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
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Logs</CardTitle>
              <CardDescription>
                Real-time logs from hardware testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground">No logs yet. Run tests to see activity.</p>
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
                <CardTitle>Troubleshooting Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">OBD-II Issues</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Ensure OBD-II adapter is properly connected</li>
                    <li>• Check if vehicle ignition is on</li>
                    <li>• Try different USB ports</li>
                    <li>• Update OBD-II adapter drivers</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">GPS Issues</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Allow location access in browser</li>
                    <li>• Ensure GPS is enabled on device</li>
                    <li>• Try outdoor location for better signal</li>
                    <li>• Check browser permissions</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Bluetooth Issues</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Ensure Bluetooth is enabled</li>
                    <li>• Pair adapter with device first</li>
                    <li>• Check adapter battery level</li>
                    <li>• Try re-pairing the device</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Browser Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    For best compatibility, use Chrome 89+ or Edge 89+ with HTTPS enabled.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Required Permissions</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Serial port access (for OBD-II)</li>
                    <li>• Bluetooth access (for wireless OBD-II)</li>
                    <li>• Location access (for GPS)</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">HTTPS Requirement</h4>
                  <p className="text-sm text-muted-foreground">
                    Web Serial and Web Bluetooth APIs require HTTPS in production. 
                    Local development (localhost) works without HTTPS.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 