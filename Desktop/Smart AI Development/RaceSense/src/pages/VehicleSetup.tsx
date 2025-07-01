import React from "react";
import { RacingButton } from "@/components/RacingButton";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Wrench,
  Save,
  RotateCcw,
  Copy,
  Trash2,
  Car,
  Lock,
} from "lucide-react";
import { obdIntegrationService, LiveOBDData } from "@/services/OBDIntegrationService";

interface VehicleSetup {
  name: string;
  suspension: {
    frontSpringRate: number;
    rearSpringRate: number;
    frontDamping: number;
    rearDamping: number;
    frontToe: number;
    rearToe: number;
    ackerman: number;
    trackWidth: number;
  };
  tires: {
    frontType: string;
    rearType: string;
    frontLeftPressure: number;
    frontRightPressure: number;
    rearLeftPressure: number;
    rearRightPressure: number;
    frontCompound: string;
    rearCompound: string;
  };
  engine: {
    type: string;
    maxPower: number;
    maxTorque: number;
    peakRpm: number;
    redline: number;
  };
  gearbox: {
    type: string;
    gear1: number;
    gear2: number;
    gear3: number;
    gear4: number;
    gear5: number;
    gear6: number;
    finalDrive: number;
    differential: number;
  };
}

interface VehicleSetupState {
  currentProfile: string;
  activeTab: string;
  setup: VehicleSetup;
}

class VehicleSetupPage extends React.Component<{}, VehicleSetupState & { liveOBD: LiveOBDData | null, obdConnected: boolean, obdError: string | null, connecting: boolean, saveConfirmation?: boolean }> {
  private savedProfiles = [
    "Default Setup",
    "Silverstone Qualifying",
    "Nürburgring Race",
    "Suzuka Wet Weather",
    "Monza High Speed",
  ];

  private unsubscribeOBD?: () => void;
  private unsubscribeOBDConn?: () => void;
  private unsubscribeOBDErr?: () => void;

  constructor(props: {}) {
    super(props);
    this.state = {
      currentProfile: "Default Setup",
      activeTab: "suspension",
      setup: {
        name: "Default Setup",
        suspension: {
          frontSpringRate: 8.5,
          rearSpringRate: 9.2,
          frontDamping: 65,
          rearDamping: 70,
          frontToe: 0.2,
          rearToe: -0.1,
          ackerman: 15,
          trackWidth: 1850,
        },
        tires: {
          frontType: "Racing Slicks",
          rearType: "Racing Slicks",
          frontLeftPressure: 2.1,
          frontRightPressure: 2.1,
          rearLeftPressure: 2.0,
          rearRightPressure: 2.0,
          frontCompound: "Medium",
          rearCompound: "Medium",
        },
        engine: {
          type: "V8 Naturally Aspirated",
          maxPower: 485,
          maxTorque: 520,
          peakRpm: 7200,
          redline: 8500,
        },
        gearbox: {
          type: "Sequential 6-Speed",
          gear1: 3.45,
          gear2: 2.18,
          gear3: 1.64,
          gear4: 1.28,
          gear5: 1.05,
          gear6: 0.89,
          finalDrive: 3.73,
          differential: 15,
        },
      },
      liveOBD: null,
      obdConnected: obdIntegrationService.isDeviceConnected(),
      obdError: null,
      connecting: false,
      saveConfirmation: false,
    };
  }

  componentDidMount() {
    // Subscribe to OBD data
    this.unsubscribeOBD = obdIntegrationService.onDataUpdate((data) => {
      this.setState({ liveOBD: data });
      // Optionally update setup fields with live data
      this.updateSetupWithLiveOBD(data);
    });
    this.unsubscribeOBDConn = obdIntegrationService.onConnectionChange((connected) => {
      this.setState({ obdConnected: connected });
    });
    this.unsubscribeOBDErr = obdIntegrationService.onError((err) => {
      this.setState({ obdError: err });
    });
    // Set initial state if already connected
    if (obdIntegrationService.isDeviceConnected()) {
      const data = obdIntegrationService.getCurrentData();
      if (data) {
        this.setState({ liveOBD: data });
        this.updateSetupWithLiveOBD(data);
      }
    }
  }

  componentWillUnmount() {
    if (this.unsubscribeOBD) this.unsubscribeOBD();
    if (this.unsubscribeOBDConn) this.unsubscribeOBDConn();
    if (this.unsubscribeOBDErr) this.unsubscribeOBDErr();
  }

  private updateSetupWithLiveOBD = (data: LiveOBDData) => {
    // Map OBD data to setup fields (engine, gearbox, etc.)
    this.setState((prevState) => {
      const newSetup = { ...prevState.setup };
      // Engine
      if (typeof data.rpm === 'number') newSetup.engine.peakRpm = Math.round(data.rpm);
      if (typeof data.coolantTemp === 'number') newSetup.engine.maxPower = Math.round(400 + (data.coolantTemp - 80) * 2); // Example mapping
      if (typeof data.throttlePosition === 'number') newSetup.engine.maxTorque = Math.round(400 + data.throttlePosition);
      // Gearbox (not directly available, but could be inferred)
      // ...
      return { setup: newSetup };
    });
  };

  private handleProfileChange = (profile: string) => {
    this.setState({ currentProfile: profile });
  };

  private handleTabChange = (tab: string) => {
    this.setState({ activeTab: tab });
  };

  private updateSetupValue = (path: string[], value: any) => {
    this.setState((prevState) => {
      const newSetup = { ...prevState.setup };
      let current: any = newSetup;

      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }

      current[path[path.length - 1]] = value;
      return { setup: newSetup };
    });
  };

  private saveSetup = () => {
    const { setup, currentProfile } = this.state;
    // Save the current setup as a new profile if not already present
    if (!this.savedProfiles.includes(setup.name)) {
      this.savedProfiles.push(setup.name);
    }
    this.setState({
      currentProfile: setup.name,
      saveConfirmation: true,
    });
    setTimeout(() => this.setState({ saveConfirmation: false }), 2000);
  };

  private resetSetup = () => {
    this.setState({
      currentProfile: "Default Setup",
      setup: {
        ...this.state.setup,
        name: "Default Setup",
      },
    });
  };

  handleOBDConnect = async () => {
    this.setState({ connecting: true, obdError: null });
    try {
      await obdIntegrationService.connectBluetooth();
    } catch (err: any) {
      this.setState({ obdError: err.message || String(err) });
    } finally {
      this.setState({ connecting: false });
    }
  };

  handleOBDDisconnect = async () => {
    this.setState({ connecting: true, obdError: null });
    try {
      await obdIntegrationService.disconnect();
    } catch (err: any) {
      this.setState({ obdError: err.message || String(err) });
    } finally {
      this.setState({ connecting: false });
    }
  };

  renderLiveTelemetryPanel() {
    const { liveOBD, obdConnected } = this.state;
    if (!obdConnected || !liveOBD) return null;
    return (
      <Card className="mb-6 p-4 bg-card/80 border-green-700/40">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-bold text-green-400">Live Telemetry</span>
          <span className="text-xs text-green-300">(OBD Connected)</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div>Speed: <span className="font-mono">{liveOBD.speed?.toFixed(1) ?? "-"} km/h</span></div>
          <div>RPM: <span className="font-mono">{liveOBD.rpm?.toFixed(0) ?? "-"}</span></div>
          <div>Throttle: <span className="font-mono">{liveOBD.throttlePosition?.toFixed(1) ?? "-"} %</span></div>
          <div>Engine Load: <span className="font-mono">{liveOBD.engineLoad?.toFixed(1) ?? "-"} %</span></div>
          <div>Coolant Temp: <span className="font-mono">{liveOBD.coolantTemp?.toFixed(1) ?? "-"} °C</span></div>
          <div>Intake Air Temp: <span className="font-mono">{liveOBD.intakeAirTemp?.toFixed(1) ?? "-"} °C</span></div>
          <div>Fuel Level: <span className="font-mono">{liveOBD.fuelLevel?.toFixed(1) ?? "-"} %</span></div>
          <div>Voltage: <span className="font-mono">{liveOBD.voltage?.toFixed(2) ?? "-"} V</span></div>
          <div>Oil Temp: <span className="font-mono">{liveOBD.oilTemp?.toFixed(1) ?? "-"} °C</span></div>
          <div>Fuel Pressure: <span className="font-mono">{liveOBD.fuelPressure?.toFixed(1) ?? "-"} kPa</span></div>
          <div>Manifold Pressure: <span className="font-mono">{liveOBD.manifoldPressure?.toFixed(1) ?? "-"} kPa</span></div>
          <div>Boost: <span className="font-mono">{liveOBD.boost?.toFixed(1) ?? "-"} kPa</span></div>
        </div>
      </Card>
    );
  }

  render() {
    const { currentProfile, activeTab, setup, liveOBD, obdConnected, obdError, connecting, saveConfirmation } = this.state;

    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-racing-dark text-white">
        <div className="container mx-auto px-4 py-10 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <Car className="h-10 w-10 text-racing-red drop-shadow-lg" />
              <div>
                <h1 className="text-4xl font-extrabold text-racing-red tracking-tight drop-shadow-lg">
                  Vehicle Setup
                </h1>
                <p className="text-muted-foreground text-base mt-1">
                  Fine-tune your racing machine for peak performance
                </p>
                {obdConnected && (
                  <span className="ml-2 px-2 py-1 bg-green-700 text-xs rounded font-bold animate-pulse">Live</span>
                )}
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <RacingButton
                variant={obdConnected ? "destructive" : "default"}
                onClick={obdConnected ? this.handleOBDDisconnect : this.handleOBDConnect}
                disabled={connecting}
                className={obdConnected ? "bg-red-700 hover:bg-red-800" : "bg-green-700 hover:bg-green-800"}
              >
                {connecting ? (
                  <span>Connecting...</span>
                ) : (
                  <>{obdConnected ? "Disconnect OBD" : "Connect OBD"}</>
                )}
              </RacingButton>
              {obdError && <span className="text-xs text-red-400 ml-2">{obdError}</span>}
            </div>
          </div>

          {/* Live Telemetry Panel */}
          {this.renderLiveTelemetryPanel()}

          {/* Profile Selection */}
          <Card className="p-6 bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gray-700/60 mb-8 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Wrench className="h-6 w-6 text-racing-yellow" />
                <div>
                  <h3 className="text-xl font-semibold text-racing-yellow">Setup Profile</h3>
                  <p className="text-muted-foreground text-sm">Load or save vehicle configurations</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profile">Current Profile</Label>
                  <select
                    id="profile"
                    name="profile"
                    value={currentProfile}
                    onChange={(e) => this.handleProfileChange(e.target.value)}
                    className="px-3 py-2 bg-background/60 border border-border/50 rounded-md text-white min-w-[200px] focus:ring-2 focus:ring-racing-orange"
                  >
                    {this.savedProfiles.map((profile) => (
                      <option key={profile} value={profile}>
                        {profile}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <RacingButton size="sm" variant="default" title="Save Profile" onClick={this.saveSetup}>
                    <Save className="h-4 w-4" /> Save
                  </RacingButton>
                  <RacingButton size="sm" variant="outline" title="Copy Profile">
                    <Copy className="h-4 w-4" />
                  </RacingButton>
                  <RacingButton size="sm" variant="outline" title="Delete Profile">
                    <Trash2 className="h-4 w-4" />
                  </RacingButton>
                </div>
              </div>
            </div>
            {saveConfirmation && (
              <div className="mt-2 text-green-400 text-sm font-semibold">Profile saved!</div>
            )}
          </Card>

          {/* Setup Tabs */}
          <div className="space-y-8">
            {/* Tab Navigation */}
            <div className="flex w-full gap-2 bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-lg p-1 mb-2 shadow">
              {[
                { id: "suspension", label: "🔧 Suspension" },
                { id: "tires", label: "🛞 Tires" },
                { id: "engine", label: "🏎 Engine" },
                { id: "gearbox", label: "⚙️ Gearbox" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => this.handleTabChange(tab.id)}
                  className={`flex-1 px-4 py-2 rounded-md text-base font-semibold transition-colors duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-racing-orange
                    ${activeTab === tab.id
                      ? "bg-racing-orange text-white drop-shadow-lg"
                      : "text-muted-foreground hover:text-white hover:bg-gray-700/60"}
                  `}
                  aria-selected={activeTab === tab.id}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-gray-700/60 shadow-lg p-6">
              {activeTab === "suspension" && (
                <>
                  <h3 className="text-xl font-bold text-racing-blue mb-6 border-b border-gray-700 pb-2">Suspension Setup</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Front Suspension */}
                    <div className="space-y-6">
                      <h4 className="font-semibold text-racing-blue mb-2">Front</h4>
                      <div className="space-y-3">
                        <Label>Spring Rate: {setup.suspension.frontSpringRate} N/mm</Label>
                        <input
                          type="range"
                          value={setup.suspension.frontSpringRate}
                          onChange={(e) => this.updateSetupValue(["suspension", "frontSpringRate"], parseFloat(e.target.value))}
                          min={5}
                          max={15}
                          step={0.1}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-racing-blue"
                          disabled={obdConnected}
                        />
                        <Label>Damping: {setup.suspension.frontDamping}</Label>
                        <input
                          type="range"
                          value={setup.suspension.frontDamping}
                          onChange={(e) => this.updateSetupValue(["suspension", "frontDamping"], parseInt(e.target.value))}
                          min={40}
                          max={100}
                          step={1}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-racing-blue"
                          disabled={obdConnected}
                        />
                        <Label>Toe: {setup.suspension.frontToe}°</Label>
                        <input
                          type="range"
                          value={setup.suspension.frontToe}
                          onChange={(e) => this.updateSetupValue(["suspension", "frontToe"], parseFloat(e.target.value))}
                          min={-1}
                          max={1}
                          step={0.01}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-racing-blue"
                          disabled={obdConnected}
                        />
                        <Label>Ackerman: {setup.suspension.ackerman}°</Label>
                        <input
                          type="range"
                          value={setup.suspension.ackerman}
                          onChange={(e) => this.updateSetupValue(["suspension", "ackerman"], parseInt(e.target.value))}
                          min={0}
                          max={30}
                          step={1}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-racing-blue"
                          disabled={obdConnected}
                        />
                        <Label>Track Width: {setup.suspension.trackWidth} mm</Label>
                        <input
                          type="range"
                          value={setup.suspension.trackWidth}
                          onChange={(e) => this.updateSetupValue(["suspension", "trackWidth"], parseInt(e.target.value))}
                          min={1600}
                          max={2000}
                          step={1}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-racing-blue"
                          disabled={obdConnected}
                        />
                      </div>
                    </div>
                    {/* Rear Suspension */}
                    <div className="space-y-6">
                      <h4 className="font-semibold text-racing-blue mb-2">Rear</h4>
                      <div className="space-y-3">
                        <Label>Spring Rate: {setup.suspension.rearSpringRate} N/mm</Label>
                        <input
                          type="range"
                          value={setup.suspension.rearSpringRate}
                          onChange={(e) => this.updateSetupValue(["suspension", "rearSpringRate"], parseFloat(e.target.value))}
                          min={5}
                          max={15}
                          step={0.1}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-racing-blue"
                          disabled={obdConnected}
                        />
                        <Label>Damping: {setup.suspension.rearDamping}</Label>
                        <input
                          type="range"
                          value={setup.suspension.rearDamping}
                          onChange={(e) => this.updateSetupValue(["suspension", "rearDamping"], parseInt(e.target.value))}
                          min={40}
                          max={100}
                          step={1}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-racing-blue"
                          disabled={obdConnected}
                        />
                        <Label>Toe: {setup.suspension.rearToe}°</Label>
                        <input
                          type="range"
                          value={setup.suspension.rearToe}
                          onChange={(e) => this.updateSetupValue(["suspension", "rearToe"], parseFloat(e.target.value))}
                          min={-1}
                          max={1}
                          step={0.01}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-racing-blue"
                          disabled={obdConnected}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
              {activeTab === "tires" && (
                <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                  <h3 className="text-xl font-semibold text-racing-green mb-6">
                    Tire Configuration
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Front Tires */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-racing-green">
                        Front Tires
                      </h4>

                      <div className="space-y-2">
                        <Label>Tire Type</Label>
                        <select
                          value={setup.tires.frontType}
                          onChange={(e) =>
                            this.updateSetupValue(
                              ["tires", "frontType"],
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-md text-white"
                          disabled={obdConnected}
                        >
                          <option value="Racing Slicks">Racing Slicks</option>
                          <option value="Semi-Slicks">Semi-Slicks</option>
                          <option value="Street Tires">Street Tires</option>
                          <option value="Wet Weather">Wet Weather</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Compound</Label>
                        <select
                          value={setup.tires.frontCompound}
                          onChange={(e) =>
                            this.updateSetupValue(
                              ["tires", "frontCompound"],
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-md text-white"
                          disabled={obdConnected}
                        >
                          <option value="Soft">Soft</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>
                            Left Pressure: {setup.tires.frontLeftPressure} bar
                          </Label>
                          <input
                            type="range"
                            value={setup.tires.frontLeftPressure}
                            onChange={(e) =>
                              this.updateSetupValue(
                                ["tires", "frontLeftPressure"],
                                parseFloat(e.target.value),
                              )
                            }
                            min={1.5}
                            max={3.0}
                            step={0.1}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            disabled={obdConnected}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>
                            Right Pressure: {setup.tires.frontRightPressure} bar
                          </Label>
                          <input
                            type="range"
                            value={setup.tires.frontRightPressure}
                            onChange={(e) =>
                              this.updateSetupValue(
                                ["tires", "frontRightPressure"],
                                parseFloat(e.target.value),
                              )
                            }
                            min={1.5}
                            max={3.0}
                            step={0.1}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            disabled={obdConnected}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Rear Tires */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-racing-green">
                        Rear Tires
                      </h4>

                      <div className="space-y-2">
                        <Label>Tire Type</Label>
                        <select
                          value={setup.tires.rearType}
                          onChange={(e) =>
                            this.updateSetupValue(
                              ["tires", "rearType"],
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-md text-white"
                          disabled={obdConnected}
                        >
                          <option value="Racing Slicks">Racing Slicks</option>
                          <option value="Semi-Slicks">Semi-Slicks</option>
                          <option value="Street Tires">Street Tires</option>
                          <option value="Wet Weather">Wet Weather</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Compound</Label>
                        <select
                          value={setup.tires.rearCompound}
                          onChange={(e) =>
                            this.updateSetupValue(
                              ["tires", "rearCompound"],
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-md text-white"
                          disabled={obdConnected}
                        >
                          <option value="Soft">Soft</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>
                            Left Pressure: {setup.tires.rearLeftPressure} bar
                          </Label>
                          <input
                            type="range"
                            value={setup.tires.rearLeftPressure}
                            onChange={(e) =>
                              this.updateSetupValue(
                                ["tires", "rearLeftPressure"],
                                parseFloat(e.target.value),
                              )
                            }
                            min={1.5}
                            max={3.0}
                            step={0.1}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            disabled={obdConnected}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>
                            Right Pressure: {setup.tires.rearRightPressure} bar
                          </Label>
                          <input
                            type="range"
                            value={setup.tires.rearRightPressure}
                            onChange={(e) =>
                              this.updateSetupValue(
                                ["tires", "rearRightPressure"],
                                parseFloat(e.target.value),
                              )
                            }
                            min={1.5}
                            max={3.0}
                            step={0.1}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            disabled={obdConnected}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
              {activeTab === "engine" && (
                <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                  <h3 className="text-xl font-semibold text-racing-red mb-6">
                    Engine Configuration
                  </h3>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-racing-red">
                        Engine Type
                      </h4>
                      <select
                        value={setup.engine.type}
                        onChange={(e) =>
                          this.updateSetupValue(
                            ["engine", "type"],
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-md text-white"
                        disabled={obdConnected}
                      >
                        <option value="V8 Naturally Aspirated">
                          V8 Naturally Aspirated
                        </option>
                        <option value="V8 Turbo">V8 Turbo</option>
                        <option value="V6 Turbo">V6 Turbo</option>
                        <option value="V10 Naturally Aspirated">
                          V10 Naturally Aspirated
                        </option>
                        <option value="V12 Naturally Aspirated">
                          V12 Naturally Aspirated
                        </option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Max Power: {setup.engine.maxPower} HP</Label>
                        <input
                          type="range"
                          value={setup.engine.maxPower}
                          onChange={(e) =>
                            this.updateSetupValue(
                              ["engine", "maxPower"],
                              parseInt(e.target.value),
                            )
                          }
                          min={200}
                          max={800}
                          step={5}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          disabled={obdConnected}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Torque: {setup.engine.maxTorque} Nm</Label>
                        <input
                          type="range"
                          value={setup.engine.maxTorque}
                          onChange={(e) =>
                            this.updateSetupValue(
                              ["engine", "maxTorque"],
                              parseInt(e.target.value),
                            )
                          }
                          min={300}
                          max={900}
                          step={5}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          disabled={obdConnected}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )}
              {activeTab === "gearbox" && (
                <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                  <h3 className="text-xl font-semibold text-racing-yellow mb-6">
                    Gearbox Configuration
                  </h3>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-racing-yellow">
                        Gearbox Type
                      </h4>
                      <select
                        value={setup.gearbox.type}
                        onChange={(e) =>
                          this.updateSetupValue(
                            ["gearbox", "type"],
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-md text-white"
                        disabled={obdConnected}
                      >
                        <option value="Sequential 6-Speed">
                          Sequential 6-Speed
                        </option>
                        <option value="Manual 6-Speed">Manual 6-Speed</option>
                        <option value="Dual-Clutch">Dual-Clutch</option>
                        <option value="CVT">CVT</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((gear) => (
                        <div key={gear} className="space-y-2">
                          <Label>
                            Gear {gear}:{" "}
                            {
                              setup.gearbox[
                                `gear${gear}` as keyof typeof setup.gearbox
                              ]
                            }
                          </Label>
                          <input
                            type="range"
                            value={
                              setup.gearbox[
                                `gear${gear}` as keyof typeof setup.gearbox
                              ] as number
                            }
                            onChange={(e) =>
                              this.updateSetupValue(
                                ["gearbox", `gear${gear}`],
                                parseFloat(e.target.value),
                              )
                            }
                            min={0.5}
                            max={5}
                            step={0.01}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            disabled={obdConnected}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default function VehicleSetup() {
  return <VehicleSetupPage />;
}
