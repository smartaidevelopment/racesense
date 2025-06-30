import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Upload, 
  BarChart3, 
  Settings, 
  Zap, 
  Trophy, 
  Target, 
  Smartphone,
  Users,
  MapPin,
  Gauge,
  TrendingUp,
  Mic
} from "lucide-react";
import { useNotifications } from "@/components/RacingNotifications";
import { useVoiceAI } from '@/services/VoiceAIService';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const { speak, isListening, startVoiceRecognition, stopVoiceRecognition } = useVoiceAI();

  const handleStartSession = () => {
    notify({
      type: "racing",
      title: "Starting Session",
      message: "Preparing your racing telemetry setup...",
      duration: 3000
    });
    navigate("/new-session");
  };

  const handleUploadSession = () => {
    notify({
      type: "info",
      title: "Upload Session",
      message: "Opening session upload interface...",
      duration: 3000
    });
    navigate("/data-management");
  };

  const quickActions = [
    {
      title: "Live Session",
      description: "Start real-time telemetry",
      icon: <Play className="h-6 w-6" />,
      action: () => navigate("/telemetry"),
      color: "bg-racing-orange",
      badge: "Popular"
    },
    {
      title: "Upload Data",
      description: "Import session files",
      icon: <Upload className="h-6 w-6" />,
      action: () => navigate("/data-management"),
      color: "bg-racing-blue"
    },
    {
      title: "Analysis",
      description: "Review past sessions",
      icon: <BarChart3 className="h-6 w-6" />,
      action: () => navigate("/analysis"),
      color: "bg-racing-green"
    },
    {
      title: "Settings",
      description: "Configure your setup",
      icon: <Settings className="h-6 w-6" />,
      action: () => navigate("/settings"),
      color: "bg-racing-purple"
    }
  ];

  const featuredModes = [
    {
      title: "AI Coach",
      description: "AI-powered coaching and analysis",
      icon: <Zap className="h-5 w-5" />,
      route: "/drift-feedback",
      color: "racing-orange"
    },
    {
      title: "Time Attack",
      description: "Push for fastest laps",
      icon: <Trophy className="h-5 w-5" />,
      route: "/telemetry",
      color: "racing-red"
    },
    {
      title: "Precision Mode",
      description: "Perfect your racing line",
      icon: <Target className="h-5 w-5" />,
      route: "/advanced-analysis",
      color: "racing-green"
    },
    {
      title: "Mobile Racing",
      description: "On-the-go telemetry",
      icon: <Smartphone className="h-5 w-5" />,
      route: "/mobile-racing",
      color: "racing-blue"
    }
  ];

  const stats = [
    { label: "Active Sessions", value: "12", icon: <Gauge className="h-4 w-4" /> },
    { label: "Total Laps", value: "1,247", icon: <MapPin className="h-4 w-4" /> },
    { label: "Best Time", value: "1:23.456", icon: <Trophy className="h-4 w-4" /> },
    { label: "Improvement", value: "+2.3s", icon: <TrendingUp className="h-4 w-4" /> }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4">
          Welcome to <span className="text-racing-orange">RaceSense</span>
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Professional racing telemetry and analysis platform. Track your performance, 
          analyze your sessions, and push your limits with precision data.
        </p>
        
        <div className="flex gap-4 justify-center mb-8">
          <Button 
            size="lg" 
            className="bg-racing-orange hover:bg-racing-orange/80 text-white px-8 py-3 text-lg"
            onClick={handleStartSession}
          >
            <Play className="h-5 w-5 mr-2" />
            Start Live Session
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-3 text-lg"
            onClick={handleUploadSession}
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload Session
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2 text-racing-orange">
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button
            onClick={() => navigate('/new-session')}
            className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-racing-red to-red-600 hover:from-red-600 hover:to-red-700 text-white"
          >
            <Play className="h-6 w-6" />
            <span className="font-semibold">Start Live Session</span>
          </Button>

          <Button
            onClick={() => navigate('/telemetry')}
            className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-racing-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            <Gauge className="h-6 w-6" />
            <span className="font-semibold">Live Telemetry</span>
          </Button>

          <Button
            onClick={() => navigate('/analysis')}
            className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-racing-green to-green-600 hover:from-green-600 hover:to-green-700 text-white"
          >
            <BarChart3 className="h-6 w-6" />
            <span className="font-semibold">Session Analysis</span>
          </Button>

          <Button
            onClick={() => {
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
                speak("Voice control activated. Say hey racesense followed by your command.");
              }
            }}
            className={`h-24 flex flex-col items-center justify-center gap-2 ${
              isListening 
                ? 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                : 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
            } text-white`}
          >
            {isListening ? (
              <>
                <Mic className="h-6 w-6 animate-pulse" />
                <span className="font-semibold">Voice Active</span>
              </>
            ) : (
              <>
                <Mic className="h-6 w-6" />
                <span className="font-semibold">Voice Control</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Featured Modes */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Featured Modes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredModes.map((mode, index) => (
            <Card 
              key={index} 
              className="bg-gray-900/50 border-gray-700 hover:border-racing-orange/50 transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(mode.route)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`text-${mode.color}`}>
                    {mode.icon}
                  </div>
                  <h3 className="font-semibold text-white">{mode.title}</h3>
                </div>
                <p className="text-sm text-gray-400">{mode.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-racing-green rounded-full"></div>
                  <span className="text-white">Session completed - Laguna Seca</span>
                </div>
                <span className="text-gray-400 text-sm">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-racing-orange rounded-full"></div>
                  <span className="text-white">New personal best - Turn 3</span>
                </div>
                <span className="text-gray-400 text-sm">1 day ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-racing-blue rounded-full"></div>
                  <span className="text-white">Hardware connected - RaceBox Mini</span>
                </div>
                <span className="text-gray-400 text-sm">3 days ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <Card className="bg-gradient-to-r from-racing-orange/20 to-racing-red/20 border-racing-orange/30">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Race?</h3>
            <p className="text-gray-300 mb-6">
              Connect your hardware, choose your mode, and start tracking your performance with professional-grade telemetry.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                className="bg-racing-orange hover:bg-racing-orange/80 text-white"
                onClick={() => navigate("/hardware")}
              >
                <Gauge className="h-4 w-4 mr-2" />
                Setup Hardware
              </Button>
              <Button 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                onClick={() => navigate("/new-session")}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
