// ===== UTILIDADES DE SEGURIDAD =====
class SecurityUtils {
    /**
     * Valida y sanitiza una URL para prevenir XSS y otros ataques
     * @param {string} url - URL a validar
     * @returns {string|null} - URL sanitizada o null si es inválida
     */
    static sanitizeUrl(url) {
        if (!url || typeof url !== 'string') {
            return null;
        }

        try {
            const urlObj = new URL(url);
            // Solo permitir protocolos seguros
            const allowedProtocols = ['http:', 'https:', 'chrome:', 'chrome-extension:'];
            
            if (!allowedProtocols.includes(urlObj.protocol)) {
                console.warn('Protocolo no permitido:', urlObj.protocol);
                return null;
            }

            // Verificar que no contenga caracteres maliciosos
            const maliciousPatterns = [
                /javascript:/i,
                /data:/i,
                /vbscript:/i,
                /<script/i,
                /on\w+=/i
            ];

            for (const pattern of maliciousPatterns) {
                if (pattern.test(url)) {
                    console.warn('URL contiene contenido malicioso:', url);
                    return null;
                }
            }

            return urlObj.href;
        } catch (error) {
            console.warn('URL inválida:', url, error);
            return null;
        }
    }

    /**
     * Sanitiza texto de entrada para prevenir XSS
     * @param {string} text - Texto a sanitizar
     * @returns {string} - Texto sanitizado
     */
    static sanitizeText(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }

        return text
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Decodifica entidades HTML de texto (para títulos de marcadores)
     * @param {string} text - Texto con entidades HTML
     * @returns {string} - Texto decodificado
     */
    static decodeHtmlEntities(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }

        return text
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .replace(/&#x2F;/g, '/')
            .replace(/&amp;/g, '&'); // This should be last to avoid double-decoding
    }

    /**
     * Genera una URL segura para favicon
     * @param {string} url - URL del bookmark
     * @returns {string} - URL del favicon o placeholder
     */
    static getFaviconUrl(url) {
        const sanitizedUrl = this.sanitizeUrl(url);
        if (!sanitizedUrl) {
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjY2NjIi8+CjwvZXZnPg==';
        }

        try {
            const urlObj = new URL(sanitizedUrl);
            const domain = urlObj.hostname;
            
            // Lista de dominios problemáticos que pueden causar CSP issues
            const problematicDomains = ['localhost', '127.0.0.1', '192.168.', '10.0.', 'file://'];
            
            if (problematicDomains.some(prob => domain.includes(prob))) {
                return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjNENBRjUwIi8+CjwvZXZnPg==';
            }
            
            return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=16`;
        } catch (error) {
            console.warn('Error generando favicon URL:', error);
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjY2NjIi8+CjwvZXZnPg==';
        }
    }
}

// Exportar para uso global en extension
window.SecurityUtils = SecurityUtils;