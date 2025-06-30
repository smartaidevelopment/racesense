import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Brain,
} from "lucide-react";
import VoiceAISettings from "@/components/VoiceAISettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VoiceControl } from '@/components/VoiceControl';
import VoiceTest from '@/components/VoiceTest';

interface SettingsState {
  voiceCoach: boolean;
  units: string;
  sensitivity: number[];
  autoSave: boolean;
  nightMode: boolean;
  notifications: boolean;
  driverName: string;
  language: string;
  activeTab: 'general' | 'voice' | 'hardware' | 'display';
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
      activeTab: 'general',
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

  setActiveTab = (tab: SettingsState['activeTab']) => {
    this.setState({ activeTab: tab });
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

  renderTabButton = (tab: SettingsState['activeTab'], label: string, icon: React.ReactNode) => {
    const isActive = this.state.activeTab === tab;
    return (
      <button
        onClick={() => this.setActiveTab(tab)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isActive 
            ? "bg-racing-orange text-white" 
            : "text-gray-300 hover:text-white hover:bg-gray-700"
        }`}
      >
        {icon}
        {label}
      </button>
    );
  };

  renderGeneralSettings = () => (
    <div className="space-y-6">
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
              value={this.state.driverName}
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
              this.state.units,
              (value) => this.setState({ units: value }),
              [
                { value: "km/h", label: "km/h" },
                { value: "mph", label: "mph" },
              ],
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">
              Language: English | Spanish | French
            </label>
            {this.renderCustomSelect(
              this.state.language,
              (value) => this.setState({ language: value }),
              [
                { value: "English", label: "English" },
                { value: "Spanish", label: "Spanish" },
                { value: "French", label: "French" },
              ],
            )}
          </div>
        </div>
      </Card>

      {/* General Settings */}
      <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-racing-blue" />
          General Settings
        </h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Auto-Save Sessions</label>
              <p className="text-xs text-muted-foreground">
                Automatically save session data
              </p>
            </div>
            {this.renderCustomSwitch(
              this.state.autoSave,
              (checked) => this.setState({ autoSave: checked })
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Night Mode</label>
              <p className="text-xs text-muted-foreground">
                Dark theme for better visibility
              </p>
            </div>
            {this.renderCustomSwitch(
              this.state.nightMode,
              (checked) => this.setState({ nightMode: checked })
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Notifications</label>
              <p className="text-xs text-muted-foreground">
                Receive performance alerts
              </p>
            </div>
            {this.renderCustomSwitch(
              this.state.notifications,
              (checked) => this.setState({ notifications: checked })
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">
              Sensor Sensitivity: {this.state.sensitivity[0]}%
            </label>
            {this.renderCustomSlider(
              this.state.sensitivity,
              (value) => this.setState({ sensitivity: value })
            )}
          </div>
        </div>
      </Card>
    </div>
  );

  render() {
    const { activeTab } = this.state;

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-racing-red mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Configure your RaceSense experience and voice AI preferences
          </p>
        </div>

        <Tabs defaultValue="voice-ai" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="voice-ai">Voice AI</TabsTrigger>
            <TabsTrigger value="voice-control">Voice Control</TabsTrigger>
            <TabsTrigger value="voice-test">Voice Test</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>

          <TabsContent value="voice-ai" className="space-y-6">
            <VoiceAISettings />
          </TabsContent>

          <TabsContent value="voice-control" className="space-y-6">
            <VoiceControl />
          </TabsContent>

          <TabsContent value="voice-test" className="space-y-6">
            <VoiceTest />
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure general application preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  General settings will be available here in future updates.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
}

export default function Settings() {
  return <SettingsPage />;
}
