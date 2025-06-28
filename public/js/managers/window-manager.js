// ===== GESTOR DE VENTANAS =====
class WindowManager {
    constructor(stateManager, bookmarkManager) {
        this.stateManager = stateManager;
        this.bookmarkManager = bookmarkManager;
        this.eventListeners = new Map();
        this.abortController = new AbortController();
        
        // Colores para ventanas
        this.windowColors = [
            'window-color-1', 'window-color-2', 'window-color-3', 
            'window-color-4', 'window-color-5', 'window-color-6'
        ];
    }

    /**
     * Crear una nueva ventana
     */
    createWindow(config) {
        const defaultConfig = {
            id: Date.now(),
            type: 'bookmark',
            folder: 'Nueva Ventana',
            position: { x: 50, y: 50 },
            size: { width: 350, height: 400 },
            minimized: false,
            colorClass: this.getNextWindowColor()
        };

        const windowConfig = { ...defaultConfig, ...config };
        const windows = this.stateManager.getState('windows');
        windows.push(windowConfig);
        
        this.stateManager.setState('windows', windows);
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
     * Eliminar ventana
     */
    removeWindow(windowId) {
        const windows = this.stateManager.getState('windows');
        const filteredWindows = windows.filter(w => w.id !== windowId);
        this.stateManager.setState('windows', filteredWindows);
    }

    /**
     * Obtener siguiente color para ventana
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

        // Las ventanas de bookmark (no default) SÍ deben tener botón de cerrar
        div.innerHTML = `
            <div class="window-header" data-window-id="${windowData.id}">
                <div class="window-title">${SecurityUtils.decodeHtmlEntities(windowData.folder || 'Marcadores')}</div>
                <div class="window-controls">
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

        div.innerHTML = `
            <div class="window-header" data-window-id="${windowData.id}">
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

        div.innerHTML = `
            <div class="window-header" data-window-id="${windowData.id}">
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
                    const windowId = windowElement.id.replace('window-', '');
                    const numericWindowId = parseInt(windowId);
                    
                    console.log('Cerrando ventana ID:', numericWindowId);
                    
                    // Remover del estado
                    this.removeWindow(numericWindowId);
                    
                    // Remover del DOM
                    windowElement.remove();
                }
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
        
        // Traer la ventana al frente al empezar a arrastrar
        this.bringToFront(windowElement);
        
        // Prevenir selección de texto durante el arrastre
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        
        const startX = e.clientX - windowData.position.x;
        const startY = e.clientY - windowData.position.y;

        const onMouseMove = (e) => {
            e.preventDefault();
            const newX = e.clientX - startX;
            const newY = e.clientY - startY;
            
            windowElement.style.left = `${newX}px`;
            windowElement.style.top = `${newY}px`;
            
            windowData.position = { x: newX, y: newY };
        };

        const onMouseUp = () => {
            // Restaurar selección de texto
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            this.stateManager.saveState();
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