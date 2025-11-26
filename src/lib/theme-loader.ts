"use client";

import type { ThemeName } from "@/hooks/use-theme-config";

// Cache de URLs de temas ya precargados
const preloadedThemes = new Set<ThemeName>();

// Cache de fuentes ya cargadas
const loadedFonts = new Set<string>();

// ID del elemento <link> para el tema activo
const THEME_LINK_ID = "dynamic-theme-link";

// Mapa de fuentes de Google Fonts por tema
// Solo incluimos fuentes que requieren carga de Google Fonts (no system fonts)
const THEME_FONTS: Record<string, string[]> = {
  "amber-minimal": ["Inter"],
  "amethyst-haze": ["Geist"],
  "bold-tech": ["Roboto", "Playfair Display", "Fira Code"],
  bubblegum: ["Poppins", "Playfair Display", "Fira Code"],
  caffeine: [], // usa system fonts
  candyland: ["Poppins", "Lora", "Fira Code"],
  catppuccin: ["Montserrat", "Merriweather", "JetBrains Mono"],
  claude: [], // usa system fonts
  claymorphism: ["Plus Jakarta Sans", "DM Sans", "JetBrains Mono"],
  "clean-slate": ["Inter", "Source Serif 4", "JetBrains Mono"],
  "cosmic-night": ["Oxanium", "Source Code Pro"],
  cyberpunk: ["Oxanium", "Source Code Pro"],
  darkmatter: ["Inter", "JetBrains Mono"],
  "doom-64": ["Oxanium", "Source Code Pro"],
  "elegant-luxury": ["Libre Baskerville", "Lora", "Source Code Pro"],
  graphite: ["Inter", "JetBrains Mono"],
  "kodama-grove": ["Quicksand", "Merriweather", "Fira Code"],
  "midnight-bloom": ["Poppins", "Playfair Display", "Fira Code"],
  "mocha-mousse": ["Outfit", "Space Mono"],
  "modern-minimal": ["Inter", "Source Serif 4", "JetBrains Mono"],
  mono: ["Geist Mono"],
  nature: ["Open Sans", "Merriweather", "Fira Code"],
  "neo-brutalism": ["Inter", "JetBrains Mono"],
  "northern-lights": ["Inter", "Source Serif 4", "Fira Code"],
  notebook: ["Architects Daughter"],
  "ocean-breeze": ["Poppins", "Playfair Display", "Fira Code"],
  "pastel-dreams": ["Poppins", "Lora", "Fira Code"],
  perpetuity: ["Antic", "IBM Plex Mono"],
  "quantum-rose": ["Poppins", "Playfair Display", "Fira Code"],
  "retro-arcade": ["Outfit", "Space Mono"],
  "sage-garden": ["Outfit", "Space Mono"],
  "soft-pop": ["DM Sans", "Fira Code"],
  "solar-dusk": ["Inter", "Source Serif 4", "Fira Code"],
  "starry-night": ["Poppins", "Lora", "Fira Code"],
  "sunset-horizon": ["Poppins", "Playfair Display", "Fira Code"],
  supabase: ["Inter", "JetBrains Mono"],
  "t3-chat": ["Geist", "Geist Mono"],
  tangerine: ["Outfit", "Space Mono"],
  twitter: ["Inter", "JetBrains Mono"],
  vercel: ["Geist", "Geist Mono"],
  "vintage-paper": ["Libre Baskerville", "Lora", "Source Code Pro"],
  "violet-bloom": ["Poppins", "Playfair Display", "Fira Code"],
};

/**
 * Carga las fuentes de Google Fonts necesarias para un tema
 */
function loadGoogleFonts(theme: ThemeName): void {
  const fonts = THEME_FONTS[theme] || [];
  const fontsToLoad = fonts.filter((font) => !loadedFonts.has(font));

  if (fontsToLoad.length === 0) return;

  // Construir URL de Google Fonts
  const fontFamilies = fontsToLoad
    .map((font) => {
      // Algunas fuentes necesitan pesos específicos
      const fontWithWeight = font.replace(/ /g, "+");
      // Cargar pesos comunes: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
      return `family=${fontWithWeight}:wght@400;500;600;700`;
    })
    .join("&");

  const googleFontsUrl = `https://fonts.googleapis.com/css2?${fontFamilies}&display=swap`;

  // Verificar si ya existe este link
  const existingLink = document.querySelector(`link[href="${googleFontsUrl}"]`);
  if (existingLink) return;

  // Crear link para cargar fuentes
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = googleFontsUrl;
  document.head.appendChild(link);

  // Marcar fuentes como cargadas
  fontsToLoad.forEach((font) => loadedFonts.add(font));
}

/**
 * Carga dinámicamente el CSS de un tema específico usando <link>.
 * También carga las fuentes de Google Fonts necesarias para el tema.
 * Estrategia "swap" para evitar flash:
 * 1. Crea un nuevo <link> con el nuevo tema
 * 2. Espera a que cargue completamente
 * 3. Solo entonces elimina el <link> anterior
 */
export async function loadTheme(theme: ThemeName): Promise<void> {
  if (typeof document === "undefined") return;

  // Cargar fuentes de Google Fonts para este tema
  loadGoogleFonts(theme);

  const newHref = `/styles/themes/${theme}.css`;

  // Buscar el elemento <link> actual
  const currentLink = document.getElementById(
    THEME_LINK_ID
  ) as HTMLLinkElement | null;

  // Si ya tiene exactamente este tema, no hacer nada
  if (currentLink?.href.endsWith(`${theme}.css`)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    // Crear nuevo elemento <link> temporal
    const newLink = document.createElement("link");
    newLink.rel = "stylesheet";
    newLink.href = newHref;
    // Usar un ID temporal mientras carga
    newLink.id = `${THEME_LINK_ID}-loading`;

    const completeLoad = () => {
      // El nuevo CSS ya cargó, ahora hacemos el swap seguro
      // 1. Cambiar el ID del nuevo link al ID principal
      newLink.id = THEME_LINK_ID;

      // 2. Eliminar el link anterior (si existe y es diferente)
      if (currentLink && currentLink !== newLink) {
        currentLink.remove();
      }

      preloadedThemes.add(theme);
      resolve();
    };

    newLink.onload = completeLoad;

    newLink.onerror = () => {
      console.error(`Error loading theme: ${theme}`);
      // En caso de error, eliminar el link fallido
      newLink.remove();
      resolve();
    };

    // Añadir el nuevo link al head (coexiste temporalmente con el anterior)
    document.head.appendChild(newLink);

    // Fallback: Si el archivo ya está en caché (304), onload puede no dispararse
    // Verificamos después de un pequeño delay si la hoja de estilos ya está disponible
    setTimeout(() => {
      // Verificar si la hoja de estilos está cargada
      const sheets = document.styleSheets;
      for (let i = 0; i < sheets.length; i++) {
        try {
          if (sheets[i].href?.includes(`${theme}.css`)) {
            // Ya está cargado, completar
            if (newLink.id === `${THEME_LINK_ID}-loading`) {
              completeLoad();
            }
            return;
          }
        } catch {
          // Ignorar errores de acceso cross-origin
        }
      }
    }, 50);
  });
}

/**
 * Pre-carga un tema en segundo plano (sin aplicarlo).
 * Útil para precargar temas cuando el usuario abre el selector.
 */
export function preloadTheme(theme: ThemeName): void {
  if (typeof document === "undefined") return;
  if (preloadedThemes.has(theme)) return;

  // Verificar si ya existe un link con este tema
  const href = `/styles/themes/${theme}.css`;
  const existingLink = document.querySelector(`link[href="${href}"]`);
  if (existingLink) {
    preloadedThemes.add(theme);
    return;
  }

  // Usar <link rel="prefetch"> para precargar sin aplicar
  const prefetchLink = document.createElement("link");
  prefetchLink.rel = "prefetch";
  prefetchLink.href = href;
  prefetchLink.as = "style";
  document.head.appendChild(prefetchLink);
  preloadedThemes.add(theme);
}

/**
 * Pre-carga todos los temas disponibles en segundo plano.
 * Llamar cuando el usuario abre el menú de temas.
 */
export function preloadAllThemes(themes: ThemeName[]): void {
  themes.forEach(preloadTheme);
}
