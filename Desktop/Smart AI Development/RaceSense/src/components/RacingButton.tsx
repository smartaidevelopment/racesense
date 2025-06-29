import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface RacingButtonProps extends ButtonProps {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "racing";
  racing?: "red" | "orange" | "yellow" | "green" | "blue" | "purple";
  icon?: LucideIcon;
  glow?: boolean;
}

export const RacingButton = React.forwardRef<
  HTMLButtonElement,
  RacingButtonProps
>(
  (
    {
      className,
      variant = "default",
      racing,
      icon: Icon,
      glow = false,
      children,
      ...props
    },
    ref,
  ) => {
    const racingVariants = {
      red: "bg-racing-red hover:bg-racing-red/90 text-racing-red-foreground border-racing-red/30",
      orange:
        "bg-racing-orange hover:bg-racing-orange/90 text-racing-orange-foreground border-racing-orange/30",
      yellow:
        "bg-racing-yellow hover:bg-racing-yellow/90 text-racing-yellow-foreground border-racing-yellow/30",
      green:
        "bg-racing-green hover:bg-racing-green/90 text-racing-green-foreground border-racing-green/30",
      blue: "bg-racing-blue hover:bg-racing-blue/90 text-racing-blue-foreground border-racing-blue/30",
      purple:
        "bg-racing-purple hover:bg-racing-purple/90 text-racing-purple-foreground border-racing-purple/30",
    };

    const glowColors = {
      red: "shadow-[0_0_20px_hsl(var(--racing-red)/0.4)] hover:shadow-[0_0_30px_hsl(var(--racing-red)/0.6)]",
      orange:
        "shadow-[0_0_20px_hsl(var(--racing-orange)/0.4)] hover:shadow-[0_0_30px_hsl(var(--racing-orange)/0.6)]",
      yellow:
        "shadow-[0_0_20px_hsl(var(--racing-yellow)/0.4)] hover:shadow-[0_0_30px_hsl(var(--racing-yellow)/0.6)]",
      green:
        "shadow-[0_0_20px_hsl(var(--racing-green)/0.4)] hover:shadow-[0_0_30px_hsl(var(--racing-green)/0.6)]",
      blue: "shadow-[0_0_20px_hsl(var(--racing-blue)/0.4)] hover:shadow-[0_0_30px_hsl(var(--racing-blue)/0.6)]",
      purple:
        "shadow-[0_0_20px_hsl(var(--racing-purple)/0.4)] hover:shadow-[0_0_30px_hsl(var(--racing-purple)/0.6)]",
    };

    return (
      <Button
        className={cn(
          "relative overflow-hidden transition-all duration-300 transform hover:scale-105",
          variant === "racing" && racing && racingVariants[racing],
          glow && racing && glowColors[racing],
          "group",
          className,
        )}
        variant={variant === "racing" ? "default" : variant}
        ref={ref}
        {...props}
      >
        {/* Animated shine effect */}
        <div className="absolute inset-0 -top-1 -bottom-1 left-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:left-[100%] transition-all duration-700" />

        <div className="relative flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          {children}
        </div>
      </Button>
    );
  },
);

RacingButton.displayName = "RacingButton";
