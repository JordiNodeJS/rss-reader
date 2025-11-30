"use client";

import { memo, useRef } from "react";
import { AVAILABLE_THEMES, useThemeConfig } from "@/hooks/use-theme-config";
import { cn } from "@/lib/utils";
import {
  usePageVisibility,
  useInViewport,
  usePrefersReducedMotion,
} from "@/hooks/useAnimationPause";
import { useIsClient } from "@/hooks/useIsClient";

interface ThemeCarouselProps {
  /** When true, animation is paused to save CPU/GPU */
  isPaused?: boolean;
}

interface ThemeButtonProps {
  theme: (typeof AVAILABLE_THEMES)[number];
  onClick?: () => void;
  isActive?: boolean;
  isMounted?: boolean;
}

const ThemeButton = memo(function ThemeButton({
  theme,
  onClick,
  isActive,
  isMounted,
}: ThemeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full",
        // Removed backdrop-blur-sm - too GPU intensive when there are many buttons
        "bg-background/95 border border-border/50",
        "hover:bg-primary/10 hover:border-primary/40 hover:scale-105",
        "transition-all duration-200 shrink-0 cursor-pointer",
        "text-xs font-medium text-foreground/80 whitespace-nowrap",
        isActive && "ring-1 ring-primary border-primary bg-primary/10"
      )}
    >
      {/* Color dots - only render colors after mount to avoid hydration mismatch 
          from browser extensions like Dark Reader that modify inline styles */}
      <div className="flex items-center gap-0.5">
        {theme.colors?.map((color, i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full shrink-0 border border-white/10"
            style={isMounted ? { backgroundColor: color } : undefined}
          />
        ))}
      </div>
      <span>{theme.name}</span>
    </button>
  );
});

export function ThemeCarousel({ isPaused = false }: ThemeCarouselProps) {
  const { currentTheme, setTheme } = useThemeConfig();
  const themes = AVAILABLE_THEMES;
  const isClient = useIsClient();
  const containerRef = useRef<HTMLDivElement>(null);

  // Performance optimizations: pause animation when not needed
  const isPageVisible = usePageVisibility();
  const isInViewport = useInViewport(containerRef);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Animation should only run when: not explicitly paused, page is visible, element is in viewport, and user doesn't prefer reduced motion
  const shouldAnimate =
    !isPaused && isPageVisible && isInViewport && !prefersReducedMotion;

  return (
    <div
      ref={containerRef}
      className="relative flex overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        // Use content-visibility for better performance
        contentVisibility: "auto",
        containIntrinsicSize: "auto 36px",
      }}
    >
      <div
        className={cn(
          "flex gap-2 hover:[animation-play-state:paused]",
          shouldAnimate ? "animate-marquee" : ""
        )}
        style={{
          animationDuration: "120s",
          // Only apply will-change when actually animating
          willChange: shouldAnimate ? "transform" : "auto",
          // Pause animation via CSS when not animating
          animationPlayState: shouldAnimate ? "running" : "paused",
        }}
      >
        {/* Reduced duplicates from 4x to 2x - still provides seamless loop with less DOM elements */}
        {[...(themes || []), ...(themes || [])].map((theme, i) => (
          <ThemeButton
            key={`${theme.id}-${i}`}
            theme={theme}
            isActive={currentTheme === theme.id}
            onClick={() => setTheme(theme.id)}
            isMounted={isClient}
          />
        ))}
      </div>
    </div>
  );
}
