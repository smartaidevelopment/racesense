import React from "react";
import { Layout } from "@/components/Layout";
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
} from "lucide-react";

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

class VehicleSetupPage extends React.Component<{}, VehicleSetupState> {
  private savedProfiles = [
    "Default Setup",
    "Silverstone Qualifying",
    "Nürburgring Race",
    "Suzuka Wet Weather",
    "Monza High Speed",
  ];

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
    };
  }

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
    console.log("Saving setup:", this.state.setup);
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

  render() {
    const { currentProfile, activeTab, setup } = this.state;

    return (
      <Layout>
        <div className="min-h-screen bg-racing-dark text-white">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <RacingButton
                  variant="outline"
                  size="sm"
                  className="border-border/50 hover:bg-card/50"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </RacingButton>
                <div className="flex items-center gap-3">
                  <Car className="h-8 w-8 text-racing-red" />
                  <div>
                    <h1 className="text-3xl font-bold text-racing-red">
                      Vehicle Setup
                    </h1>
                    <p className="text-muted-foreground">
                      Fine-tune your racing machine
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <RacingButton
                  variant="outline"
                  onClick={this.resetSetup}
                  className="border-border/50 hover:bg-card/50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </RacingButton>
                <RacingButton
                  onClick={this.saveSetup}
                  className="bg-racing-green hover:bg-racing-green/80"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Setup
                </RacingButton>
              </div>
            </div>

            {/* Profile Selection */}
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Wrench className="h-6 w-6 text-racing-yellow" />
                  <div>
                    <h3 className="text-xl font-semibold text-racing-yellow">
                      Setup Profile
                    </h3>
                    <p className="text-muted-foreground">
                      Load or save vehicle configurations
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile">Current Profile</Label>
                    <select
                      value={currentProfile}
                      onChange={(e) => this.handleProfileChange(e.target.value)}
                      className="px-3 py-2 bg-background/50 border border-border/50 rounded-md text-white min-w-[200px]"
                    >
                      {this.savedProfiles.map((profile) => (
                        <option key={profile} value={profile}>
                          {profile}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <RacingButton size="sm" variant="outline">
                      <Copy className="h-4 w-4" />
                    </RacingButton>
                    <RacingButton size="sm" variant="outline">
                      <Trash2 className="h-4 w-4" />
                    </RacingButton>
                  </div>
                </div>
              </div>
            </Card>

            {/* Setup Tabs */}
            <div className="space-y-6">
              {/* Tab Navigation */}
              <div className="grid w-full grid-cols-4 bg-card/50 rounded-lg p-1">
                {[
                  { id: "suspension", label: "🔧 Suspension" },
                  { id: "tires", label: "🛞 Tires" },
                  { id: "engine", label: "🏎 Engine" },
                  { id: "gearbox", label: "⚙️ Gearbox" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => this.handleTabChange(tab.id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-racing-orange text-white"
                        : "text-muted-foreground hover:text-white hover:bg-card/50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === "suspension" && (
                <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                  <h3 className="text-xl font-semibold text-racing-blue mb-6">
                    Suspension Setup
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Front Suspension */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-racing-blue">Front</h4>

                      <div className="space-y-2">
                        <Label>
                          Spring Rate: {setup.suspension.frontSpringRate} N/mm
                        </Label>
                        <input
                          type="range"
                          value={setup.suspension.frontSpringRate}
                          onChange={(e) =>
                            this.updateSetupValue(
                              ["suspension", "frontSpringRate"],
                              parseFloat(e.target.value),
                            )
                          }
                          min={5}
                          max={15}
                          step={0.1}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Damping: {setup.suspension.frontDamping}%</Label>
                        <input
                          type="range"
                          value={setup.suspension.frontDamping}
                          onChange={(e) =>
                            this.updateSetupValue(
                              ["suspension", "frontDamping"],
                              parseInt(e.target.value),
                            )
                          }
                          min={10}
                          max={100}
                          step={5}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Toe: {setup.suspension.frontToe}°</Label>
                        <input
                          type="range"
                          value={setup.suspension.frontToe}
                          onChange={(e) =>
                            this.updateSetupValue(
                              ["suspension", "frontToe"],
                              parseFloat(e.target.value),
                            )
                          }
                          min={-1}
                          max={1}
                          step={0.1}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Rear Suspension */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-racing-blue">Rear</h4>

                      <div className="space-y-2">
                        <Label>
                          Spring Rate: {setup.suspension.rearSpringRate} N/mm
                        </Label>
                        <input
                          type="range"
                          value={setup.suspension.rearSpringRate}
                          onChange={(e) =>
                            this.updateSetupValue(
                              ["suspension", "rearSpringRate"],
                              parseFloat(e.target.value),
                            )
                          }
                          min={5}
                          max={15}
                          step={0.1}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Damping: {setup.suspension.rearDamping}%</Label>
                        <input
                          type="range"
                          value={setup.suspension.rearDamping}
                          onChange={(e) =>
                            this.updateSetupValue(
                              ["suspension", "rearDamping"],
                              parseInt(e.target.value),
                            )
                          }
                          min={10}
                          max={100}
                          step={5}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Toe: {setup.suspension.rearToe}°</Label>
                        <input
                          type="range"
                          value={setup.suspension.rearToe}
                          onChange={(e) =>
                            this.updateSetupValue(
                              ["suspension", "rearToe"],
                              parseFloat(e.target.value),
                            )
                          }
                          min={-1}
                          max={1}
                          step={0.1}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
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
      </Layout>
    );
  }
}

export default function VehicleSetup() {
  return <VehicleSetupPage />;
}
