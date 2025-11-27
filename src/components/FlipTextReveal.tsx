"use client";

import { useRef, useCallback, useLayoutEffect, useEffect } from "react";
import gsap from "gsap";
import { TextPlugin } from "gsap/TextPlugin";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(TextPlugin);
}

// Characters used for the scramble effect (like flip board letters)
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789!@#$%&*";

/**
 * FlipHtmlReveal - Animates HTML content transition with a flip-board style effect
 * Uses cross-fade with blur for smooth HTML transitions
 */
interface FlipHtmlRevealProps {
  /** Original HTML content */
  originalHtml: string;
  /** Translated HTML content */
  translatedHtml: string;
  /** Whether to show translated version */
  showTranslation: boolean;
  /** Animation duration in seconds */
  duration?: number;
  /** CSS class for the prose container */
  className?: string;
  /** Called when animation completes */
  onComplete?: () => void;
}

export function FlipHtmlReveal({
  originalHtml,
  translatedHtml,
  showTranslation,
  duration = 0.6,
  className = "",
  onComplete,
}: FlipHtmlRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const originalRef = useRef<HTMLDivElement>(null);
  const translatedRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const previousShowTranslation = useRef(showTranslation);
  const isFirstRender = useRef(true);
  const previousHeight = useRef<number>(0);

  // Track container height changes to maintain the "last known stable height"
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use borderBoxSize if available for accurate height including padding/border
        if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
          previousHeight.current = entry.borderBoxSize[0].blockSize;
        } else {
          previousHeight.current = (entry.target as HTMLElement).offsetHeight;
        }
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, []);

  // Use layout effect for DOM manipulation to avoid flicker
  useLayoutEffect(() => {
    // Set initial state on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (originalRef.current && translatedRef.current) {
        gsap.set(originalRef.current, {
          opacity: showTranslation ? 0 : 1,
          display: showTranslation ? "none" : "block",
          visibility: "visible", // We use display:none now, so visibility can be visible
          y: 0,
          filter: "blur(0px)",
        });
        gsap.set(translatedRef.current, {
          opacity: showTranslation ? 1 : 0,
          display: showTranslation ? "block" : "none",
          visibility: "visible",
          y: 0,
          filter: "blur(0px)",
        });
        // Initialize height ref
        if (containerRef.current) {
          previousHeight.current = containerRef.current.offsetHeight;
        }
      }
      previousShowTranslation.current = showTranslation;
      return;
    }

    // Skip if value hasn't actually changed
    if (previousShowTranslation.current === showTranslation) {
      return;
    }
    previousShowTranslation.current = showTranslation;

    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }

    if (!originalRef.current || !translatedRef.current || !containerRef.current) return;

    const showEl = showTranslation
      ? translatedRef.current
      : originalRef.current;
    const hideEl = showTranslation
      ? originalRef.current
      : translatedRef.current;

    // Create the flip-board style animation
    const tl = gsap.timeline({
      onComplete: () => {
        // Ensure the hidden element is removed from layout
        gsap.set(hideEl, { display: "none" });
        onComplete?.();
      },
    });
    
    // --- HEIGHT ANIMATION ---
    // 1. Prepare the incoming element (make it part of layout but invisible)
    gsap.set(showEl, {
      display: "block",
      opacity: 0,
      y: 10, // Reduced from 20 to minimize movement
      filter: "blur(8px)",
      visibility: "visible",
    });

    // 2. Measure heights
    // The DOM now has both elements with display:block.
    // Grid height will be max(hideEl, showEl).
    // We want to animate from hideEl.height to showEl.height.
    // However, we only have the 'current composite height'.
    // We rely on previousHeight.current to be the height of the SINGLE visible element before this change.
    
    const newHeight = containerRef.current.offsetHeight;
    const oldHeight = previousHeight.current;
    
    // 3. Animate height if needed
    if (oldHeight > 0 && Math.abs(newHeight - oldHeight) > 2) {
      gsap.fromTo(
        containerRef.current,
        { height: oldHeight },
        {
          height: newHeight,
          duration: duration,
          ease: "power2.inOut",
          clearProps: "height"
        }
      );
    }

    // --- CONTENT ANIMATION ---
    // Animate out the old content
    tl.fromTo(hideEl, 
      { y: 0, filter: "blur(0px)", opacity: 1 },
      {
        opacity: 0,
        y: -10, // Reduced from 20
        filter: "blur(8px)",
        duration: duration * 0.45,
        ease: "power2.in",
      }
    );

    // Animate in the new content
    tl.to(
      showEl,
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: duration * 0.55,
        ease: "power2.out",
      },
      `-=${duration * 0.15}`
    );

    animationRef.current = tl;

    return () => {
      tl.kill();
    };
  }, [showTranslation, duration, onComplete]);

  // Calculate positions - using grid stack
  const commonStyle: React.CSSProperties = {
    gridArea: "1 / 1",
    width: "100%",
    height: "fit-content", // Ensure content height is respected
  };

  return (
    <div 
      ref={containerRef} 
      className={`grid items-start overflow-hidden ${className}`} 
      style={{ gridTemplateColumns: "100%" }} 
    >
      {/* Original content layer */}
      <div
        ref={originalRef}
        className="flip-html-layer"
        style={commonStyle}
        dangerouslySetInnerHTML={{ __html: originalHtml }}
      />

      {/* Translated content layer */}
      <div
        ref={translatedRef}
        className="flip-html-layer"
        style={commonStyle}
        dangerouslySetInnerHTML={{ __html: translatedHtml }}
      />
    </div>
  );
}

/**
 * FlipTitleReveal - Animates title with character scramble effect
 * Like an airport departure board or flip clock
 */
interface FlipTitleRevealProps {
  originalTitle: string;
  translatedTitle: string;
  showTranslation: boolean;
  duration?: number;
  className?: string;
}

export function FlipTitleReveal({
  originalTitle,
  translatedTitle,
  showTranslation,
  duration = 1.0,
  className = "",
}: FlipTitleRevealProps) {
  const titleRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const lastAnimatedState = useRef<{
    showTranslation: boolean;
    original: string;
    translated: string;
  } | null>(null);

  // Calculate target text based on current state
  const targetText = showTranslation ? translatedTitle : originalTitle;

  // Scramble function - creates the flip board effect
  const scrambleText = useCallback(
    (fromText: string, toText: string, progress: number): string => {
      const result: string[] = [];
      const maxLen = Math.max(fromText.length, toText.length);

      for (let i = 0; i < maxLen; i++) {
        // Each character reveals at a slightly different time (staggered)
        const charDelay = (i / maxLen) * 0.3;
        const charProgress = Math.min(
          1,
          Math.max(0, (progress - charDelay) / (1 - 0.3))
        );

        if (charProgress >= 1) {
          // Character fully revealed
          result.push(toText[i] || "");
        } else if (charProgress > 0) {
          // Character is scrambling
          const char = toText[i] || fromText[i] || "";
          if (char === " " || /[.,!?;:'"()\-–—]/.test(char)) {
            result.push(char);
          } else {
            // Random scramble character
            result.push(
              SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
            );
          }
        } else {
          // Character not yet started
          result.push(fromText[i] || " ");
        }
      }

      return result.join("");
    },
    []
  );

  useLayoutEffect(() => {
    const lastState = lastAnimatedState.current;
    const currentState = {
      showTranslation,
      original: originalTitle,
      translated: translatedTitle,
    };

    // First render or no change in toggle state
    if (!lastState) {
      lastAnimatedState.current = currentState;
      // State is already initialized, no need to update
      return;
    }

    // Check what changed
    const toggleChanged = lastState.showTranslation !== showTranslation;
    const textsChanged =
      lastState.original !== originalTitle ||
      lastState.translated !== translatedTitle;

    // Update the ref
    lastAnimatedState.current = currentState;

    // If texts changed but toggle didn't, update DOM directly
    if (textsChanged && !toggleChanged) {
      if (titleRef.current) {
        titleRef.current.textContent = targetText;
      }
      return;
    }

    // If toggle didn't change, nothing to animate
    if (!toggleChanged) {
      return;
    }

    // Kill existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }

    const fromText = showTranslation ? originalTitle : translatedTitle;
    const toText = showTranslation ? translatedTitle : originalTitle;

    // Skip animation if texts are the same
    if (fromText === toText) {
      if (titleRef.current) {
        titleRef.current.textContent = toText;
      }
      return;
    }

    // Animate the scramble effect using DOM directly
    const obj = { progress: 0 };

    animationRef.current = gsap.to(obj, {
      progress: 1,
      duration: duration,
      ease: "power1.inOut",
      onUpdate: () => {
        if (titleRef.current) {
          const scrambled = scrambleText(fromText, toText, obj.progress);
          titleRef.current.textContent = scrambled;
        }
      },
      onComplete: () => {
        if (titleRef.current) {
          titleRef.current.textContent = toText;
        }
      },
    });

    return () => {
      animationRef.current?.kill();
    };
  }, [
    showTranslation,
    originalTitle,
    translatedTitle,
    targetText,
    duration,
    scrambleText,
  ]);

  return (
    <span ref={titleRef} className={`flip-title ${className}`}>
      {targetText}
    </span>
  );
}

/**
 * Simple text reveal without scramble - just a clean fade/slide
 */
interface SimpleTextRevealProps {
  originalText: string;
  translatedText: string;
  showTranslation: boolean;
  duration?: number;
  className?: string;
}

export function SimpleTextReveal({
  originalText,
  translatedText,
  showTranslation,
  duration = 0.4,
  className = "",
}: SimpleTextRevealProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const previousShowTranslation = useRef(showTranslation);

  useLayoutEffect(() => {
    if (previousShowTranslation.current === showTranslation) return;
    previousShowTranslation.current = showTranslation;

    if (!textRef.current) return;

    const el = textRef.current;
    const toText = showTranslation ? translatedText : originalText;

    gsap.to(el, {
      opacity: 0,
      y: -5,
      duration: duration * 0.4,
      ease: "power2.in",
      onComplete: () => {
        el.textContent = toText;
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: duration * 0.6,
          ease: "power2.out",
        });
      },
    });
  }, [showTranslation, originalText, translatedText, duration]);

  return (
    <span ref={textRef} className={className}>
      {showTranslation ? translatedText : originalText}
    </span>
  );
}
