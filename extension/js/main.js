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
            
            // Calcular posiciones junto al título
            const titleWidth = 400; // Ancho aproximado del título "Gestor de Marcadores"
            const centerX = window.innerWidth / 2;
            const windowWidth = 350; // Tamaño original restaurado
            const windowHeight = 400; // Tamaño original restaurado
            const titleY = 40; // Altura más arriba para estar realmente junto al título
            
            const leftX = centerX - titleWidth/2 - windowWidth - 20; // Izquierda del título
            const rightX = centerX + titleWidth/2 + 20; // Derecha del título
            
            const defaultWindows = [
                {
                    id: Date.now() + 1,
                    type: 'search',
                    folder: 'Búsqueda Web',
                    position: { x: leftX, y: titleY },
                    size: { width: windowWidth, height: windowHeight },
                    minimized: false,
                    colorClass: 'window-color-1',
                    headerColor: 'header-color-default' // Verde por defecto
                },
                {
                    id: Date.now() + 2,
                    type: 'translation',
                    folder: 'Traductor',
                    position: { x: rightX, y: titleY },
                    size: { width: windowWidth, height: windowHeight },
                    minimized: false,
                    colorClass: 'window-color-1',
                    headerColor: 'header-color-default' // Verde por defecto
                }
            ];
            
            this.stateManager.setState('windows', defaultWindows);
            windows = defaultWindows;
        } else {
            // Verificar que existan ventanas de búsqueda y traducción
            const hasSearchWindow = windows.some(w => w.type === 'search');
            const hasTranslationWindow = windows.some(w => w.type === 'translation');
            
            // Usar las mismas posiciones calculadas
            const titleWidth = 400;
            const centerX = window.innerWidth / 2;
            const windowWidth = 350; // Tamaño original restaurado
            const windowHeight = 400; // Tamaño original restaurado
            const titleY = 40;
            const leftX = centerX - titleWidth/2 - windowWidth - 20;
            const rightX = centerX + titleWidth/2 + 20;
            
            if (!hasSearchWindow) {
                windows.push({
                    id: Date.now() + 999,
                    type: 'search',
                    folder: 'Búsqueda Web',
                    position: { x: leftX, y: titleY },
                    size: { width: windowWidth, height: windowHeight },
                    minimized: false,
                    colorClass: 'window-color-1',
                    headerColor: 'header-color-default'
                });
            } else {
                // Actualizar ventana existente con color verde
                const searchWindow = windows.find(w => w.type === 'search');
                if (searchWindow) {
                    searchWindow.headerColor = 'header-color-default';
                }
            }
            
            if (!hasTranslationWindow) {
                windows.push({
                    id: Date.now() + 998,
                    type: 'translation',
                    folder: 'Traductor',
                    position: { x: rightX, y: titleY },
                    size: { width: windowWidth, height: windowHeight },
                    minimized: false,
                    colorClass: 'window-color-1',
                    headerColor: 'header-color-default'
                });
            } else {
                // Actualizar ventana existente con color verde
                const translationWindow = windows.find(w => w.type === 'translation');
                if (translationWindow) {
                    translationWindow.headerColor = 'header-color-default';
                }
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
            
            // Usar alineación de grilla en lugar de cascada
            const windowWidth = 350;
            const windowHeight = 400;
            const marginX = 20;
            const marginY = 20;
            const startX = 50;
            const startY = 200; // Más espacio para el header
            const footerHeight = 80; // Espacio para el footer
            
            // Calcular cuántas columnas caben sin salirse del área visible
            const availableWidth = window.innerWidth - (startX * 2);
            const maxColumns = Math.max(1, Math.floor(availableWidth / (windowWidth + marginX)));
            
            let column = 0;
            let row = 0;
            
            folders.forEach((folder, index) => {
                if (folder && folder.trim()) {
                    // Verificar si hay una posición guardada para esta carpeta
                    const savedWindows = this.stateManager.getState('windows') || [];
                    const existingSavedWindow = savedWindows.find(w => w.folder === folder && w.type === 'bookmark');
                    
                    // Calcular posición en grilla si no hay posición guardada
                    let posX, posY;
                    if (existingSavedWindow && existingSavedWindow.position) {
                        posX = existingSavedWindow.position.x;
                        posY = existingSavedWindow.position.y;
                    } else {
                        posX = startX + (column * (windowWidth + marginX));
                        posY = startY + (row * (windowHeight + marginY));
                        
                        // Asegurar que la ventana no se salga del área visible
                        const maxX = window.innerWidth - windowWidth - 20;
                        const maxY = window.innerHeight - windowHeight - footerHeight;
                        
                        posX = Math.max(20, Math.min(posX, maxX));
                        posY = Math.max(startY, Math.min(posY, maxY));
                        
                        // Avanzar a siguiente posición
                        column++;
                        if (column >= maxColumns) {
                            column = 0;
                            row++;
                        }
                    }
                    
                    const windowConfig = {
                        type: 'bookmark',
                        folder: folder,
                        position: { x: posX, y: posY },
                        size: existingSavedWindow ? existingSavedWindow.size : { width: windowWidth, height: windowHeight },
                        bookmarks: groupedBookmarks[folder],
                        colorClass: existingSavedWindow ? existingSavedWindow.colorClass : undefined,
                        headerColor: existingSavedWindow ? existingSavedWindow.headerColor : undefined
                    };
                    
                    const windowId = this.windowManager.createWindow(windowConfig);
                    
                    console.log(`📁 Ventana creada para "${folder}" en posición (${posX}, ${posY})`);
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
                    <div class="settings-row">
                        <button id="save-layout-btn" class="primary-btn">💾 Guardar Layout Actual</button>
                        <button id="auto-align-btn" class="secondary-btn">📐 Alinear Automáticamente</button>
                    </div>
                    <div class="settings-row">
                        <button id="reset-settings-btn" class="danger-btn">🗑️ Resetear Configuración</button>
                        <button id="export-settings-btn" class="secondary-btn">📤 Exportar Configuración</button>
                    </div>
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

        document.getElementById('save-layout-btn')?.addEventListener('click', () => {
            this.saveCurrentLayout();
        });

        document.getElementById('auto-align-btn')?.addEventListener('click', () => {
            this.autoAlignWindows();
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
        console.log('➕ === INICIO DIALOG AÑADIR VENTANA ===');
        
        // Esperar un tick para asegurar que cualquier operación previa termine
        setTimeout(() => {
            this._showAddWindowDialogInternal();
        }, 50);
    }
    
    _showAddWindowDialogInternal() {
        // Obtener el estado más fresco posible
        const currentState = this.stateManager.getState();
        
        console.log('🔄 Análisis completo del estado actual:');
        console.log('  - Total ventanas en estado:', currentState.windows?.length || 0);
        console.log('  - Total marcadores cargados:', currentState.bookmarks?.length || 0);
        
        // Verificar el DOM actual
        const domWindowElements = document.querySelectorAll('.draggable-window');
        console.log('🏠 Ventanas físicas en DOM:', domWindowElements.length);
        
        // Crear lista de ventanas existentes combinando estado y DOM para máxima precisión
        const existingWindows = currentState.windows || [];
        const existingFolders = new Set();
        
        // Primero agregar desde el estado
        existingWindows.forEach(w => {
            if (w.type === 'bookmark' && w.folder) {
                existingFolders.add(w.folder);
                console.log(`📋 Estado: "${w.folder}" (ID: ${w.id}, Type: ${w.type})`);
            }
        });
        
        // Luego verificar DOM para doble confirmación
        Array.from(domWindowElements).forEach(el => {
            const titleElement = el.querySelector('.window-title');
            const title = titleElement?.textContent?.trim() || '';
            
            // Solo considerar ventanas de marcadores (excluir 🔍 y 🌍)
            if (title && !title.includes('🔍') && !title.includes('🌍') && !title.includes('Búsqueda') && !title.includes('Traductor')) {
                existingFolders.add(title);
                console.log(`🏠 DOM: "${title}" (Elemento: ${el.id})`);
            }
        });
        
        console.log('🎯 Carpetas que YA tienen ventanas:', Array.from(existingFolders));
        
        // Obtener todas las carpetas disponibles
        const allFolders = this.bookmarkManager.getUniqueFolders(currentState.bookmarks || []);
        console.log('📁 Todas las carpetas de marcadores disponibles:', allFolders);
        
        // Filtrar carpetas que NO tienen ventanas
        const availableFolders = allFolders.filter(folder => {
            const isAvailable = !existingFolders.has(folder);
            if (!isAvailable) {
                console.log(`❌ "${folder}" ya tiene ventana - FILTRADA`);
            } else {
                console.log(`✅ "${folder}" disponible para añadir`);
            }
            return isAvailable;
        });
        
        console.log('🎯 RESULTADO FINAL - Carpetas disponibles:', availableFolders);
        
        if (allFolders.length === 0) {
            this.showNotification('❌ No hay carpetas de marcadores disponibles', 'error');
            return;
        }
        
        if (availableFolders.length === 0) {
            this.showNotification('⚠️ Todas las carpetas ya tienen ventanas. Elimina una ventana primero para poder añadir otra.', 'error');
            return;
        }
        
        // Continuar con el resto del diálogo usando availableFolders en lugar de folders
        const folders = availableFolders;

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
                
                console.log('➕ Creando nueva ventana para carpeta:', folder);
                
                // Verificar si ya existe una ventana para esta carpeta
                const existingWindows = this.stateManager.getState('windows');
                const existingWindow = existingWindows.find(w => w.folder === folder && w.type === 'bookmark');
                
                if (existingWindow) {
                    // Si ya existe, solo mostrar notificación
                    this.showNotification(`⚠️ Ya existe una ventana para "${folder}"`, 'error');
                    closeModal();
                    return;
                }
                
                console.log('🪟 Creando nueva ventana para:', folder);
                
                const windowId = this.windowManager.createWindow({
                    type: 'bookmark',
                    folder: folder,
                    position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
                    bookmarks: groupedBookmarks[folder] || []
                });
                
                console.log('✅ Nueva ventana creada con ID:', windowId);
                console.log('📊 Total ventanas después de crear:', this.stateManager.getState('windows').length);
                
                // NO llamar renderAllWindows() - la ventana ya se añade automáticamente
                // En su lugar, solo añadir la nueva ventana al DOM
                const newWindowData = this.stateManager.getState('windows').find(w => w.id === windowId);
                if (newWindowData) {
                    const container = document.querySelector('.windows-container');
                    if (container) {
                        const windowElement = this.windowManager.renderBookmarkWindow(newWindowData);
                        container.appendChild(windowElement);
                        console.log('🏠 Nueva ventana añadida al DOM');
                    }
                }
                
                closeModal();
                this.showNotification(`✅ Ventana "${folder}" añadida correctamente`, 'success');
            });
        });
    }

    /**
     * Guardar layout actual
     */
    saveCurrentLayout() {
        console.log('💾 Guardando layout actual...');
        
        // Obtener posiciones actuales de todas las ventanas visibles
        const windowElements = document.querySelectorAll('.draggable-window');
        const windows = this.stateManager.getState('windows');
        
        windowElements.forEach(element => {
            const windowId = parseInt(element.id.replace('window-', ''));
            const windowData = windows.find(w => parseInt(w.id) === windowId);
            
            if (windowData) {
                // Actualizar posición y tamaño actuales
                windowData.position = {
                    x: parseInt(element.style.left) || windowData.position.x,
                    y: parseInt(element.style.top) || windowData.position.y
                };
                windowData.size = {
                    width: parseInt(element.style.width) || windowData.size.width,
                    height: parseInt(element.style.height) || windowData.size.height
                };
                
                console.log(`Guardando ventana ${windowData.folder}: pos(${windowData.position.x}, ${windowData.position.y})`);
            }
        });
        
        // Guardar inmediatamente
        this.stateManager.setState('windows', windows);
        this.stateManager.saveState();
        
        // Mostrar confirmación
        this.showNotification('💾 Layout guardado correctamente', 'success');
    }

    /**
     * Alinear ventanas automáticamente
     */
    autoAlignWindows() {
        console.log('📐 Alineando ventanas automáticamente...');
        
        const windows = this.stateManager.getState('windows');
        const windowElements = document.querySelectorAll('.draggable-window');
        
        // Configuración de alineación mejorada
        const startX = 50;
        const startY = 200; // Más espacio para el header
        const windowWidth = 350;
        const windowHeight = 400;
        const marginX = 20;
        const marginY = 20;
        const footerHeight = 80; // Espacio para el footer
        
        // Calcular cuántas columnas caben sin salirse del área visible
        const availableWidth = window.innerWidth - (startX * 2);
        const maxColumns = Math.max(1, Math.floor(availableWidth / (windowWidth + marginX)));
        
        // Calcular cuántas filas caben sin salirse del área visible
        const availableHeight = window.innerHeight - startY - footerHeight;
        const maxRows = Math.max(1, Math.floor(availableHeight / (windowHeight + marginY)));
        
        console.log(`📐 Configuración: ${maxColumns} columnas x ${maxRows} filas (Viewport: ${window.innerWidth}x${window.innerHeight})`);
        
        let currentX = startX;
        let currentY = startY;
        let column = 0;
        let row = 0;
        
        // Ordenar ventanas para tener un orden consistente
        const sortedElements = Array.from(windowElements).sort((a, b) => {
            const aId = parseInt(a.id.replace('window-', ''));
            const bId = parseInt(b.id.replace('window-', ''));
            return aId - bId;
        });
        
        sortedElements.forEach((element, index) => {
            const windowId = parseInt(element.id.replace('window-', ''));
            const windowData = windows.find(w => parseInt(w.id) === windowId);
            
            if (windowData) {
                // Calcular nueva posición
                let newX = currentX;
                let newY = currentY;
                
                // Asegurar que la ventana no se salga del área visible
                const maxX = window.innerWidth - windowWidth - 20;
                const maxY = window.innerHeight - windowHeight - footerHeight;
                
                newX = Math.max(20, Math.min(newX, maxX));
                newY = Math.max(startY, Math.min(newY, maxY));
                
                // Aplicar posición
                element.style.left = `${newX}px`;
                element.style.top = `${newY}px`;
                
                // Asegurar que el tamaño sea estándar
                element.style.width = `${windowWidth}px`;
                element.style.height = `${windowHeight}px`;
                
                // Actualizar datos
                windowData.position = { x: newX, y: newY };
                windowData.size = { width: windowWidth, height: windowHeight };
                
                console.log(`📍 Ventana ${windowData.folder}: (${newX}, ${newY}) - Col:${column}, Row:${row}`);
                
                // Calcular siguiente posición
                column++;
                if (column >= maxColumns) {
                    column = 0;
                    row++;
                    currentX = startX;
                    currentY = startY + (row * (windowHeight + marginY));
                    
                    // Si excedemos las filas disponibles, crear scroll o nueva columna
                    if (row >= maxRows) {
                        // Reiniciar desde la primera fila pero desplazado hacia la derecha
                        row = 0;
                        currentY = startY;
                        startX = Math.min(startX + (maxColumns * (windowWidth + marginX)), window.innerWidth - windowWidth - 20);
                        currentX = startX;
                    }
                } else {
                    currentX = startX + (column * (windowWidth + marginX));
                }
            }
        });
        
        // Guardar nuevas posiciones
        this.stateManager.setState('windows', windows);
        this.stateManager.saveState();
        
        // Mostrar confirmación
        this.showNotification(`📐 ${sortedElements.length} ventanas alineadas en grilla ${maxColumns}x${maxRows}`, 'success');
    }

    /**
     * Mostrar notificación
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
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