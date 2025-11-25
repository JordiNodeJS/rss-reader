"use client";

import type { ThemeName } from "@/hooks/use-theme-config";

// Cache de URLs de temas ya precargados
const preloadedThemes = new Set<ThemeName>();

// ID del elemento <link> para el tema activo
const THEME_LINK_ID = "dynamic-theme-link";

/**
 * Carga dinámicamente el CSS de un tema específico usando <link>.
 * Estrategia "swap" para evitar flash:
 * 1. Crea un nuevo <link> con el nuevo tema
 * 2. Espera a que cargue completamente
 * 3. Solo entonces elimina el <link> anterior
 */
export async function loadTheme(theme: ThemeName): Promise<void> {
  if (typeof document === "undefined") return;

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
