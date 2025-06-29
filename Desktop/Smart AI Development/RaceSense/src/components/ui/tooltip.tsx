import React from "react";

// Simple tooltip components for compatibility
// These do nothing but prevent import errors

export function Tooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function TooltipTrigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function TooltipContent({ children }: { children: React.ReactNode }) {
  return null; // Don't render tooltip content
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
