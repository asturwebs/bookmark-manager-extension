// extension-controls.js - Versión mejorada para delegar en BookmarkManager

// Usamos un enfoque con delegación de eventos para que los botones funcionen después de cambios en el DOM

// Funciones globales para manejar los clics en los botones
const handlers = {
  // Función para mostrar/ocultar el panel de configuración
  toggleSettings: function() {
    if (window.bookmarkManager && typeof window.bookmarkManager.toggleSettings === 'function') {
      window.bookmarkManager.toggleSettings();
    } else {
      console.warn('BookmarkManager no está listo o no expone toggleSettings');
    }
  },
  
  // Función para cambiar entre temas claro y oscuro
  toggleTheme: function() {
    if (window.bookmarkManager && typeof window.bookmarkManager.toggleTheme === 'function') {
      window.bookmarkManager.toggleTheme();
    } else {
      console.warn('BookmarkManager no está listo o no expone toggleTheme');
    }
  },
  
  // Función para cerrar el panel de configuración
  closeSettings: function() {
    const settings = document.getElementById('settings-panel');
    if (settings) settings.classList.add('hidden');
  }
};

// Delegación de eventos de clic para los botones (se mantiene incluso si el DOM cambia)
document.addEventListener('click', function(event) {
  const target = event.target.closest('button');
  if (!target) return;
  
  switch (target.id) {
    case 'settings-btn':
      handlers.toggleSettings();
      event.preventDefault();
      break;
    case 'theme-toggle-btn':
      handlers.toggleTheme();
      event.preventDefault();
      break;
    case 'close-settings-btn':
      handlers.closeSettings();
      event.preventDefault();
      break;
  }
});

// Atajos de teclado globales
// Alt+S para configuración, Alt+T para tema
const keyHandler = (e) => {
  if (e.altKey && e.key === 's') {
    handlers.toggleSettings();
  }
  if (e.altKey && e.key === 't') {
    handlers.toggleTheme();
  }
};

document.addEventListener('keydown', keyHandler);

document.addEventListener('DOMContentLoaded', () => {
  console.log('extension-controls.js cargado y listo');
});
