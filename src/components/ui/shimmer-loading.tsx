"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShimmerLoadingProps {
  message: string;
  subtitle?: string;
  className?: string;
  /** Size of the icon */
  iconSize?: "sm" | "md" | "lg";
  /** Variant changes the shimmer color scheme */
  variant?: "default" | "purple" | "green" | "blue";
}

/**
 * ShimmerLoading - A loading indicator with animated shimmer effect
 *
 * Displays a message with a sweeping shine/shimmer animation on the background
 * to indicate processing is in progress. Similar to skeleton loaders but with
 * a more polished shine effect.
 */
export function ShimmerLoading({
  message,
  subtitle,
  className,
  iconSize = "md",
  variant = "purple",
}: ShimmerLoadingProps) {
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const variantStyles = {
    default: {
      container: "bg-muted/30 border-muted/50",
      icon: "text-muted-foreground",
      text: "text-foreground",
      subtitle: "text-muted-foreground",
      shimmer: "shimmer-default",
    },
    purple: {
      container: "bg-purple-500/10 border-purple-500/30",
      icon: "text-purple-500",
      text: "text-purple-700 dark:text-purple-300",
      subtitle: "text-purple-600/70 dark:text-purple-400/70",
      shimmer: "shimmer-purple",
    },
    green: {
      container: "bg-green-500/10 border-green-500/30",
      icon: "text-green-500",
      text: "text-green-700 dark:text-green-300",
      subtitle: "text-green-600/70 dark:text-green-400/70",
      shimmer: "shimmer-green",
    },
    blue: {
      container: "bg-blue-500/10 border-blue-500/30",
      icon: "text-blue-500",
      text: "text-blue-700 dark:text-blue-300",
      subtitle: "text-blue-600/70 dark:text-blue-400/70",
      shimmer: "shimmer-blue",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border px-4 py-3",
        styles.container,
        className
      )}
    >
      {/* Shimmer effect overlay */}
      <div
        className={cn("shimmer-effect absolute inset-0", styles.shimmer)}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-3">
        <Loader2
          className={cn(
            iconSizes[iconSize],
            styles.icon,
            "animate-spin flex-shrink-0"
          )}
        />
        <div className="flex flex-col min-w-0">
          <span className={cn("font-medium text-sm", styles.text)}>
            {message}
          </span>
          {subtitle && (
            <span className={cn("text-xs", styles.subtitle)}>{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline shimmer for compact spaces (e.g., in article metadata bar)
 */
export function ShimmerLoadingInline({
  message,
  className,
  variant = "purple",
}: Omit<ShimmerLoadingProps, "subtitle" | "iconSize">) {
  const variantStyles = {
    default: {
      container: "bg-muted/20",
      icon: "text-muted-foreground",
      text: "text-muted-foreground",
      shimmer: "shimmer-default",
    },
    purple: {
      container: "bg-purple-500/10",
      icon: "text-purple-500",
      text: "text-purple-600 dark:text-purple-400",
      shimmer: "shimmer-purple",
    },
    green: {
      container: "bg-green-500/10",
      icon: "text-green-500",
      text: "text-green-600 dark:text-green-400",
      shimmer: "shimmer-green",
    },
    blue: {
      container: "bg-blue-500/10",
      icon: "text-blue-500",
      text: "text-blue-600 dark:text-blue-400",
      shimmer: "shimmer-blue",
    },
  };

  const styles = variantStyles[variant];

  return (
    <span
      className={cn(
        "relative overflow-hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm",
        styles.container,
        className
      )}
    >
      {/* Shimmer effect overlay */}
      <span
        className={cn("shimmer-effect absolute inset-0", styles.shimmer)}
        aria-hidden="true"
      />

      {/* Content */}
      <Loader2
        className={cn(
          "w-3 h-3 animate-spin flex-shrink-0 relative z-10",
          styles.icon
        )}
      />
      <span className={cn("relative z-10 line-clamp-1", styles.text)}>
        {message}
      </span>
    </span>
  );
}
