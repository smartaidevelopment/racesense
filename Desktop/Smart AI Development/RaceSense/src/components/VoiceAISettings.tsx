import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Play, 
  Settings, 
  Brain,
  User,
  Languages,
  Zap
} from "lucide-react";
import { useVoiceAI, VoiceOption, VoiceSettings } from "@/services/VoiceAIService";
import { useNotifications } from "@/components/RacingNotifications";

const VoiceAISettings: React.FC = () => {
  const { 
    speak, 
    startVoiceRecognition, 
    stopVoiceRecognition, 
    updateVoiceSettings,
    voiceOptions, 
    settings, 
    isSupported 
  } = useVoiceAI();

  const { notify } = useNotifications();
  const [isListening, setIsListening] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(settings.selectedVoice);
  const [showDebug, setShowDebug] = useState(false);

  // Debug logging
  console.log('VoiceAISettings - Available voices:', voiceOptions.length);
  console.log('VoiceAISettings - Voice options:', voiceOptions);
  console.log('VoiceAISettings - Selected voice:', selectedVoice);

  const handleVoiceChange = (voiceId: string) => {
    console.log('Changing voice to:', voiceId);
    setSelectedVoice(voiceId);
    updateVoiceSettings({ selectedVoice: voiceId });
    
    // Provide immediate feedback
    const selectedVoice = voiceOptions.find(v => v.id === voiceId);
    if (selectedVoice) {
      speak(`Voice changed to ${selectedVoice.name}. ${selectedVoice.sampleText}`);
      notify({
        type: "success",
        title: "Voice Changed",
        message: `Switched to ${selectedVoice.name}`,
        duration: 2000
      });
    }
  };

  const handleVolumeChange = (value: number[]) => {
    updateVoiceSettings({ volume: value[0] / 100 });
  };

  const handleSpeedChange = (value: number[]) => {
    updateVoiceSettings({ speed: value[0] / 100 });
  };

  const handlePitchChange = (value: number[]) => {
    updateVoiceSettings({ pitch: value[0] / 100 });
  };

  const handleToggleVoiceRecognition = () => {
    if (isListening) {
      stopVoiceRecognition();
      setIsListening(false);
    } else {
      startVoiceRecognition();
      setIsListening(true);
    }
  };

  const handleTestVoice = (voice: VoiceOption) => {
    // Temporarily set the voice for testing
    const originalVoice = settings.selectedVoice;
    updateVoiceSettings({ selectedVoice: voice.id });
    
    // Speak the sample text
    speak(voice.sampleText);
    
    // Restore the original voice after a short delay
    setTimeout(() => {
      updateVoiceSettings({ selectedVoice: originalVoice });
      setSelectedVoice(originalVoice);
    }, 2000);
  };

  const handleToggleAutoSpeak = (enabled: boolean) => {
    updateVoiceSettings({ autoSpeak: enabled });
  };

  const handleCoachingModeChange = (mode: string) => {
    updateVoiceSettings({ coachingMode: mode as VoiceSettings['coachingMode'] });
  };

  const getCoachingModeDescription = (mode: string) => {
    switch (mode) {
      case 'aggressive':
        return 'High-energy, intense coaching for maximum performance';
      case 'encouraging':
        return 'Positive reinforcement and motivational feedback';
      case 'technical':
        return 'Data-driven, precise technical analysis';
      case 'calm':
        return 'Relaxed, focused guidance for steady improvement';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Voice AI Status */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Brain className="h-5 w-5 text-racing-orange" />
            Voice AI Assistant
          </CardTitle>
          <CardDescription className="text-gray-300">
            Configure your AI racing coach voice and speech recognition settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge 
                variant={isSupported ? "default" : "destructive"}
                className={isSupported ? "bg-racing-green text-white" : "bg-red-600"}
              >
                {isSupported ? "Supported" : "Not Supported"}
              </Badge>
              <span className="text-sm text-gray-400">
                {isSupported ? "Voice recognition available" : "Voice recognition not available in this browser"}
              </span>
            </div>
            <Button
              onClick={handleToggleVoiceRecognition}
              disabled={!isSupported}
              className={`${
                isListening 
                  ? "bg-red-600 hover:bg-red-700" 
                  : "bg-racing-orange hover:bg-racing-orange/80"
              } text-white`}
            >
              {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
              {isListening ? "Stop Listening" : "Start Listening"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voice Selection */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Voice Selection</CardTitle>
              <CardDescription className="text-gray-300">
                Choose your preferred AI coach voice. The actual voice depends on your browser and system settings.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-gray-300 border-gray-600">
              {voiceOptions.length} voices available
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {voiceOptions.map((voice) => (
              <Card 
                key={voice.id} 
                className={`border transition-all duration-200 cursor-pointer ${
                  selectedVoice === voice.id 
                    ? "border-racing-orange bg-racing-orange/10" 
                    : "border-gray-700 hover:border-gray-600"
                }`}
                onClick={() => handleVoiceChange(voice.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-white">{voice.name}</h4>
                      <p className="text-sm text-gray-400">{voice.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestVoice(voice);
                      }}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 italic">"{voice.sampleText}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voice Settings */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Voice Settings</CardTitle>
          <CardDescription className="text-gray-300">
            Adjust voice parameters and coaching behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Volume Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Volume
              </label>
              <span className="text-sm text-gray-400">{Math.round(settings.volume * 100)}%</span>
            </div>
            <Slider
              value={[settings.volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Speed Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white">Speech Speed</label>
              <span className="text-sm text-gray-400">{Math.round(settings.speed * 100)}%</span>
            </div>
            <Slider
              value={[settings.speed * 100]}
              onValueChange={handleSpeedChange}
              max={200}
              step={5}
              className="w-full"
            />
          </div>

          {/* Pitch Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white">Pitch</label>
              <span className="text-sm text-gray-400">{Math.round(settings.pitch * 100)}%</span>
            </div>
            <Slider
              value={[settings.pitch * 100]}
              onValueChange={handlePitchChange}
              max={200}
              step={5}
              className="w-full"
            />
          </div>

          {/* Auto Speak Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-white">Auto-Speak Feedback</label>
              <p className="text-xs text-gray-400">Automatically speak coaching feedback during sessions</p>
            </div>
            <Switch
              checked={settings.autoSpeak}
              onCheckedChange={handleToggleAutoSpeak}
            />
          </div>

          {/* Coaching Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Coaching Mode</label>
            <Select value={settings.coachingMode} onValueChange={handleCoachingModeChange}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="aggressive" className="text-white hover:bg-gray-700">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-red-400" />
                    Aggressive
                  </div>
                </SelectItem>
                <SelectItem value="encouraging" className="text-white hover:bg-gray-700">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-400" />
                    Encouraging
                  </div>
                </SelectItem>
                <SelectItem value="technical" className="text-white hover:bg-gray-700">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-blue-400" />
                    Technical
                  </div>
                </SelectItem>
                <SelectItem value="calm" className="text-white hover:bg-gray-700">
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4 text-purple-400" />
                    Calm
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">
              {getCoachingModeDescription(settings.coachingMode)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Voice Commands Help */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Voice Commands</CardTitle>
          <CardDescription className="text-gray-300">
            Available voice commands for hands-free operation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-white">Session Control</h4>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• "Start session" - Begin practice</li>
                <li>• "End session" - Stop current session</li>
                <li>• "Pause" - Pause current activity</li>
                <li>• "Resume" - Continue paused activity</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-white">Information Requests</h4>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• "Lap time" - Get current lap time</li>
                <li>• "How fast" - Speed information</li>
                <li>• "Corner advice" - Cornering tips</li>
                <li>• "Help" - List available commands</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Section */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Voice Debug Info</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDebug(!showDebug)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              {showDebug ? "Hide" : "Show"} Debug
            </Button>
          </div>
          <CardDescription className="text-gray-300">
            Technical information for troubleshooting voice selection
          </CardDescription>
        </CardHeader>
        {showDebug && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-white">Current Settings</h4>
              <div className="text-sm text-gray-300 space-y-1">
                <p>Selected Voice ID: {settings.selectedVoice}</p>
                <p>Volume: {Math.round(settings.volume * 100)}%</p>
                <p>Speed: {Math.round(settings.speed * 100)}%</p>
                <p>Pitch: {Math.round(settings.pitch * 100)}%</p>
                <p>Auto Speak: {settings.autoSpeak ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-white">Available Browser Voices</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {typeof window !== 'undefined' && window.speechSynthesis ? (
                  window.speechSynthesis.getVoices().map((voice, index) => (
                    <div key={index} className="text-xs text-gray-400 p-2 bg-gray-800 rounded">
                      <p><strong>Name:</strong> {voice.name}</p>
                      <p><strong>Language:</strong> {voice.lang}</p>
                      <p><strong>Default:</strong> {voice.default ? "Yes" : "No"}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">Speech synthesis not available</p>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default VoiceAISettings; 