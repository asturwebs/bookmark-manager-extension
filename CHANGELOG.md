# 📋 Changelog

Todos los cambios notables en este proyecto están documentados aquí.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto sigue [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2025-01-08

### 🔴 Arreglado
- **Chrome Storage Fix**: Validación robusta de permisos y disponibilidad de chrome.storage
- **Condición de carrera**: Mutex implementado para evitar eliminaciones simultáneas de ventanas
- **Validación de bookmarks**: Manejo granular de errores + filtrado de bookmarks inválidos
- **Fondo y pie de página**: Corregido layout flexbox para mostrar correctamente el fondo y footer
- **Auto-organización**: Ventanas ya no se salen del área visible al auto-organizarse

### 🚀 Mejorado
- **CSS Optimizado**: Eliminados duplicados de scrollbars y animaciones (-20% tamaño)
- **Algoritmos mejorados**: Posicionamiento inteligente que respeta viewport
- **Manejo de errores**: Notificaciones específicas para permisos, timeout y red

### 🛠️ Técnico
- **Async/await**: Operaciones de eliminación ahora son asíncronas y seguras
- **Validación URL**: Prevención de javascript: y URLs malformadas
- **Consistencia**: Versiones sincronizadas en todos los archivos

## [1.0.1] - 2025-01-07

### 🔴 Arreglado
- **Cascada de ventanas**: Las ventanas ya no aparecen apiladas tras resetear → Ahora usan posicionamiento en grilla organizada
- **Color picker fantasma**: Ya no cambia el color de la ventana incorrecta → Sistema robusto de identificación de ventanas
- **Ventanas que desaparecen**: Ya no se pierden ventanas al añadir nuevas → Actualizaciones incrementales del DOM
- **Cursor desincronizado**: Mouse ya no se desplaza mal al arrastrar → Sistema de posicionamiento basado en deltas
- **Carpetas fantasma**: Carpetas eliminadas ya no aparecen en diálogos → Verificación dual estado+DOM
- **Distorsión de contenido**: Restaurados tamaños originales (350x400) → Mejor legibilidad

### ✨ Agregado
- **Selector de colores interactivo**: Menú desplegable con 11 colores temáticos
- **Detección automática de colores**: Desarrollo=Azul, Trabajo=Naranja, Social=Rosa, etc.
- **Posicionamiento inteligente**: Ventanas fijas junto al título, bookmark windows en grilla
- **Sistema de debugging mejorado**: Logs exhaustivos para resolución de problemas
- **Notificaciones animadas**: Feedback visual para acciones del usuario

### 🚀 Mejorado
- **Búsqueda optimizada**: Throttling y caché para filtros más rápidos
- **Gestión de memoria**: Limpieza automática de event listeners
- **Renderizado incremental**: Solo actualiza ventanas que cambian

## [1.0.0] - 2025-01-06

### ✨ Agregado
- **Ventanas flotantes arrastrables**: Organización de marcadores por carpetas
- **Herramientas integradas**: Búsqueda web y traductor
- **Personalización completa**: Temas, fondos, colores personalizables
- **Arquitectura modular**: Vanilla JavaScript sin dependencias
- **Alto rendimiento**: ~3MB memoria, carga <500ms
- **Seguridad**: CSP estricta, validación URLs, sin tracking

### 🛠️ Técnico
- **Manifest V3**: Compatibilidad con extensiones modernas
- **Observer Pattern**: Gestión de estado reactiva
- **Drag & Drop**: Sistema optimizado de arrastre
- **Chrome APIs**: Integración con bookmarks y storage
- **Responsive**: Adaptación a diferentes resoluciones

---

## Tipos de cambios

- **✨ Agregado** para nuevas funcionalidades
- **🚀 Mejorado** para cambios en funcionalidades existentes
- **🔴 Arreglado** para bugs corregidos
- **🛠️ Técnico** para cambios técnicos internos
- **🔒 Seguridad** para vulnerabilidades arregladas
- **💥 Roto** para cambios que rompen compatibilidad

[1.0.2]: https://github.com/asturwebs/bookmark-manager-extension/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/asturwebs/bookmark-manager-extension/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/asturwebs/bookmark-manager-extension/releases/tag/v1.0.0