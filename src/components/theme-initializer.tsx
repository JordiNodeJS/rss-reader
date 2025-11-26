"use client";

import { useEffect, useRef } from "react";
import { useThemeConfig } from "@/hooks/use-theme-config";
import { loadTheme } from "@/lib/theme-loader";

/**
 * Component that syncs theme changes after initial mount.
 * The initial theme is applied via a blocking script in layout.tsx to prevent flash.
 * Also handles dynamic loading of theme CSS.
 *
 * IMPORTANT: The initial theme CSS is loaded by the inline script in layout.tsx
 * which reads from localStorage BEFORE React hydration. We must NOT override
 * that on first mount, as Zustand hasn't hydrated yet and would use the default theme.
 */
export function ThemeInitializer({ children }: { children: React.ReactNode }) {
  const { currentTheme } = useThemeConfig();
  const isFirstRender = useRef(true);
  const hasHydrated = useRef(false);

  // Track when Zustand has hydrated from localStorage
  // The currentTheme will change from default to stored value after hydration
  useEffect(() => {
    // After a small delay, mark as hydrated
    // This ensures Zustand has had time to restore from localStorage
    const timer = setTimeout(() => {
      hasHydrated.current = true;
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Skip the first render - theme is already applied by the blocking script in layout.tsx
    // The inline script reads localStorage directly and loads the correct CSS
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Only update on subsequent theme changes (user interactions)
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
