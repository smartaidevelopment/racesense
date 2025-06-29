import { Layout } from "@/components/Layout";
import { RacingButton } from "@/components/RacingButton";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Zap, Clock, Grip, Mountain } from "lucide-react";
import { Link } from "react-router-dom";

const modes = [
  {
    id: "drift",
    name: "Drift",
    description:
      "Master the art of controlled oversteer. Track angle, speed, and style points.",
    icon: Zap,
    color: "orange" as const,
    features: [
      "Angle measurement",
      "Style scoring",
      "Speed analysis",
      "Drift coaching",
    ],
    bg: "from-racing-orange/20 to-racing-red/20",
    border: "border-racing-orange/30",
  },
  {
    id: "time-attack",
    name: "Time Attack",
    description: "Push for the fastest lap times. Every millisecond counts.",
    icon: Clock,
    color: "red" as const,
    features: ["Lap timing", "Sector analysis", "Speed traps", "Racing lines"],
    bg: "from-racing-red/20 to-racing-purple/20",
    border: "border-racing-red/30",
  },
  {
    id: "grip-track",
    name: "Grip Track",
    description:
      "Focus on grip, traction, and optimal racing lines for maximum speed.",
    icon: Grip,
    color: "green" as const,
    features: [
      "Traction analysis",
      "G-force monitoring",
      "Cornering speed",
      "Tire performance",
    ],
    bg: "from-racing-green/20 to-racing-blue/20",
    border: "border-racing-green/30",
  },
  {
    id: "rally",
    name: "Rally",
    description:
      "Navigate varied terrain with precision. Adapt to changing conditions.",
    icon: Mountain,
    color: "blue" as const,
    features: [
      "Terrain adaptation",
      "Surface grip",
      "Jump analysis",
      "Route optimization",
    ],
    bg: "from-racing-blue/20 to-racing-purple/20",
    border: "border-racing-blue/30",
  },
];

export default function ModeSelection() {
  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/">
            <RacingButton variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </RacingButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold mb-2">Select Driving Mode</h1>
            <p className="text-muted-foreground">
              Choose your driving style to get tailored feedback and analysis
            </p>
          </div>
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modes.map((mode) => (
            <Card
              key={mode.id}
              className={`p-6 bg-gradient-to-br ${mode.bg} ${mode.border} border transition-all duration-300 hover:scale-105 hover:shadow-xl group cursor-pointer relative overflow-hidden`}
            >
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br from-racing-${mode.color} to-racing-${mode.color}/80 flex items-center justify-center shadow-lg`}
                  >
                    <mode.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold group-hover:text-racing-red transition-colors">
                      {mode.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {mode.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <h4 className="font-medium text-sm">Key Features:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {mode.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full bg-racing-${mode.color}`}
                        />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <RacingButton
                  variant="racing"
                  racing={mode.color}
                  className="w-full"
                  glow
                >
                  Start {mode.name} Session
                </RacingButton>
              </div>
            </Card>
          ))}
        </div>

        {/* Pro Tips */}
        <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-racing-yellow" />
            Pro Tips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">Before you start:</h3>
              <ul className="space-y-1">
                <li>• Ensure GPS signal is strong</li>
                <li>• Calibrate your sensors</li>
                <li>• Check track conditions</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">For best results:</h3>
              <ul className="space-y-1">
                <li>• Mount device securely</li>
                <li>• Enable voice coaching</li>
                <li>• Start recording before first turn</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
