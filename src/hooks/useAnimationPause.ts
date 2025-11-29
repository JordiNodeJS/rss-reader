"use client";

import {
  useEffect,
  useState,
  useRef,
  RefObject,
  useSyncExternalStore,
} from "react";

// --- Page Visibility ---
const pageVisibilitySubscribe = (callback: () => void) => {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
};

const getPageVisibilitySnapshot = () => document.visibilityState === "visible";
const getPageVisibilityServerSnapshot = () => true;

/**
 * Hook to detect page visibility - pauses animations when tab is hidden.
 * This saves CPU/GPU resources when the user is not viewing the page.
 */
export function usePageVisibility(): boolean {
  return useSyncExternalStore(
    pageVisibilitySubscribe,
    getPageVisibilitySnapshot,
    getPageVisibilityServerSnapshot
  );
}

// --- Prefers Reduced Motion ---
const createReducedMotionSubscribe = () => {
  let mediaQuery: MediaQueryList | null = null;

  return (callback: () => void) => {
    mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    mediaQuery.addEventListener("change", callback);
    return () => mediaQuery?.removeEventListener("change", callback);
  };
};

const reducedMotionSubscribe = createReducedMotionSubscribe();
const getReducedMotionSnapshot = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getReducedMotionServerSnapshot = () => false;

/**
 * Hook to reduce motion for users who prefer reduced motion.
 * Respects the prefers-reduced-motion media query.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    reducedMotionSubscribe,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
}

/**
 * Hook to detect if an element is in the viewport using IntersectionObserver.
 * Useful for pausing animations on off-screen elements.
 *
 * @param ref - Reference to the element to observe
 * @param rootMargin - Margin around the root (viewport). Defaults to "50px" to start animation slightly before visible.
 */
export function useInViewport(
  ref: RefObject<HTMLElement | null>,
  rootMargin: string = "50px"
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return isIntersecting;
}

/**
 * Combined hook for animation performance optimization.
 * Returns true only when animations should be running:
 * - Page is visible (tab is active)
 * - Element is in viewport (optional)
 * - Not explicitly paused
 * - User doesn't prefer reduced motion
 *
 * @param ref - Optional reference to an element to check viewport visibility
 * @param isPaused - External pause control
 * @returns boolean - Whether animations should run
 */
export function useAnimationPause(
  ref?: RefObject<HTMLElement | null>,
  isPaused: boolean = false
): boolean {
  const isPageVisible = usePageVisibility();
  const prefersReducedMotion = usePrefersReducedMotion();
  const fallbackRef = useRef<HTMLElement>(null);
  const actualRef = ref || fallbackRef;
  const isInViewport = useInViewport(actualRef);

  // If no ref provided, ignore viewport check
  const viewportCheck = ref ? isInViewport : true;

  return !isPaused && isPageVisible && viewportCheck && !prefersReducedMotion;
}
