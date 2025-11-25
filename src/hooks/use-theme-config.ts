"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 
  | 'retro-arcade'
  | 'mocha-mousse'
  | 'amethyst-haze'
  | 'claude'
  | 'sage-garden'
  | 'tangerine';

export interface ThemeConfig {
  id: ThemeName;
  name: string;
  colors: string[]; // Preview colors for the theme button
}

export const AVAILABLE_THEMES: ThemeConfig[] = [
  {
    id: 'retro-arcade',
    name: 'Retro Arcade',
    colors: ['#ea0093', '#00c2b9', '#fba628'], // Primary, Secondary, Accent
  },
  {
    id: 'mocha-mousse',
    name: 'Mocha Mousse',
    colors: ['#9b7c49', '#b8a46f', '#a88d5f'], // Brown tones
  },
  {
    id: 'amethyst-haze',
    name: 'Amethyst Haze',
    colors: ['#9276b2', '#e09cb7', '#6ecba6'], // Purple, Pink, Teal
  },
  {
    id: 'claude',
    name: 'Claude',
    colors: ['#c87849', '#7d6eb4', '#e0d1b3'], // Warm orange, Purple, Beige
  },
  {
    id: 'sage-garden',
    name: 'Sage Garden',
    colors: ['#7ba876', '#a8c798', '#8fb88b'], // Various greens
  },
  {
    id: 'tangerine',
    name: 'Tangerine',
    colors: ['#e05d38', '#f3f4f6', '#d6e4f0'], // Orange, Gray, Blue-ish
  },
];

interface ThemeStore {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

export const useThemeConfig = create<ThemeStore>()(
  persist(
    (set) => ({
      currentTheme: 'retro-arcade',
      setTheme: (theme) => {
        set({ currentTheme: theme });
        
        // Apply the theme class to document.documentElement
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          
          // Remove all theme classes
          AVAILABLE_THEMES.forEach((t) => {
            root.classList.remove(`theme-${t.id}`);
          });
          
          // Add the selected theme class
          root.classList.add(`theme-${theme}`);
        }
      },
    }),
    {
      name: 'rss-reader-theme-config',
      onRehydrateStorage: () => (state) => {
        // Apply theme class on initialization
        if (state && typeof document !== 'undefined') {
          const root = document.documentElement;
          root.classList.add(`theme-${state.currentTheme}`);
        }
      },
    }
  )
);
