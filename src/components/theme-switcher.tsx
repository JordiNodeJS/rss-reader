"use client";

import { useEffect } from "react";
import { AVAILABLE_THEMES, useThemeConfig } from "@/hooks/use-theme-config";
import { preloadAllThemes } from "@/lib/theme-loader";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

export function ThemeSwitcher() {
  const { currentTheme, setTheme, isLoading } = useThemeConfig();

  // Precargar todos los temas cuando el componente se monta
  // (normalmente cuando el usuario abre el menú de configuración)
  useEffect(() => {
    preloadAllThemes(AVAILABLE_THEMES.map((t) => t.id));
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-medium text-foreground flex items-center gap-2">
        Color Theme
        {isLoading && (
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setTheme(theme.id)}
            disabled={isLoading && currentTheme !== theme.id}
            className={cn(
              "group relative flex items-center gap-2 px-3 py-2 rounded-md",
              "border transition-all duration-200",
              "hover:border-primary hover:shadow-md",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              currentTheme === theme.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-background"
            )}
            title={theme.name}
          >
            {/* Color preview dots */}
            <div className="flex gap-1">
              {theme.colors.map((color, index) => (
                <div
                  key={index}
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Theme name */}
            <span className="text-sm font-medium text-foreground">
              {theme.name}
            </span>

            {/* Check icon when selected */}
            {currentTheme === theme.id && (
              <Check className="ml-auto w-4 h-4 text-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
