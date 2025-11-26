"use client";

import { useEffect, useState, useRef } from "react";
import {
  AVAILABLE_THEMES,
  useThemeConfig,
  type ThemeName,
} from "@/hooks/use-theme-config";
import { preloadAllThemes } from "@/lib/theme-loader";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Loader2 } from "lucide-react";

export function ThemeSwitcher() {
  const { currentTheme, setTheme, isLoading } = useThemeConfig();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current theme info
  const currentThemeInfo = AVAILABLE_THEMES.find((t) => t.id === currentTheme);

  // Precargar todos los temas cuando el componente se monta
  useEffect(() => {
    preloadAllThemes(AVAILABLE_THEMES.map((t) => t.id));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (themeId: ThemeName) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
      <div className="text-sm font-medium text-foreground flex items-center gap-2">
        Color Theme
        {isLoading && (
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2 rounded-md",
          "border border-border bg-background",
          "hover:border-primary/50 hover:bg-muted/30",
          "transition-colors duration-200",
          "text-sm font-medium text-foreground",
          isOpen && "border-primary ring-1 ring-primary/20"
        )}
      >
        <div className="flex items-center gap-2">
          {/* Color preview dots */}
          {currentThemeInfo && (
            <div className="flex gap-1">
              {currentThemeInfo.colors.map((color, index) => (
                <div
                  key={index}
                  className="w-3 h-3 rounded-full border border-white/10"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
          <span>{currentThemeInfo?.name || "Select theme"}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute left-0 right-0 z-50",
            "bg-popover border border-border rounded-md shadow-lg",
            "max-h-64 overflow-y-auto scrollbar-theme",
            "animate-in fade-in-0 zoom-in-95 duration-150"
          )}
          style={{ top: "calc(100% + 4px)" }}
        >
          {AVAILABLE_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleSelect(theme.id)}
              disabled={isLoading && currentTheme !== theme.id}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2",
                "hover:bg-muted/50 transition-colors duration-150",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "text-sm text-foreground",
                currentTheme === theme.id && "bg-primary/10"
              )}
            >
              {/* Color preview dots */}
              <div className="flex gap-1 shrink-0">
                {theme.colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-3 h-3 rounded-full border border-white/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Theme name */}
              <span className="flex-1 text-left">{theme.name}</span>

              {/* Check icon when selected */}
              {currentTheme === theme.id && (
                <Check className="w-4 h-4 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
