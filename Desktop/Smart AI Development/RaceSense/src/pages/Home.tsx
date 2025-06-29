import { Layout } from "@/components/Layout";
import { RacingButton } from "@/components/RacingButton";
import { DataCard } from "@/components/DataCard";
import { Card } from "@/components/ui/card";
import { notify } from "@/components/RacingNotifications";
import {
  Upload,
  Play,
  Clock,
  Trophy,
  TrendingUp,
  Zap,
  Bell,
} from "lucide-react";

export default function Home() {
  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl modern-panel p-8 md:p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-racing-red/10 via-transparent to-racing-blue/10" />
          {/* Logo stuck to left border */}
          <div className="absolute -top-[18px] left-0 z-10">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F470759060b1c4b0b916b5f9ea82a1d3c%2Fcc591e09ecaf40208de8f7e8e6da8afd"
              alt="RaceSense Logo"
              className="h-36 object-contain pl-5 pb-5"
            />
          </div>
          <div className="relative z-10">
            <div className="flex justify-center mb-6"></div>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              Professional racing telemetry and performance analysis. Track
              every moment, improve every lap, master every turn.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <RacingButton
                variant="racing"
                racing="red"
                icon={Play}
                size="lg"
                glow
                className="text-lg px-8 py-4"
                onClick={() => {
                  notify.success(
                    "GPS Lap Timing Ready!",
                    "Live telemetry with automatic track detection and lap timing.",
                    {
                      actions: [
                        {
                          label: "Start Recording",
                          action: () => {
                            window.location.href = "/telemetry-dashboard";
                          },
                          style: "primary",
                        },
                        {
                          label: "Learn More",
                          action: () => {
                            notify.info(
                              "Real Racing Features",
                              "• GPS lap timing\n• Track auto-detection\n• Live telemetry\n• Sector analysis\n• Best lap tracking",
                              { duration: 8000 },
                            );
                          },
                        },
                      ],
                    },
                  );
                }}
              >
                Start Live Session
              </RacingButton>
              <RacingButton
                variant="outline"
                icon={Upload}
                size="lg"
                className="text-lg px-8 py-4 border-racing-blue/30 text-racing-blue hover:bg-racing-blue/10"
                onClick={() => {
                  notify.info(
                    "Upload Feature",
                    "Drag and drop your session files or browse to upload.",
                    { duration: 4000 },
                  );
                }}
              >
                Upload Session
              </RacingButton>
            </div>
          </div>

          {/* Animated speed lines */}
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-32 h-1 bg-gradient-to-r from-transparent to-racing-red opacity-30 animate-speed-lines" />
          <div
            className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-y-4 w-24 h-1 bg-gradient-to-r from-transparent to-racing-orange opacity-20 animate-speed-lines"
            style={{ animationDelay: "0.5s" }}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataCard
            label="Recent Sessions"
            value="12"
            icon={Clock}
            color="blue"
            trend="up"
          />
          <DataCard
            label="Best Lap Time"
            value="1:23.45"
            icon={Trophy}
            color="yellow"
            trend="down"
          />
          <DataCard
            label="Avg Performance"
            value="94.2"
            unit="%"
            icon={TrendingUp}
            color="green"
            trend="up"
          />
          <DataCard
            label="Total Distance"
            value="847.3"
            unit="km"
            icon={Zap}
            color="purple"
          />
        </div>

        {/* Recent Activity */}
        <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-racing-green" />
            Recent Activity
          </h2>

          <div className="space-y-4">
            {[
              {
                session: "Silverstone GP - Time Attack",
                date: "2 hours ago",
                performance: "+2.3s improvement",
                color: "green" as const,
              },
              {
                session: "Nürburgring - Drift Practice",
                date: "1 day ago",
                performance: "New drift record: 8,450 pts",
                color: "orange" as const,
              },
              {
                session: "Suzuka - Grip Track",
                date: "3 days ago",
                performance: "Consistent lap times",
                color: "blue" as const,
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full",
                      activity.color === "green" && "bg-racing-green",
                      activity.color === "orange" && "bg-racing-orange",
                      activity.color === "blue" && "bg-racing-blue",
                    )}
                  />
                  <div>
                    <p className="font-medium group-hover:text-racing-red transition-colors">
                      {activity.session}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{activity.performance}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Notification System Demo */}
        <Card className="p-6 bg-gradient-to-br from-racing-yellow/5 to-racing-orange/5 border-racing-yellow/20">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-racing-yellow" />
            Racing Notifications System
          </h2>
          <p className="text-muted-foreground mb-6">
            Professional racing-themed notifications with haptic feedback and
            racing colors.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <RacingButton
              variant="outline"
              size="sm"
              className="border-racing-green/30 text-racing-green hover:bg-racing-green/10"
              onClick={() =>
                notify.success("Lap Record!", "New personal best: 1:23.156s")
              }
            >
              Success
            </RacingButton>
            <RacingButton
              variant="outline"
              size="sm"
              className="border-racing-red/30 text-racing-red hover:bg-racing-red/10"
              onClick={() =>
                notify.error(
                  "Engine Warning",
                  "Oil temperature critical - 142°C",
                )
              }
            >
              Error
            </RacingButton>
            <RacingButton
              variant="outline"
              size="sm"
              className="border-racing-yellow/30 text-racing-yellow hover:bg-racing-yellow/10"
              onClick={() =>
                notify.warning(
                  "Tire Pressure",
                  "Front left: 1.8 bar (below optimal)",
                )
              }
            >
              Warning
            </RacingButton>
            <RacingButton
              variant="outline"
              size="sm"
              className="border-racing-blue/30 text-racing-blue hover:bg-racing-blue/10"
              onClick={() =>
                notify.info(
                  "Weather Update",
                  "Rain probability: 30% in 15 minutes",
                )
              }
            >
              Info
            </RacingButton>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-gradient-to-br from-racing-red/10 to-racing-orange/10 border-racing-red/20 hover:border-racing-red/40 transition-colors group">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-racing-red transition-colors">
              Performance Analysis
            </h3>
            <p className="text-muted-foreground mb-4">
              Dive deep into your telemetry data and discover areas for
              improvement.
            </p>
            <RacingButton variant="racing" racing="red" size="sm">
              View Analysis
            </RacingButton>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-racing-blue/10 to-racing-purple/10 border-racing-blue/20 hover:border-racing-blue/40 transition-colors group">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-racing-blue transition-colors">
              AI Coach Feedback
            </h3>
            <p className="text-muted-foreground mb-4">
              Get personalized coaching tips based on your driving patterns.
            </p>
            <RacingButton variant="racing" racing="blue" size="sm">
              Get Feedback
            </RacingButton>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
