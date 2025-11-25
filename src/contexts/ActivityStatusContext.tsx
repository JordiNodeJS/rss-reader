"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ActivityStatus =
  | "idle" // Verde - Sistema en reposo
  | "fetching-rss" // Azul - Obteniendo feeds RSS
  | "scraping" // Naranja - Haciendo scrape de artículo
  | "saving" // Púrpura - Guardando en IndexedDB
  | "error"; // Rojo - Error en alguna operación

export interface ActivityState {
  status: ActivityStatus;
  message?: string;
}

interface ActivityStatusContextType {
  activity: ActivityState;
  setActivity: (status: ActivityStatus, message?: string) => void;
  clearActivity: () => void;
}

const ActivityStatusContext = createContext<ActivityStatusContextType | null>(
  null
);

export function ActivityStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activity, setActivityState] = useState<ActivityState>({
    status: "idle",
  });

  const setActivity = useCallback(
    (status: ActivityStatus, message?: string) => {
      setActivityState({ status, message });
    },
    []
  );

  const clearActivity = useCallback(() => {
    setActivityState({ status: "idle" });
  }, []);

  return (
    <ActivityStatusContext.Provider
      value={{ activity, setActivity, clearActivity }}
    >
      {children}
    </ActivityStatusContext.Provider>
  );
}

export function useActivityStatus() {
  const context = useContext(ActivityStatusContext);
  if (!context) {
    throw new Error(
      "useActivityStatus must be used within ActivityStatusProvider"
    );
  }
  return context;
}

// Configuración de colores y labels para cada estado
export const ACTIVITY_CONFIG: Record<
  ActivityStatus,
  { color: string; pulseColor: string; label: string }
> = {
  idle: {
    color: "bg-green-500",
    pulseColor: "bg-green-400",
    label: "ONLINE",
  },
  "fetching-rss": {
    color: "bg-blue-500",
    pulseColor: "bg-blue-400",
    label: "FETCHING RSS",
  },
  scraping: {
    color: "bg-orange-500",
    pulseColor: "bg-orange-400",
    label: "SCRAPING",
  },
  saving: {
    color: "bg-purple-500",
    pulseColor: "bg-purple-400",
    label: "SAVING",
  },
  error: {
    color: "bg-red-500",
    pulseColor: "bg-red-400",
    label: "ERROR",
  },
};
