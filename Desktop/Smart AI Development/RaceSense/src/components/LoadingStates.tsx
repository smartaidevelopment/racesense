import React from "react";
import { Zap, Activity, Circle } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "red" | "orange" | "yellow" | "green" | "blue" | "purple";
  text?: string;
}

export function RacingSpinner({
  size = "md",
  color = "red",
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const colorClasses = {
    red: "text-racing-red",
    orange: "text-racing-orange",
    yellow: "text-racing-yellow",
    green: "text-racing-green",
    blue: "text-racing-blue",
    purple: "text-racing-purple",
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"
          />
        </svg>
      </div>
      {text && (
        <p className={`text-sm font-medium ${colorClasses[color]}`}>{text}</p>
      )}
    </div>
  );
}

interface LoadingBarProps {
  progress: number;
  color?: "red" | "orange" | "yellow" | "green" | "blue" | "purple";
  showPercentage?: boolean;
  text?: string;
  animated?: boolean;
}

export function RacingProgressBar({
  progress,
  color = "red",
  showPercentage = true,
  text,
  animated = true,
}: LoadingBarProps) {
  const colorClasses = {
    red: "bg-racing-red",
    orange: "bg-racing-orange",
    yellow: "bg-racing-yellow",
    green: "bg-racing-green",
    blue: "bg-racing-blue",
    purple: "bg-racing-purple",
  };

  const glowClasses = {
    red: "shadow-[0_0_10px_hsl(var(--racing-red)/0.5)]",
    orange: "shadow-[0_0_10px_hsl(var(--racing-orange)/0.5)]",
    yellow: "shadow-[0_0_10px_hsl(var(--racing-yellow)/0.5)]",
    green: "shadow-[0_0_10px_hsl(var(--racing-green)/0.5)]",
    blue: "shadow-[0_0_10px_hsl(var(--racing-blue)/0.5)]",
    purple: "shadow-[0_0_10px_hsl(var(--racing-purple)/0.5)]",
  };

  return (
    <div className="space-y-2">
      {text && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-foreground">{text}</span>
          {showPercentage && (
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} ${glowClasses[color]} transition-all duration-300 relative ${
            animated ? "animate-pulse" : ""
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        >
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-speed-lines" />
          )}
        </div>
      </div>
    </div>
  );
}

interface StatusIndicatorProps {
  status: "online" | "offline" | "connecting" | "error" | "warning";
  text?: string;
  size?: "sm" | "md" | "lg";
}

export function RacingStatusIndicator({
  status,
  text,
  size = "md",
}: StatusIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const statusConfig = {
    online: {
      color: "bg-racing-green",
      animation: "animate-pulse",
      icon: Circle,
      textColor: "text-racing-green",
    },
    offline: {
      color: "bg-muted-foreground",
      animation: "",
      icon: Circle,
      textColor: "text-muted-foreground",
    },
    connecting: {
      color: "bg-racing-yellow",
      animation: "animate-pulse",
      icon: Activity,
      textColor: "text-racing-yellow",
    },
    error: {
      color: "bg-racing-red",
      animation: "animate-pulse",
      icon: Circle,
      textColor: "text-racing-red",
    },
    warning: {
      color: "bg-racing-orange",
      animation: "animate-pulse",
      icon: Circle,
      textColor: "text-racing-orange",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} ${config.color} rounded-full ${config.animation}`}
      />
      {text && (
        <span className={`text-sm font-medium ${config.textColor}`}>
          {text}
        </span>
      )}
    </div>
  );
}

interface PerformanceMetricProps {
  label: string;
  value: number;
  unit?: string;
  target?: number;
  format?: "number" | "percentage" | "time";
  color?: "red" | "orange" | "yellow" | "green" | "blue" | "purple";
}

export function PerformanceMetric({
  label,
  value,
  unit,
  target,
  format = "number",
  color = "blue",
}: PerformanceMetricProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case "percentage":
        return `${val.toFixed(1)}%`;
      case "time":
        return `${val.toFixed(3)}s`;
      default:
        return val.toLocaleString();
    }
  };

  const getPerformanceColor = () => {
    if (!target) return `text-racing-${color}`;

    const ratio = value / target;
    if (ratio >= 0.95) return "text-racing-green";
    if (ratio >= 0.8) return "text-racing-yellow";
    return "text-racing-red";
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        {target && (
          <span className="text-xs text-muted-foreground">
            Target: {formatValue(target)}
          </span>
        )}
      </div>
      <div className={`text-2xl font-bold ${getPerformanceColor()}`}>
        {formatValue(value)}
        {unit && <span className="text-sm ml-1">{unit}</span>}
      </div>
      {target && (
        <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              value >= target
                ? "bg-racing-green"
                : value >= target * 0.8
                  ? "bg-racing-yellow"
                  : "bg-racing-red"
            }`}
            style={{ width: `${Math.min(100, (value / target) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({
  isLoading,
  text = "Loading...",
  children,
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
          <div className="bg-card/80 border border-border/50 rounded-lg p-6 backdrop-blur-sm">
            <RacingSpinner size="lg" color="yellow" text={text} />
          </div>
        </div>
      )}
    </div>
  );
}
