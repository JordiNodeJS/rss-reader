"use client";

import { AVAILABLE_THEMES, useThemeConfig } from '@/hooks/use-theme-config';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export function ThemeSwitcher() {
  const { currentTheme, setTheme } = useThemeConfig();

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-medium text-foreground">Color Theme</div>
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setTheme(theme.id)}
            className={cn(
              "group relative flex items-center gap-2 px-3 py-2 rounded-md",
              "border transition-all duration-200",
              "hover:border-primary hover:shadow-md",
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
