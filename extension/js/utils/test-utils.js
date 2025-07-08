// ===== UTILIDADES DE TESTING =====

/**
 * Sistema de testing minimalista para browser extension
 * Permite ejecutar tests unitarios en la consola del navegador
 */
class TestRunner {
    constructor() {
        this.tests = new Map();
        this.results = [];
        this.currentSuite = null;
    }

    /**
     * Crear una suite de tests
     * @param {string} name - Nombre de la suite
     * @param {Function} testFn - Función que contiene los tests
     */
    describe(name, testFn) {
        this.currentSuite = name;
        logInfo('TestRunner', `📋 Iniciando suite: ${name}`);
        
        try {
            testFn();
        } catch (error) {
            logError('TestRunner', `❌ Error en suite ${name}:`, error);
        }
        
        this.currentSuite = null;
    }

    /**
     * Definir un test individual
     * @param {string} description - Descripción del test
     * @param {Function} testFn - Función del test
     */
    it(description, testFn) {
        const fullName = this.currentSuite ? `${this.currentSuite} > ${description}` : description;
        
        try {
            const startTime = performance.now();
            testFn();
            const endTime = performance.now();
            
            this.results.push({
                name: fullName,
                status: 'passed',
                duration: Math.round(endTime - startTime),
                error: null
            });
            
            logInfo('TestRunner', `✅ ${fullName} (${Math.round(endTime - startTime)}ms)`);
        } catch (error) {
            this.results.push({
                name: fullName,
                status: 'failed',
                duration: 0,
                error: error.message
            });
            
            logError('TestRunner', `❌ ${fullName}: ${error.message}`);
        }
    }

    /**
     * Assertion básica
     * @param {any} actual - Valor actual
     * @param {any} expected - Valor esperado
     * @param {string} message - Mensaje de error personalizado
     */
    expect(actual, expected, message = '') {
        if (actual !== expected) {
            const errorMsg = message || `Expected ${expected}, but got ${actual}`;
            throw new Error(errorMsg);
        }
    }

    /**
     * Verificar que un valor sea verdadero
     * @param {any} value - Valor a verificar
     * @param {string} message - Mensaje de error
     */
    assertTrue(value, message = '') {
        if (!value) {
            throw new Error(message || `Expected truthy value, but got ${value}`);
        }
    }

    /**
     * Verificar que un valor sea falso
     * @param {any} value - Valor a verificar
     * @param {string} message - Mensaje de error
     */
    assertFalse(value, message = '') {
        if (value) {
            throw new Error(message || `Expected falsy value, but got ${value}`);
        }
    }

    /**
     * Verificar que un valor no sea null/undefined
     * @param {any} value - Valor a verificar
     * @param {string} message - Mensaje de error
     */
    assertNotNull(value, message = '') {
        if (value == null) {
            throw new Error(message || `Expected non-null value, but got ${value}`);
        }
    }

    /**
     * Verificar que una función lance un error
     * @param {Function} fn - Función que debe lanzar error
     * @param {string} expectedMessage - Mensaje de error esperado (opcional)
     */
    assertThrows(fn, expectedMessage = '') {
        let threw = false;
        let actualMessage = '';
        
        try {
            fn();
        } catch (error) {
            threw = true;
            actualMessage = error.message;
        }
        
        if (!threw) {
            throw new Error('Expected function to throw an error, but it did not');
        }
        
        if (expectedMessage && !actualMessage.includes(expectedMessage)) {
            throw new Error(`Expected error message to contain "${expectedMessage}", but got "${actualMessage}"`);
        }
    }

    /**
     * Verificar que dos arrays sean iguales
     * @param {Array} actual - Array actual
     * @param {Array} expected - Array esperado
     * @param {string} message - Mensaje de error
     */
    assertArrayEquals(actual, expected, message = '') {
        if (!Array.isArray(actual) || !Array.isArray(expected)) {
            throw new Error(message || 'Both values must be arrays');
        }
        
        if (actual.length !== expected.length) {
            throw new Error(message || `Array lengths differ: expected ${expected.length}, got ${actual.length}`);
        }
        
        for (let i = 0; i < actual.length; i++) {
            if (actual[i] !== expected[i]) {
                throw new Error(message || `Arrays differ at index ${i}: expected ${expected[i]}, got ${actual[i]}`);
            }
        }
    }

    /**
     * Verificar que un objeto contenga propiedades específicas
     * @param {Object} obj - Objeto a verificar
     * @param {Array} properties - Array de propiedades requeridas
     * @param {string} message - Mensaje de error
     */
    assertHasProperties(obj, properties, message = '') {
        if (typeof obj !== 'object' || obj === null) {
            throw new Error(message || 'Value must be an object');
        }
        
        const missing = properties.filter(prop => !(prop in obj));
        if (missing.length > 0) {
            throw new Error(message || `Missing properties: ${missing.join(', ')}`);
        }
    }

    /**
     * Ejecutar todos los tests definidos y mostrar resumen
     */
    run() {
        const passed = this.results.filter(r => r.status === 'passed').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        const total = this.results.length;
        
        logInfo('TestRunner', `📊 Resumen de tests: ${passed}/${total} pasaron, ${failed} fallaron`);
        
        if (failed > 0) {
            logWarn('TestRunner', '❌ Tests fallidos:');
            this.results.filter(r => r.status === 'failed').forEach(result => {
                logError('TestRunner', `  - ${result.name}: ${result.error}`);
            });
        }
        
        return {
            total,
            passed,
            failed,
            results: this.results
        };
    }

    /**
     * Limpiar resultados de tests
     */
    clear() {
        this.results = [];
        this.tests.clear();
        logInfo('TestRunner', 'Resultados de tests limpiados');
    }
}

// Tests para funciones críticas del Bookmark Manager
class BookmarkManagerTests {
    constructor(testRunner) {
        this.runner = testRunner;
    }

    /**
     * Tests para SecurityUtils
     */
    testSecurityUtils() {
        this.runner.describe('SecurityUtils', () => {
            this.runner.it('should validate valid URLs', () => {
                this.runner.assertTrue(SecurityUtils.isValidUrl('https://example.com'));
                this.runner.assertTrue(SecurityUtils.isValidUrl('http://localhost:3000'));
                this.runner.assertTrue(SecurityUtils.isValidUrl('chrome://extensions/'));
            });

            this.runner.it('should reject invalid URLs', () => {
                this.runner.assertFalse(SecurityUtils.isValidUrl('javascript:alert(1)'));
                this.runner.assertFalse(SecurityUtils.isValidUrl('not-a-url'));
                this.runner.assertFalse(SecurityUtils.isValidUrl(''));
                this.runner.assertFalse(SecurityUtils.isValidUrl(null));
            });

            this.runner.it('should sanitize text properly', () => {
                const dirty = '<script>alert("xss")</script>Hello';
                const clean = SecurityUtils.sanitizeText(dirty);
                this.runner.assertFalse(clean.includes('<script>'));
                this.runner.assertTrue(clean.includes('Hello'));
            });

            this.runner.it('should validate bookmark objects', () => {
                const validBookmark = { title: 'Test', url: 'https://example.com' };
                const invalidBookmark = { url: 'javascript:alert(1)' };
                
                this.runner.assertTrue(SecurityUtils.validateBookmark(validBookmark));
                this.runner.assertFalse(SecurityUtils.validateBookmark(invalidBookmark));
                this.runner.assertFalse(SecurityUtils.validateBookmark(null));
            });
        });
    }

    /**
     * Tests para PerformanceUtils
     */
    testPerformanceUtils() {
        this.runner.describe('PerformanceUtils', () => {
            this.runner.it('should create debounced functions', () => {
                let callCount = 0;
                const fn = () => callCount++;
                const debounced = PerformanceUtils.debounce(fn, 100);
                
                // Llamar múltiples veces rápidamente
                debounced();
                debounced();
                debounced();
                
                // Solo debe llamarse una vez después del delay
                this.runner.expect(callCount, 0, 'Function should not execute immediately');
                
                // Esperar y verificar (test simplificado)
                setTimeout(() => {
                    this.runner.expect(callCount, 1, 'Function should execute once after delay');
                }, 150);
            });

            this.runner.it('should create throttled functions', () => {
                let callCount = 0;
                const fn = () => callCount++;
                const throttled = PerformanceUtils.throttle(fn, 100);
                
                throttled();
                throttled();
                throttled();
                
                // Primera llamada debe ejecutarse inmediatamente
                this.runner.expect(callCount, 1, 'First call should execute immediately');
            });

            this.runner.it('should create cache instances', () => {
                const cache = PerformanceUtils.createCache(5);
                
                cache.set('key1', 'value1');
                cache.set('key2', 'value2');
                
                this.runner.expect(cache.get('key1'), 'value1');
                this.runner.assertTrue(cache.has('key1'));
                this.runner.assertFalse(cache.has('nonexistent'));
            });
        });
    }

    /**
     * Tests para WindowManager (funciones de utilidad)
     */
    testWindowManager() {
        this.runner.describe('WindowManager Utils', () => {
            // Solo testear funciones puras sin dependencias del DOM
            this.runner.it('should generate hash-based colors consistently', () => {
                if (window.WindowManager) {
                    const wm = new WindowManager({}, {});
                    const color1 = wm.getHashBasedColor('test');
                    const color2 = wm.getHashBasedColor('test');
                    
                    this.runner.expect(color1, color2, 'Same input should produce same color');
                    this.runner.assertTrue(color1.startsWith('header-color-'));
                }
            });

            this.runner.it('should detect category colors', () => {
                if (window.WindowManager) {
                    const wm = new WindowManager({}, {});
                    
                    const devColor = wm.getColorForFolder('desarrollo');
                    const workColor = wm.getColorForFolder('trabajo');
                    
                    this.runner.expect(devColor, 'header-color-development');
                    this.runner.expect(workColor, 'header-color-work');
                }
            });
        });
    }

    /**
     * Tests para Logger
     */
    testLogger() {
        this.runner.describe('Logger', () => {
            this.runner.it('should have correct log levels', () => {
                this.runner.assertNotNull(Logger.LEVELS);
                this.runner.expect(Logger.LEVELS.ERROR, 0);
                this.runner.expect(Logger.LEVELS.WARN, 1);
                this.runner.expect(Logger.LEVELS.INFO, 2);
                this.runner.expect(Logger.LEVELS.DEBUG, 3);
            });

            this.runner.it('should configure log levels correctly', () => {
                if (window.logger) {
                    const originalLevel = window.logger.currentLevel;
                    
                    window.logger.setLevel('ERROR');
                    this.runner.expect(window.logger.currentLevel, Logger.LEVELS.ERROR);
                    
                    window.logger.setLevel('DEBUG');
                    this.runner.expect(window.logger.currentLevel, Logger.LEVELS.DEBUG);
                    
                    // Restaurar nivel original
                    window.logger.currentLevel = originalLevel;
                }
            });

            this.runner.it('should maintain log history', () => {
                if (window.logger) {
                    const initialHistorySize = window.logger.logHistory.length;
                    
                    // Generar un log de test
                    window.logger.info('TestModule', 'Test message for history');
                    
                    this.runner.assertTrue(window.logger.logHistory.length > initialHistorySize);
                    
                    const lastLog = window.logger.logHistory[window.logger.logHistory.length - 1];
                    this.runner.expect(lastLog.module, 'TestModule');
                    this.runner.expect(lastLog.message, 'Test message for history');
                }
            });
        });
    }

    /**
     * Ejecutar todos los tests
     */
    runAll() {
        logInfo('BookmarkManagerTests', '🧪 Iniciando tests del Bookmark Manager...');
        
        this.testSecurityUtils();
        this.testPerformanceUtils();
        this.testWindowManager();
        this.testLogger();
        
        return this.runner.run();
    }
}

// Crear instancia global del test runner
const testRunner = new TestRunner();
const bmTests = new BookmarkManagerTests(testRunner);

// Exportar para uso global
window.TestRunner = TestRunner;
window.testRunner = testRunner;
window.bmTests = bmTests;

// Funciones de conveniencia
window.runTests = () => bmTests.runAll();
window.clearTests = () => testRunner.clear();

// Auto-mostrar ayuda
logInfo('TestUtils', '🧪 Sistema de testing cargado');
logInfo('TestUtils', '💡 Comandos disponibles:');
logInfo('TestUtils', '  - runTests() - Ejecutar todos los tests');
logInfo('TestUtils', '  - clearTests() - Limpiar resultados');
logInfo('TestUtils', '  - testRunner.describe("Suite", () => {...}) - Crear suite');
logInfo('TestUtils', '  - testRunner.it("Test", () => {...}) - Crear test');