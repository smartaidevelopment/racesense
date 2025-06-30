import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  Usb,
  Brain,
  Cog,
  Map,
} from "lucide-react";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "New Session", href: "/mode-selection", icon: Play },
  { name: "Telemetry", href: "/telemetry", icon: Activity },
  { name: "Session Analysis", href: "/session-analysis", icon: BarChart3 },
  { name: "Tracks", href: "/tracks", icon: Map },
  { name: "Vehicle Setup", href: "/vehicle-setup", icon: Wrench },
  { name: "Advanced AI", href: "/advanced-ai", icon: Gauge },
  { name: "Data Management", href: "/data-management", icon: Database },
  { name: "Advanced Visualization", href: "/advanced-visualization", icon: Box },
  { name: "Hardware Config", href: "/hardware-configuration", icon: HardDrive },
  { name: "Hardware Integration", href: "/hardware-integration", icon: Usb },
  { name: "AI Coach", href: "/drift-feedback", icon: Brain },
  { name: "Settings", href: "/settings", icon: Cog },
];

// 1. Memoized NavItem for performance and accessibility
const NavItem = React.memo(function NavItem({ item, isActive, onClick }: { item: any, isActive: boolean, onClick: (href: string) => void }) {
  return (
    <button
      key={item.name}
      onClick={() => onClick(item.href)}
      aria-current={isActive ? "page" : undefined}
      tabIndex={0}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-racing-yellow/70",
        isActive
          ? "bg-racing-yellow/20 text-racing-yellow border-l-4 border-racing-yellow shadow-md"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50 border-l-4 border-transparent",
      )}
      style={{ minHeight: 44 }}
    >
      <item.icon className="h-4 w-4" style={{ minWidth: 16 }} />
      <span className="align-middle">{item.name}</span>
      {isActive && (
        <span className="sr-only">Current page</span>
      )}
    </button>
  );
});

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 2. Remove console.log except in development
  const handleNavClick = (href: string) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Navigation clicked:', href);
    }
    try {
      setIsOpen(false);
      navigate(href);
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Navigation successful to:', href);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Navigation failed:', error);
      }
    }
  };

  // 3. Close mobile drawer on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Desktop Navigation */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50 bg-card/80 backdrop-blur-sm border-r border-border/50">
        {/* Logo */}
        <div className="absolute -top-[5px] left-0 z-10">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F470759060b1c4b0b916b5f9ea82a1d3c%2Fcc591e09ecaf40208de8f7e8e6da8afd"
            alt="RaceSense Logo"
            className="h-24 object-contain mr-auto pl-5 pb-5"
            draggable={false}
          />
        </div>
        
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-8">
            <div className="flex items-center"></div>
          </div>
          
          <div className="mt-5 flex-grow flex flex-col px-4">
            <nav className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={location.pathname === item.href}
                  onClick={handleNavClick}
                />
              ))}
            </nav>
          </div>
          
          <div className="flex-shrink-0 px-4 py-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-racing-yellow" />
              Performance Analytics
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Header */}
      <div className="md:hidden">
        <header
          className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50 shadow-lg"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)",
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 min-h-[56px]">
            {/* Logo and current page indicator */}
            <button
              onClick={() => handleNavClick("/")}
              className="flex items-center gap-3 flex-1 bg-transparent hover:bg-gray-800/50 rounded-lg text-left"
            >
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F470759060b1c4b0b916b5f9ea82a1d3c%2Fcc591e09ecaf40208de8f7e8e6da8afd"
                alt="RaceSense Logo"
                className="h-10 object-contain"
              />
              <div>
                <h1 className="font-semibold text-racing-yellow text-lg">
                  RaceSense
                </h1>
                <p className="text-xs text-muted-foreground">
                  {navigation.find(
                    (item) => item.href === location.pathname,
                  )?.name || "Racing Analytics"}
                </p>
              </div>
            </button>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleNavClick("/mode-selection")}
                variant="outline"
                size="sm"
                className="bg-racing-blue/20 hover:bg-racing-blue/30 text-racing-blue border-racing-blue/30"
              >
                <Play className="h-4 w-4" />
              </Button>

              <Button
                onClick={() => setIsOpen(true)}
                variant="outline"
                size="sm"
                className="bg-racing-yellow/10 hover:bg-racing-yellow/20 text-racing-yellow border-racing-yellow/30"
              >
                <Menu className="h-5 w-5" />
              </Button>
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
      {isOpen && (
        <div className="md:hidden mobile-menu-container">
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/80 animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
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

                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 hover:bg-gray-700 text-muted-foreground hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation content */}
              <div className="flex-grow px-6 py-4 overflow-y-auto">
                <nav className="space-y-2">
                  {navigation.map((item) => (
                    <NavItem
                      key={item.name}
                      item={item}
                      isActive={location.pathname === item.href}
                      onClick={handleNavClick}
                    />
                  ))}
                </nav>
              </div>

              {/* Footer */}
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
                    <Button
                      onClick={() => handleNavClick("/mode-selection")}
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-racing-blue/20 hover:bg-racing-blue/30 text-racing-blue border-racing-blue/30"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Quick Start
                    </Button>

                    <Button
                      onClick={() => handleNavClick("/settings")}
                      variant="outline"
                      size="sm"
                      className="bg-gray-800 hover:bg-gray-700 text-muted-foreground hover:text-white"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
