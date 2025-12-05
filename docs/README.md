# Documentación de Desarrollo - RSS Reader Antigravity

Bienvenido a la documentación técnica del proyecto. Esta colección de documentos está diseñada para facilitar el onboarding de nuevos desarrolladores y servir como referencia para el mantenimiento del sistema.

## 📚 Estructura de la Documentación

### 🚀 [Primeros Pasos](getting-started/setup.md)

Guía rápida para configurar tu entorno, instalar dependencias y ejecutar el proyecto localmente.

- [Configuración y Setup](getting-started/setup.md)

### 🏗️ [Arquitectura y Diseño](architecture/overview.md)

Entiende cómo funciona el sistema por dentro.

- [Visión General](architecture/overview.md): Arquitectura cliente-servidor, flujo de datos offline-first y archivos críticos.
- [Análisis de Fugas de Memoria](architecture/memory-leak-analysis.md): Investigación técnica sobre gestión de memoria.

### ✨ [Funcionalidades Clave](features/)

Documentación detallada de características específicas.

- [Sistema de Resúmenes (IA)](features/summarization.md): Cómo funciona la integración con Chrome AI y Transformers.js.
- [Configuración Upstash](features/upstash-setup.md): Detalles sobre la integración con Upstash (Rate Limiting/Redis).

### 📏 [Estándares y Normas](standards/)

Reglas del juego para mantener la calidad del código.

- [Reglas del Gestor de Paquetes](standards/package-manager-rules.md): Uso estricto de `pnpm`.
- [Reglas para Agentes de IA](standards/ai-agent-pnpm-rules.md): Instrucciones específicas para IAs que modifican el código.

### 📋 [Gestión del Proyecto](project-management/)

Historial, tareas y lecciones aprendidas.

- [Aprendizajes](project-management/aprendizajes.md): Reporte de lecciones clave del desarrollo.
- [Historias de Usuario](project-management/user-stories.md): Definición funcional del producto.
- [Progreso de Tareas (Dic 2025)](project-management/task-progress-dec-2025.md): Log de trabajo.
- [Tareas de Rendimiento](project-management/performance-tasks.md): Lista de optimizaciones pendientes o realizadas.

---

## ¿Por dónde empiezo?

1.  Lee la guía de **[Configuración](getting-started/setup.md)** para tener el proyecto corriendo.
2.  Revisa la **[Visión General de Arquitectura](architecture/overview.md)** para entender el modelo mental "Offline-First".
3.  Si vas a añadir una nueva librería, consulta las **[Reglas de Paquetes](standards/package-manager-rules.md)**.
