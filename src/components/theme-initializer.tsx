"use client";

import { useEffect, useRef } from "react";
import { useThemeConfig } from "@/hooks/use-theme-config";
import { loadTheme } from "@/lib/theme-loader";

/**
 * Component that syncs theme changes after initial mount.
 * The initial theme is applied via a blocking script in layout.tsx to prevent flash.
 * Also handles dynamic loading of theme CSS.
 */
export function ThemeInitializer({ children }: { children: React.ReactNode }) {
  const { currentTheme } = useThemeConfig();
  const isFirstRender = useRef(true);

  // Load theme CSS on mount
  useEffect(() => {
    // Load the current theme CSS immediately
    loadTheme(currentTheme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Skip the first render - theme class is already applied by the blocking script
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Only update on subsequent theme changes
    const root = document.documentElement;

    // Remove all possible theme classes first
    root.classList.forEach((className) => {
      if (className.startsWith("theme-")) {
        root.classList.remove(className);
      }
    });

    // Add the current theme class
    root.classList.add(`theme-${currentTheme}`);

    // Load the new theme CSS dynamically
    loadTheme(currentTheme);
  }, [currentTheme]);

  return <>{children}</>;
}
