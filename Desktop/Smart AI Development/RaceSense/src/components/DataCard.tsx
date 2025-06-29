import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface DataCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  className?: string;
  children?: ReactNode;
  trend?: "up" | "down" | "neutral";
  color?: "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "default";
}

export function DataCard({
  label,
  value,
  unit,
  icon: Icon,
  className,
  children,
  trend,
  color = "default",
}: DataCardProps) {
  const colorVariants = {
    red: "border-racing-red/30 bg-racing-red/5",
    orange: "border-racing-orange/30 bg-racing-orange/5",
    yellow: "border-racing-yellow/30 bg-racing-yellow/5",
    green: "border-racing-green/30 bg-racing-green/5",
    blue: "border-racing-blue/30 bg-racing-blue/5",
    purple: "border-racing-purple/30 bg-racing-purple/5",
    default: "border-border/50 bg-card/80",
  };

  const iconColors = {
    red: "text-racing-red",
    orange: "text-racing-orange",
    yellow: "text-racing-yellow",
    green: "text-racing-green",
    blue: "text-racing-blue",
    purple: "text-racing-purple",
    default: "text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "data-card backdrop-blur-sm border rounded-lg p-4 relative overflow-hidden transition-all duration-300 hover:scale-105 group",
        colorVariants[color],
        className,
      )}
    >
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent animate-speed-lines" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          {Icon && <Icon className={cn("h-4 w-4", iconColors[color])} />}
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          {unit && (
            <span className="text-sm text-muted-foreground">{unit}</span>
          )}
        </div>

        {trend && (
          <div className="mt-2 flex items-center gap-1">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                trend === "up" && "bg-racing-green",
                trend === "down" && "bg-racing-red",
                trend === "neutral" && "bg-racing-yellow",
              )}
            />
            <span className="text-xs text-muted-foreground">
              {trend === "up" && "Increasing"}
              {trend === "down" && "Decreasing"}
              {trend === "neutral" && "Stable"}
            </span>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
