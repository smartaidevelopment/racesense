import React from "react";
import { Layout } from "@/components/Layout";
import { RacingButton } from "@/components/RacingButton";
import { Card } from "@/components/ui/card";
// Radix UI components (Switch, Select, Slider) removed to prevent hook issues in class component
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Volume2,
  Gauge,
  Smartphone,
  Save,
  User,
} from "lucide-react";

interface SettingsState {
  voiceCoach: boolean;
  units: string;
  sensitivity: number[];
  autoSave: boolean;
  nightMode: boolean;
  notifications: boolean;
  driverName: string;
  language: string;
}

class SettingsPage extends React.Component<{}, SettingsState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      voiceCoach: true,
      units: "km/h",
      sensitivity: [75],
      autoSave: true,
      nightMode: false,
      notifications: true,
      driverName: "Driver",
      language: "English",
    };
  }

  handleNavigation = (path: string) => {
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  handleSaveChanges = () => {
    // In a real app, this would save to localStorage or API
    console.log("Settings saved:", this.state);
    // You could also show a toast notification here
  };

  // Custom Switch component replacement
  renderCustomSwitch = (
    checked: boolean,
    onChange: (checked: boolean) => void,
    disabled?: boolean,
  ) => {
    return (
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-racing-blue focus:ring-offset-2 ${
          checked ? "bg-racing-blue" : "bg-gray-600"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    );
  };

  // Custom Slider component replacement
  renderCustomSlider = (
    value: number[],
    onValueChange: (value: number[]) => void,
    min: number = 0,
    max: number = 100,
    step: number = 1,
  ) => {
    return (
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={(e) => onValueChange([parseInt(e.target.value)])}
        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((value[0] - min) / (max - min)) * 100}%, #4B5563 ${((value[0] - min) / (max - min)) * 100}%, #4B5563 100%)`,
        }}
      />
    );
  };

  // Custom Select component replacement
  renderCustomSelect = (
    value: string,
    onValueChange: (value: string) => void,
    options: { value: string; label: string }[],
    placeholder?: string,
  ) => {
    return (
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-racing-blue focus:border-racing-blue"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };

  render() {
    const {
      voiceCoach,
      units,
      sensitivity,
      autoSave,
      nightMode,
      notifications,
      driverName,
      language,
    } = this.state;

    return (
      <Layout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <RacingButton
                variant="outline"
                size="icon"
                onClick={() => this.handleNavigation("/")}
              >
                <ArrowLeft className="h-4 w-4" />
              </RacingButton>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <SettingsIcon className="h-8 w-8 text-racing-blue" />
                  Settings
                </h1>
                <p className="text-muted-foreground">
                  Customize your RaceSense experience
                </p>
              </div>
            </div>
            <RacingButton
              variant="racing"
              racing="green"
              icon={Save}
              onClick={this.handleSaveChanges}
            >
              Save Changes
            </RacingButton>
          </div>

          {/* Driver Profile */}
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-racing-green" />
              Driver Profile
            </h2>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Name: [editable field]
                </label>
                <Input
                  value={driverName}
                  onChange={(e) =>
                    this.setState({ driverName: e.target.value })
                  }
                  placeholder="Enter driver name"
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Preferred Units: km/h | mph
                </label>
                {this.renderCustomSelect(
                  units,
                  (value) => this.setState({ units: value }),
                  [
                    { value: "km/h", label: "km/h" },
                    { value: "mph", label: "mph" },
                  ],
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Language: English | Deutsch | Français
                </label>
                {this.renderCustomSelect(
                  language,
                  (value) => this.setState({ language: value }),
                  [
                    { value: "English", label: "English" },
                    { value: "Deutsch", label: "Deutsch" },
                    { value: "Français", label: "Français" },
                  ],
                )}
              </div>
            </div>
          </Card>

          {/* Current Settings Display */}
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="space-y-3 mb-6">
              <p className="text-lg">
                <span className="font-medium">Units:</span> {units}
              </p>
              <p className="text-lg">
                <span className="font-medium">Voice Coach:</span>{" "}
                {voiceCoach ? "On" : "Off"}
              </p>
            </div>
          </Card>

          {/* Audio Settings */}
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-racing-orange" />
              Audio & Voice
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Voice Coach</label>
                  <p className="text-sm text-muted-foreground">
                    Enable real-time voice feedback during sessions
                  </p>
                </div>
                {this.renderCustomSwitch(autoSave, (checked) =>
                  this.setState({ autoSave: checked }),
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Voice Volume</label>
                {this.renderCustomSlider(
                  sensitivity,
                  (value) => this.setState({ sensitivity: value }),
                  0,
                  100,
                  1,
                )}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Quiet</span>
                  <span>{sensitivity[0]}%</span>
                  <span>Loud</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">
                    Session Notifications
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about achievements and milestones
                  </p>
                </div>
                {this.renderCustomSwitch(voiceCoach, (checked) =>
                  this.setState({ voiceCoach: checked }),
                )}
              </div>
            </div>
          </Card>

          {/* Display Settings */}
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-racing-purple" />
              Display & Units
            </h2>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">Speed Units</label>
                {this.renderCustomSelect(
                  units,
                  (value) => this.setState({ units: value }),
                  [
                    { value: "km/h", label: "Kilometers per hour (km/h)" },
                    { value: "mph", label: "Miles per hour (mph)" },
                    { value: "m/s", label: "Meters per second (m/s)" },
                  ],
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Night Mode</label>
                  <p className="text-sm text-muted-foreground">
                    Optimize display for low-light conditions
                  </p>
                </div>
                {this.renderCustomSwitch(notifications, (checked) =>
                  this.setState({ notifications: checked }),
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Temperature Units</label>
                {this.renderCustomSelect("celsius", (value) => {}, [
                  { value: "celsius", label: "Celsius (°C)" },
                  { value: "fahrenheit", label: "Fahrenheit (°F)" },
                ])}
              </div>
            </div>
          </Card>

          {/* Performance Settings */}
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Gauge className="h-5 w-5 text-racing-red" />
              Performance & Data
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">
                    Auto-Save Sessions
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save session data when recording stops
                  </p>
                </div>
                {this.renderCustomSwitch(nightMode, (checked) =>
                  this.setState({ nightMode: checked }),
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">GPS Sensitivity</label>
                {this.renderCustomSelect("high", (value) => {}, [
                  { value: "low", label: "Low (Battery Saving)" },
                  { value: "medium", label: "Medium (Balanced)" },
                  { value: "high", label: "High (Maximum Accuracy)" },
                ])}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Data Recording Rate
                </label>
                {this.renderCustomSelect("10hz", (value) => {}, [
                  { value: "1hz", label: "1 Hz (Basic)" },
                  { value: "5hz", label: "5 Hz (Standard)" },
                  { value: "10hz", label: "10 Hz (High Detail)" },
                  { value: "20hz", label: "20 Hz (Professional)" },
                ])}
              </div>
            </div>
          </Card>

          {/* Advanced Settings */}
          <Card className="p-6 bg-gradient-to-br from-racing-dark/20 to-racing-red/20 border-racing-red/30">
            <h2 className="text-xl font-semibold mb-4 text-racing-red">
              Advanced Settings
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              These settings are for advanced users. Changing them may affect
              app performance.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RacingButton
                variant="outline"
                className="border-racing-orange/30 text-racing-orange hover:bg-racing-orange/10"
              >
                Calibrate Sensors
              </RacingButton>
              <RacingButton
                variant="outline"
                className="border-racing-blue/30 text-racing-blue hover:bg-racing-blue/10"
              >
                Export Data
              </RacingButton>
              <RacingButton
                variant="outline"
                className="border-racing-purple/30 text-racing-purple hover:bg-racing-purple/10"
              >
                Reset to Defaults
              </RacingButton>
              <RacingButton
                variant="outline"
                className="border-racing-yellow/30 text-racing-yellow hover:bg-racing-yellow/10"
              >
                Developer Mode
              </RacingButton>
            </div>
          </Card>

          {/* App Info */}
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="text-center space-y-2">
              <h3 className="font-semibold">RaceSense Pro</h3>
              <p className="text-sm text-muted-foreground">Version 2.1.0</p>
              <p className="text-xs text-muted-foreground">
                © 2024 RaceSense Technologies. All rights reserved.
              </p>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }
}

export default function Settings() {
  return <SettingsPage />;
}
