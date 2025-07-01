// ===== UTILIDADES DE PERFORMANCE =====
class PerformanceUtils {
    /**
     * Implementa debouncing para funciones
     * @param {Function} func - Función a debouncar
     * @param {number} wait - Tiempo de espera en ms
     * @param {boolean} immediate - Ejecutar inmediatamente la primera vez
     * @returns {Function} - Función debouncada
     */
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    }

    /**
     * Implementa throttling para funciones
     * @param {Function} func - Función a throttle
     * @param {number} limit - Límite de tiempo en ms
     * @returns {Function} - Función throttleada
     */
    static throttle(func, limit) {
        let lastFunc;
        let lastRan;
        return function(...args) {
            if (!lastRan) {
                func.apply(this, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(() => {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(this, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }

    /**
     * Cache simple con TTL
     */
    static createCache(ttl = 300000) { // 5 minutos por defecto
        const cache = new Map();
        const timers = new Map();

        return {
            get(key) {
                return cache.get(key);
            },
            set(key, value) {
                // Limpiar timer anterior si existe
                if (timers.has(key)) {
                    clearTimeout(timers.get(key));
                }
                
                cache.set(key, value);
                
                // Programar limpieza
                const timer = setTimeout(() => {
                    cache.delete(key);
                    timers.delete(key);
                }, ttl);
                
                timers.set(key, timer);
            },
            has(key) {
                return cache.has(key);
            },
            clear() {
                timers.forEach(timer => clearTimeout(timer));
                cache.clear();
                timers.clear();
            }
        };
    }

    /**
     * Observador de performance para medición de métricas
     */
    static measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`Performance [${name}]: ${(end - start).toFixed(2)}ms`);
        return result;
    }
}

// Exportar para uso global en extension
window.PerformanceUtils = PerformanceUtils;