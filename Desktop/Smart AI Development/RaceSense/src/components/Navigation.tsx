import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TouchTarget } from "./ResponsiveContainer";
import {
  Home,
  Play,
  BarChart3,
  MessageSquare,
  Settings,
  Menu,
  Gauge,
  Zap,
  Activity,
  Wrench,
  X,
  Database,
  Box,
  HardDrive,
  ChevronRight,
} from "lucide-react";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "New Session", href: "/mode-selection", icon: Play },
  { name: "Live Telemetry", href: "/telemetry-dashboard", icon: Activity },
  { name: "Real Racing", href: "/real-racing", icon: Zap },
  { name: "AI Analysis", href: "/advanced-analysis", icon: Gauge },
  { name: "Vehicle Setup", href: "/vehicle-setup", icon: Wrench },
  { name: "Analysis", href: "/session-analysis", icon: BarChart3 },
  { name: "Data Manager", href: "/data-management", icon: Database },
  { name: "3D Visualization", href: "/advanced-visualization", icon: Box },
  { name: "Hardware Config", href: "/hardware-configuration", icon: HardDrive },
  { name: "Feedback", href: "/drift-feedback", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface NavigationState {
  isOpen: boolean;
  currentPath: string;
}

class NavigationClass extends React.Component<{}, NavigationState> {
  private pathCheckInterval: NodeJS.Timeout | null = null;

  constructor(props: {}) {
    super(props);
    this.state = {
      isOpen: false,
      currentPath:
        typeof window !== "undefined" ? window.location.pathname : "/",
    };
  }

  componentDidMount() {
    // Listen for path changes
    if (typeof window !== "undefined") {
      // Initial path update
      this.updateCurrentPath();

      // Listen to popstate for back/forward navigation
      window.addEventListener("popstate", this.handlePopState);

      // Check for path changes periodically (for programmatic navigation)
      this.pathCheckInterval = setInterval(this.updateCurrentPath, 100);
    }
  }

  componentWillUnmount() {
    if (typeof window !== "undefined") {
      window.removeEventListener("popstate", this.handlePopState);
    }
    if (this.pathCheckInterval) {
      clearInterval(this.pathCheckInterval);
    }
  }

  handlePopState = () => {
    this.updateCurrentPath();
  };

  updateCurrentPath = () => {
    if (typeof window !== "undefined") {
      const newPath = window.location.pathname;
      if (newPath !== this.state.currentPath) {
        this.setState({ currentPath: newPath });
      }
    }
  };

  setIsOpen = (isOpen: boolean) => {
    this.setState({ isOpen });
  };

  handleNavClick = (href: string) => {
    this.setIsOpen(false);
    // Navigate programmatically
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", href);
      // Trigger a custom event to notify React Router
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  renderNavContent = () => (
    <nav className="flex flex-col space-y-2">
      {navigation.map((item) => {
        const isActive = this.state.currentPath === item.href;
        return (
          <a
            key={item.name}
            href={item.href}
            onClick={(e) => {
              e.preventDefault();
              this.handleNavClick(item.href);
            }}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative group",
              isActive
                ? "bg-racing-yellow/20 text-racing-yellow border border-racing-yellow/30"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
            {isActive && (
              <div className="absolute inset-0 bg-racing-yellow/5 rounded-lg animate-pulse-glow" />
            )}
          </a>
        );
      })}
    </nav>
  );

  renderMobileOverlay = () => {
    if (!this.state.isOpen) return null;

    return (
      <div className="md:hidden mobile-menu-container">
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-black/80 animate-in fade-in duration-300"
          onClick={() => this.setIsOpen(false)}
          role="button"
          aria-label="Close navigation menu"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              this.setIsOpen(false);
            }
          }}
        />

        {/* Mobile Drawer */}
        <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-card/95 backdrop-blur-md border-r border-border/50 animate-in slide-in-from-left duration-300">
          <div
            className="flex flex-col h-full"
            style={{
              paddingTop: "max(2rem, env(safe-area-inset-top))",
              paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
            }}
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between px-6 pb-6 border-b border-border/30">
              <div className="flex items-center gap-3">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F470759060b1c4b0b916b5f9ea82a1d3c%2Fcc591e09ecaf40208de8f7e8e6da8afd"
                  alt="RaceSense Logo"
                  className="h-10 object-contain"
                />
                <div>
                  <h2 className="font-semibold text-racing-yellow">
                    RaceSense
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Racing Analytics
                  </p>
                </div>
              </div>

              <TouchTarget
                onClick={() => this.setIsOpen(false)}
                className="bg-gray-800 hover:bg-gray-700 text-muted-foreground hover:text-white"
                size="md"
                haptic={true}
              >
                <X className="h-5 w-5" />
              </TouchTarget>
            </div>

            {/* Navigation content with enhanced touch targets */}
            <div className="flex-grow px-6 py-4 overflow-y-auto">
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const isActive = this.state.currentPath === item.href;
                  return (
                    <TouchTarget
                      key={item.name}
                      onClick={() => {
                        this.handleNavClick(item.href);
                        this.setIsOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left font-medium transition-all duration-200 group touch-target",
                        isActive
                          ? "bg-racing-yellow/20 text-racing-yellow border border-racing-yellow/30 shadow-lg"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50 active:bg-accent/70",
                      )}
                      size="lg"
                      haptic={true}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
                          isActive
                            ? "bg-racing-yellow/30"
                            : "bg-gray-800 group-hover:bg-gray-700",
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1">
                        <span className="text-base">{item.name}</span>
                        {isActive && (
                          <div className="text-xs text-racing-yellow/70 mt-0.5">
                            Current page
                          </div>
                        )}
                      </div>

                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform group-hover:translate-x-1",
                          isActive
                            ? "text-racing-yellow"
                            : "text-muted-foreground",
                        )}
                      />
                    </TouchTarget>
                  );
                })}
              </nav>
            </div>

            {/* Enhanced footer with quick stats */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-border/30">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="h-3 w-3 text-racing-yellow" />
                    Performance Mode
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-500">Online</span>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex gap-2">
                  <TouchTarget
                    onClick={() => {
                      this.handleNavClick("/mode-selection");
                      this.setIsOpen(false);
                    }}
                    className="flex-1 bg-racing-blue/20 hover:bg-racing-blue/30 text-racing-blue border border-racing-blue/30 rounded-lg text-xs font-medium"
                    haptic={true}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Quick Start
                  </TouchTarget>

                  <TouchTarget
                    onClick={() => {
                      this.handleNavClick("/settings");
                      this.setIsOpen(false);
                    }}
                    className="bg-gray-800 hover:bg-gray-700 text-muted-foreground hover:text-white rounded-lg"
                    haptic={true}
                  >
                    <Settings className="h-4 w-4" />
                  </TouchTarget>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    return (
      <>
        {/* Desktop Navigation */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50 bg-card/80 backdrop-blur-sm border-r border-border/50">
          {/* Logo stuck to left border */}
          <div className="absolute -top-[5px] left-0 z-10">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F470759060b1c4b0b916b5f9ea82a1d3c%2Fcc591e09ecaf40208de8f7e8e6da8afd"
              alt="RaceSense Logo"
              className="h-24 object-contain mr-auto pl-5 pb-5"
            />
          </div>
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <div className="flex items-center"></div>
            </div>
            <div className="mt-5 flex-grow flex flex-col px-4">
              {this.renderNavContent()}
            </div>
            <div className="flex-shrink-0 px-4 py-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-3 w-3 text-racing-yellow" />
                Performance Analytics
              </div>
            </div>
          </div>
        </aside>

        {/* Enhanced Mobile Navigation Header */}
        <div className="md:hidden">
          <header
            className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50 shadow-lg"
            style={{
              paddingTop: "env(safe-area-inset-top)",
              paddingLeft: "env(safe-area-inset-left)",
              paddingRight: "env(safe-area-inset-right)",
            }}
            role="banner"
          >
            <div className="flex items-center justify-between px-4 py-3 min-h-[56px]">
              {/* Logo and current page indicator */}
              <TouchTarget
                onClick={() => this.handleNavClick("/")}
                className="flex items-center gap-3 flex-1 bg-transparent hover:bg-gray-800/50 rounded-lg"
                haptic={true}
              >
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F470759060b1c4b0b916b5f9ea82a1d3c%2Fcc591e09ecaf40208de8f7e8e6da8afd"
                  alt="RaceSense Logo"
                  className="h-10 object-contain"
                />
                <div className="text-left">
                  <h1 className="font-semibold text-racing-yellow text-lg">
                    RaceSense
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {navigation.find(
                      (item) => item.href === this.state.currentPath,
                    )?.name || "Racing Analytics"}
                  </p>
                </div>
              </TouchTarget>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {/* Quick action button */}
                <TouchTarget
                  onClick={() => this.handleNavClick("/mode-selection")}
                  className="bg-racing-blue/20 hover:bg-racing-blue/30 text-racing-blue border border-racing-blue/30"
                  size="md"
                  haptic={true}
                >
                  <Play className="h-4 w-4" />
                </TouchTarget>

                {/* Menu button */}
                <TouchTarget
                  onClick={() => this.setIsOpen(true)}
                  className="bg-racing-yellow/10 hover:bg-racing-yellow/20 text-racing-yellow border border-racing-yellow/30"
                  size="md"
                  haptic={true}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open navigation menu</span>
                </TouchTarget>
              </div>
            </div>

            {/* Optional: Quick navigation breadcrumb */}
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-x-auto">
                <TouchTarget
                  onClick={() => this.handleNavClick("/")}
                  className="bg-transparent hover:bg-gray-800/50 text-xs px-2 py-1 rounded whitespace-nowrap"
                >
                  Home
                </TouchTarget>
                {this.state.currentPath !== "/" && (
                  <>
                    <ChevronRight className="h-3 w-3 flex-shrink-0" />
                    <span className="text-racing-yellow whitespace-nowrap">
                      {
                        navigation.find(
                          (item) => item.href === this.state.currentPath,
                        )?.name
                      }
                    </span>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Spacer to prevent content overlap */}
          <div
            className="h-20"
            style={{ height: "calc(5rem + env(safe-area-inset-top))" }}
          />
        </div>

        {/* Mobile Drawer */}
        {this.renderMobileOverlay()}
      </>
    );
  }
}

export function Navigation() {
  return <NavigationClass />;
}
