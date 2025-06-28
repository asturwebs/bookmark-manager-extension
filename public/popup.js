// Script para el popup de la extensión
document.addEventListener('DOMContentLoaded', function() {
  // Botón para abrir nueva pestaña con el gestor de marcadores
  document.getElementById('openNewTab').addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  });
  
  // Botón para abrir configuración
  document.getElementById('openSettings').addEventListener('click', function() {
    // Primero verificar si ya existe una pestaña con la aplicación
    chrome.tabs.query({ url: chrome.runtime.getURL('index.html') }, function(tabs) {
      if (tabs.length > 0) {
        // Si ya existe, enfocarla y enviar mensaje
        const existingTab = tabs[0];
        chrome.tabs.update(existingTab.id, { active: true }, function() {
          setTimeout(() => {
            chrome.tabs.sendMessage(existingTab.id, { action: 'openSettings' }, function(response) {
              if (chrome.runtime.lastError) {
                console.log('Error comunicando con pestaña existente:', chrome.runtime.lastError);
              } else {
                console.log('Mensaje enviado a pestaña existente:', response);
              }
            });
          }, 100);
        });
      } else {
        // Si no existe, crear nueva pestaña
        chrome.tabs.create({ url: chrome.runtime.getURL('index.html') }, function(tab) {
          // Esperar a que la página cargue completamente antes de enviar mensaje
          chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
            if (tabId === tab.id && changeInfo.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, { action: 'openSettings' }, function(response) {
                  if (chrome.runtime.lastError) {
                    console.log('Error comunicando con nueva pestaña:', chrome.runtime.lastError);
                  } else {
                    console.log('Mensaje enviado a nueva pestaña:', response);
                  }
                });
              }, 500);
            }
          });
        });
      }
    });
  });
  
  // Cargar marcadores recientes
  loadRecentBookmarks();
});

// Función para cargar marcadores recientes
function loadRecentBookmarks() {
  const bookmarksList = document.getElementById('recentBookmarksList');
  
  chrome.bookmarks.getRecent(5, function(bookmarks) {
    if (bookmarks.length === 0) {
      bookmarksList.innerHTML = '<p style="text-align: center; color: #888;">No hay marcadores recientes</p>';
      return;
    }
    
    bookmarksList.innerHTML = '';
    
    bookmarks.forEach(function(bookmark) {
      const bookmarkItem = document.createElement('div');
      bookmarkItem.className = 'bookmark-item';
      
      // Obtener favicon
      const faviconUrl = getFaviconUrl(bookmark.url);
      
      bookmarkItem.innerHTML = `
        <img src="${faviconUrl}" alt="" class="bookmark-favicon">
        <div class="bookmark-title">${bookmark.title}</div>
      `;
      
      bookmarkItem.addEventListener('click', function() {
        chrome.tabs.create({ url: bookmark.url });
      });
      
      bookmarksList.appendChild(bookmarkItem);
    });
  });
}

// Función para obtener favicon
function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
  } catch (e) {
    return 'icons/icon16.png';
  }
}
