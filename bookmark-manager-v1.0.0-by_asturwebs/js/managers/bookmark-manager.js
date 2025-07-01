// ===== GESTOR DE MARCADORES =====
class BookmarkManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.cache = PerformanceUtils.createCache(300000);
        this.throttledSearch = PerformanceUtils.throttle((searchTerm, windowId) => this._handleSearch(searchTerm, windowId), 200);
    }

    /**
     * Cargar marcadores desde Chrome API
     */
    async loadBookmarks() {
        console.log('Cargando marcadores...');
        
        if (typeof chrome !== 'undefined' && chrome.bookmarks) {
            try {
                const bookmarkTree = await new Promise((resolve, reject) => {
                    chrome.bookmarks.getTree((results) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(results);
                        }
                    });
                });
                
                const flatBookmarks = this.flattenBookmarks(bookmarkTree);
                console.log(`${flatBookmarks.length} marcadores cargados desde Chrome`);
                
                this.stateManager.setState('bookmarks', flatBookmarks);
                return flatBookmarks;
                
            } catch (error) {
                console.error('Error cargando marcadores:', error);
                return this.getDefaultBookmarks();
            }
        } else {
            console.warn('Chrome bookmarks API no disponible, usando marcadores por defecto');
            const defaultBookmarks = this.getDefaultBookmarks();
            this.stateManager.setState('bookmarks', defaultBookmarks);
            return defaultBookmarks;
        }
    }

    /**
     * Aplanar el árbol de marcadores de Chrome
     */
    flattenBookmarks(bookmarkNodes) {
        const result = [];
        
        const traverse = (nodes, folderName = '') => {
            nodes.forEach(node => {
                if (node.url) {
                    result.push({
                        id: node.id,
                        title: node.title,
                        url: node.url,
                        folder: folderName || 'Favoritos'
                    });
                } else if (node.children) {
                    traverse(node.children, node.title || folderName);
                }
            });
        };
        
        traverse(bookmarkNodes);
        return result;
    }

    /**
     * Obtener marcadores por defecto para desarrollo/demo
     */
    getDefaultBookmarks() {
        return [
            { id: '1', title: 'Google', url: 'https://www.google.com', folder: 'Favoritos' },
            { id: '2', title: 'YouTube', url: 'https://www.youtube.com', folder: 'Favoritos' },
            { id: '3', title: 'GitHub', url: 'https://github.com', folder: 'Desarrollo' },
            { id: '4', title: 'Stack Overflow', url: 'https://stackoverflow.com', folder: 'Desarrollo' },
            { id: '5', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', folder: 'Desarrollo' },
            { id: '6', title: 'Wikipedia', url: 'https://www.wikipedia.org', folder: 'Referencia' },
            { id: '7', title: 'Amazon', url: 'https://www.amazon.com', folder: 'Compras' },
            { id: '8', title: 'Netflix', url: 'https://www.netflix.com', folder: 'Entretenimiento' },
            { id: '9', title: 'Facebook', url: 'https://www.facebook.com', folder: 'Social' },
            { id: '10', title: 'Twitter', url: 'https://www.twitter.com', folder: 'Social' }
        ];
    }

    /**
     * Agrupar marcadores por carpeta
     */
    groupBookmarksByFolder(bookmarks) {
        const grouped = {};
        
        bookmarks.forEach(bookmark => {
            const folder = bookmark.folder || 'Sin Carpeta';
            if (!grouped[folder]) {
                grouped[folder] = [];
            }
            grouped[folder].push(bookmark);
        });
        
        return grouped;
    }

    /**
     * Obtener carpetas únicas de marcadores
     */
    getUniqueFolders(bookmarks) {
        const folders = [...new Set(bookmarks.map(b => b.folder || 'Sin Carpeta'))];
        return folders.filter(f => f && f.trim() !== '');
    }

    /**
     * Filtrar marcadores con cache optimizado
     */
    getFilteredBookmarks(bookmarks, searchTerm) {
        if (!searchTerm) {
            return bookmarks;
        }

        const cacheKey = `filtered_${JSON.stringify(bookmarks.map(b => b.id))}_${searchTerm}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const filtered = bookmarks.filter(bookmark => 
            bookmark.title.toLowerCase().includes(searchTerm) ||
            bookmark.url.toLowerCase().includes(searchTerm)
        );

        this.cache.set(cacheKey, filtered);
        return filtered;
    }

    /**
     * Manejar búsqueda con throttling
     */
    handleSearch(searchTerm, windowId) {
        this.throttledSearch(searchTerm, windowId);
    }

    /**
     * Método privado para ejecutar búsqueda
     */
    _handleSearch(searchTerm, windowId) {
        const windows = this.stateManager.getState('windows');
        const currentWindow = windows.find(w => w.id === windowId);
        if (!currentWindow) return;

        const filtered = this.getFilteredBookmarks(currentWindow.bookmarks, searchTerm);
        
        const container = document.querySelector(`#window-content-${windowId} .bookmarks-container`) ||
                         document.querySelector(`[data-window-id="${windowId}"] .bookmarks-container`);
        
        if (container) {
            container.innerHTML = this.renderBookmarksList(filtered);
        }
    }

    /**
     * Renderizar lista de marcadores con lazy loading
     */
    renderBookmarksList(bookmarks, lazyLoad = true) {
        if (!bookmarks || !Array.isArray(bookmarks) || bookmarks.length === 0) {
            return '<div class="no-bookmarks">No hay marcadores en esta carpeta</div>';
        }

        const LAZY_LOAD_THRESHOLD = 50;
        const shouldLazyLoad = lazyLoad && bookmarks.length > LAZY_LOAD_THRESHOLD;
        const bookmarksToRender = shouldLazyLoad ? bookmarks.slice(0, LAZY_LOAD_THRESHOLD) : bookmarks;

        const fragment = document.createDocumentFragment();
        
        bookmarksToRender.forEach(bookmark => {
            const bookmarkDiv = this.createElement('div', 'bookmark-item', null, {
                'data-url': SecurityUtils.sanitizeUrl(bookmark.url) || '#'
            });

            // Usar un icono emoji en lugar de favicon para evitar CSP issues
            const faviconSpan = this.createElement('span', 'bookmark-favicon');
            faviconSpan.textContent = '🔗'; // Icono de enlace por defecto

            const title = this.createElement('span', 'bookmark-title');
            title.textContent = SecurityUtils.decodeHtmlEntities(bookmark.title);

            bookmarkDiv.appendChild(faviconSpan);
            bookmarkDiv.appendChild(title);
            fragment.appendChild(bookmarkDiv);
        });

        // Agregar botón "Cargar más" si hay lazy loading
        if (shouldLazyLoad) {
            const loadMoreButton = this.createElement('button', 'load-more-bookmarks', 
                `Cargar más marcadores (${bookmarks.length - LAZY_LOAD_THRESHOLD} restantes)`, {
                'data-remaining-bookmarks': JSON.stringify(bookmarks.slice(LAZY_LOAD_THRESHOLD)),
                'type': 'button'
            });
            fragment.appendChild(loadMoreButton);
        }

        const tempContainer = document.createElement('div');
        tempContainer.appendChild(fragment);
        return tempContainer.innerHTML;
    }

    /**
     * Helper para crear elementos DOM
     */
    createElement(tag, className, innerHTML, attributes = {}) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        
        return element;
    }

    /**
     * Navegar a URL de bookmark de forma segura
     */
    navigateToBookmark(url) {
        const sanitizedUrl = SecurityUtils.sanitizeUrl(url);
        if (sanitizedUrl && sanitizedUrl !== '#') {
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.update({ url: sanitizedUrl });
            } else {
                window.location.href = sanitizedUrl;
            }
        } else {
            console.warn('URL no válida o maliciosa bloqueada:', url);
        }
    }

    /**
     * Limpiar cache de marcadores
     */
    clearCache() {
        this.cache.clear();
    }
}

// Exportar para uso global
window.BookmarkManager = BookmarkManager;