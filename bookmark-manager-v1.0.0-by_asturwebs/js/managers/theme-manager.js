// ===== GESTOR DE TEMAS =====
class ThemeManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        
        this.backgroundOptions = [
            { name: 'Gradiente Azul', value: 'linear-gradient(135deg, #546190 0%, #483874 100%)' },
            { name: 'Gradiente Verde', value: 'linear-gradient(135deg, #3a7d3e 0%, #2c5c3f 100%)' },
            { name: 'Gradiente Rojo', value: 'linear-gradient(135deg, #a93c35 0%, #7a2b28 100%)' },
            { name: 'Gradiente Morado', value: 'linear-gradient(135deg, #6a296e 0%, #4b1e55 100%)' },
            { name: 'Color Personalizado...', value: 'custom' },
            { name: 'Imagen Personalizada...', value: 'image' }
        ];
    }

    /**
     * Inicializar tema detectando preferencias del sistema
     */
    initializeTheme() {
        let savedTheme = this.stateManager.getState('theme');
        
        // Si no hay tema guardado, detectar preferencia del sistema
        if (!savedTheme) {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            savedTheme = prefersDark ? 'dark' : 'light';
            this.stateManager.setState('theme', savedTheme);
        }
        
        this.applyTheme(savedTheme);
        this.updateThemeButton(savedTheme);
        
        // Escuchar cambios en preferencias del sistema
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addListener((e) => {
                if (!localStorage.getItem('bookmarkManager_theme')) {
                    const newTheme = e.matches ? 'dark' : 'light';
                    this.setTheme(newTheme);
                }
            });
        }
    }

    /**
     * Cambiar tema
     */
    setTheme(theme) {
        if (!['light', 'dark'].includes(theme)) {
            console.warn('Tema no válido:', theme);
            return;
        }
        
        this.applyTheme(theme);
        this.updateThemeButton(theme);
        this.stateManager.setState('theme', theme);
        
        console.log('Tema establecido:', theme);
    }

    /**
     * Alternar entre temas
     */
    toggleTheme() {
        const currentTheme = this.stateManager.getState('theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * Aplicar tema al DOM
     */
    applyTheme(theme) {
        const app = document.querySelector('.app');
        if (app) {
            app.className = `app ${theme}`;
        }
        
        // También aplicar al body para elementos globales
        document.body.className = theme;
        
        // Actualizar meta theme-color para móviles
        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) {
            themeColorMeta = document.createElement('meta');
            themeColorMeta.name = 'theme-color';
            document.head.appendChild(themeColorMeta);
        }
        
        themeColorMeta.content = theme === 'dark' ? '#1a1a1a' : '#ffffff';
    }

    /**
     * Actualizar botón de tema
     */
    updateThemeButton(theme) {
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) {
            themeBtn.innerHTML = `<span>${theme === 'dark' ? '☀️' : '🌙'}</span>`;
            themeBtn.title = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
        }
    }

    /**
     * Establecer fondo personalizado
     */
    setBackground(background) {
        const container = document.getElementById('background-container');
        if (container) {
            // Validar que el background sea seguro
            if (this.isValidBackground(background)) {
                container.style.background = background;
                this.stateManager.setState('backgroundImage', background);
            } else {
                console.warn('Fondo no válido:', background);
            }
        }
    }

    /**
     * Validar que el fondo sea seguro
     */
    isValidBackground(background) {
        if (!background || typeof background !== 'string') return false;
        
        // Patrones permitidos
        const allowedPatterns = [
            /^linear-gradient\(/i,
            /^radial-gradient\(/i,
            /^#[0-9a-f]{3,6}$/i,
            /^rgb\(/i,
            /^rgba\(/i,
            /^hsl\(/i,
            /^hsla\(/i,
            /^url\(/i,  // URLs de imágenes
            /^data:image\//i  // Data URLs de imágenes
        ];
        
        // Patrones maliciosos
        const maliciousPatterns = [
            /javascript:/i,
            /expression\(/i,
            /<script/i,
            /on\w+=/i,
            /data:(?!image\/)/i  // Prevenir data URLs excepto imágenes
        ];
        
        // Verificar si es un patrón malicioso
        for (const pattern of maliciousPatterns) {
            if (pattern.test(background)) {
                return false;
            }
        }
        
        // Verificar si es un patrón permitido
        for (const pattern of allowedPatterns) {
            if (pattern.test(background)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Obtener opciones de fondo disponibles
     */
    getBackgroundOptions() {
        return this.backgroundOptions;
    }

    /**
     * Aplicar fondo por nombre
     */
    setBackgroundByName(name) {
        const option = this.backgroundOptions.find(opt => opt.name === name);
        if (option && option.value !== 'custom' && option.value !== 'image') {
            this.setBackground(option.value);
        }
    }

    /**
     * Renderizar selector de fondos
     */
    renderBackgroundSelector() {
        return this.backgroundOptions.map((option, index) => {
            const currentBackground = this.stateManager.getState('backgroundImage');
            const isSelected = option.value === currentBackground;
            
            if (option.value === 'custom') {
                return `
                    <div class="background-option custom-option">
                        <label for="custom-background">Color Personalizado:</label>
                        <input type="text" id="custom-background" placeholder="linear-gradient(...) o #color" />
                        <button type="button" id="apply-custom-bg">Aplicar</button>
                    </div>
                `;
            }
            
            if (option.value === 'image') {
                return `
                    <div class="background-option custom-option">
                        <label for="custom-image">Imagen de Fondo:</label>
                        <div class="image-input-group">
                            <input type="file" id="custom-image-file" accept="image/*" style="display: none;" />
                            <button type="button" id="select-image-file" class="file-button">📁 Seleccionar archivo</button>
                            <span class="file-name" id="selected-file-name"></span>
                        </div>
                        <div class="url-input-group">
                            <input type="text" id="custom-image-url" placeholder="O pega una URL: https://ejemplo.com/imagen.jpg" />
                            <button type="button" id="apply-custom-image-url">Aplicar URL</button>
                        </div>
                    </div>
                `;
            }
            
            return `
                <div class="background-option ${isSelected ? 'selected' : ''}" 
                     data-background="${option.value}">
                    <div class="background-preview" style="background: ${option.value}"></div>
                    <span class="background-name">${option.name}</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Configurar event listeners para temas
     */
    setupThemeEventListeners() {
        // Botón de toggle tema
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Event listeners para selector de fondos (se configuran cuando se abre el panel)
        document.addEventListener('change', (e) => {
            // Manejar selección de archivo de imagen
            if (e.target.id === 'custom-image-file') {
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const dataUrl = event.target.result;
                        // Crear CSS para imagen de fondo usando data URL
                        const backgroundCss = `url("${dataUrl}") center/cover no-repeat`;
                        this.setBackground(backgroundCss);
                        
                        // Mostrar nombre del archivo seleccionado
                        const fileNameSpan = document.getElementById('selected-file-name');
                        if (fileNameSpan) {
                            fileNameSpan.textContent = `✅ ${file.name}`;
                            fileNameSpan.style.color = '#4CAF50';
                        }
                    };
                    reader.readAsDataURL(file);
                } else {
                    alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, GIF, etc.)');
                }
            }
        });
        
        document.addEventListener('click', (e) => {
            // Selector de fondo predefinido
            if (e.target.closest('.background-option') && !e.target.closest('.custom-option')) {
                const option = e.target.closest('.background-option');
                const background = option.dataset.background;
                if (background) {
                    this.setBackground(background);
                    
                    // Actualizar selección visual
                    document.querySelectorAll('.background-option').forEach(opt => 
                        opt.classList.remove('selected'));
                    option.classList.add('selected');
                }
            }
            
            // Aplicar fondo personalizado
            if (e.target.id === 'apply-custom-bg') {
                const customInput = document.getElementById('custom-background');
                if (customInput && customInput.value.trim()) {
                    this.setBackground(customInput.value.trim());
                }
            }
            
            // Seleccionar archivo de imagen
            if (e.target.id === 'select-image-file') {
                const fileInput = document.getElementById('custom-image-file');
                if (fileInput) {
                    fileInput.click();
                }
            }
            
            // Aplicar imagen desde URL
            if (e.target.id === 'apply-custom-image-url') {
                const imageInput = document.getElementById('custom-image-url');
                if (imageInput && imageInput.value.trim()) {
                    const imageUrl = imageInput.value.trim();
                    // Crear CSS para imagen de fondo
                    const backgroundCss = `url("${imageUrl}") center/cover no-repeat`;
                    this.setBackground(backgroundCss);
                }
            }
        });
    }

    /**
     * Obtener información de debugging
     */
    getDebugInfo() {
        return {
            currentTheme: this.stateManager.getState('theme'),
            currentBackground: this.stateManager.getState('backgroundImage'),
            availableBackgrounds: this.backgroundOptions.length,
            systemPrefersDark: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        };
    }
}

// Exportar para uso global
window.ThemeManager = ThemeManager;