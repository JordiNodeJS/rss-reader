# Configuración y Puesta en Marcha

Esta guía te ayudará a configurar el entorno de desarrollo para el proyecto RSS Reader Antigravity.

## Requisitos Previos

- **Node.js**: Versión 22.x (Requerido).
- **Gestor de Paquetes**: `pnpm` (Obligatorio). Consulta las [reglas del gestor de paquetes](../standards/package-manager-rules.md).
- **Sistema Operativo**: Windows, macOS o Linux. (Nota: En Windows, `sharp` puede requerir pasos adicionales si no se instalan los binarios precompilados correctamente).

## Instalación

1.  **Clonar el repositorio**:

    ```bash
    git clone <url-del-repo>
    cd rss-reader-antigravity
    ```

2.  **Instalar dependencias**:
    ```bash
    pnpm install
    ```

## Comandos Principales

| Comando                    | Descripción                                                  |
| :------------------------- | :----------------------------------------------------------- |
| `pnpm dev`                 | Inicia el servidor de desarrollo en `http://localhost:3000`. |
| `pnpm build`               | Compila la aplicación para producción.                       |
| `pnpm start`               | Inicia la aplicación compilada en modo producción.           |
| `pnpm lint`                | Ejecuta el linter para verificar la calidad del código.      |
| `pnpm dlx playwright test` | Ejecuta las pruebas E2E con Playwright.                      |

## Verificación Rápida

Para verificar que todo funciona correctamente:

1.  Inicia el servidor de desarrollo: `pnpm dev`.
2.  Abre `http://localhost:3000` en tu navegador.
3.  Prueba añadir un feed RSS (ej. `https://hnrss.org/frontpage`).
4.  Verifica que los artículos se cargan y se guardan en IndexedDB (puedes ver esto en las DevTools > Application > IndexedDB).

## Solución de Problemas Comunes

- **Errores con `sharp` en Windows**: Si encuentras errores relacionados con binarios de `sharp`, intenta ejecutar `pnpm rebuild sharp`.
- **Problemas de Base de Datos**: Si la aplicación se comporta de forma extraña después de una actualización, puede ser necesario limpiar la base de datos IndexedDB local.

## Siguientes Pasos

- Revisa la [Visión General de la Arquitectura](../architecture/overview.md) para entender cómo funciona el sistema.
- Consulta las [Guías de Funcionalidades](../features/) para detalles sobre componentes específicos como la IA de resumen.
