// ===== UTILIDADES DE LOGGING CONFIGURABLES =====

/**
 * Sistema de logging configurable para el Bookmark Manager
 * Permite controlar el nivel de logs mostrados y formatearlos de manera consistente
 */
class Logger {
    static instance = null;
    
    // Niveles de log (orden de prioridad)
    static LEVELS = {
        ERROR: 0,
        WARN: 1, 
        INFO: 2,
        DEBUG: 3,
        TRACE: 4
    };
    
    constructor() {
        if (Logger.instance) {
            return Logger.instance;
        }
        
        this.currentLevel = Logger.LEVELS.INFO; // Nivel por defecto
        this.enabledModules = new Set(); // Módulos habilitados (vacío = todos)
        this.logHistory = []; // Historial de logs para debugging
        this.maxHistorySize = 1000;
        
        // Configuración por módulo
        this.moduleConfig = new Map();
        
        Logger.instance = this;
        return this;
    }
    
    /**
     * Configurar nivel de log global
     * @param {string|number} level - Nivel de log ('ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE' o número)
     */
    setLevel(level) {
        if (typeof level === 'string') {
            this.currentLevel = Logger.LEVELS[level.toUpperCase()] ?? Logger.LEVELS.INFO;
        } else if (typeof level === 'number') {
            this.currentLevel = level;
        }
        
        this.info('Logger', `Nivel de log configurado a: ${this.getLevelName(this.currentLevel)}`);
    }
    
    /**
     * Habilitar/deshabilitar logs para módulos específicos
     * @param {string|string[]} modules - Nombre(s) de módulo(s)
     * @param {boolean} enabled - true para habilitar, false para deshabilitar
     */
    setModuleLevel(modules, enabled = true) {
        const moduleList = Array.isArray(modules) ? modules : [modules];
        
        moduleList.forEach(module => {
            if (enabled) {
                this.enabledModules.add(module);
            } else {
                this.enabledModules.delete(module);
            }
        });
        
        this.info('Logger', `Módulos ${enabled ? 'habilitados' : 'deshabilitados'}: ${moduleList.join(', ')}`);
    }
    
    /**
     * Configurar nivel específico para un módulo
     * @param {string} module - Nombre del módulo
     * @param {string|number} level - Nivel específico para este módulo
     */
    setModuleConfig(module, level) {
        const numLevel = typeof level === 'string' ? Logger.LEVELS[level.toUpperCase()] : level;
        this.moduleConfig.set(module, numLevel);
        
        this.info('Logger', `Módulo "${module}" configurado con nivel: ${this.getLevelName(numLevel)}`);
    }
    
    /**
     * Verificar si se debe mostrar un log
     * @param {number} logLevel - Nivel del log
     * @param {string} module - Módulo que genera el log
     * @returns {boolean}
     */
    shouldLog(logLevel, module) {
        // Si hay módulos específicos habilitados, verificar que este esté incluido
        if (this.enabledModules.size > 0 && !this.enabledModules.has(module)) {
            return false;
        }
        
        // Verificar nivel específico del módulo o nivel global
        const moduleLevel = this.moduleConfig.get(module) ?? this.currentLevel;
        return logLevel <= moduleLevel;
    }
    
    /**
     * Formatear mensaje de log
     * @param {number} level - Nivel del log
     * @param {string} module - Módulo que genera el log
     * @param {string} message - Mensaje principal
     * @param {...any} args - Argumentos adicionales
     * @returns {object}
     */
    formatMessage(level, module, message, ...args) {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const levelName = this.getLevelName(level);
        const emoji = this.getLevelEmoji(level);
        
        return {
            timestamp,
            level,
            levelName,
            module,
            message,
            args,
            formattedMessage: `${emoji} [${timestamp}] [${levelName}] [${module}] ${message}`
        };
    }
    
    /**
     * Obtener nombre del nivel
     * @param {number} level
     * @returns {string}
     */
    getLevelName(level) {
        return Object.keys(Logger.LEVELS).find(key => Logger.LEVELS[key] === level) || 'UNKNOWN';
    }
    
    /**
     * Obtener emoji para el nivel
     * @param {number} level
     * @returns {string}
     */
    getLevelEmoji(level) {
        const emojis = {
            [Logger.LEVELS.ERROR]: '❌',
            [Logger.LEVELS.WARN]: '⚠️',
            [Logger.LEVELS.INFO]: 'ℹ️',
            [Logger.LEVELS.DEBUG]: '🔧',
            [Logger.LEVELS.TRACE]: '🔍'
        };
        return emojis[level] || '📋';
    }
    
    /**
     * Agregar log al historial
     * @param {object} logEntry
     */
    addToHistory(logEntry) {
        this.logHistory.push({
            ...logEntry,
            timestamp: Date.now()
        });
        
        // Mantener tamaño del historial
        if (this.logHistory.length > this.maxHistorySize) {
            this.logHistory.shift();
        }
    }
    
    /**
     * Log de error
     * @param {string} module - Módulo que genera el log
     * @param {string} message - Mensaje
     * @param {...any} args - Argumentos adicionales
     */
    error(module, message, ...args) {
        if (!this.shouldLog(Logger.LEVELS.ERROR, module)) return;
        
        const logEntry = this.formatMessage(Logger.LEVELS.ERROR, module, message, ...args);
        this.addToHistory(logEntry);
        
        if (args.length > 0) {
            console.error(logEntry.formattedMessage, ...args);
        } else {
            console.error(logEntry.formattedMessage);
        }
    }
    
    /**
     * Log de advertencia
     * @param {string} module - Módulo que genera el log
     * @param {string} message - Mensaje
     * @param {...any} args - Argumentos adicionales
     */
    warn(module, message, ...args) {
        if (!this.shouldLog(Logger.LEVELS.WARN, module)) return;
        
        const logEntry = this.formatMessage(Logger.LEVELS.WARN, module, message, ...args);
        this.addToHistory(logEntry);
        
        if (args.length > 0) {
            console.warn(logEntry.formattedMessage, ...args);
        } else {
            console.warn(logEntry.formattedMessage);
        }
    }
    
    /**
     * Log informativo
     * @param {string} module - Módulo que genera el log
     * @param {string} message - Mensaje
     * @param {...any} args - Argumentos adicionales
     */
    info(module, message, ...args) {
        if (!this.shouldLog(Logger.LEVELS.INFO, module)) return;
        
        const logEntry = this.formatMessage(Logger.LEVELS.INFO, module, message, ...args);
        this.addToHistory(logEntry);
        
        if (args.length > 0) {
            console.log(logEntry.formattedMessage, ...args);
        } else {
            console.log(logEntry.formattedMessage);
        }
    }
    
    /**
     * Log de debug
     * @param {string} module - Módulo que genera el log
     * @param {string} message - Mensaje
     * @param {...any} args - Argumentos adicionales
     */
    debug(module, message, ...args) {
        if (!this.shouldLog(Logger.LEVELS.DEBUG, module)) return;
        
        const logEntry = this.formatMessage(Logger.LEVELS.DEBUG, module, message, ...args);
        this.addToHistory(logEntry);
        
        if (args.length > 0) {
            console.log(logEntry.formattedMessage, ...args);
        } else {
            console.log(logEntry.formattedMessage);
        }
    }
    
    /**
     * Log de trace (máximo detalle)
     * @param {string} module - Módulo que genera el log
     * @param {string} message - Mensaje
     * @param {...any} args - Argumentos adicionales
     */
    trace(module, message, ...args) {
        if (!this.shouldLog(Logger.LEVELS.TRACE, module)) return;
        
        const logEntry = this.formatMessage(Logger.LEVELS.TRACE, module, message, ...args);
        this.addToHistory(logEntry);
        
        if (args.length > 0) {
            console.log(logEntry.formattedMessage, ...args);
        } else {
            console.log(logEntry.formattedMessage);
        }
    }
    
    /**
     * Obtener configuración actual
     * @returns {object}
     */
    getConfig() {
        return {
            currentLevel: this.currentLevel,
            currentLevelName: this.getLevelName(this.currentLevel),
            enabledModules: Array.from(this.enabledModules),
            moduleConfig: Object.fromEntries(this.moduleConfig),
            historySize: this.logHistory.length,
            maxHistorySize: this.maxHistorySize
        };
    }
    
    /**
     * Obtener historial de logs
     * @param {number} limit - Número máximo de logs a retornar
     * @returns {array}
     */
    getHistory(limit = 100) {
        return this.logHistory.slice(-limit);
    }
    
    /**
     * Limpiar historial
     */
    clearHistory() {
        this.logHistory = [];
        this.info('Logger', 'Historial de logs limpiado');
    }
    
    /**
     * Exportar logs como texto
     * @param {number} limit - Número de logs a incluir
     * @returns {string}
     */
    exportLogs(limit = 500) {
        const logs = this.getHistory(limit);
        const header = `=== BOOKMARK MANAGER LOGS ===\nFecha: ${new Date().toISOString()}\nTotal: ${logs.length} logs\n\n`;
        
        const logText = logs.map(log => {
            const time = new Date(log.timestamp).toISOString();
            return `[${time}] [${log.levelName}] [${log.module}] ${log.message}`;
        }).join('\n');
        
        return header + logText;
    }
}

// Crear instancia global
const logger = new Logger();

// Exportar para uso global y módulos
window.Logger = Logger;
window.logger = logger;

// Funciones de conveniencia para uso directo
window.logError = (module, message, ...args) => logger.error(module, message, ...args);
window.logWarn = (module, message, ...args) => logger.warn(module, message, ...args);
window.logInfo = (module, message, ...args) => logger.info(module, message, ...args);
window.logDebug = (module, message, ...args) => logger.debug(module, message, ...args);
window.logTrace = (module, message, ...args) => logger.trace(module, message, ...args);

// Configuraciones predefinidas para fácil uso
window.setLogLevel = (level) => logger.setLevel(level);
window.enableModuleLogs = (modules) => logger.setModuleLevel(modules, true);
window.disableModuleLogs = (modules) => logger.setModuleLevel(modules, false);
window.getLogConfig = () => logger.getConfig();
window.exportLogs = (limit) => logger.exportLogs(limit);

// Configuración inicial basada en entorno
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
    // En producción, reducir logs
    logger.setLevel('WARN');
} else {
    // En desarrollo, logs completos
    logger.setLevel('DEBUG');
}

// Log inicial del sistema
logger.info('Logger', 'Sistema de logging inicializado');