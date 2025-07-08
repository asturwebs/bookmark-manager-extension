// ===== GESTOR DE VENTANAS =====
class WindowManager {
    constructor(stateManager, bookmarkManager) {
        this.stateManager = stateManager;
        this.bookmarkManager = bookmarkManager;
        this.eventListeners = new Map();
        this.abortController = new AbortController();
        this.isRemoving = false; // Mutex para evitar condiciones de carrera
        
        // Colores para ventanas (compatibilidad)
        this.windowColors = [
            'window-color-1', 'window-color-2', 'window-color-3', 
            'window-color-4', 'window-color-5', 'window-color-6'
        ];
        
        // Mapeo inteligente de carpetas a colores
        this.categoryColors = {
            // Desarrollo
            'desarrollo': 'header-color-development',
            'development': 'header-color-development',
            'programming': 'header-color-development',
            'coding': 'header-color-development',
            'github': 'header-color-development',
            'code': 'header-color-development',
            
            // Trabajo
            'trabajo': 'header-color-work',
            'work': 'header-color-work',
            'office': 'header-color-work',
            'business': 'header-color-work',
            'empresa': 'header-color-work',
            
            // Social
            'social': 'header-color-social',
            'redes': 'header-color-social',
            'facebook': 'header-color-social',
            'twitter': 'header-color-social',
            'instagram': 'header-color-social',
            
            // Entretenimiento
            'entretenimiento': 'header-color-entertainment',
            'entertainment': 'header-color-entertainment',
            'peliculas': 'header-color-entertainment',
            'movies': 'header-color-entertainment',
            'series': 'header-color-entertainment',
            'youtube': 'header-color-entertainment',
            'netflix': 'header-color-entertainment',
            'gaming': 'header-color-entertainment',
            'juegos': 'header-color-entertainment',
            
            // Compras
            'compras': 'header-color-shopping',
            'shopping': 'header-color-shopping',
            'amazon': 'header-color-shopping',
            'tienda': 'header-color-shopping',
            'store': 'header-color-shopping',
            
            // Referencia
            'referencia': 'header-color-reference',
            'reference': 'header-color-reference',
            'docs': 'header-color-reference',
            'documentation': 'header-color-reference',
            'wiki': 'header-color-reference',
            'wikipedia': 'header-color-reference',
            
            // Noticias
            'noticias': 'header-color-news',
            'news': 'header-color-news',
            'periodicos': 'header-color-news',
            'newspapers': 'header-color-news',
            
            // Herramientas
            'herramientas': 'header-color-tools',
            'tools': 'header-color-tools',
            'utilities': 'header-color-tools',
            'utilidades': 'header-color-tools',
            
            // Diseño
            'diseño': 'header-color-design',
            'design': 'header-color-design',
            'graphics': 'header-color-design',
            'creative': 'header-color-design',
            
            // Educación
            'educacion': 'header-color-education',
            'education': 'header-color-education',
            'learning': 'header-color-education',
            'courses': 'header-color-education',
            'study': 'header-color-education'
        };
    }

    /**
     * Crear una nueva ventana
     */
    createWindow(config) {
        // Generar ID único más robusto
        const existingWindows = this.stateManager.getState('windows') || [];
        const existingIds = existingWindows.map(w => parseInt(w.id));
        
        let newId = Date.now();
        // Asegurar que el ID no exista ya
        while (existingIds.includes(newId)) {
            newId = Date.now() + Math.floor(Math.random() * 1000);
        }
        
        const defaultConfig = {
            id: newId,
            type: 'bookmark',
            folder: 'Nueva Ventana',
            position: { x: 50, y: 50 },
            size: { width: 350, height: 400 },
            minimized: false,
            colorClass: this.getNextWindowColor()
        };

        const windowConfig = { ...defaultConfig, ...config };
        
        // Auto-detectar color si no se especifica y es una ventana de marcadores
        if (windowConfig.type === 'bookmark' && !config.headerColor) {
            windowConfig.headerColor = this.getColorForFolder(windowConfig.folder);
        } else if (!windowConfig.headerColor) {
            windowConfig.headerColor = 'header-color-default';
        }
        
        const windows = this.stateManager.getState('windows') || [];
        
        console.log('🪟 Creando ventana:', windowConfig.folder, 
                   'Color:', windowConfig.headerColor, 'Total antes:', windows.length);
        
        // Crear una copia del array para evitar mutaciones
        const newWindows = [...windows, windowConfig];
        
        this.stateManager.setState('windows', newWindows);
        
        console.log('✅ Ventana creada. Total después:', newWindows.length);
        return windowConfig.id;
    }

    /**
     * Actualizar configuración de ventana
     */
    updateWindow(windowId, updates) {
        const windows = this.stateManager.getState('windows');
        const windowIndex = windows.findIndex(w => w.id === windowId);
        
        if (windowIndex !== -1) {
            windows[windowIndex] = { ...windows[windowIndex], ...updates };
            this.stateManager.setState('windows', windows);
        }
    }

    /**
     * Eliminar ventana (con mutex para evitar condiciones de carrera)
     */
    async removeWindow(windowId) {
        // Evitar múltiples operaciones simultáneas
        if (this.isRemoving) {
            console.warn('⚠️ Operación de eliminación ya en progreso, ignorando');
            return;
        }
        
        this.isRemoving = true;
        
        try {
            console.log('🗑️ Iniciando eliminación de ventana:', windowId);
            
            const windows = this.stateManager.getState('windows');
            const targetId = parseInt(windowId); // Asegurar que sea número
            
            console.log('📊 Estado antes de eliminar:');
            console.log('  - Total ventanas:', windows.length);
            console.log('  - Ventanas:', windows.map(w => ({id: w.id, folder: w.folder, type: w.type})));
            console.log('  - ID objetivo:', targetId, typeof targetId);
            
            // Verificar que la ventana existe antes de proceder
            const windowToRemove = windows.find(w => parseInt(w.id) === targetId);
            if (!windowToRemove) {
                console.warn('⚠️ Ventana no encontrada:', targetId);
                return;
            }
            
            const filteredWindows = windows.filter(w => {
                const windowIdNum = parseInt(w.id);
                const shouldKeep = windowIdNum !== targetId;
                
                if (!shouldKeep) {
                    console.log('✂️ Eliminando ventana:', {
                        id: w.id,
                        folder: w.folder,
                        type: w.type
                    });
                }
                
                return shouldKeep;
            });
            
            console.log('📊 Estado después de filtrar:');
            console.log('  - Total ventanas:', filteredWindows.length, '(antes:', windows.length + ')');
            console.log('  - Ventanas restantes:', filteredWindows.map(w => ({id: w.id, folder: w.folder})));
            
            // Actualizar estado y forzar guardado inmediato
            this.stateManager.setState('windows', filteredWindows);
            await this.stateManager.saveState(); // Forzar guardado inmediato
            
            console.log('✅ Ventana eliminada del estado');
            
            // Emitir evento personalizado para notificar a otros componentes
            window.dispatchEvent(new CustomEvent('windowRemoved', {
                detail: { 
                    removedWindowId: targetId,
                    remainingWindows: filteredWindows.length,
                    removedFolder: windowToRemove.folder
                }
            }));
            
        } catch (error) {
            console.error('❌ Error eliminando ventana:', error);
        } finally {
            this.isRemoving = false;
        }
    }

    /**
     * Detectar color automático basado en el nombre de la carpeta
     */
    getColorForFolder(folderName) {
        if (!folderName) return 'header-color-default';
        
        const normalizedName = folderName.toLowerCase().trim();
        
        // Buscar coincidencia exacta primero
        if (this.categoryColors[normalizedName]) {
            return this.categoryColors[normalizedName];
        }
        
        // Buscar coincidencias parciales
        for (const [keyword, color] of Object.entries(this.categoryColors)) {
            if (normalizedName.includes(keyword) || keyword.includes(normalizedName)) {
                return color;
            }
        }
        
        // Si no hay coincidencia, usar color por hash del nombre
        return this.getHashBasedColor(normalizedName);
    }
    
    /**
     * Generar color consistente basado en hash del nombre
     */
    getHashBasedColor(name) {
        const colors = [
            'header-color-1', 'header-color-2', 'header-color-3',
            'header-color-4', 'header-color-5', 'header-color-6'
        ];
        
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            const char = name.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir a 32-bit integer
        }
        
        return colors[Math.abs(hash) % colors.length];
    }

    /**
     * Obtener siguiente color para ventana (método legacy)
     */
    getNextWindowColor() {
        const windows = this.stateManager.getState('windows');
        const usedColors = windows.map(w => w.colorClass).filter(Boolean);
        
        for (const color of this.windowColors) {
            if (!usedColors.includes(color)) {
                return color;
            }
        }
        
        return this.windowColors[windows.length % this.windowColors.length];
    }

    /**
     * Determinar si una carpeta es una subcarpeta y obtener el icono apropiado
     */
    getFolderIcon(folderName) {
        if (!folderName) return '📁';
        
        // Detectar subcarpetas por diferentes criterios
        const isSubfolder = 
            folderName.includes('/') ||           // Separador de path
            folderName.includes('\\') ||          // Separador Windows
            folderName.includes(' - ') ||         // Formato "Padre - Hijo"
            folderName.includes(' > ') ||         // Formato "Padre > Hijo"
            folderName.includes('::') ||          // Formato "Padre::Hijo"
            folderName.match(/^\w+\s+\w+\s+\w+/) || // 3+ palabras sugiere categorización específica
            folderName.toLowerCase().includes('subcarpeta') ||
            folderName.toLowerCase().includes('subfolder');
        
        // Iconos específicos por tipo de carpeta
        const folderIcons = {
            // Carpetas de desarrollo
            'desarrollo': '💻',
            'development': '💻',
            'programming': '💻',
            'code': '🧑‍💻',
            'github': '🐙',
            'projects': '🔧',
            
            // Carpetas de trabajo
            'trabajo': '💼',
            'work': '💼',
            'office': '🏢',
            'business': '💼',
            'empresa': '🏢',
            
            // Carpetas de entretenimiento
            'entretenimiento': '🎬',
            'entertainment': '🎬',
            'movies': '🎬',
            'peliculas': '🎬',
            'gaming': '🎮',
            'juegos': '🎮',
            'youtube': '▶️',
            'netflix': '🎥',
            
            // Carpetas sociales
            'social': '👥',
            'redes': '📱',
            'facebook': '📘',
            'twitter': '🐦',
            'instagram': '📷',
            
            // Otras categorías
            'compras': '🛒',
            'shopping': '🛒',
            'amazon': '📦',
            'noticias': '📰',
            'news': '📰',
            'educacion': '🎓',
            'education': '🎓',
            'docs': '📚',
            'documentation': '📖',
            'herramientas': '🔨',
            'tools': '⚙️',
            'utilities': '🛠️'
        };
        
        // Buscar icono específico por nombre de carpeta
        const normalizedName = folderName.toLowerCase().trim();
        for (const [keyword, icon] of Object.entries(folderIcons)) {
            if (normalizedName.includes(keyword) || keyword.includes(normalizedName)) {
                return isSubfolder ? `${icon}📂` : icon; // Agregar 📂 si es subcarpeta
            }
        }
        
        // Iconos por defecto
        return isSubfolder ? '📂' : '📁';
    }

    /**
     * Renderizar ventana de marcadores
     */
    renderBookmarkWindow(windowData) {
        const div = document.createElement('div');
        div.className = `draggable-window ${windowData.colorClass || 'window-color-1'} ${windowData.minimized ? 'minimized' : ''}`;
        div.id = `window-${windowData.id}`;
        div.style.left = `${windowData.position.x}px`;
        div.style.top = `${windowData.position.y}px`;
        div.style.width = `${windowData.size.width}px`;
        div.style.height = `${windowData.size.height}px`;

        // Aplicar color de barra de título
        const headerColor = windowData.headerColor || this.getColorForFolder(windowData.folder);
        
        // Obtener icono apropiado para la carpeta
        const folderIcon = this.getFolderIcon(windowData.folder);
        
        // Las ventanas de bookmark (no default) SÍ deben tener botón de cerrar
        console.log(`🏗️ Renderizando ventana: ID=${windowData.id}, Folder="${windowData.folder}", Color=${headerColor}, Icon=${folderIcon}`);
        
        div.innerHTML = `
            <div class="window-header ${headerColor}" data-window-id="${windowData.id}">
                <div class="window-title">${folderIcon} ${SecurityUtils.decodeHtmlEntities(windowData.folder || 'Marcadores')}</div>
                <div class="window-controls">
                    <button class="color-picker-btn" title="Cambiar color" data-window-id="${windowData.id}">🎨</button>
                    <button class="close-btn" title="Cerrar">×</button>
                </div>
            </div>
            <div class="window-content" id="window-content-${windowData.id}">
                <div class="bookmark-search-container">
                    <input type="text" class="bookmark-search-input" placeholder="Buscar marcadores..." />
                </div>
                <div class="bookmarks-container">
                    ${this.bookmarkManager.renderBookmarksList(windowData.bookmarks || [])}
                </div>
            </div>
        `;

        this.setupWindowEventListeners(div, windowData);
        return div;
    }

    /**
     * Renderizar ventana de búsqueda web
     */
    renderSearchWindow(windowData) {
        const searchEngines = [
            { name: 'Google', url: 'https://www.google.com/search?q=' },
            { name: 'Brave', url: 'https://search.brave.com/search?q=' },
            { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
            { name: 'Ecosia', url: 'https://www.ecosia.org/search?q=' }
        ];

        const div = document.createElement('div');
        div.className = `draggable-window default-window ${windowData.colorClass || 'window-color-1'} ${windowData.minimized ? 'minimized' : ''}`;
        div.id = `window-${windowData.id}`;
        div.style.left = `${windowData.position.x}px`;
        div.style.top = `${windowData.position.y}px`;
        div.style.width = `${windowData.size.width}px`;
        div.style.height = `${windowData.size.height}px`;

        const enginesHTML = searchEngines.map(engine => `
            <label class="engine-option">
                <input type="radio" name="search-engine-${windowData.id}" value="${engine.name}" 
                       ${engine.name === this.stateManager.getState('defaultSearchEngine') ? 'checked' : ''}>
                <span>${engine.name}</span>
            </label>
        `).join('');

        // Aplicar color específico para búsqueda (verde por defecto)
        const searchHeaderColor = windowData.headerColor || 'header-color-default';
        
        div.innerHTML = `
            <div class="window-header ${searchHeaderColor}" data-window-id="${windowData.id}">
                <div class="window-title">🔍 Búsqueda Web</div>
                <div class="window-controls">
                    <button class="minimize-btn" title="Minimizar">-</button>
                </div>
            </div>
            <div class="window-content">
                <div class="search-container">
                    <input type="text" id="web-search-input-${windowData.id}" 
                           class="web-search-input" placeholder="Escribe tu búsqueda..." />
                    <button id="web-search-button-${windowData.id}" class="search-button">Buscar</button>
                </div>
                <div class="search-engines">
                    ${enginesHTML}
                </div>
            </div>
        `;

        this.setupWebSearchListeners(div, windowData);
        this.setupWindowEventListeners(div, windowData);
        return div;
    }

    /**
     * Renderizar ventana de traducción
     */
    renderTranslationWindow(windowData) {
        const translationEngines = [
            { name: 'Google Translate', url: 'https://translate.google.com/?sl=auto&tl=es&text=' },
            { name: 'DeepL', url: 'https://www.deepl.com/translator#en/es/' },
            { name: 'Reverso Context', url: 'https://context.reverso.net/traduccion/ingles-espanol/' }
        ];

        const div = document.createElement('div');
        div.className = `draggable-window default-window ${windowData.colorClass || 'window-color-1'} ${windowData.minimized ? 'minimized' : ''}`;
        div.id = `window-${windowData.id}`;
        div.style.left = `${windowData.position.x}px`;
        div.style.top = `${windowData.position.y}px`;
        div.style.width = `${windowData.size.width}px`;
        div.style.height = `${windowData.size.height}px`;

        const enginesHTML = translationEngines.map(engine => `
            <label class="engine-option">
                <input type="radio" name="translation-engine-${windowData.id}" value="${engine.name}"
                       ${engine.name === this.stateManager.getState('defaultTranslationEngine') ? 'checked' : ''}>
                <span>${engine.name}</span>
            </label>
        `).join('');

        // Aplicar color específico para traducción (verde por defecto)
        const translationHeaderColor = windowData.headerColor || 'header-color-default';
        
        div.innerHTML = `
            <div class="window-header ${translationHeaderColor}" data-window-id="${windowData.id}">
                <div class="window-title">🌍 Traductor</div>
                <div class="window-controls">
                    <button class="minimize-btn" title="Minimizar">-</button>
                </div>
            </div>
            <div class="window-content">
                <div class="translation-container">
                    <input type="text" id="translation-input-${windowData.id}" 
                           class="translation-input" placeholder="Escribe el texto a traducir..." />
                    <button id="translation-button-${windowData.id}" class="translate-button">Traducir</button>
                </div>
                <div class="search-engines">
                    ${enginesHTML}
                </div>
            </div>
        `;

        this.setupTranslationListeners(div, windowData);
        this.setupWindowEventListeners(div, windowData);
        return div;
    }

    /**
     * Configurar event listeners para ventana
     */
    setupWindowEventListeners(windowElement, windowData) {
        const header = windowElement.querySelector('.window-header');
        const closeBtn = windowElement.querySelector('.close-btn');
        const colorPickerBtn = windowElement.querySelector('.color-picker-btn');
        const searchInput = windowElement.querySelector('.bookmark-search-input');

        // Drag functionality
        if (header) {
            this.addEventListenerWithCleanup(header, 'mousedown', (e) => {
                this.startDragging(windowElement, windowData, e);
            });
        }

        // Close
        if (closeBtn) {
            this.addEventListenerWithCleanup(closeBtn, 'click', (e) => {
                e.stopPropagation();
                
                // Encontrar la ventana completa que contiene este botón
                const windowElement = e.target.closest('.draggable-window');
                if (windowElement && windowElement.id) {
                    // Extraer el ID del elemento (format: window-123)
                    const windowIdStr = windowElement.id.replace('window-', '');
                    const numericWindowId = parseInt(windowIdStr);
                    
                    console.log('Cerrando ventana ID:', numericWindowId, 'extraído de:', windowElement.id);
                    
                    // Verificar que el ID sea válido
                    if (!isNaN(numericWindowId)) {
                        console.log('🗑️ Eliminando ventana desde DOM - ID:', numericWindowId);
                        
                        // Remover del DOM primero
                        windowElement.remove();
                        
                        // Luego remover del estado
                        this.removeWindow(numericWindowId);
                        
                        // Verificar estado final
                        const finalWindows = this.stateManager.getState('windows');
                        console.log('✅ Ventana eliminada. Estado final:', finalWindows.length, 'ventanas');
                        console.log('📋 Ventanas restantes:', finalWindows.map(w => ({id: w.id, folder: w.folder})));
                        
                    } else {
                        console.error('ID de ventana inválido:', windowIdStr);
                    }
                }
            });
        }

        // Color picker
        if (colorPickerBtn) {
            this.addEventListenerWithCleanup(colorPickerBtn, 'click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                console.log('🎨 === CLICK SELECTOR COLOR ===');
                console.log('🎯 Target element:', e.target);
                console.log('📋 Target classList:', Array.from(e.target.classList));
                console.log('🏷️ Target dataset:', e.target.dataset);
                
                // Estrategia 1: Obtener desde el data-window-id del botón
                let windowId = e.target.dataset.windowId;
                console.log('📋 Estrategia 1 - windowId desde target:', windowId);
                
                // Estrategia 2: Buscar en el header padre
                if (!windowId) {
                    const header = e.target.closest('.window-header');
                    console.log('🏠 Header encontrado:', header);
                    if (header) {
                        windowId = header.dataset.windowId;
                        console.log('📋 Estrategia 2 - windowId desde header:', windowId);
                    }
                }
                
                // Estrategia 3: Buscar desde la ventana padre
                if (!windowId) {
                    const windowElement = e.target.closest('.draggable-window');
                    console.log('🪟 Window element encontrado:', windowElement);
                    if (windowElement && windowElement.id) {
                        windowId = windowElement.id.replace('window-', '');
                        console.log('📋 Estrategia 3 - windowId desde window element:', windowId);
                    }
                }
                
                console.log('🎯 WindowId FINAL obtenido:', windowId, typeof windowId);
                
                if (windowId) {
                    // Verificar que la ventana existe en el estado
                    const windows = this.stateManager.getState('windows');
                    const targetWindow = windows.find(w => 
                        String(w.id) === String(windowId) || 
                        parseInt(w.id) === parseInt(windowId)
                    );
                    
                    console.log('🔍 Ventana encontrada en estado:', targetWindow?.folder, 'ID:', targetWindow?.id);
                    
                    if (targetWindow) {
                        this.showColorPicker(parseInt(windowId), e.target);
                    } else {
                        console.error('❌ Ventana no encontrada en estado');
                        console.error('🔍 Ventanas disponibles:', windows.map(w => ({id: w.id, folder: w.folder})));
                    }
                } else {
                    console.error('❌ No se pudo obtener windowId del botón de color');
                }
                
                console.log('🎨 === FIN CLICK SELECTOR COLOR ===');
            });
        }

        // Search de marcadores
        if (searchInput && windowData.type === 'bookmark') {
            this.addEventListenerWithCleanup(searchInput, 'input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filtered = this.bookmarkManager.getFilteredBookmarks(windowData.bookmarks || [], searchTerm);
                const container = windowElement.querySelector('.bookmarks-container');
                if (container) {
                    container.innerHTML = this.bookmarkManager.renderBookmarksList(filtered);
                }
            });
        }
    }

    /**
     * Configurar listeners para búsqueda web
     */
    setupWebSearchListeners(windowElement, windowData) {
        const searchButton = windowElement.querySelector(`#web-search-button-${windowData.id}`);
        const searchInput = windowElement.querySelector(`#web-search-input-${windowData.id}`);
        const engineRadios = windowElement.querySelectorAll(`input[name="search-engine-${windowData.id}"]`);

        if (searchButton) {
            this.addEventListenerWithCleanup(searchButton, 'click', () => {
                this.handleWebSearch(windowData.id);
            });
        }

        if (searchInput) {
            this.addEventListenerWithCleanup(searchInput, 'keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleWebSearch(windowData.id);
                }
            });
        }

        // Configurar radio buttons para selección de motor
        engineRadios.forEach(radio => {
            this.addEventListenerWithCleanup(radio, 'change', (e) => {
                if (e.target.checked) {
                    this.stateManager.setState('defaultSearchEngine', e.target.value);
                    console.log('Motor de búsqueda cambiado a:', e.target.value);
                }
            });
        });
    }

    /**
     * Configurar listeners para traducción
     */
    setupTranslationListeners(windowElement, windowData) {
        const translateButton = windowElement.querySelector(`#translation-button-${windowData.id}`);
        const translationInput = windowElement.querySelector(`#translation-input-${windowData.id}`);
        const engineRadios = windowElement.querySelectorAll(`input[name="translation-engine-${windowData.id}"]`);

        if (translateButton) {
            this.addEventListenerWithCleanup(translateButton, 'click', () => {
                this.handleTranslation(windowData.id);
            });
        }

        if (translationInput) {
            this.addEventListenerWithCleanup(translationInput, 'keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleTranslation(windowData.id);
                }
            });
        }

        // Configurar radio buttons para selección de motor de traducción
        engineRadios.forEach(radio => {
            this.addEventListenerWithCleanup(radio, 'change', (e) => {
                if (e.target.checked) {
                    this.stateManager.setState('defaultTranslationEngine', e.target.value);
                    console.log('Motor de traducción cambiado a:', e.target.value);
                }
            });
        });
    }

    /**
     * Manejar búsqueda web
     */
    handleWebSearch(windowId) {
        const searchInput = document.getElementById(`web-search-input-${windowId}`);
        if (!searchInput || !searchInput.value.trim()) return;

        const searchText = SecurityUtils.sanitizeText(searchInput.value.trim());
        if (!searchText) return;

        const query = encodeURIComponent(searchText);
        const defaultEngine = this.stateManager.getState('defaultSearchEngine');
        const engines = [
            { name: 'Google', url: 'https://www.google.com/search?q=' },
            { name: 'Brave', url: 'https://search.brave.com/search?q=' },
            { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
            { name: 'Ecosia', url: 'https://www.ecosia.org/search?q=' }
        ];

        const selectedEngine = engines.find(engine => engine.name === defaultEngine) || engines[0];
        const url = SecurityUtils.sanitizeUrl(selectedEngine.url + query);

        if (url) {
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.update({ url });
            } else {
                window.location.href = url;
            }
            searchInput.value = '';
        }
    }

    /**
     * Manejar traducción
     */
    handleTranslation(windowId) {
        const translationInput = document.getElementById(`translation-input-${windowId}`);
        if (!translationInput || !translationInput.value.trim()) return;

        const translationText = SecurityUtils.sanitizeText(translationInput.value.trim());
        if (!translationText) return;

        const text = encodeURIComponent(translationText);
        const defaultEngine = this.stateManager.getState('defaultTranslationEngine');
        const engines = [
            { name: 'Google Translate', url: 'https://translate.google.com/?sl=auto&tl=es&text=' },
            { name: 'DeepL', url: 'https://www.deepl.com/translator#en/es/' },
            { name: 'Reverso Context', url: 'https://context.reverso.net/traduccion/ingles-espanol/' }
        ];

        const selectedEngine = engines.find(engine => engine.name === defaultEngine) || engines[0];
        const url = SecurityUtils.sanitizeUrl(selectedEngine.url + text);

        if (url) {
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.update({ url });
            } else {
                window.location.href = url;
            }
            translationInput.value = '';
        }
    }

    /**
     * Iniciar arrastre de ventana
     */
    startDragging(windowElement, windowData, e) {
        // Prevenir comportamiento por defecto y selección de texto
        e.preventDefault();
        e.stopPropagation();
        
        // Traer la ventana al frente al empezar a arrastrar
        this.bringToFront(windowElement);
        
        // Prevenir selección de texto durante el arrastre
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        
        // Método simplificado: usar directamente la posición CSS actual
        const currentLeft = parseInt(windowElement.style.left) || 0;
        const currentTop = parseInt(windowElement.style.top) || 0;
        
        // Guardar posición inicial del mouse
        const startMouseX = e.clientX;
        const startMouseY = e.clientY;
        
        console.log('🖱️ Iniciando drag simplificado:', {
            startMouseX,
            startMouseY,
            currentLeft,
            currentTop
        });

        const onMouseMove = (e) => {
            e.preventDefault();
            
            // Calcular cuánto se ha movido el mouse
            const deltaX = e.clientX - startMouseX;
            const deltaY = e.clientY - startMouseY;
            
            // Aplicar el delta a la posición inicial
            const newX = currentLeft + deltaX;
            const newY = currentTop + deltaY;
            
            // Limitar a los bordes de la pantalla (opcional)
            const maxX = window.innerWidth - windowElement.offsetWidth;
            const maxY = window.innerHeight - windowElement.offsetHeight;
            
            const constrainedX = Math.max(0, Math.min(newX, maxX));
            const constrainedY = Math.max(0, Math.min(newY, maxY));
            
            // Aplicar directamente
            windowElement.style.left = `${constrainedX}px`;
            windowElement.style.top = `${constrainedY}px`;
            
            // Actualizar datos de la ventana
            windowData.position = { x: constrainedX, y: constrainedY };
        };

        const onMouseUp = () => {
            // Restaurar selección de texto
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            // Guardar estado final
            this.stateManager.saveState();
            
            console.log('🏁 Drag finalizado. Posición final:', windowData.position);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    /**
     * Traer ventana al frente
     */
    bringToFront(windowElement) {
        // Obtener todas las ventanas
        const allWindows = document.querySelectorAll('.draggable-window');
        let maxZIndex = 1000;
        
        // Encontrar el z-index más alto actual
        allWindows.forEach(window => {
            const zIndex = parseInt(window.style.zIndex) || 1000;
            if (zIndex > maxZIndex) {
                maxZIndex = zIndex;
            }
        });
        
        // Asignar un z-index más alto a la ventana actual
        windowElement.style.zIndex = maxZIndex + 1;
    }

    /**
     * Toggle minimizar ventana
     */
    toggleMinimize(windowId) {
        const windows = this.stateManager.getState('windows');
        const window = windows.find(w => w.id === windowId);
        
        if (window) {
            window.minimized = !window.minimized;
            this.stateManager.setState('windows', windows);
            this.renderAllWindows();
        }
    }

    /**
     * Renderizar todas las ventanas
     */
    renderAllWindows() {
        const container = document.querySelector('.windows-container');
        if (!container) return;

        container.innerHTML = '';
        const windows = this.stateManager.getState('windows');

        windows.forEach(windowData => {
            let windowElement;
            
            switch (windowData.type) {
                case 'search':
                    windowElement = this.renderSearchWindow(windowData);
                    break;
                case 'translation':
                    windowElement = this.renderTranslationWindow(windowData);
                    break;
                default:
                    windowElement = this.renderBookmarkWindow(windowData);
                    break;
            }
            
            if (windowElement) {
                container.appendChild(windowElement);
            }
        });
    }

    /**
     * Agregar event listener con cleanup
     */
    addEventListenerWithCleanup(element, event, handler, options = {}) {
        const listenerData = { element, event, handler, options };
        const key = `${element.id || 'element'}_${event}_${Date.now()}`;
        
        const finalOptions = { ...options, signal: this.abortController.signal };
        element.addEventListener(event, handler, finalOptions);
        this.eventListeners.set(key, listenerData);
        
        return key;
    }

    /**
     * Mostrar selector de color para ventana
     */
    showColorPicker(windowId, buttonElement) {
        const availableColors = [
            { name: 'Desarrollo', class: 'header-color-development', color: '#2196F3' },
            { name: 'Trabajo', class: 'header-color-work', color: '#FF9800' },
            { name: 'Social', class: 'header-color-social', color: '#E91E63' },
            { name: 'Entretenimiento', class: 'header-color-entertainment', color: '#9C27B0' },
            { name: 'Compras', class: 'header-color-shopping', color: '#FF5722' },
            { name: 'Referencia', class: 'header-color-reference', color: '#607D8B' },
            { name: 'Noticias', class: 'header-color-news', color: '#795548' },
            { name: 'Herramientas', class: 'header-color-tools', color: '#009688' },
            { name: 'Diseño', class: 'header-color-design', color: '#CDDC39' },
            { name: 'Educación', class: 'header-color-education', color: '#3F51B5' },
            { name: 'Por defecto', class: 'header-color-default', color: '#4CAF50' }
        ];

        // Crear menú contextual
        const menu = document.createElement('div');
        menu.className = 'color-picker-menu';
        menu.innerHTML = `
            <div class="color-picker-header">🎨 Elegir Color</div>
            <div class="color-options">
                ${availableColors.map(color => `
                    <div class="color-option" data-color-class="${color.class}" title="${color.name}">
                        <div class="color-preview" style="background: ${color.color}"></div>
                        <span class="color-name">${color.name}</span>
                    </div>
                `).join('')}
            </div>
        `;

        // Posicionar el menú
        const rect = buttonElement.getBoundingClientRect();
        menu.style.cssText = `
            position: fixed;
            top: ${rect.bottom + 5}px;
            left: ${rect.left - 150}px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 10000;
            min-width: 180px;
            font-family: 'Segoe UI', sans-serif;
        `;

        document.body.appendChild(menu);

        // Event listeners
        const closeMenu = () => {
            if (menu.parentNode) {
                menu.parentNode.removeChild(menu);
            }
        };

        // Cerrar al hacer clic fuera
        setTimeout(() => {
            document.addEventListener('click', closeMenu, { once: true });
        }, 100);

        // Seleccionar color
        menu.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const colorClass = option.dataset.colorClass;
                this.changeWindowHeaderColor(windowId, colorClass);
                closeMenu();
            });
        });
    }

    /**
     * Cambiar color de barra de título de ventana
     */
    changeWindowHeaderColor(windowId, newColorClass) {
        console.log('🎨 === CAMBIO COLOR INICIADO ===');
        console.log('🎯 WindowId recibido:', windowId, typeof windowId);
        console.log('🌈 Color objetivo:', newColorClass);
        
        // Obtener estado actual
        let windows = this.stateManager.getState('windows');
        console.log('📊 Total ventanas en estado:', windows.length);
        
        // Buscar la ventana objetivo con múltiples estrategias
        let windowData = null;
        let foundIndex = -1;
        
        // Probar diferentes tipos de comparación
        foundIndex = windows.findIndex(w => {
            const match = (
                w.id === windowId || 
                parseInt(w.id) === parseInt(windowId) || 
                String(w.id) === String(windowId)
            );
            if (match) {
                console.log(`🎯 MATCH encontrado: ventana "${w.folder}" (ID: ${w.id})`);
            }
            return match;
        });
        
        if (foundIndex >= 0) {
            windowData = windows[foundIndex];
            console.log(`✅ Ventana objetivo confirmada: "${windowData.folder}" (ID: ${windowData.id})`);
            
            // Verificar elemento DOM correspondiente
            const windowElement = document.getElementById(`window-${windowId}`);
            const windowTitle = windowElement?.querySelector('.window-title')?.textContent;
            console.log(`🏠 Elemento DOM: ${windowElement ? 'Encontrado' : 'NO encontrado'}`);
            console.log(`📝 Título en DOM: "${windowTitle}"`);
            
            // Verificar coherencia
            if (windowTitle && windowTitle !== windowData.folder) {
                console.warn(`⚠️ INCOHERENCIA: Estado="${windowData.folder}" vs DOM="${windowTitle}"`);
            }
            
            // Actualizar estado de forma inmutable
            const newWindows = [...windows];
            newWindows[foundIndex] = { ...windowData, headerColor: newColorClass };
            
            // Guardar estado
            this.stateManager.setState('windows', newWindows);
            this.stateManager.saveState();
            
            // Actualizar visualmente
            if (windowElement) {
                const header = windowElement.querySelector('.window-header');
                if (header) {
                    // Remover clases de color anteriores
                    const oldClasses = Array.from(header.classList).filter(c => c.startsWith('header-color-'));
                    console.log(`🗑️ Removiendo clases: ${oldClasses.join(', ')}`);
                    
                    oldClasses.forEach(className => header.classList.remove(className));
                    
                    // Agregar nueva clase
                    header.classList.add(newColorClass);
                    console.log(`🎨 Clase añadida: ${newColorClass}`);
                    console.log(`📋 Clases finales: ${Array.from(header.classList).join(', ')}`);
                }
            }
            
            console.log(`✅ Cambio completado para "${windowData.folder}"`);
        } else {
            console.error(`❌ ERROR: No se encontró ventana con ID: ${windowId}`);
            console.error('🔍 Ventanas disponibles:');
            windows.forEach((w, i) => {
                console.error(`  [${i}] ID: ${w.id} (${typeof w.id}) - Folder: "${w.folder}"`);
            });
        }
        
        console.log('🎨 === CAMBIO COLOR TERMINADO ===');
    }

    /**
     * Limpiar event listeners
     */
    cleanup() {
        this.abortController.abort();
        this.abortController = new AbortController();
        this.eventListeners.clear();
    }
}

// Exportar para uso global
window.WindowManager = WindowManager;