"use client";

import { useEffect, useState } from "react";
import { Rss } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeCarousel } from "@/components/ThemeCarousel";
import { cn } from "@/lib/utils";
import {
  useActivityStatus,
  ACTIVITY_CONFIG,
} from "@/contexts/ActivityStatusContext";

export function BrandingBanner() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { activity } = useActivityStatus();
  const activityConfig = ACTIVITY_CONFIG[activity.status];

  useEffect(() => {
    // Prefer the explicit scroll container id, fallback to `main > div.overflow-y-auto`, otherwise listen on window
    const candidates = ["#app-scroll", "main > div.overflow-y-auto"];
    let scrollContainer: HTMLElement | null = null;
    for (const sel of candidates) {
      const found = document.querySelector(sel);
      if (found) {
        scrollContainer = found as HTMLElement;
        break;
      }
    }

    let useWindow = false;
    if (!scrollContainer) {
      useWindow = true;
    }

    const onScroll = () => {
      if (useWindow) {
        setIsScrolled(window.scrollY > 20);
      } else if (scrollContainer) {
        setIsScrolled(scrollContainer.scrollTop > 20);
      }
    };

    onScroll();
    if (useWindow) {
      window.addEventListener("scroll", onScroll);
    } else {
      scrollContainer!.addEventListener("scroll", onScroll);
    }

    return () => {
      if (useWindow) window.removeEventListener("scroll", onScroll);
      else scrollContainer!.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      className={cn(
        "w-full relative overflow-hidden shadow-lg z-50 group sticky top-0",
        isScrolled ? "h-16 md:h-20" : "h-28 md:h-32",
        "transition-[height,box-shadow] duration-300"
      )}
    >
      {/* Hero Background Image */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: "url(/banner-image.png)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
      </div>

      {/* Theme Carousel - subtle strip at bottom, visible only when expanded */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 z-20 py-1.5 bg-background/40 backdrop-blur-sm border-t border-border/20",
          "transition-all duration-300",
          isScrolled
            ? "opacity-0 translate-y-2 pointer-events-none"
            : "opacity-100 translate-y-0"
        )}
      >
        <ThemeCarousel isPaused={isScrolled} />
      </div>

      <div className="container mx-auto px-4 h-full flex items-start pt-3 md:pt-4 justify-between relative z-10">
        <div
          className={cn("flex items-center gap-4 md:gap-6", "pl-16 md:pl-0")}
        >
          <div
            id="rss-icon-container"
            className="bg-background/80 p-3 md:p-4 rounded-xl backdrop-blur-md shadow-2xl border border-border/50 transform transition-transform hover:rotate-3 ml-2 md:ml-0"
          >
            <Rss
              className={cn(
                "text-primary animate-pulse transition-all duration-300",
                isScrolled ? "w-5 h-5 md:w-6 md:h-6" : "w-8 h-8 md:w-10 md:h-10"
              )}
            />
          </div>
          <div className="flex flex-col">
            <h1
              className={cn(
                "font-black tracking-tighter leading-none text-foreground drop-shadow-sm transition-all duration-300",
                isScrolled ? "text-xl md:text-2xl" : "text-3xl md:text-5xl"
              )}
            >
              RSS <span className="text-primary">READER</span>
            </h1>
            <span
              className={cn(
                "text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-muted-foreground mt-1 transition-all duration-300",
                isScrolled
                  ? "opacity-0 h-0 overflow-hidden translate-y-[-4px]"
                  : "opacity-100"
              )}
            >
              Level Up Your Feed
            </span>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center bg-background/80 rounded-full backdrop-blur-md border border-border/50 shadow-lg transition-all duration-500 ease-in-out",
            isScrolled ? "gap-2 pl-3 pr-2 py-1.5" : "gap-4 pl-6 pr-2 py-2"
          )}
        >
          <div className="hidden md:flex items-center">
            <div className="flex flex-col items-end">
              <span
                className={cn(
                  "text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap transition-all duration-500 ease-in-out overflow-hidden",
                  isScrolled
                    ? "w-0 opacity-0 h-0"
                    : "w-auto opacity-100 h-auto mb-1"
                )}
              >
                System Status
              </span>
              <div
                className={cn(
                  "flex items-center transition-all duration-500 ease-in-out",
                  isScrolled ? "gap-0" : "gap-2"
                )}
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0 transition-colors duration-300",
                    activityConfig.color,
                    activity.status !== "idle" && "animate-pulse"
                  )}
                  title={activity.message || activityConfig.label}
                />
                <span
                  className={cn(
                    "text-sm font-bold text-foreground/80 transition-all duration-500 ease-in-out overflow-hidden",
                    isScrolled ? "w-0 opacity-0" : "w-auto opacity-100"
                  )}
                >
                  {activityConfig.label}
                </span>
              </div>
            </div>
          </div>
          <div
            className={cn(
              "transition-transform duration-500 ease-in-out",
              isScrolled ? "scale-90" : "scale-100"
            )}
          >
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
