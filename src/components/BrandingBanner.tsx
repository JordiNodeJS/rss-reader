"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Rss, HelpCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ThemeCarousel } from "@/components/ThemeCarousel";
import { cn } from "@/lib/utils";
import {
  useActivityStatus,
  ACTIVITY_CONFIG,
} from "@/contexts/ActivityStatusContext";

export function BrandingBanner() {
  const { activity } = useActivityStatus();
  const activityConfig = ACTIVITY_CONFIG[activity.status];

  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  // Mouse Parallax Effect - optimized with quickSetter
  useEffect(() => {
    if (!containerRef.current) return;

    // Use GSAP quickSetter for better performance
    const setBgX = bgRef.current
      ? gsap.quickSetter(bgRef.current, "x", "px")
      : null;
    const setBgY = bgRef.current
      ? gsap.quickSetter(bgRef.current, "y", "px")
      : null;
    const setContentX = contentRef.current
      ? gsap.quickSetter(contentRef.current, "x", "px")
      : null;
    const setContentY = contentRef.current
      ? gsap.quickSetter(contentRef.current, "y", "px")
      : null;
    const setIconRotY = iconRef.current
      ? gsap.quickSetter(iconRef.current, "rotationY", "deg")
      : null;
    const setIconRotX = iconRef.current
      ? gsap.quickSetter(iconRef.current, "rotationX", "deg")
      : null;

    let rafId: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;

        // Normalized position with smoothing
        const targetX = (clientX / innerWidth - 0.5) * 2;
        const targetY = (clientY / innerHeight - 0.5) * 2;

        // Lerp for smoother transitions
        lastX += (targetX - lastX) * 0.1;
        lastY += (targetY - lastY) * 0.1;

        // Apply transforms directly (no tweening)
        if (setBgX && setBgY) {
          setBgX(lastX * -20);
          setBgY(lastY * -10);
        }
        if (setContentX && setContentY) {
          setContentX(lastX * 10);
          setContentY(lastY * 5);
        }
        if (setIconRotY && setIconRotX) {
          setIconRotY(lastX * 15);
          setIconRotX(-lastY * 15);
        }

        rafId = null;
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Entrance Animation - per-letter animation
  useEffect(() => {
    if (!containerRef.current || hasAnimated.current) return;
    hasAnimated.current = true;
    const title = titleRef.current;
    const bg = bgRef.current;
    const icon = iconRef.current;

    if (!bg || !icon || !title) return;

    // Split text into individual letter spans
    const rssText = "RSS";
    const readerText = "READER";

    const rssSpan = title.querySelector(".title-rss");
    const readerSpan = title.querySelector(".title-reader");

    if (rssSpan && readerSpan) {
      // Create letter spans for RSS
      rssSpan.innerHTML = rssText
        .split("")
        .map(
          (letter) =>
            `<span class="letter" style="display: inline-block;">${letter}</span>`
        )
        .join("");

      // Create letter spans for READER
      readerSpan.innerHTML = readerText
        .split("")
        .map(
          (letter) =>
            `<span class="letter" style="display: inline-block;">${letter}</span>`
        )
        .join("");
    }

    const allLetters = title.querySelectorAll(".letter");

    // Initial states
    gsap.set(bg, { scale: 1.15, opacity: 0 });
    gsap.set(containerRef.current, { perspective: 1200 });
    gsap.set(allLetters, {
      opacity: 0,
      y: -100,
      rotationX: -90,
      rotationY: () => gsap.utils.random(-45, 45),
      scale: 0.3,
      transformOrigin: "50% 50%",
    });
    gsap.set(icon, {
      scale: 0,
      rotation: -360,
      opacity: 0,
    });

    const tl = gsap.timeline();

    // Background entrance
    tl.to(bg, {
      scale: 1.1,
      opacity: 1,
      duration: 0.6,
      ease: "power2.out",
    })
      // Icon with bounce
      .to(
        icon,
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 0.8,
          ease: "back.out(2)",
        },
        "-=0.3"
      )
      // Letters with stagger - cada letra entra con efecto diferente
      .to(
        allLetters,
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          rotationY: 0,
          scale: 1,
          duration: 0.6,
          ease: "back.out(1.7)",
          stagger: {
            amount: 0.5,
            from: "start",
            ease: "power2.inOut",
          },
        },
        "-=0.4"
      );

    // Subtle breathing background
    gsap.to(bg, {
      scale: 1.12,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 1,
    });

    // Hover effect on letters
    allLetters.forEach((letter) => {
      // Get the computed primary color to avoid CSS variable issues in GSAP
      const computedStyle = window.getComputedStyle(letter);
      const primaryColor =
        computedStyle.getPropertyValue("--primary") ||
        computedStyle.color ||
        "#3b82f6"; // fallback to blue-500

      letter.addEventListener("mouseenter", () => {
        gsap.to(letter, {
          scale: 1.3,
          color: primaryColor,
          duration: 0.3,
          ease: "back.out(2)",
        });
      });

      letter.addEventListener("mouseleave", () => {
        gsap.to(letter, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
        });
      });
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full relative overflow-hidden shadow-lg z-50 group sticky top-0 h-28 md:h-32 bg-background"
    >
      {/* Hero Background Image */}
      <div
        ref={bgRef}
        className="absolute inset-[-20px] w-[calc(100%+40px)] h-[calc(100%+40px)] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/banner-image.png)",
          willChange: "transform, opacity",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
      </div>

      {/* Theme Carousel */}
      <div className="absolute bottom-0 left-0 right-0 z-20 py-1.5 bg-background/40 backdrop-blur-sm border-t border-border/20">
        <ThemeCarousel isPaused={false} />
      </div>

      <div
        ref={contentRef}
        className="container mx-auto px-4 h-full flex items-start pt-4 justify-between relative z-10"
        style={{ willChange: "transform" }}
      >
        <div className="flex items-center gap-4 md:gap-6 pl-0">
          <div
            ref={iconRef}
            id="rss-icon-container"
            className="bg-background/80 p-2 md:p-3 rounded-xl backdrop-blur-md shadow-2xl border border-border/50"
            style={{ willChange: "transform" }}
          >
            <Rss className="text-primary w-7 h-7 md:w-9 md:h-9" />
          </div>
          <div className="flex flex-col">
            <h1
              ref={titleRef}
              className="font-black tracking-tighter leading-none text-foreground drop-shadow-sm text-3xl md:text-5xl"
              style={{ transformStyle: "preserve-3d" }}
            >
              <span
                className="title-rss inline-block origin-bottom"
                style={{ willChange: "transform, opacity" }}
              >
                RSS
              </span>{" "}
              <span
                className="title-reader text-primary inline-block origin-bottom"
                style={{ willChange: "transform, opacity" }}
              >
                READER
              </span>
            </h1>
            <span className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-muted-foreground mt-1">
              Level Up Your Feed
            </span>
          </div>
        </div>

        <div className="flex items-center bg-background/80 rounded-full backdrop-blur-md border border-border/50 shadow-lg gap-4 pl-6 pr-2 py-2">
          <div className="hidden md:flex items-center">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap mb-1">
                System Status
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0 transition-colors duration-300",
                    activityConfig.color,
                    activity.status !== "idle" && "animate-pulse"
                  )}
                  title={activity.message || activityConfig.label}
                />
                <span className="text-sm font-bold text-foreground/80">
                  {activityConfig.label}
                </span>
              </div>
            </div>
          </div>
          <Link href="/help" title="Centro de Ayuda">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-primary/10 h-9 w-9"
            >
              <HelpCircle className="text-muted-foreground hover:text-primary transition-colors h-5 w-5" />
            </Button>
          </Link>
          <div className="scale-100">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
