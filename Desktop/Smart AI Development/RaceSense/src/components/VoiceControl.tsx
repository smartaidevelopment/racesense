import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  HelpCircle, 
  Command, 
  Zap,
  CheckCircle,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';
import { useVoiceAI, VoiceCommand } from '@/services/VoiceAIService';
import { useNotifications } from '@/components/RacingNotifications';

interface VoiceControlProps {
  className?: string;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({ className }) => {
  const {
    speak,
    startVoiceRecognition,
    stopVoiceRecognition,
    updateVoiceSettings,
    settings,
    commands,
    isSupported,
    isListening,
    isWakeWordActive
  } = useVoiceAI();

  const { notify } = useNotifications();
  const [activeTab, setActiveTab] = useState('control');
  const [customWakeWord, setCustomWakeWord] = useState(settings.wakeWord);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  const handleToggleVoiceControl = () => {
    if (isListening) {
      stopVoiceRecognition();
      notify({
        type: "info",
        title: "Voice Control Deactivated",
        message: "Voice recognition has been stopped",
        duration: 2000
      });
    } else {
      startVoiceRecognition();
    }
  };

  const handleWakeWordChange = () => {
    updateVoiceSettings({ wakeWord: customWakeWord });
    notify({
      type: "success",
      title: "Wake Word Updated",
      message: `Wake word changed to "${customWakeWord}"`,
      duration: 2000
    });
  };

  const handleVolumeChange = (value: number[]) => {
    updateVoiceSettings({ volume: value[0] });
  };

  const handleSpeedChange = (value: number[]) => {
    updateVoiceSettings({ speed: value[0] });
  };

  const handleTestVoice = () => {
    speak('Voice control is working perfectly! Ready for your commands.');
  };

  const handleQuickCommand = (command: VoiceCommand) => {
    speak(`Executing: ${command.description}`);
    command.action();
    setRecentCommands(prev => [command.command, ...prev.slice(0, 4)]);
  };

  const getCommandsByCategory = (category: string) => {
    return commands.filter(cmd => cmd.category === category);
  };

  const getStatusColor = () => {
    if (!isSupported) return 'text-red-500';
    if (isWakeWordActive) return 'text-green-500';
    if (isListening) return 'text-blue-500';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (!isSupported) return 'Not Supported';
    if (isWakeWordActive) return 'Listening for Command';
    if (isListening) return 'Voice Control Active';
    return 'Voice Control Inactive';
  };

  const getStatusIcon = () => {
    if (!isSupported) return <AlertCircle className="h-4 w-4" />;
    if (isWakeWordActive) return <CheckCircle className="h-4 w-4" />;
    if (isListening) return <Mic className="h-4 w-4" />;
    return <MicOff className="h-4 w-4" />;
  };

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-500 mb-4">
            <AlertCircle className="h-4 w-4" />
            <span>Voice recognition not supported in your browser</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Voice control requires a modern browser with speech recognition support. 
            Try using Chrome, Edge, or Safari.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Control
        </CardTitle>
        <CardDescription>
          Control RaceSense with voice commands and get AI coaching feedback
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="control">Control</TabsTrigger>
            <TabsTrigger value="commands">Commands</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="control" className="space-y-4">
            {/* Status Display */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <div className={getStatusColor()}>
                  {getStatusIcon()}
                </div>
                <span className="font-medium">{getStatusText()}</span>
              </div>
              <Badge variant={isListening ? "default" : "secondary"}>
                {isListening ? "Active" : "Inactive"}
              </Badge>
            </div>

            {/* Main Control */}
            <div className="flex flex-col gap-4">
              <Button
                onClick={handleToggleVoiceControl}
                variant={isListening ? "destructive" : "default"}
                size="lg"
                className="w-full"
              >
                {isListening ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4" />
                    Stop Voice Control
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Start Voice Control
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleTestVoice}
                  variant="outline"
                  size="sm"
                >
                  <Volume2 className="mr-2 h-4 w-4" />
                  Test Voice
                </Button>
                <Button
                  onClick={() => speak('Available commands: start session, end session, go home, telemetry, analysis, settings, lap time, speed, performance, corner advice, volume up, volume down, mute, unmute, and help.')}
                  variant="outline"
                  size="sm"
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  List Commands
                </Button>
              </div>
            </div>

            {/* Wake Word Display */}
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Wake Word</p>
              <p className="font-mono text-lg font-semibold text-primary">
                "{settings.wakeWord}"
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Say this phrase followed by your command
              </p>
            </div>

            {/* Recent Commands */}
            {recentCommands.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Recent Commands</h4>
                <div className="space-y-1">
                  {recentCommands.map((cmd, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Command className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono">{cmd}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="commands" className="space-y-4">
            <div className="grid gap-4">
              {/* Session Commands */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Session Control
                </h4>
                <div className="grid gap-2">
                  {getCommandsByCategory('session').map((cmd) => (
                    <Button
                      key={cmd.command}
                      onClick={() => handleQuickCommand(cmd)}
                      variant="outline"
                      size="sm"
                      className="justify-start"
                    >
                      <Command className="mr-2 h-3 w-3" />
                      {cmd.description}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Navigation Commands */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Navigation
                </h4>
                <div className="grid gap-2">
                  {getCommandsByCategory('navigation').map((cmd) => (
                    <Button
                      key={cmd.command}
                      onClick={() => handleQuickCommand(cmd)}
                      variant="outline"
                      size="sm"
                      className="justify-start"
                    >
                      <Command className="mr-2 h-3 w-3" />
                      {cmd.description}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Data Commands */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Data & Performance
                </h4>
                <div className="grid gap-2">
                  {getCommandsByCategory('data').map((cmd) => (
                    <Button
                      key={cmd.command}
                      onClick={() => handleQuickCommand(cmd)}
                      variant="outline"
                      size="sm"
                      className="justify-start"
                    >
                      <Command className="mr-2 h-3 w-3" />
                      {cmd.description}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Coaching Commands */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  AI Coaching
                </h4>
                <div className="grid gap-2">
                  {getCommandsByCategory('coaching').map((cmd) => (
                    <Button
                      key={cmd.command}
                      onClick={() => handleQuickCommand(cmd)}
                      variant="outline"
                      size="sm"
                      className="justify-start"
                    >
                      <Command className="mr-2 h-3 w-3" />
                      {cmd.description}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            {/* Wake Word Settings */}
            <div className="space-y-2">
              <Label htmlFor="wakeWord">Custom Wake Word</Label>
              <div className="flex gap-2">
                <Input
                  id="wakeWord"
                  value={customWakeWord}
                  onChange={(e) => setCustomWakeWord(e.target.value)}
                  placeholder="hey racesense"
                />
                <Button onClick={handleWakeWordChange} size="sm">
                  Update
                </Button>
              </div>
            </div>

            <Separator />

            {/* Voice Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="volume">Volume</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
              <Slider
                id="volume"
                value={[settings.volume]}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.1}
                className="w-full"
              />

              <div className="flex items-center justify-between">
                <Label htmlFor="speed">Speed</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.speed}x
                </span>
              </div>
              <Slider
                id="speed"
                value={[settings.speed]}
                onValueChange={handleSpeedChange}
                max={2}
                min={0.5}
                step={0.1}
                className="w-full"
              />
            </div>

            <Separator />

            {/* Toggle Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoSpeak">Auto Speak</Label>
                <Switch
                  id="autoSpeak"
                  checked={settings.autoSpeak}
                  onCheckedChange={(checked) => 
                    updateVoiceSettings({ autoSpeak: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="voiceControl">Voice Control</Label>
                <Switch
                  id="voiceControl"
                  checked={settings.voiceControlEnabled}
                  onCheckedChange={(checked) => 
                    updateVoiceSettings({ voiceControlEnabled: checked })
                  }
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 