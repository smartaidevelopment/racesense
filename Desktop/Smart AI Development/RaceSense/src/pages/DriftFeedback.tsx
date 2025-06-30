import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Play, 
  BarChart3, 
  Zap, 
  Trophy, 
  Clock,
  Star,
  MessageSquare,
  Lightbulb,
  BookOpen,
  Users,
  Award,
  Mic,
  MicOff,
  Volume2
} from "lucide-react";
import { useNotifications } from "@/components/RacingNotifications";
import { useVoiceAI } from "@/services/VoiceAIService";

const DriftFeedback: React.FC = () => {
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const { speak, isListening, startVoiceRecognition, stopVoiceRecognition } = useVoiceAI();
  const [isGuidedPracticeActive, setIsGuidedPracticeActive] = useState(false);
  const [isFocusTrainingActive, setIsFocusTrainingActive] = useState(false);

  const handleStartGuidedPractice = () => {
    console.log("Start Guided Practice button clicked");
    setIsGuidedPracticeActive(true);
    speak("Starting guided practice session. I'll be your AI coach throughout this session.");
    notify({
      type: "racing",
      title: "Guided Practice Started",
      message: "AI Coach is now monitoring your session. Follow the voice guidance for optimal performance.",
      duration: 5000
    });
    // Navigate to telemetry with guided practice mode
    navigate("/telemetry");
  };

  const handleFocusTrainingMode = () => {
    console.log("Focus Training Mode button clicked");
    setIsFocusTrainingActive(true);
    speak("Focus training mode activated. I'll concentrate on specific areas: cornering technique, braking points, and racing line optimization.");
    notify({
      type: "performance",
      title: "Focus Training Mode Activated",
      message: "AI Coach will focus on specific areas: cornering technique, braking points, and racing line optimization.",
      duration: 5000
    });
    // Navigate to advanced racing analysis with focus training
    navigate("/advanced-racing-analysis");
  };

  const handleViewFullReport = () => {
    console.log("View Full Report button clicked");
    speak("Generating comprehensive performance report. Analyzing your complete session data.");
    notify({
      type: "info",
      title: "Generating Full Report",
      message: "AI Coach is analyzing your complete performance data and generating a comprehensive report.",
      duration: 3000
    });
    // Navigate to session analysis for detailed report
    navigate("/session-analysis");
  };

  const aiInsights = [
    {
      category: "Cornering Technique",
      score: 85,
      feedback: "Excellent late apex technique on Turn 3. Consider earlier braking for Turn 5.",
      improvement: "+12%"
    },
    {
      category: "Racing Line",
      score: 78,
      feedback: "Good line consistency. Focus on track-out points for better exit speed.",
      improvement: "+8%"
    },
    {
      category: "Braking Points",
      score: 92,
      feedback: "Outstanding brake modulation. Your trail-braking is improving significantly.",
      improvement: "+15%"
    },
    {
      category: "Throttle Control",
      score: 81,
      feedback: "Smooth throttle application. Work on earlier power application on exits.",
      improvement: "+6%"
    }
  ];

  const coachingTips = [
    {
      tip: "Use the entire track width on corner exits for maximum speed",
      category: "Racing Line",
      priority: "High"
    },
    {
      tip: "Brake 10 meters later into Turn 2 for better lap times",
      category: "Braking",
      priority: "Medium"
    },
    {
      tip: "Maintain consistent steering input through high-speed corners",
      category: "Technique",
      priority: "High"
    },
    {
      tip: "Focus on smooth throttle application from apex to exit",
      category: "Throttle Control",
      priority: "Medium"
    }
  ];

  const recentAchievements = [
    {
      title: "Perfect Corner Entry",
      description: "Achieved optimal entry speed on Turn 1",
      icon: <Target className="h-4 w-4" />,
      color: "text-racing-green"
    },
    {
      title: "Consistent Lap Times",
      description: "5 consecutive laps within 0.5s variance",
      icon: <Clock className="h-4 w-4" />,
      color: "text-racing-blue"
    },
    {
      title: "Personal Best",
      description: "New fastest lap: 1:23.456",
      icon: <Trophy className="h-4 w-4" />,
      color: "text-racing-yellow"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-racing-orange/20 rounded-full">
            <Brain className="h-8 w-8 text-racing-orange" />
          </div>
          <h1 className="text-4xl font-bold text-white">AI Coach</h1>
        </div>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Your personal AI racing coach. Get real-time feedback, guided practice sessions, 
          and comprehensive performance analysis to improve your driving skills.
        </p>
      </div>

      {/* Voice Control Integration */}
      <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-300">
            <Mic className="h-5 w-5" />
            Voice Coaching
          </CardTitle>
          <CardDescription className="text-purple-200/70">
            Enable hands-free AI coaching with voice commands
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-purple-200">Voice Control</p>
              <p className="text-sm text-purple-200/70">
                {isListening ? 'Active - Listening for commands' : 'Inactive - Click to enable'}
              </p>
            </div>
            <Button
              onClick={() => {
                if (isListening) {
                  stopVoiceRecognition();
                  notify({
                    type: "info",
                    title: "Voice Coaching Deactivated",
                    message: "Voice recognition has been stopped",
                    duration: 2000
                  });
                } else {
                  startVoiceRecognition();
                  speak("Voice coaching activated. Say hey racesense followed by coaching commands like corner advice, braking advice, or line advice.");
                  notify({
                    type: "success",
                    title: "Voice Coaching Activated",
                    message: "Try saying 'hey racesense corner advice' for instant feedback",
                    duration: 3000
                  });
                }
              }}
              variant={isListening ? "destructive" : "default"}
              className={isListening ? "bg-red-600 hover:bg-red-700" : "bg-purple-600 hover:bg-purple-700"}
            >
              {isListening ? (
                <>
                  <MicOff className="mr-2 h-4 w-4" />
                  Stop Voice
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Start Voice
                </>
              )}
            </Button>
          </div>

          {isListening && (
            <div className="p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <p className="text-sm text-purple-200 font-medium mb-2">Available Voice Commands:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-purple-200/80">
                <div>• "hey racesense corner advice"</div>
                <div>• "hey racesense braking advice"</div>
                <div>• "hey racesense line advice"</div>
                <div>• "hey racesense performance"</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="bg-gray-900/50 border-gray-700 hover:border-racing-orange/50 transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-racing-orange/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="h-8 w-8 text-racing-orange" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Start Guided Practice</h3>
            <p className="text-gray-400 mb-4">
              Begin a structured practice session with real-time AI coaching and voice guidance.
            </p>
            <Button 
              className="w-full bg-racing-orange hover:bg-racing-orange/80 text-white"
              onClick={handleStartGuidedPractice}
              disabled={isGuidedPracticeActive}
            >
              {isGuidedPracticeActive ? "Practice Active" : "Start Practice"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700 hover:border-racing-green/50 transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-racing-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-racing-green" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Focus Training Mode</h3>
            <p className="text-gray-400 mb-4">
              Concentrate on specific areas: cornering, braking, or racing line optimization.
            </p>
            <Button 
              className="w-full bg-racing-green hover:bg-racing-green/80 text-white"
              onClick={handleFocusTrainingMode}
              disabled={isFocusTrainingActive}
            >
              {isFocusTrainingActive ? "Training Active" : "Start Training"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700 hover:border-racing-blue/50 transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-racing-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-racing-blue" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">View Full Report</h3>
            <p className="text-gray-400 mb-4">
              Access comprehensive performance analysis and detailed improvement recommendations.
            </p>
            <Button 
              className="w-full bg-racing-blue hover:bg-racing-blue/80 text-white"
              onClick={handleViewFullReport}
            >
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Brain className="h-6 w-6 text-racing-orange" />
          AI Performance Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {aiInsights.map((insight, index) => (
            <Card key={index} className="bg-gray-900/50 border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">{insight.category}</CardTitle>
                  <Badge className="bg-racing-green text-white">
                    {insight.improvement}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Score</span>
                    <span className="text-white">{insight.score}/100</span>
                  </div>
                  <Progress value={insight.score} className="h-2" />
                </div>
                <p className="text-sm text-gray-300">{insight.feedback}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Coaching Tips */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-racing-yellow" />
          AI Coaching Tips
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coachingTips.map((tip, index) => (
            <Card key={index} className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-racing-yellow/20 rounded-lg">
                    <MessageSquare className="h-4 w-4 text-racing-yellow" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm mb-2">{tip.tip}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {tip.category}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          tip.priority === "High" 
                            ? "border-red-500 text-red-400" 
                            : "border-yellow-500 text-yellow-400"
                        }`}
                      >
                        {tip.priority} Priority
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Award className="h-6 w-6 text-racing-yellow" />
          Recent Achievements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentAchievements.map((achievement, index) => (
            <Card key={index} className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`${achievement.color}`}>
                    {achievement.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">{achievement.title}</h4>
                    <p className="text-gray-400 text-xs">{achievement.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-racing-orange">24</div>
            <div className="text-sm text-gray-400">Coaching Sessions</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-racing-green">+15%</div>
            <div className="text-sm text-gray-400">Performance Gain</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-racing-blue">156</div>
            <div className="text-sm text-gray-400">Tips Given</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-racing-yellow">8</div>
            <div className="text-sm text-gray-400">Achievements</div>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <Card className="bg-gradient-to-r from-racing-orange/20 to-racing-red/20 border-racing-orange/30">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Improve?</h3>
            <p className="text-gray-300 mb-6">
              Start your AI coaching session now and take your racing skills to the next level.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                className="bg-racing-orange hover:bg-racing-orange/80 text-white"
                onClick={handleStartGuidedPractice}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Guided Practice
              </Button>
              <Button 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                onClick={() => navigate("/telemetry")}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Live Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriftFeedback;
