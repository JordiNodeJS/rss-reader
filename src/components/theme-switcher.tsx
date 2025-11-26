"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const [isMounted, setIsMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  // Get current theme info
  const currentThemeInfo = AVAILABLE_THEMES.find((t) => t.id === currentTheme);

  // Track mount state for portal
  useEffect(() => {
    const id = window.setTimeout(() => setIsMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  // Precargar todos los temas cuando el componente se monta
  useEffect(() => {
    preloadAllThemes((AVAILABLE_THEMES || []).map((t) => t.id));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // Check if click is outside both trigger and dropdown
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (themeId: ThemeName) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Calculate dropdown position when opened - with viewport boundary detection
  const updateDropdownPosition = useCallback(() => {
    if (triggerRef.current && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownMaxHeight = 256; // max-h-64 = 16rem = 256px
      const gap = 4;

      // Check if there's enough space below
      const spaceBelow = viewportHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;

      let top: number;
      let maxHeight: number;

      if (spaceBelow >= dropdownMaxHeight) {
        // Enough space below - show dropdown below trigger
        top = rect.bottom + gap;
        maxHeight = dropdownMaxHeight;
      } else if (spaceAbove >= dropdownMaxHeight) {
        // Enough space above - show dropdown above trigger
        top = rect.top - dropdownMaxHeight - gap;
        maxHeight = dropdownMaxHeight;
      } else if (spaceBelow >= spaceAbove) {
        // More space below - use available space below
        top = rect.bottom + gap;
        maxHeight = Math.max(150, spaceBelow - 10);
      } else {
        // More space above - use available space above
        maxHeight = Math.max(150, spaceAbove - 10);
        top = rect.top - maxHeight - gap;
      }

      setDropdownStyle({
        position: "fixed",
        top,
        left: rect.left,
        width: rect.width,
        maxHeight,
        zIndex: 9999,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);
    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [updateDropdownPosition]);

  return (
    <div className="flex flex-col gap-2 relative">
      <div className="text-sm font-medium text-foreground flex items-center gap-2">
        Color Theme
        {isLoading && (
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown trigger */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2 rounded-md w-full",
          "border border-border bg-background",
          "hover:border-primary/50 hover:bg-muted/30",
          "transition-colors duration-200",
          "text-sm font-medium text-foreground",
          isOpen && "border-primary ring-1 ring-primary/20"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Color preview dots */}
          {currentThemeInfo && (
            <div className="flex gap-1 shrink-0">
              {currentThemeInfo?.colors?.map((color, index) => (
                <div
                  key={index}
                  className="w-3 h-3 rounded-full border border-white/10"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
          <span className="truncate">
            {currentThemeInfo?.name || "Select theme"}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown menu - rendered via portal to escape overflow:hidden containers */}
      {isMounted &&
        isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className={cn(
              "bg-popover border border-border rounded-md shadow-lg",
              "overflow-y-auto scrollbar-theme",
              "animate-in fade-in-0 zoom-in-95 duration-150"
            )}
          >
            {(AVAILABLE_THEMES || []).map((theme) => (
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
                  {theme.colors?.map((color, index) => (
                    <div
                      key={index}
                      className="w-3 h-3 rounded-full border border-white/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Theme name */}
                <span className="flex-1 text-left truncate">{theme.name}</span>

                {/* Check icon when selected */}
                {currentTheme === theme.id && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
