// ===== APLICACIÓN PRINCIPAL MODULAR =====
class BookmarkManagerApp {
    constructor() {
        // Inicializar managers
        this.stateManager = new StateManager();
        this.bookmarkManager = new BookmarkManager(this.stateManager);
        this.windowManager = new WindowManager(this.stateManager, this.bookmarkManager);
        this.themeManager = new ThemeManager(this.stateManager);
        
        // Flags de control
        this.initialized = false;
        this.isInitializing = false;
        
        // Event listeners globales
        this.setupGlobalEventListeners();
        
        // Configurar listeners de mensajes de la extensión
        this.setupExtensionMessageListeners();
        
        // Inicializar aplicación
        this.init();
    }

    /**
     * Inicializar aplicación
     */
    async init() {
        if (this.isInitializing) {
            console.warn('Init ya en progreso, abortando duplicado');
            return;
        }

        this.isInitializing = true;
        console.log('🚀 Iniciando Bookmark Manager App...');

        try {
            // 1. Limpiar estado previo si existe
            if (this.initialized) {
                this.cleanup();
            }

            // 2. Cargar estado guardado
            await this.stateManager.loadState();

            // 3. Configurar ventanas por defecto si no existen
            await this.setupDefaultWindows();

            // 4. Cargar marcadores
            await this.bookmarkManager.loadBookmarks();
            await this.assignBookmarksToWindows();

            // 5. Inicializar tema
            this.themeManager.initializeTheme();

            // 6. Renderizar interfaz
            this.render();

            // 7. Configurar event listeners específicos (después del render)
            this.setupApplicationEventListeners();

            this.initialized = true;
            console.log('✅ Aplicación inicializada correctamente');

        } catch (error) {
            console.error('❌ Error inicializando aplicación:', error);
        } finally {
            this.isInitializing = false;
        }

        // Exponer globalmente para debugging
        this.exposeDebugAPI();
    }

    /**
     * Configurar ventanas por defecto
     */
    async setupDefaultWindows() {
        let windows = this.stateManager.getState('windows');
        
        if (!windows || windows.length === 0) {
            console.log('📦 Creando ventanas por defecto...');
            
            const defaultWindows = [
                {
                    id: Date.now() + 1,
                    type: 'search',
                    folder: 'Búsqueda Web',
                    position: { x: 50, y: 120 },
                    size: { width: 350, height: 400 },
                    minimized: false,
                    colorClass: 'window-color-2'
                },
                {
                    id: Date.now() + 2,
                    type: 'translation',
                    folder: 'Traductor',
                    position: { x: 420, y: 120 },
                    size: { width: 350, height: 400 },
                    minimized: false,
                    colorClass: 'window-color-3'
                }
            ];
            
            this.stateManager.setState('windows', defaultWindows);
            windows = defaultWindows;
        } else {
            // Verificar que existan ventanas de búsqueda y traducción
            const hasSearchWindow = windows.some(w => w.type === 'search');
            const hasTranslationWindow = windows.some(w => w.type === 'translation');
            
            if (!hasSearchWindow) {
                windows.push({
                    id: Date.now() + 999,
                    type: 'search',
                    folder: 'Búsqueda Web',
                    position: { x: 50, y: 120 },
                    size: { width: 350, height: 400 },
                    minimized: false,
                    colorClass: 'window-color-2'
                });
            }
            
            if (!hasTranslationWindow) {
                windows.push({
                    id: Date.now() + 998,
                    type: 'translation',
                    folder: 'Traductor',
                    position: { x: 420, y: 120 },
                    size: { width: 350, height: 400 },
                    minimized: false,
                    colorClass: 'window-color-3'
                });
            }
            
            this.stateManager.setState('windows', windows);
        }
    }

    /**
     * Asignar marcadores a ventanas
     */
    async assignBookmarksToWindows() {
        const bookmarks = this.stateManager.getState('bookmarks');
        const windows = this.stateManager.getState('windows');
        
        if (!bookmarks || bookmarks.length === 0) return;

        // Agrupar marcadores por carpeta
        const groupedBookmarks = this.bookmarkManager.groupBookmarksByFolder(bookmarks);
        const folders = Object.keys(groupedBookmarks);
        
        // Verificar si hay ventanas de marcadores para las carpetas
        const bookmarkWindows = windows.filter(w => w.type === 'bookmark' || w.type === 'bookmarks');
        
        if (bookmarkWindows.length === 0) {
            console.log('📁 Creando ventanas para carpetas de marcadores...');
            
            let posX = 50;
            let posY = 300;
            
            folders.forEach((folder, index) => {
                if (folder && folder.trim()) {
                    const windowId = this.windowManager.createWindow({
                        type: 'bookmark',
                        folder: folder,
                        position: { x: posX, y: posY },
                        size: { width: 350, height: 400 },
                        bookmarks: groupedBookmarks[folder]
                    });
                    
                    posX += 30;
                    posY += 30;
                    
                    // Resetear posición si se sale del viewport
                    if (posX > window.innerWidth - 400) {
                        posX = 50;
                        posY += 100;
                    }
                }
            });
        } else {
            // Asignar marcadores a ventanas existentes
            bookmarkWindows.forEach(window => {
                const folderBookmarks = groupedBookmarks[window.folder] || [];
                window.bookmarks = folderBookmarks;
            });
        }
        
        // Actualizar estado
        this.stateManager.setState('windows', this.stateManager.getState('windows'));
    }

    /**
     * Renderizar interfaz principal
     */
    render() {
        const root = document.getElementById('root');
        if (!root) {
            console.error('❌ Elemento root no encontrado');
            return;
        }

        const theme = this.stateManager.getState('theme');
        const backgroundImage = this.stateManager.getState('backgroundImage');

        root.innerHTML = `
            <div class="app ${theme}">
                <div id="background-container" class="background-container">
                    <!-- Título de la aplicación -->
                    <div class="app-title">
                        <h1>📚 Gestor de Marcadores</h1>
                    </div>

                    <!-- Controles de cabecera -->
                    <div class="header-controls">
                        <button id="theme-toggle-btn" class="header-button" title="Cambiar tema">
                            <span>${theme === 'dark' ? '☀️' : '🌙'}</span>
                        </button>
                        <button id="config-button" class="header-button" title="Configuración">
                            <span>⚙️</span>
                        </button>
                        <button id="add-window-button" class="header-button" title="Añadir ventana">
                            <span>➕</span>
                        </button>
                    </div>

                    <!-- Contenedor de ventanas -->
                    <div class="windows-container">
                        <!-- Las ventanas se renderizan aquí -->
                    </div>

                    <!-- Pie de página -->
                    <div class="app-footer">
                        <p>
                            Desarrollado con ❤️ por 
                            <a href="https://asturwebs.es" target="_blank" class="footer-link">asturwebs.es</a> | 
                            Gestiona tus marcadores de forma inteligente
                        </p>
                    </div>
                </div>
            </div>

            <!-- Panel de configuración (oculto por defecto) -->
            <div id="settings-panel" class="settings-panel settings-hidden">
                <!-- Se genera dinámicamente -->
            </div>
        `;

        // Aplicar background dinámicamente
        const backgroundContainer = document.getElementById('background-container');
        if (backgroundContainer && backgroundImage) {
            backgroundContainer.style.background = backgroundImage;
        }

        // Renderizar ventanas
        this.windowManager.renderAllWindows();
        
        console.log('🎨 Interfaz renderizada');
    }

    /**
     * Configurar listeners para mensajes de la extensión
     */
    setupExtensionMessageListeners() {
        console.log('📨 Configurando listeners de mensajes de extensión...');
        
        // Escuchar mensajes del popup u otras partes de la extensión
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                console.log('📨 Mensaje recibido desde extensión:', message, 'de:', sender);
                
                switch (message.action) {
                    case 'openSettings':
                        console.log('⚙️ Procesando solicitud openSettings...');
                        
                        // Esperar a que la aplicación esté inicializada
                        const waitForInit = () => {
                            console.log('🔄 Verificando inicialización...', this.initialized);
                            if (this.initialized) {
                                console.log('✅ App inicializada, abriendo configuración...');
                                this.toggleSettings();
                                sendResponse({ success: true, message: 'Configuración abierta' });
                            } else {
                                console.log('⏳ App no inicializada, esperando...');
                                setTimeout(waitForInit, 100);
                            }
                        };
                        waitForInit();
                        return true; // Indicar que la respuesta será asíncrona
                        
                    case 'getStatus':
                        sendResponse({ 
                            success: true, 
                            initialized: this.initialized,
                            ready: true 
                        });
                        return false;
                        
                    default:
                        console.log('❓ Acción no reconocida:', message.action);
                        sendResponse({ success: false, error: 'Acción no reconocida: ' + message.action });
                        return false;
                }
            });
            console.log('✅ Listeners de mensajes configurados');
        } else {
            console.warn('⚠️ Chrome runtime no disponible, ejecutándose fuera de extensión');
        }
    }

    /**
     * Configurar event listeners globales
     */
    setupGlobalEventListeners() {
        // Click en bookmarks
        document.addEventListener('click', (e) => {
            const bookmarkItem = e.target.closest('.bookmark-item');
            if (bookmarkItem && bookmarkItem.dataset.url) {
                this.bookmarkManager.navigateToBookmark(bookmarkItem.dataset.url);
            }
        });

        // Botón "Cargar más"
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('load-more-bookmarks')) {
                this.handleLoadMoreBookmarks(e.target);
            }
        });
    }

    /**
     * Configurar event listeners específicos de la aplicación
     */
    setupApplicationEventListeners() {
        console.log('🔧 Configurando event listeners de aplicación...');
        
        // Usar setTimeout para asegurar que el DOM esté completamente renderizado
        setTimeout(() => {
            this.setupConfigButton();
            
            // Botón añadir ventana
            const addWindowButton = document.getElementById('add-window-button');
            if (addWindowButton) {
                addWindowButton.addEventListener('click', () => {
                    console.log('➕ Botón añadir ventana clickeado');
                    this.showAddWindowDialog();
                });
                console.log('✅ Event listener de añadir ventana agregado');
            } else {
                console.error('❌ Botón de añadir ventana no encontrado');
            }

            // Theme manager listeners
            this.themeManager.setupThemeEventListeners();
            
        }, 100); // 100ms delay para asegurar render completo
    }

    /**
     * Configurar específicamente el botón de configuración con debugging
     */
    setupConfigButton() {
        console.log('🔧 setupConfigButton() iniciado');
        
        // Buscar el botón
        const configButton = document.getElementById('config-button');
        console.log('🔍 Botón encontrado:', configButton);
        
        if (!configButton) {
            console.error('❌ Botón config-button no encontrado');
            console.log('🔍 Todos los elementos con ID en el DOM:');
            Array.from(document.querySelectorAll('[id]')).forEach(el => {
                console.log(`  - ${el.id}: ${el.tagName} ${el.className}`);
            });
            return;
        }

        // Verificar si ya tiene event listeners
        console.log('🔍 Verificando event listeners existentes...');
        
        // Limpiar listeners anteriores clonando el elemento
        const newConfigButton = configButton.cloneNode(true);
        configButton.parentNode.replaceChild(newConfigButton, configButton);
        
        // Agregar event listener con múltiples métodos
        console.log('🔗 Agregando event listeners...');
        
        // Event listener principal
        newConfigButton.addEventListener('click', (e) => {
            console.log('🎯 Click detectado en config button');
            e.preventDefault();
            e.stopPropagation();
            this.handleConfigClick();
        });

        console.log('✅ Event listeners de configuración agregados');
        console.log('🔍 Botón final:', newConfigButton);
        
        // Test manual del botón
        console.log('🧪 Realizando test manual del botón...');
        setTimeout(() => {
            if (document.getElementById('config-button')) {
                console.log('✅ Botón sigue en el DOM después de 500ms');
            } else {
                console.error('❌ Botón desapareció del DOM');
            }
        }, 500);
    }

    /**
     * Manejar click del botón de configuración
     */
    handleConfigClick() {
        console.log('⚙️ handleConfigClick() ejecutado');
        try {
            this.toggleSettings();
            console.log('✅ toggleSettings() completado');
        } catch (error) {
            console.error('❌ Error en handleConfigClick:', error);
        }
    }

    /**
     * Manejar "Cargar más bookmarks"
     */
    handleLoadMoreBookmarks(button) {
        const container = button.closest('.bookmarks-container');
        if (!container) return;

        try {
            const remainingBookmarks = JSON.parse(button.dataset.remainingBookmarks);
            button.remove();

            const moreBookmarksHTML = this.bookmarkManager.renderBookmarksList(remainingBookmarks, false);
            container.insertAdjacentHTML('beforeend', moreBookmarksHTML);

            console.log(`📚 Cargados ${remainingBookmarks.length} marcadores adicionales`);
        } catch (error) {
            console.error('❌ Error cargando más marcadores:', error);
        }
    }

    /**
     * Mostrar/ocultar panel de configuración
     */
    toggleSettings() {
        console.log('🔧 toggleSettings() llamado');
        const panel = document.getElementById('settings-panel');
        
        if (!panel) {
            console.error('❌ Panel de configuración no encontrado en el DOM');
            return;
        }

        console.log('📋 Panel encontrado, clases actuales:', panel.className);

        if (panel.classList.contains('settings-hidden')) {
            console.log('🔄 Abriendo panel de configuración...');
            this.renderSettingsPanel();
            panel.classList.remove('settings-hidden');
            console.log('✅ Panel de configuración abierto');
        } else {
            console.log('🔄 Cerrando panel de configuración...');
            panel.classList.add('settings-hidden');
            console.log('✅ Panel de configuración cerrado');
        }
    }

    /**
     * Renderizar panel de configuración
     */
    renderSettingsPanel() {
        const panel = document.getElementById('settings-panel');
        if (!panel) return;

        panel.innerHTML = `
            <div class="settings-content">
                <div class="settings-header">
                    <h2>⚙️ Configuración</h2>
                    <button id="close-settings-btn" class="close-btn">×</button>
                </div>
                
                <div class="settings-section">
                    <h3>🎨 Fondos</h3>
                    <div class="background-selector">
                        ${this.themeManager.renderBackgroundSelector()}
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>🔧 Opciones</h3>
                    <button id="reset-settings-btn" class="danger-btn">🗑️ Resetear Configuración</button>
                    <button id="export-settings-btn" class="secondary-btn">📤 Exportar Configuración</button>
                </div>
                
                <div class="settings-section">
                    <h3>📊 Debug Info</h3>
                    <pre id="debug-info">Cargando información de debug...</pre>
                </div>
            </div>
        `;

        // Event listeners del panel
        document.getElementById('close-settings-btn')?.addEventListener('click', () => {
            this.toggleSettings();
        });

        document.getElementById('reset-settings-btn')?.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres resetear toda la configuración?')) {
                this.resetSettings();
            }
        });

        // Cargar información de debug de forma segura después del render
        setTimeout(() => {
            try {
                const debugInfo = this.getSafeDebugInfo();
                const debugElement = document.getElementById('debug-info');
                if (debugElement) {
                    debugElement.textContent = JSON.stringify(debugInfo, null, 2);
                }
            } catch (error) {
                console.error('Error cargando debug info:', error);
                const debugElement = document.getElementById('debug-info');
                if (debugElement) {
                    debugElement.textContent = 'Error cargando información de debug: ' + error.message;
                }
            }
        }, 100);
    }

    /**
     * Mostrar diálogo para añadir ventana
     */
    showAddWindowDialog() {
        const folders = this.bookmarkManager.getUniqueFolders(this.stateManager.getState('bookmarks'));
        
        if (folders.length === 0) {
            alert('No hay carpetas de marcadores disponibles');
            return;
        }

        // Crear modal personalizado
        const modal = document.createElement('div');
        modal.className = 'add-window-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>➕ Añadir Nueva Ventana</h3>
                        <button class="modal-close" type="button">×</button>
                    </div>
                    <div class="modal-body">
                        <p>Selecciona una carpeta para crear una nueva ventana:</p>
                        <div class="folder-list">
                            ${folders.map((folder, index) => `
                                <div class="folder-option" data-folder="${folder}">
                                    <span class="folder-icon">📁</span>
                                    <span class="folder-name">${SecurityUtils.decodeHtmlEntities(folder)}</span>
                                    <span class="folder-count">(${this.bookmarkManager.groupBookmarksByFolder(this.stateManager.getState('bookmarks'))[folder]?.length || 0} marcadores)</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="cancel-btn" type="button">Cancelar</button>
                    </div>
                </div>
            </div>
        `;

        // Agregar estilos dinámicos
        const style = document.createElement('style');
        style.textContent = `
            .add-window-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            .modal-overlay {
                background: rgba(0, 0, 0, 0.5);
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .modal-content {
                background: white;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }
            
            .app.dark .modal-content {
                background: #2a2a2a;
                border: 1px solid rgba(255, 255, 255, 0.15);
            }
            
            .modal-header {
                background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                color: white;
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .modal-header h3 {
                margin: 0;
                font-size: 18px;
            }
            
            .modal-close {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .modal-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .modal-body {
                padding: 20px;
            }
            
            .modal-body p {
                margin: 0 0 16px 0;
                color: #333;
            }
            
            .app.dark .modal-body p {
                color: #e0e0e0;
            }
            
            .folder-list {
                max-height: 300px;
                overflow-y: auto;
            }
            
            .folder-option {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .folder-option:hover {
                border-color: #4CAF50;
                background: #f8f9fa;
            }
            
            .app.dark .folder-option {
                border-color: rgba(255, 255, 255, 0.2);
                background: rgba(255, 255, 255, 0.05);
            }
            
            .app.dark .folder-option:hover {
                border-color: #4CAF50;
                background: rgba(76, 175, 80, 0.2);
            }
            
            .folder-icon {
                margin-right: 12px;
                font-size: 18px;
            }
            
            .folder-name {
                flex: 1;
                font-weight: 500;
                color: #333;
            }
            
            .app.dark .folder-name {
                color: #e0e0e0;
            }
            
            .folder-count {
                font-size: 12px;
                color: #666;
            }
            
            .app.dark .folder-count {
                color: #aaa;
            }
            
            .modal-footer {
                padding: 16px 20px;
                border-top: 1px solid #e0e0e0;
                display: flex;
                justify-content: flex-end;
            }
            
            .cancel-btn {
                background: #f5f5f5;
                border: 1px solid #ddd;
                color: #333;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .cancel-btn:hover {
                background: #e0e0e0;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(modal);

        // Event listeners del modal
        const closeModal = () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        };

        // Cerrar modal
        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.querySelector('.cancel-btn').addEventListener('click', closeModal);
        modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeModal();
        });

        // Seleccionar carpeta
        modal.querySelectorAll('.folder-option').forEach(option => {
            option.addEventListener('click', () => {
                const folder = option.dataset.folder;
                const groupedBookmarks = this.bookmarkManager.groupBookmarksByFolder(this.stateManager.getState('bookmarks'));
                
                this.windowManager.createWindow({
                    type: 'bookmark',
                    folder: folder,
                    position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
                    bookmarks: groupedBookmarks[folder] || []
                });
                
                this.windowManager.renderAllWindows();
                closeModal();
            });
        });
    }

    /**
     * Resetear configuración
     */
    resetSettings() {
        console.log('🔄 Reseteando configuración...');
        
        // Limpiar storage
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.sync.clear(() => {
                    console.log('✅ Chrome.storage limpiado');
                });
            }
            localStorage.clear();
            console.log('✅ LocalStorage limpiado');
        } catch (error) {
            console.error('❌ Error limpiando storage:', error);
        }
        
        // Limpiar estado y reinicializar
        this.stateManager.clear();
        this.cleanup();
        
        // Cerrar panel de configuración
        this.toggleSettings();
        
        // Reinicializar después de un breve delay
        setTimeout(() => {
            this.init();
            console.log('✅ Configuración reseteada completamente');
        }, 100);
    }

    /**
     * Limpiar recursos
     */
    cleanup() {
        this.windowManager.cleanup();
        this.bookmarkManager.clearCache();
        this.initialized = false;
    }

    /**
     * Reiniciar aplicación
     */
    restart() {
        console.log('🔄 Reiniciando aplicación...');
        this.cleanup();
        this.init();
    }

    /**
     * Obtener información de debug de forma segura
     */
    getSafeDebugInfo() {
        try {
            return {
                initialized: this.initialized,
                windows: this.stateManager.getState('windows')?.length || 0,
                bookmarks: this.stateManager.getState('bookmarks')?.length || 0,
                theme: this.stateManager.getState('theme') || 'unknown',
                performance: {
                    memory: this.getMemoryUsage(),
                    timing: Math.round(performance.now())
                }
            };
        } catch (error) {
            return {
                error: 'Error obteniendo debug info: ' + error.message,
                initialized: this.initialized
            };
        }
    }

    /**
     * Obtener información de debug (método original - deprecated)
     */
    getDebugInfo() {
        return this.getSafeDebugInfo();
    }

    /**
     * Obtener uso de memoria (si está disponible)
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return 'No disponible';
    }

    /**
     * Exponer API de debugging
     */
    exposeDebugAPI() {
        window.bookmarkManagerApp = this;
        window.bookmarkManagerApp.getDebugInfo = () => this.getDebugInfo();
        window.bookmarkManagerApp.restart = () => this.restart();
        window.bookmarkManagerApp.testConfigButton = () => {
            console.log('🧪 Test manual del botón de configuración...');
            const button = document.getElementById('config-button');
            if (button) {
                console.log('✅ Botón encontrado:', button);
                console.log('🎯 Simulando click...');
                this.handleConfigClick();
            } else {
                console.error('❌ Botón no encontrado');
            }
        };
        window.bookmarkManagerApp.forceToggleSettings = () => {
            console.log('🔧 Forzando toggle de configuración...');
            this.toggleSettings();
        };
        window.bookmarkManagerApp.clearStorage = () => {
            console.log('🗑️ Limpiando chrome.storage...');
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.sync.clear(() => {
                    console.log('✅ Chrome.storage limpiado');
                });
            }
            localStorage.clear();
            console.log('✅ LocalStorage limpiado');
        };
        
        console.log('🔧 API de debugging disponible en window.bookmarkManagerApp');
        console.log('💡 Comandos disponibles:');
        console.log('  - window.bookmarkManagerApp.testConfigButton()');
        console.log('  - window.bookmarkManagerApp.forceToggleSettings()');
        console.log('  - window.bookmarkManagerApp.getDebugInfo()');
        console.log('  - window.bookmarkManagerApp.restart()');
        console.log('  - window.bookmarkManagerApp.clearStorage() [Para limpiar storage]');
    }
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new BookmarkManagerApp();
    });
} else {
    new BookmarkManagerApp();
}