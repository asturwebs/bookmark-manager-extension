// ===== GESTOR DE ESTADO CENTRALIZADO =====
class StateManager {
    constructor() {
        this.state = {
            windows: [],
            backgroundImage: 'linear-gradient(135deg, #546190 0%, #483874 100%)',
            theme: 'light',
            bookmarks: [],
            defaultSearchEngine: 'Google',
            defaultTranslationEngine: 'Google Translate',
            initialized: false,
            isInitializing: false
        };
        
        this.subscribers = new Map();
        this.cache = PerformanceUtils.createCache(300000); // 5 minutos
        this.debouncedSave = PerformanceUtils.debounce(() => this._saveImmediate(), 1000);
    }

    /**
     * Obtener valor del estado
     * @param {string} key - Clave del estado
     * @returns {any} - Valor del estado
     */
    getState(key) {
        return key ? this.state[key] : this.state;
    }

    /**
     * Establecer valor en el estado
     * @param {string} key - Clave del estado
     * @param {any} value - Nuevo valor
     * @param {boolean} save - Si debe guardar inmediatamente
     */
    setState(key, value, save = true) {
        const oldValue = this.state[key];
        this.state[key] = value;
        
        // Notificar suscriptores
        this.notifySubscribers(key, value, oldValue);
        
        // Guardar con debouncing
        if (save) {
            this.debouncedSave();
        }
    }

    /**
     * Actualizar múltiples valores del estado
     * @param {Object} updates - Objeto con las actualizaciones
     * @param {boolean} save - Si debe guardar inmediatamente
     */
    updateState(updates, save = true) {
        const oldValues = {};
        
        Object.entries(updates).forEach(([key, value]) => {
            oldValues[key] = this.state[key];
            this.state[key] = value;
            this.notifySubscribers(key, value, oldValues[key]);
        });
        
        if (save) {
            this.debouncedSave();
        }
    }

    /**
     * Suscribirse a cambios en el estado
     * @param {string} key - Clave a observar
     * @param {Function} callback - Función a ejecutar
     * @returns {Function} - Función para desuscribirse
     */
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        
        this.subscribers.get(key).add(callback);
        
        // Retornar función para desuscribirse
        return () => {
            const keySubscribers = this.subscribers.get(key);
            if (keySubscribers) {
                keySubscribers.delete(callback);
                if (keySubscribers.size === 0) {
                    this.subscribers.delete(key);
                }
            }
        };
    }

    /**
     * Notificar a suscriptores sobre cambios
     * @param {string} key - Clave que cambió
     * @param {any} newValue - Nuevo valor
     * @param {any} oldValue - Valor anterior
     */
    notifySubscribers(key, newValue, oldValue) {
        const keySubscribers = this.subscribers.get(key);
        if (keySubscribers) {
            keySubscribers.forEach(callback => {
                try {
                    callback(newValue, oldValue, key);
                } catch (error) {
                    console.error('Error en subscriber:', error);
                }
            });
        }
    }

    /**
     * Cargar estado desde storage
     */
    async loadState() {
        console.log('Cargando estado desde storage...');
        let config = {};
        
        try {
            // Intentar localStorage primero
            const localConfig = localStorage.getItem('bookmarkManager_fullConfig');
            if (localConfig) {
                config = JSON.parse(localConfig);
                console.log('Configuración cargada desde localStorage:', config);
            }
        } catch (e) {
            console.error('Error cargando desde localStorage:', e);
        }

        // Si no hay config en localStorage, intentar chrome.storage
        if (Object.keys(config).length === 0 && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            try {
                // Verificar permisos y disponibilidad de chrome.storage
                const isStorageAvailable = await new Promise(resolve => {
                    chrome.storage.sync.get(null, (items) => {
                        if (chrome.runtime.lastError) {
                            console.warn('Chrome storage no disponible:', chrome.runtime.lastError);
                            resolve(false);
                        } else {
                            resolve(true);
                        }
                    });
                });

                if (isStorageAvailable) {
                    const items = await new Promise(resolve => chrome.storage.sync.get(null, resolve));
                    if (items && items.bookmarkManager_fullConfig) {
                        config = JSON.parse(items.bookmarkManager_fullConfig);
                        console.log('Configuración cargada desde chrome.storage:', config);
                    }
                }
            } catch (e) {
                console.error('Error cargando desde chrome.storage:', e);
            }
        }

        // Aplicar configuración cargada
        if (Object.keys(config).length > 0) {
            this.updateState(config, false); // No guardar inmediatamente
        }

        return config;
    }

    /**
     * Guardar estado a storage (método público con debouncing)
     */
    saveState() {
        this.debouncedSave();
    }

    /**
     * Guardar estado inmediatamente (método privado)
     */
    _saveImmediate() {
        console.log('Guardando estado actual...');
        
        const fullConfig = {
            windows: this.state.windows,
            backgroundImage: this.state.backgroundImage,
            theme: this.state.theme,
            defaultSearchEngine: this.state.defaultSearchEngine,
            defaultTranslationEngine: this.state.defaultTranslationEngine,
            layoutSaved: true,
            lastSaved: new Date().toISOString()
        };
        
        // Para chrome.storage: solo lo esencial (sin ventanas ni imágenes pesadas)
        let lightBackgroundImage = this.state.backgroundImage;
        if (this.state.backgroundImage && this.state.backgroundImage.startsWith('url("data:')) {
            lightBackgroundImage = 'linear-gradient(135deg, #546190 0%, #483874 100%)'; // Siempre usar fallback
            console.log('Usando gradiente fallback para chrome.storage (data URLs no permitidos)');
        }
        
        // Filtrar solo ventanas esenciales (sin bookmarks)
        const lightWindows = this.state.windows.map(w => ({
            id: w.id,
            type: w.type,
            folder: w.folder,
            position: w.position,
            size: w.size,
            minimized: w.minimized,
            colorClass: w.colorClass
            // NO incluir bookmarks array
        }));
        
        // Guardar solo configuración esencial en chrome.storage (solo si está disponible)
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            try {
                chrome.storage.sync.set({
                    theme: this.state.theme,
                    backgroundImage: lightBackgroundImage,
                    defaultSearchEngine: this.state.defaultSearchEngine,
                    defaultTranslationEngine: this.state.defaultTranslationEngine,
                    windowsCount: this.state.windows.length,
                    lastSaved: new Date().toISOString()
                    // Nota: windows y bookmarks van solo a localStorage
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.warn('Error guardando en chrome.storage:', chrome.runtime.lastError.message || chrome.runtime.lastError);
                    } else {
                        console.log('Estado esencial guardado en chrome.storage');
                    }
                });
            } catch (e) {
                console.error('Error accediendo a chrome.storage:', e);
            }
        }
        
        // Guardar en localStorage como respaldo (incluyendo configuración completa)
        try {
            const fullConfigWithBookmarks = {
                ...fullConfig,
                bookmarks: this.state.bookmarks // Solo incluir bookmarks en localStorage
            };
            localStorage.setItem('bookmarkManager_fullConfig', JSON.stringify(fullConfigWithBookmarks));
            localStorage.setItem('bookmarkManager_theme', this.state.theme);
            localStorage.setItem('bookmarkManager_searchEngine', this.state.defaultSearchEngine);
            localStorage.setItem('bookmarkManager_translationEngine', this.state.defaultTranslationEngine);
            localStorage.setItem('bookmarkManager_windows', JSON.stringify(this.state.windows));
            console.log('Estado guardado en localStorage');
        } catch (e) {
            console.error('Error guardando en localStorage:', e);
        }
    }

    /**
     * Limpiar estado y cache
     */
    clear() {
        this.state = {
            windows: [],
            backgroundImage: 'linear-gradient(135deg, #546190 0%, #483874 100%)',
            theme: 'light',
            bookmarks: [],
            defaultSearchEngine: 'Google',
            defaultTranslationEngine: 'Google Translate',
            initialized: false,
            isInitializing: false
        };
        
        this.cache.clear();
        this.subscribers.clear();
    }

    /**
     * Información de debugging
     */
    getDebugInfo() {
        return {
            stateKeys: Object.keys(this.state),
            subscribersCount: Array.from(this.subscribers.entries()).map(([key, subs]) => ({
                key,
                count: subs.size
            })),
            cacheActive: this.cache.has('debug') ? 'Activo' : 'Vacío'
        };
    }
}

// Exportar para uso global en extension
window.StateManager = StateManager;