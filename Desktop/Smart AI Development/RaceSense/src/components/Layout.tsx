import React from "react";
import { Navigation } from "./Navigation";

interface LayoutProps {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: boolean;
}

export function Layout({
  children,
  maxWidth = "full",
  padding = true,
}: LayoutProps) {
  // Simple responsive detection without hooks
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const paddingClass = padding ? (isMobile ? "p-4" : "p-6") : "";

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    "2xl": "max-w-7xl",
    full: "max-w-full",
  }[maxWidth];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />

      {/* Main Content with responsive container */}
      <main
        id="main-content"
        className={`
          ${isMobile ? "pt-16" : "md:pl-64"}
          min-h-screen
          transition-all duration-200
        `}
        style={{
          // Safe area support for notched devices
          paddingTop: isMobile
            ? "max(4rem, env(safe-area-inset-top))"
            : undefined,
          paddingBottom: isMobile
            ? "max(1rem, env(safe-area-inset-bottom))"
            : undefined,
          paddingLeft: isMobile
            ? "max(1rem, env(safe-area-inset-left))"
            : undefined,
          paddingRight: isMobile
            ? "max(1rem, env(safe-area-inset-right))"
            : undefined,
        }}
      >
        <div className={`${paddingClass} w-full ${maxWidthClass} mx-auto`}>
          {children}
        </div>
      </main>

      {/* Mobile-specific enhancements */}
      {isMobile && (
        <>
          {/* Bottom spacing for iOS home indicator */}
          <div style={{ height: "env(safe-area-inset-bottom)" }} />

          {/* Mobile optimizations */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
              @media (max-width: 768px) {
                * {
                  -webkit-overflow-scrolling: touch;
                }

                /* Optimize touch targets */
                button, a, [role="button"] {
                  min-height: 44px;
                  min-width: 44px;
                }

                /* Focus indicators for accessibility */
                button:focus-visible,
                a:focus-visible,
                [role="button"]:focus-visible {
                  outline: 2px solid #3B82F6;
                  outline-offset: 2px;
                }
              }
            `,
            }}
          />
        </>
      )}

      {/* Accessibility improvements */}
      <div
        className="sr-only"
        aria-live="polite"
        id="status-announcements"
        role="status"
      >
        {/* This div will contain dynamically inserted announcements for screen readers */}
      </div>

      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-racing-blue text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>
    </div>
  );
}
