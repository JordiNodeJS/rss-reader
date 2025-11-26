"use client";

import { useRef, useCallback, useMemo, useLayoutEffect } from "react";
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

  // Use layout effect for DOM manipulation to avoid flicker
  useLayoutEffect(() => {
    // Set initial state on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (originalRef.current && translatedRef.current) {
        gsap.set(originalRef.current, {
          opacity: showTranslation ? 0 : 1,
          visibility: showTranslation ? "hidden" : "visible",
          y: 0,
          filter: "blur(0px)",
        });
        gsap.set(translatedRef.current, {
          opacity: showTranslation ? 1 : 0,
          visibility: showTranslation ? "visible" : "hidden",
          y: 0,
          filter: "blur(0px)",
        });
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

    if (!originalRef.current || !translatedRef.current) return;

    const showEl = showTranslation
      ? translatedRef.current
      : originalRef.current;
    const hideEl = showTranslation
      ? originalRef.current
      : translatedRef.current;

    // Create the flip-board style animation with more visible effect
    const tl = gsap.timeline({
      onComplete: () => {
        onComplete?.();
      },
    });

    // Initial state for incoming element - more dramatic starting position
    gsap.set(showEl, {
      opacity: 0,
      y: 40,
      filter: "blur(8px)",
      visibility: "visible",
    });

    // Animate out the old content with a more visible "flip up" feel
    tl.to(hideEl, {
      opacity: 0,
      y: -40,
      filter: "blur(8px)",
      duration: duration * 0.45,
      ease: "power2.in",
    });

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

    // Hide the old element after animation
    tl.set(hideEl, { visibility: "hidden" });

    animationRef.current = tl;

    return () => {
      tl.kill();
    };
  }, [showTranslation, duration, onComplete]);

  // Calculate positions - the visible one is relative, hidden is absolute
  const originalStyle = useMemo(
    (): React.CSSProperties => ({
      position: showTranslation ? "absolute" : "relative",
      top: 0,
      left: 0,
      right: 0,
    }),
    [showTranslation]
  );

  const translatedStyle = useMemo(
    (): React.CSSProperties => ({
      position: !showTranslation ? "absolute" : "relative",
      top: 0,
      left: 0,
      right: 0,
    }),
    [showTranslation]
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Original content layer */}
      <div
        ref={originalRef}
        className="flip-html-layer"
        style={originalStyle}
        dangerouslySetInnerHTML={{ __html: originalHtml }}
      />

      {/* Translated content layer */}
      <div
        ref={translatedRef}
        className="flip-html-layer"
        style={translatedStyle}
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
