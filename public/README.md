# Gestor de Marcadores - Extensión para Chrome/Brave

## Descripción General

Gestor de Marcadores es una extensión para Chrome y Brave que transforma la página de nueva pestaña en una interfaz personalizable para gestionar marcadores mediante ventanas flotantes. Ofrece una experiencia moderna, limpia y altamente personalizable para organizar tus sitios web favoritos.

## Características Principales

- **Ventanas flotantes arrastrables**: Cada carpeta de marcadores se muestra como una ventana independiente que puedes mover y organizar libremente
- **Jerarquía visual de carpetas**: Los títulos de las ventanas muestran la estructura completa de carpetas con el formato "Carpeta Padre / **Carpeta Actual**"
- **Temas claro/oscuro**: Personaliza la apariencia según tus preferencias
- **Fondos personalizables**: Usa gradientes predefinidos o sube tu propia imagen de fondo
- **Herramientas integradas**:
  - Búsqueda web con múltiples motores (Google, Brave, DuckDuckGo, Ecosia)
  - Traducción de texto con diferentes servicios (Google Translate, DeepL, Reverso Context)
- **Personalización completa**: Guarda automáticamente la posición de tus ventanas y preferencias

## Instalación

### Como Extensión para Desarrollo

1. Clona o descarga este repositorio
2. Abre Chrome o Brave y navega a `chrome://extensions/`
3. Activa el "Modo desarrollador" en la esquina superior derecha
4. Haz clic en "Cargar descomprimida" y selecciona la carpeta `public` de este repositorio
5. La extensión debería aparecer en tu lista de extensiones y estar activa inmediatamente

### Uso

1. Abre una nueva pestaña para ver la interfaz del Gestor de Marcadores
2. Cada carpeta de tus marcadores aparecerá como una ventana flotante independiente
3. Interactuar con las ventanas:
   - **Mover**: Arrastra la ventana desde su barra de título
   - **Minimizar**: Usa el botón "-" en la esquina superior derecha
   - **Cerrar**: Usa el botón "✕" en la esquina superior derecha
4. Personalizar la apariencia:
   - Haz clic en el botón de configuración (⚙️) en la esquina superior derecha
   - Selecciona entre tema claro u oscuro
   - Elige un fondo predefinido o sube tu propia imagen

## Estructura del Proyecto

```
bookmark-manager-extension/
├── public/                  # Carpeta principal de la extensión
│   ├── backgrounds/         # Estilos de fondos
│   │   └── default.css      # Estilo de fondo predeterminado
│   ├── css/
│   │   └── styles.css       # Estilos CSS de la aplicación
│   ├── icons/               # Iconos SVG de la extensión
│   │   ├── icon16.svg
│   │   ├── icon48.svg
│   │   └── icon128.svg
│   ├── js/
│   │   ├── bundle.js        # Código principal de la aplicación
│   │   ├── extension-controls.js  # Controles específicos de la extensión
│   │   └── theme-controls.js      # Control de temas
│   ├── background.js        # Script de fondo de la extensión
│   ├── index.html           # Página principal (nueva pestaña)
│   ├── manifest.json        # Configuración de la extensión
│   ├── popup.html           # Ventana emergente de la extensión
│   └── popup.js             # Lógica de la ventana emergente
└── README.md                # Este archivo
```

## Arquitectura y Funcionamiento

### Componentes Principales

1. **BookmarkManager** (public/js/bundle.js):
   - Clase principal que maneja toda la lógica de la aplicación
   - Crea y gestiona las ventanas flotantes
   - Procesa los marcadores del navegador
   - Maneja la personalización y configuración

2. **Sistema de Ventanas**:
   - Cada carpeta de marcadores se representa como una ventana independiente
   - Ventanas especiales para búsqueda web y traducción
   - Sistema de arrastre y posicionamiento

3. **Almacenamiento**:
   - Utiliza Chrome Storage API para guardar preferencias
   - Guarda automáticamente la posición de las ventanas
   - Permite restablecer la configuración a valores predeterminados

### Jerarquía de Carpetas

La extensión muestra la estructura completa de carpetas en los títulos de las ventanas:

```
Carpeta Padre / Subcarpeta / Carpeta Actual
```

Donde "Carpeta Actual" aparece en negrita para facilitar la identificación visual rápida.

## Consideraciones Técnicas

### Tecnologías Utilizadas

- **JavaScript Vanilla**: Toda la aplicación está desarrollada en JavaScript puro sin dependencias externas
- **APIs de Chrome**: 
  - `chrome.bookmarks` para acceder a los marcadores
  - `chrome.storage` para guardar la configuración
  - `chrome.tabs` para interactuar con las pestañas

### Permisos Requeridos

- `bookmarks`: Acceso a los marcadores del navegador
- `storage`: Almacenamiento de la configuración
- `tabs`: Interacción con las pestañas del navegador

### Seguridad

- Todos los datos se almacenan localmente en el navegador
- No se envía información a servidores externos
- Código abierto y auditable

## Solución de Problemas

- **La extensión no carga**: Verifica que el modo desarrollador esté activado
- **Los marcadores no aparecen**: Asegúrate de que la extensión tenga permiso para acceder a los marcadores
- **Las ventanas quedan desordenadas**: Usa el botón de restablecer configuración en el panel de ajustes
- **Problemas con el tema**: Intenta cambiar manualmente entre tema claro y oscuro

---

## Desarrollado por

Pedro Luis Cuevas Villarrubia | [AsturWebs](https://asturwebs.es) | pedro@asturwebs.es

Innovation Practitioner, WebMaster, SysAdmin & SEO since 1999 and AI Agent Architect & Advanced Prompt Engineer since 2020

---

© 2025 AsturWebs | Gestor de Marcadores v1.0.0
