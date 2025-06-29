import React, { useState, useEffect } from "react";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  mobilePadding?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

interface BreakpointConfig {
  name: string;
  minWidth: number;
  cols: number;
  gutters: string;
  padding: string;
}

const breakpoints: BreakpointConfig[] = [
  { name: "mobile", minWidth: 0, cols: 1, gutters: "gap-4", padding: "px-4" },
  { name: "tablet", minWidth: 768, cols: 2, gutters: "gap-6", padding: "px-6" },
  {
    name: "desktop",
    minWidth: 1024,
    cols: 3,
    gutters: "gap-8",
    padding: "px-8",
  },
  { name: "wide", minWidth: 1280, cols: 4, gutters: "gap-8", padding: "px-12" },
];

export function useBreakpoint() {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<BreakpointConfig>(
    breakpoints[0],
  );

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      const matchedBreakpoint =
        [...breakpoints].reverse().find((bp) => width >= bp.minWidth) ||
        breakpoints[0];

      setCurrentBreakpoint(matchedBreakpoint);
    };

    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);
    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  return currentBreakpoint;
}

export function ResponsiveContainer({
  children,
  className = "",
  mobilePadding = true,
  maxWidth = "full",
}: ResponsiveContainerProps) {
  const breakpoint = useBreakpoint();

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    "2xl": "max-w-7xl",
    full: "max-w-full",
  }[maxWidth];

  const paddingClass = mobilePadding ? breakpoint.padding : "";

  return (
    <div
      className={`w-full ${maxWidthClass} mx-auto ${paddingClass} ${className}`}
    >
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  minCardWidth?: number;
  className?: string;
  gap?: "sm" | "md" | "lg";
}

export function ResponsiveGrid({
  children,
  minCardWidth = 280,
  className = "",
  gap = "md",
}: ResponsiveGridProps) {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      const containerWidth = window.innerWidth - 64; // Account for padding
      const newColumns = Math.max(1, Math.floor(containerWidth / minCardWidth));
      setColumns(newColumns);
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, [minCardWidth]);

  const gapClass = {
    sm: "gap-3",
    md: "gap-6",
    lg: "gap-8",
  }[gap];

  return (
    <div
      className={`grid ${gapClass} ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridAutoRows: "min-content",
      }}
    >
      {children}
    </div>
  );
}

// Touch-optimized components for mobile
interface TouchTargetProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  haptic?: boolean;
}

export function TouchTarget({
  children,
  onClick,
  className = "",
  size = "md",
  haptic = false,
}: TouchTargetProps) {
  const sizeClasses = {
    sm: "min-h-[40px] min-w-[40px]", // 40px minimum for accessibility
    md: "min-h-[48px] min-w-[48px]", // 48px recommended by Apple/Google
    lg: "min-h-[56px] min-w-[56px]", // 56px for primary actions
  }[size];

  const handleClick = () => {
    // Haptic feedback on supported devices
    if (haptic && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={`
        ${sizeClasses}
        flex items-center justify-center
        rounded-lg transition-all duration-200
        active:scale-95 active:bg-white/10
        focus:outline-none focus:ring-2 focus:ring-racing-blue
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// Swipe gesture support
interface SwipeableProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

export function Swipeable({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = "",
}: SwipeableProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null,
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    // Determine primary direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    setTouchStart(null);
  };

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

// Mobile-optimized modal/sheet
interface MobileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  height?: "auto" | "half" | "full";
}

export function MobileSheet({
  isOpen,
  onClose,
  children,
  title,
  height = "auto",
}: MobileSheetProps) {
  const heightClass = {
    auto: "max-h-[80vh]",
    half: "h-[50vh]",
    full: "h-[100vh]",
  }[height];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div
        className={`
        absolute bottom-0 left-0 right-0 
        bg-card rounded-t-xl
        ${heightClass}
        animate-in slide-in-from-bottom duration-300
      `}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-4 pb-4 border-b border-border">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

// Progressive Web App utilities
export function usePWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  return { showPrompt, installPWA, dismissPrompt: () => setShowPrompt(false) };
}
