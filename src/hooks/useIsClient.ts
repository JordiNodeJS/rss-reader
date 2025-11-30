"use client";

import { useSyncExternalStore } from "react";

// ============================================================
// Hydration-safe client detection hook
// Uses useSyncExternalStore to avoid hydration mismatches
// See: https://react.dev/reference/react/useSyncExternalStore
// ============================================================

// Stable function references for useSyncExternalStore
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Hook to detect client-side rendering without hydration issues.
 * Returns false during SSR and initial hydration, true after hydration.
 * 
 * Use this when you need to conditionally render content that differs
 * between server and client, such as inline styles that browser extensions
 * (like Dark Reader) might modify.
 * 
 * @example
 * const isClient = useIsClient();
 * // Only apply inline styles on client to avoid hydration mismatch
 * <span style={isClient ? { backgroundColor: color } : undefined} />
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );
}
