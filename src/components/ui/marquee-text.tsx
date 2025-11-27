"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MarqueeTextProps {
  text: string;
  className?: string;
  /** Delay in seconds before starting the scroll animation */
  delay?: number;
  /** Duration of the scroll animation in seconds per 100px of overflow */
  durationPerHundredPx?: number;
  /** Pause duration at the end before restarting in seconds */
  pauseDuration?: number;
}

/**
 * A text component that detects overflow and shows:
 * 1. A smooth horizontal scroll animation using CSS after a delay
 * 2. A tooltip on hover showing the full text
 */
export function MarqueeText({
  text,
  className,
  delay = 2,
  durationPerHundredPx = 2.5,
  pauseDuration = 1.5,
}: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [overflowAmount, setOverflowAmount] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  // Check if text is overflowing
  const checkOverflow = useCallback(() => {
    if (containerRef.current && textRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const textWidth = textRef.current.scrollWidth;
      const overflow = textWidth > containerWidth;
      const newOverflowAmount = overflow ? textWidth - containerWidth + 12 : 0;

      setIsOverflowing(overflow);
      setOverflowAmount(newOverflowAmount);
      // Reset animation when overflow changes
      setAnimationKey((prev) => prev + 1);
    }
  }, []);

  // Check overflow on mount and text change
  useEffect(() => {
    checkOverflow();

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [text, checkOverflow]);

  // Calculate animation duration based on overflow amount
  const scrollDuration = Math.max(
    2,
    (overflowAmount / 100) * durationPerHundredPx
  );
  const totalDuration = delay + scrollDuration + pauseDuration;

  // Generate unique keyframe name based on overflow amount
  const keyframeName = `marquee-${animationKey}`;

  // Calculate percentages for keyframe timings
  const delayPercent = (delay / totalDuration) * 100;
  const scrollEndPercent = ((delay + scrollDuration) / totalDuration) * 100;

  const content = (
    <div
      ref={containerRef}
      className={cn("overflow-hidden whitespace-nowrap", className)}
    >
      {isOverflowing && (
        <style>
          {`
            @keyframes ${keyframeName} {
              0%, ${delayPercent.toFixed(1)}% {
                transform: translateX(0);
              }
              ${scrollEndPercent.toFixed(1)}%, 100% {
                transform: translateX(-${overflowAmount}px);
              }
            }
          `}
        </style>
      )}
      <span
        ref={textRef}
        className="inline-block"
        style={
          isOverflowing
            ? {
                animation: `${keyframeName} ${totalDuration}s ease-in-out infinite`,
              }
            : undefined
        }
      >
        {text}
      </span>
    </div>
  );

  // Only show tooltip if text is overflowing
  if (isOverflowing) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p className="whitespace-normal break-words">{text}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
