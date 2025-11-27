// Client-only utility to detect and log when IndexedDB databases are deleted or disappear.
// This code is intentionally light and avoids making assumptions about other code.

import { toast } from "sonner";

export interface DBEventLogItem {
  type: "deleted" | "created" | "missing" | "found" | "error";
  name: string;
  timestamp: number;
  message?: string;
  userAgent?: string;
  href?: string;
  stack?: string | null;
}

const DB_MONITOR_KEY = "rss-reader-db-events";

function storeEvent(event: DBEventLogItem) {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined")
      return;
    const raw = localStorage.getItem(DB_MONITOR_KEY);
    const arr = raw ? (JSON.parse(raw) as DBEventLogItem[]) : [];
    arr.push(event);
    // Keep only the last 50 events to avoid storage bloat
    localStorage.setItem(DB_MONITOR_KEY, JSON.stringify(arr.slice(-50)));
  } catch (err) {
    console.warn("db-monitor: failed to persist event", err);
  }
}

// Return the current events
export function getDBEvents(): DBEventLogItem[] {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined")
      return [];
    const raw = localStorage.getItem(DB_MONITOR_KEY);
    return raw ? (JSON.parse(raw) as DBEventLogItem[]) : [];
  } catch (err) {
    console.warn("db-monitor: failed to read events", err);
    return [];
  }
}

// Clear events (not used automatically)
export function clearDBEvents() {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined")
      return;
    localStorage.removeItem(DB_MONITOR_KEY);
  } catch (err) {
    console.warn("db-monitor: failed to clear events", err);
  }
}

let watchIntervalId: number | null = null;
let prevExists: Map<string, boolean> = new Map();
let pollMs = 2000;

// Polls indexedDB.databases() (if available) and detect DB present/absent changes.
export function startDBWatch(options?: {
  dbNames?: string[]; // which DB names to monitor; if undefined, monitors "rss-reader-db"
  interval?: number;
  onEvent?: (e: DBEventLogItem) => void;
}) {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") return;

  const dbNamesToMonitor = options?.dbNames ?? ["rss-reader-db"];
  if (options?.interval) pollMs = options.interval;

  // Initialize prev state by checking current DBs once
  (async () => {
    try {
      // typed version of the databases() result
      type DBEntry = { name?: string };
      const indexedDBAny = indexedDB as unknown as {
        databases?: () => Promise<DBEntry[]>;
      };
      const list = await indexedDBAny.databases?.();
      const names = new Set(list?.map((d) => d.name));
      for (const name of dbNamesToMonitor) {
        const exists = names.has(name);
        prevExists.set(name, exists);
      }
    } catch {
      // If indexedDB.databases() is not supported, default assumptions
      for (const name of dbNamesToMonitor) {
        prevExists.set(name, true);
      }
    }
  })();

  if (watchIntervalId) {
    // Already running
    return;
  }

  watchIntervalId = window.setInterval(async () => {
    try {
      type DBEntry = { name?: string };
      const indexedDBAny = indexedDB as unknown as {
        databases?: () => Promise<DBEntry[]>;
      };
      const list = await indexedDBAny.databases?.();
      const names = new Set(list?.map((d) => d.name));

      for (const name of dbNamesToMonitor) {
        const exists = names.has(name);
        const prev = prevExists.get(name);
        // If prev === undefined, this is first poll: just set
        if (typeof prev === "undefined") {
          prevExists.set(name, exists);
          continue;
        }

        if (prev && !exists) {
          // DB was deleted
          const event = {
            type: "deleted" as const,
            name,
            timestamp: Date.now(),
            message: `IndexedDB database ${name} no longer present`,
            userAgent: navigator.userAgent,
            href: window.location.href,
            stack: new Error().stack ?? null,
          };
          console.warn("db-monitor: detected deletion", event);
          storeEvent(event);
          options?.onEvent?.(event);
          // Show a toast to the user in dev/test environment (not mandatory in production)
          try {
            toast?.warning?.(`IndexedDB ${name} removed`);
          } catch {
            /* ignore */
          }
        } else if (!prev && exists) {
          const event = {
            type: "created" as const,
            name,
            timestamp: Date.now(),
            message: `IndexedDB database ${name} appeared`,
            userAgent: navigator.userAgent,
            href: window.location.href,
            stack: new Error().stack ?? null,
          };
          console.info("db-monitor: detected creation", event);
          storeEvent(event);
          options?.onEvent?.(event);
        }

        prevExists.set(name, exists);
      }
    } catch (err) {
      const event = {
        type: "error" as const,
        name: "db-monitor",
        timestamp: Date.now(),
        message: `db-monitor polling error: ${
          (err as Error)?.message ?? String(err)
        }`,
        userAgent: navigator.userAgent,
        href: window.location.href,
        stack: ((err as Error)?.stack as string) ?? null,
      };
      console.error("db-monitor: poll error", err);
      storeEvent(event);
      options?.onEvent?.(event);
    }
  }, pollMs);
}

export function stopDBWatch() {
  if (watchIntervalId) {
    clearInterval(watchIntervalId);
    watchIntervalId = null;
    prevExists = new Map();
  }
}

// Simple helper to check DB existence right away
export async function checkDBExists(dbName = "rss-reader-db") {
  try {
    type DBEntry = { name?: string };
    const indexedDBAny = indexedDB as unknown as {
      databases?: () => Promise<DBEntry[]>;
    };
    const list = await indexedDBAny.databases?.();
    return list?.some((d) => d.name === dbName);
  } catch {
    try {
      // Fallback: try opening DB and see if it fails
      const req = indexedDB.open(dbName);
      return await new Promise((resolve) => {
        req.onsuccess = () => {
          req.result.close();
          resolve(true);
        };
        req.onerror = () => resolve(false);
        req.onupgradeneeded = () => {
          if (req.transaction) req.transaction.abort();
          resolve(true);
        };
      });
    } catch {
      return false;
    }
  }
}

// Export a simple log function so other modules can append events to the DB monitor log
export function logDBEvent(item: Omit<DBEventLogItem, "timestamp">) {
  if (typeof window === "undefined" || typeof localStorage === "undefined")
    return;
  const ev: DBEventLogItem = { ...item, timestamp: Date.now() };
  storeEvent(ev);
}
