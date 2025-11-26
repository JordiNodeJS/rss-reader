"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { loadTheme } from "@/lib/theme-loader";

export type ThemeName =
  | "amber-minimal"
  | "amethyst-haze"
  | "bold-tech"
  | "bubblegum"
  | "caffeine"
  | "candyland"
  | "catppuccin"
  | "claude"
  | "claymorphism"
  | "clean-slate"
  | "cosmic-night"
  | "cyberpunk"
  | "darkmatter"
  | "doom-64"
  | "elegant-luxury"
  | "graphite"
  | "kodama-grove"
  | "midnight-bloom"
  | "mocha-mousse"
  | "modern-minimal"
  | "mono"
  | "nature"
  | "neo-brutalism"
  | "northern-lights"
  | "notebook"
  | "ocean-breeze"
  | "pastel-dreams"
  | "perpetuity"
  | "quantum-rose"
  | "retro-arcade"
  | "sage-garden"
  | "soft-pop"
  | "solar-dusk"
  | "starry-night"
  | "sunset-horizon"
  | "supabase"
  | "t3-chat"
  | "tangerine"
  | "twitter"
  | "vercel"
  | "vintage-paper"
  | "violet-bloom";

export interface ThemeConfig {
  id: ThemeName;
  name: string;
  colors: string[]; // Preview colors for the theme button
}

export const AVAILABLE_THEMES: ThemeConfig[] = [
  {
    id: "amber-minimal",
    name: "Amber Minimal",
    colors: ["#d4a656","#f5f5f5","#8b7355"],
  },
  {
    id: "amethyst-haze",
    name: "Amethyst Haze",
    colors: ["#9276b2","#e09cb7","#6ecba6"],
  },
  {
    id: "bold-tech",
    name: "Bold Tech",
    colors: ["#8b5cf6","#c4b5fd","#60a5fa"],
  },
  {
    id: "bubblegum",
    name: "Bubblegum",
    colors: ["#ec4899","#60d5d5","#fbbf24"],
  },
  {
    id: "caffeine",
    name: "Caffeine",
    colors: ["#6b4423","#f5e6d3","#d4a574"],
  },
  {
    id: "candyland",
    name: "Candyland",
    colors: ["#ffc0cb","#87ceeb","#ffff00"],
  },
  {
    id: "catppuccin",
    name: "Catppuccin",
    colors: ["#cba6f7","#89b4fa","#a6e3a1"],
  },
  {
    id: "claude",
    name: "Claude",
    colors: ["#c87849","#7d6eb4","#e0d1b3"],
  },
  {
    id: "claymorphism",
    name: "Claymorphism",
    colors: ["#6366f1","#fafafa","#e5e7eb"],
  },
  {
    id: "clean-slate",
    name: "Clean Slate",
    colors: ["#3b82f6","#f8fafc","#e2e8f0"],
  },
  {
    id: "cosmic-night",
    name: "Cosmic Night",
    colors: ["#8b5cf6","#0f0f1e","#ff6b9d"],
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    colors: ["#ff00ff","#00ffff","#ffff00"],
  },
  {
    id: "darkmatter",
    name: "Dark Matter",
    colors: ["#7c3aed","#0a0a0a","#22d3ee"],
  },
  {
    id: "doom-64",
    name: "Doom 64",
    colors: ["#ff4444","#1a1a1a","#44ff44"],
  },
  {
    id: "elegant-luxury",
    name: "Elegant Luxury",
    colors: ["#d4af37","#1a1a1a","#f5f5f5"],
  },
  {
    id: "graphite",
    name: "Graphite",
    colors: ["#6b7280","#1f2937","#9ca3af"],
  },
  {
    id: "kodama-grove",
    name: "Kodama Grove",
    colors: ["#22c55e","#ecfdf5","#166534"],
  },
  {
    id: "midnight-bloom",
    name: "Midnight Bloom",
    colors: ["#c026d3","#1e1b4b","#f0abfc"],
  },
  {
    id: "mocha-mousse",
    name: "Mocha Mousse",
    colors: ["#9b7c49","#b8a46f","#a88d5f"],
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    colors: ["#18181b","#fafafa","#71717a"],
  },
  {
    id: "mono",
    name: "Mono",
    colors: ["#000000","#ffffff","#737373"],
  },
  {
    id: "nature",
    name: "Nature",
    colors: ["#4ade80","#f0fdf4","#166534"],
  },
  {
    id: "neo-brutalism",
    name: "Neo Brutalism",
    colors: ["#facc15","#000000","#ffffff"],
  },
  {
    id: "northern-lights",
    name: "Northern Lights",
    colors: ["#22d3ee","#1e293b","#a78bfa"],
  },
  {
    id: "notebook",
    name: "Notebook",
    colors: ["#3b82f6","#fef9c3","#f87171"],
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    colors: ["#0ea5e9","#f0f9ff","#0369a1"],
  },
  {
    id: "pastel-dreams",
    name: "Pastel Dreams",
    colors: ["#f9a8d4","#fbcfe8","#c4b5fd"],
  },
  {
    id: "perpetuity",
    name: "Perpetuity",
    colors: ["#6366f1","#0f172a","#22d3ee"],
  },
  {
    id: "quantum-rose",
    name: "Quantum Rose",
    colors: ["#f43f5e","#fff1f2","#be123c"],
  },
  {
    id: "retro-arcade",
    name: "Retro Arcade",
    colors: ["#ea0093","#00c2b9","#fba628"],
  },
  {
    id: "sage-garden",
    name: "Sage Garden",
    colors: ["#7ba876","#a8c798","#8fb88b"],
  },
  {
    id: "soft-pop",
    name: "Soft Pop",
    colors: ["#f472b6","#fce7f3","#7c3aed"],
  },
  {
    id: "solar-dusk",
    name: "Solar Dusk",
    colors: ["#f97316","#fef3c7","#ea580c"],
  },
  {
    id: "starry-night",
    name: "Starry Night",
    colors: ["#6366f1","#0c0a1d","#fbbf24"],
  },
  {
    id: "sunset-horizon",
    name: "Sunset Horizon",
    colors: ["#f97316","#fdf4ff","#ec4899"],
  },
  {
    id: "supabase",
    name: "Supabase",
    colors: ["#3ecf8e","#1c1c1c","#9333ea"],
  },
  {
    id: "t3-chat",
    name: "T3 Chat",
    colors: ["#e879f9","#0a0a0a","#22d3ee"],
  },
  {
    id: "tangerine",
    name: "Tangerine",
    colors: ["#e05d38","#f3f4f6","#d6e4f0"],
  },
  {
    id: "twitter",
    name: "Twitter",
    colors: ["#1d9bf0","#15202b","#ffffff"],
  },
  {
    id: "vercel",
    name: "Vercel",
    colors: ["#000000","#ffffff","#888888"],
  },
  {
    id: "vintage-paper",
    name: "Vintage Paper",
    colors: ["#92400e","#fef3c7","#d97706"],
  },
  {
    id: "violet-bloom",
    name: "Violet Bloom",
    colors: ["#8b5cf6","#faf5ff","#c4b5fd"],
  }
];

interface ThemeStore {
  currentTheme: ThemeName;
  isLoading: boolean;
  setTheme: (theme: ThemeName) => void;
}

export const useThemeConfig = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: "retro-arcade",
      isLoading: false,
      setTheme: (theme) => {
        // No hacer nada si ya es el tema actual o si está cargando
        const state = get();
        if (state.currentTheme === theme || state.isLoading) {
          return;
        }

        // Indicar que estamos cargando (pero no bloquear la UI)
        set({ isLoading: true });

        // Cargar el CSS primero, ANTES de cambiar las clases
        // Esto evita el flash de contenido sin estilos
        loadTheme(theme)
          .then(() => {
            // Solo aplicar clases DESPUÉS de que el CSS haya cargado
            if (typeof document !== "undefined") {
              const root = document.documentElement;

              // Remove all theme classes
              AVAILABLE_THEMES.forEach((t) => {
                root.classList.remove(`theme-${t.id}`);
              });

              // Add the selected theme class
              root.classList.add(`theme-${theme}`);
            }

            // Actualizar estado
            set({ currentTheme: theme, isLoading: false });
          })
          .catch(() => {
            // En caso de error, resetear el estado de carga
            set({ isLoading: false });
          });
      },
    }),
    {
      name: "rss-reader-theme-config",
      // Solo persistir currentTheme, NO isLoading
      partialize: (state) => ({ currentTheme: state.currentTheme }),
      onRehydrateStorage: () => (state) => {
        // Apply theme class and load CSS on initialization
        if (state && typeof document !== "undefined") {
          const root = document.documentElement;
          root.classList.add(`theme-${state.currentTheme}`);

          // Load the theme CSS
          loadTheme(state.currentTheme);
          
          // Explicitly reset isLoading after hydration
          // This prevents the loading spinner from showing during initial mount
          state.isLoading = false;
        }
      },
    }
  )
);
