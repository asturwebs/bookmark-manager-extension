# 📚 Gestor de Marcadores Browser Extension

Una extensión moderna para navegadores Chromium (Brave, Chrome, Edge) que transforma la gestión de marcadores con ventanas flotantes arrastrables y herramientas integradas.

![Versión](https://img.shields.io/badge/version-1.0.1-blue.svg)
![Licencia](https://img.shields.io/badge/license-MIT-green.svg)
![Navegadores](https://img.shields.io/badge/browsers-Brave%20%7C%20Chrome%20%7C%20Edge-orange.svg)

## ✨ Características Principales

### 🪟 **Ventanas Flotantes Arrastrables**
- Organiza marcadores en ventanas independientes por carpeta
- Drag & drop optimizado con sincronización precisa del cursor
- Posicionamiento inteligente: grilla organizada (no cascada caótica)
- Persistencia automática de posiciones y tamaños

### 🔍 **Herramientas Integradas**
- **Búsqueda Web**: Google, Brave, DuckDuckGo, Ecosia
- **Traductor**: Google Translate, DeepL, Reverso Context
- **Búsqueda de Marcadores**: Filtrado en tiempo real

### 🎨 **Personalización Completa**
- **Temas**: Modo claro/oscuro automático
- **Fondos**: 4 gradientes predefinidos + colores personalizados
- **Imágenes**: Fondos personalizados (archivo local o URL)
- **Color Picker**: 11 colores temáticos para headers de ventanas
- **Auto-detección**: Colores automáticos por categoría de carpeta (Desarrollo=Azul, Trabajo=Naranja, etc.)

### ⚡ **Alto Rendimiento**
- Arquitectura modular con Vanilla JavaScript
- Solo 3MB de uso de memoria
- Carga instantánea sin dependencias

## 🚀 Instalación Rápida

### **Brave Browser**
```
1. Descargar ZIP → Extraer
2. brave://extensions/ → Modo desarrollador ON
3. "Cargar extensión sin empaquetar" → Seleccionar carpeta
4. ¡Listo! 🎉
```

### **Google Chrome**
```
1. Descargar ZIP → Extraer  
2. chrome://extensions/ → Modo desarrollador ON
3. "Cargar extensión sin empaquetar" → Seleccionar carpeta
4. ¡Listo! 🎉
```

### **Microsoft Edge**
```
1. Descargar ZIP → Extraer
2. edge://extensions/ → Modo desarrollador ON (panel izquierdo)
3. "Cargar extensión sin empaquetar" → Seleccionar carpeta  
4. ¡Listo! 🎉
```

## 📦 Descarga

### **Opción 1: Release (Recomendado)**
[📥 Descargar bookmark-manager-v1.0.1.zip](../../releases/latest)

### **Opción 2: Desde Código Fuente**
```bash
git clone https://github.com/asturwebs/bookmark-manager-extension.git
cd bookmark-manager-extension
# Usar la carpeta 'extension/' para instalar
```

## 🎯 Uso

### **Primera Vez**
1. Al instalar aparecen 2 ventanas: **Búsqueda Web** y **Traductor**
2. Clic en **➕** para agregar ventanas de carpetas de marcadores
3. **⚙️** para personalizar temas y fondos

### **Controles**
- **Arrastrar**: Desde barra superior de ventana (cursor sincronizado)
- **Cerrar**: Botón **×** (solo ventanas de marcadores)
- **Buscar**: Campo de búsqueda en cada ventana
- **Temas**: Botón **🌙/☀️** en header
- **Cambiar color**: Botón **🎨** en cada ventana para personalizar header

### **Personalización**
- **4 gradientes**: Azul, Verde, Rojo, Morado
- **Color personalizado**: CSS/gradientes propios
- **Imagen de fondo**: Archivo local o URL externa

## 🏗️ Arquitectura Técnica

### **Estructura Modular**
```
public/js/
├── main.js                 # Orquestador principal
├── managers/
│   ├── state-manager.js    # Estado centralizado + Observer pattern
│   ├── bookmark-manager.js # Operaciones de marcadores + cache
│   ├── window-manager.js   # Gestión ventanas + drag&drop
│   └── theme-manager.js    # Temas + fondos personalizados
└── utils/
    ├── security-utils.js   # Validación URLs + sanitización XSS
    └── performance-utils.js # Debouncing + caching + throttling
```

### **Flujo de Datos**
```
main.js (Orchestrator)
    ↓
StateManager (Observer Pattern) ←→ Chrome Storage API
    ↓
BookmarkManager (Data Layer) ←→ Chrome Bookmarks API  
    ↓
WindowManager (UI Logic) ←→ DOM Events
    ↓
ThemeManager (Styling) ←→ CSS Classes
```

## 🛠️ Desarrollo

### **Debug Console**
```javascript
// Consola del navegador (F12)
window.bookmarkManagerApp.getDebugInfo()   // Estado + métricas
window.bookmarkManagerApp.restart()        // Reiniciar app
window.bookmarkManagerApp.clearStorage()   // Limpiar storage
```

### **Performance Metrics**
- **Memoria**: ~3MB (vs 25MB+ extensiones similares)
- **Carga**: <500ms inicial  
- **Arquitectura**: 7 módulos especializados vs monolito
- **Sin dependencias**: 100% Vanilla JavaScript

### **Características de Seguridad**
- ✅ Content Security Policy (CSP) estricta
- ✅ Validación URLs + prevención XSS
- ✅ Sin tracking ni telemetría  
- ✅ Storage local únicamente

## 📋 Permisos Requeridos

```json
{
  "permissions": [
    "bookmarks",  // Acceso a marcadores del navegador
    "storage"     // Persistencia de configuración  
  ]
}
```

## 🆕 Changelog v1.0.1

### 🐛 **Bugs Críticos Corregidos**
- ✅ **Cascada de ventanas**: Las ventanas ya no aparecen apiladas tras resetear → Ahora usan posicionamiento en grilla organizada
- ✅ **Color picker fantasma**: Ya no cambia el color de la ventana incorrecta → Sistema robusto de identificación de ventanas
- ✅ **Ventanas que desaparecen**: Ya no se pierden ventanas al añadir nuevas → Actualizaciones incrementales del DOM
- ✅ **Cursor desincronizado**: Mouse ya no se desplaza mal al arrastrar → Sistema de posicionamiento basado en deltas
- ✅ **Carpetas fantasma**: Carpetas eliminadas ya no aparecen en diálogos → Verificación dual estado+DOM
- ✅ **Distorsión de contenido**: Restaurados tamaños originales (350x400) → Mejor legibilidad

### 🎨 **Nuevas Funcionalidades**
- 🆕 **Selector de colores interactivo**: Menú desplegable con 11 colores temáticos
- 🆕 **Detección automática de colores**: Desarrollo=Azul, Trabajo=Naranja, Social=Rosa, etc.
- 🆕 **Posicionamiento inteligente**: Ventanas fijas junto al título, bookmark windows en grilla
- 🆕 **Sistema de debugging mejorado**: Logs exhaustivos para resolución de problemas
- 🆕 **Notificaciones animadas**: Feedback visual para acciones del usuario

### 🚀 **Mejoras de Rendimiento**
- ⚡ **Búsqueda optimizada**: Throttling y caché para filtros más rápidos
- ⚡ **Gestión de memoria**: Limpieza automática de event listeners
- ⚡ **Renderizado incremental**: Solo actualiza ventanas que cambian

## 🔧 Configuración Avanzada

### **Motores de Búsqueda Soportados**
- Google (predeterminado)
- Brave Search
- DuckDuckGo  
- Ecosia

### **Servicios de Traducción**
- Google Translate (predeterminado)
- DeepL
- Reverso Context

### **Almacenamiento**
- **Chrome Storage**: Configuración esencial (sync entre dispositivos)
- **LocalStorage**: Datos completos + imágenes personalizadas
- **Auto-backup**: Posiciones ventanas + preferencias

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| Extensión no carga | Verificar modo desarrollador activado |
| Marcadores no aparecen | Comprobar permisos de bookmarks |
| Ventanas no se mueven | Recargar extensión desde `chrome://extensions/` |
| Storage quota exceeded | Usar gradientes en lugar de imágenes pesadas |

## 🚀 Roadmap

### **v1.1.0 (Próximo)**
- [ ] Favicons reales (solución CSP)
- [ ] Categorías personalizadas de marcadores  
- [ ] Atajos de teclado
- [ ] Exportar/importar configuración

### **v1.2.0 (Futuro)**
- [ ] Sincronización nube
- [ ] Estadísticas de uso
- [ ] Widgets personalizables
- [ ] API para terceros

## 📊 Comparación

| Característica | Esta Extensión | Extensiones Típicas |
|----------------|----------------|---------------------|
| **Memoria** | ~3MB | 15-30MB |
| **Carga** | <500ms | 1-3s |
| **Dependencias** | 0 | 5-20+ |
| **Personalización** | Alta | Básica |
| **Performance** | Optimizada | Variable |

## 🤝 Contribuir

1. **Fork** el repositorio
2. **Crear rama**: `git checkout -b feature/nueva-caracteristica`
3. **Commit**: `git commit -m 'Add: nueva característica'`
4. **Push**: `git push origin feature/nueva-caracteristica`  
5. **Pull Request** con descripción detallada

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para detalles completos.

## 🔗 Enlaces

- **🌐 Website**: [asturwebs.es](https://asturwebs.es)
- **🐛 Issues**: [GitHub Issues](../../issues)
- **📧 Contact**: Disponible en asturwebs.es

## 🙏 Agradecimientos

- **Brave Browser** por su excelente API de extensiones
- **Chrome Extension APIs** por la funcionalidad base
- **Comunidad Open Source** por inspiración y feedback

---

<div align="center">

**Desarrollado con ❤️ por [AsturWebs](https://asturwebs.es)**

*Transformando la gestión de marcadores desde 2025*

[![GitHub stars](https://img.shields.io/github/stars/asturwebs/bookmark-manager-extension?style=social)](../../stargazers)
[![GitHub forks](https://img.shields.io/github/forks/asturwebs/bookmark-manager-extension?style=social)](../../network/members)

</div>