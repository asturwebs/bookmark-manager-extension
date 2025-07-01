// Archivo de fondo para la extensión
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extensión de Gestor de Marcadores instalada correctamente');
  
  // Inicializar almacenamiento con valores predeterminados si no existen
  chrome.storage.sync.get(['windows', 'backgroundImage', 'theme'], (result) => {
    if (!result.windows) {
      chrome.storage.sync.set({ 
        windows: [
          {
            id: Date.now(),
            type: 'bookmarks',
            position: { x: 50, y: 100 },
            size: { width: 350, height: 450 },
            minimized: false
          }
        ]
      });
    }
    
    if (!result.backgroundImage) {
      chrome.storage.sync.set({ backgroundImage: 'backgrounds/default.css' });
    }
    
    if (!result.theme) {
      // En service workers no hay acceso a window, usar 'light' por defecto
      chrome.storage.sync.set({ theme: 'light' });
    }
  });
});

// Escuchar mensajes de la extensión
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getBookmarks') {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      sendResponse({ bookmarks: bookmarkTreeNodes });
    });
    return true; // Indica que la respuesta será asíncrona
  }
});
