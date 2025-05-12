/**
 * Local implementation of the Telegram WebApp API
 * This provides a complete mock of the Telegram WebApp API that can be used
 * when the official API is not available.
 */

// Default theme colors for light/dark modes
const DEFAULT_THEME_PARAMS = {
  light: {
    bg_color: "#ffffff",
    text_color: "#000000",
    hint_color: "#707579",
    link_color: "#0077CC",
    button_color: "#3390ec",
    button_text_color: "#ffffff",
    secondary_bg_color: "#f1f1f1"
  },
  dark: {
    bg_color: "#212121",
    text_color: "#ffffff",
    hint_color: "#aaaaaa",
    link_color: "#8cc2ff",
    button_color: "#3390ec",
    button_text_color: "#ffffff",
    secondary_bg_color: "#181818"
  }
};

// EventEmitter implementation for internal events
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return () => this.off(event, listener);
  }

  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }

  once(event, listener) {
    const remove = this.on(event, (...args) => {
      remove();
      listener(...args);
    });
  }
}

// Storage implementation
class Storage {
  constructor() {
    this.items = {};
  }

  getItem(key) {
    return this.items[key] || null;
  }

  setItem(key, value) {
    this.items[key] = String(value);
    return true;
  }

  removeItem(key) {
    if (key in this.items) {
      delete this.items[key];
      return true;
    }
    return false;
  }

  clear() {
    this.items = {};
    return true;
  }

  get length() {
    return Object.keys(this.items).length;
  }

  key(index) {
    return Object.keys(this.items)[index] || null;
  }
}

// Button implementation with state management
class Button {
  constructor(params = {}) {
    this.text = params.text || '';
    this.color = params.color || '#3390ec';
    this.textColor = params.textColor || '#ffffff';
    this.isVisible = false;
    this.isActive = true;
    this.isProgressVisible = false;
    this._onClick = null;
    this._eventEmitter = new EventEmitter();
  }

  setText(text) {
    this.text = text;
    this._eventEmitter.emit('text_changed', text);
    return this;
  }

  onClick(callback) {
    this._onClick = callback;
    return this;
  }

  offClick(callback) {
    if (this._onClick === callback) {
      this._onClick = null;
    }
    return this;
  }

  show() {
    this.isVisible = true;
    this._eventEmitter.emit('visibility_changed', true);
    return this;
  }

  hide() {
    this.isVisible = false;
    this._eventEmitter.emit('visibility_changed', false);
    return this;
  }

  enable() {
    this.isActive = true;
    this._eventEmitter.emit('active_changed', true);
    return this;
  }

  disable() {
    this.isActive = false;
    this._eventEmitter.emit('active_changed', false);
    return this;
  }

  showProgress(leaveActive = false) {
    this.isProgressVisible = true;
    if (!leaveActive) {
      this.isActive = false;
    }
    this._eventEmitter.emit('progress_visible_changed', true);
    return this;
  }

  hideProgress() {
    this.isProgressVisible = false;
    this._eventEmitter.emit('progress_visible_changed', false);
    return this;
  }

  // Internal method to trigger click
  _triggerClick() {
    if (this.isActive && this.isVisible && this._onClick) {
      this._onClick();
    }
  }
}

// Implementation of Haptic Feedback
class HapticFeedback {
  impactOccurred(style = 'medium') {
    console.log(`[TelegramWebApp] Haptic impact: ${style}`);
    // In a real environment, this would trigger device vibration
  }

  notificationOccurred(type = 'success') {
    console.log(`[TelegramWebApp] Haptic notification: ${type}`);
    // In a real environment, this would trigger device vibration
  }

  selectionChanged() {
    console.log('[TelegramWebApp] Haptic selection changed');
    // In a real environment, this would trigger device vibration
  }
}

// PopupButton implementation
class PopupButton {
  constructor(id, text, type = 'default') {
    this.id = id;
    this.text = text;
    this.type = type;
  }
}

// Initialize the local Telegram WebApp
function initializeTelegramWebApp() {
  // Get preferred color scheme from system
  const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const colorScheme = prefersDarkMode ? 'dark' : 'light';
  const themeParams = DEFAULT_THEME_PARAMS[colorScheme];
  
  // Try to parse URL params for testing
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('user_id') || '12345';
  const userName = params.get('user_name') || 'Test User';
  const initData = params.get('initData') || '';
  
  // Create a mock initDataUnsafe object similar to what Telegram provides
  const initDataUnsafe = {
    query_id: '',
    user: {
      id: parseInt(userId, 10),
      first_name: userName.split(' ')[0] || 'Test',
      last_name: userName.split(' ')[1] || 'User',
      username: userName.toLowerCase().replace(/\s/g, '_') || 'test_user',
      language_code: navigator.language?.split('-')[0] || 'en'
    },
    auth_date: Math.floor(Date.now() / 1000),
    hash: ''
  };
  
  // Create buttons
  const mainButton = new Button({
    text: 'CONTINUE',
    color: themeParams.button_color,
    textColor: themeParams.button_text_color
  });
  
  const backButton = new Button({
    text: 'Back',
    color: themeParams.button_color,
    textColor: themeParams.button_text_color
  });

  // Core event emitter for WebApp events
  const eventEmitter = new EventEmitter();

  // Storage implementation
  const webAppStorage = new Storage();

  // Viewport management
  let isExpanded = false;
  let viewportHeight = window.innerHeight;
  const viewportStableHeight = window.innerHeight;
  
  // Initialize haptic feedback
  const hapticFeedback = new HapticFeedback();

  // Create the WebApp object
  const WebApp = {
    // Version info
    version: '6.9.0',
    platform: 'web',
    isExpanded,
    
    // Initial data
    initData,
    initDataUnsafe,
    
    // Color scheme
    colorScheme,
    themeParams,
    
    // Viewport properties
    viewportHeight,
    viewportStableHeight,
    
    // Buttons
    MainButton: mainButton,
    BackButton: backButton,
    
    // Haptic feedback
    HapticFeedback: hapticFeedback,

    // Methods
    ready() {
      console.log('[TelegramWebApp] WebApp is ready');
      eventEmitter.emit('ready');
      return true;
    },
    
    expand() {
      isExpanded = true;
      eventEmitter.emit('expand');
      return true;
    },
    
    close() {
      console.log('[TelegramWebApp] WebApp closing');
      eventEmitter.emit('close');
    },
    
    isVersionAtLeast(version) {
      const current = this.version.split('.').map(n => parseInt(n, 10));
      const required = version.split('.').map(n => parseInt(n, 10));
      
      for (let i = 0; i < Math.max(current.length, required.length); i++) {
        const a = current[i] || 0;
        const b = required[i] || 0;
        if (a < b) return false;
        if (a > b) return true;
      }
      return true;
    },
    
    setHeaderColor(color) {
      console.log(`[TelegramWebApp] Header color set to ${color}`);
      eventEmitter.emit('header_color_changed', color);
      return true;
    },
    
    setBackgroundColor(color) {
      console.log(`[TelegramWebApp] Background color set to ${color}`);
      document.body.style.backgroundColor = color;
      eventEmitter.emit('background_color_changed', color);
      return true;
    },
    
    enableClosingConfirmation() {
      console.log('[TelegramWebApp] Closing confirmation enabled');
      eventEmitter.emit('closing_confirmation_changed', true);
      return true;
    },
    
    disableClosingConfirmation() {
      console.log('[TelegramWebApp] Closing confirmation disabled');
      eventEmitter.emit('closing_confirmation_changed', false);
      return true;
    },
    
    onEvent(eventName, callback) {
      return eventEmitter.on(eventName, callback);
    },
    
    offEvent(eventName, callback) {
      eventEmitter.off(eventName, callback);
      return true;
    },
    
    sendData(data) {
      if (typeof data !== 'string') {
        console.error('[TelegramWebApp] Data must be a string');
        return false;
      }
      
      console.log(`[TelegramWebApp] Sending data: ${data}`);
      eventEmitter.emit('data_sent', data);
      return true;
    },
    
    openLink(url) {
      if (typeof url !== 'string') {
        console.error('[TelegramWebApp] URL must be a string');
        return false;
      }
      
      console.log(`[TelegramWebApp] Opening link: ${url}`);
      window.open(url, '_blank');
      return true;
    },
    
    openTelegramLink(url) {
      if (typeof url !== 'string') {
        console.error('[TelegramWebApp] Telegram URL must be a string');
        return false;
      }
      
      if (!url.startsWith('https://t.me/')) {
        url = 'https://t.me/' + url;
      }
      
      console.log(`[TelegramWebApp] Opening Telegram link: ${url}`);
      window.open(url, '_blank');
      return true;
    },
    
    showPopup(params, callback) {
      if (!params || typeof params !== 'object') {
        console.error('[TelegramWebApp] Invalid popup params');
        return false;
      }
      
      console.log(`[TelegramWebApp] Showing popup: ${params.title || 'Popup'}`);
      
      // Create a simple popup implementation
      const popup = document.createElement('div');
      popup.style.position = 'fixed';
      popup.style.top = '0';
      popup.style.left = '0';
      popup.style.width = '100%';
      popup.style.height = '100%';
      popup.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      popup.style.display = 'flex';
      popup.style.justifyContent = 'center';
      popup.style.alignItems = 'center';
      popup.style.zIndex = '9999';
      
      const content = document.createElement('div');
      content.style.backgroundColor = themeParams.bg_color;
      content.style.color = themeParams.text_color;
      content.style.borderRadius = '8px';
      content.style.padding = '16px';
      content.style.maxWidth = '80%';
      content.style.maxHeight = '80%';
      content.style.overflow = 'auto';
      
      if (params.title) {
        const title = document.createElement('h3');
        title.textContent = params.title;
        title.style.marginTop = '0';
        content.appendChild(title);
      }
      
      if (params.message) {
        const message = document.createElement('p');
        message.textContent = params.message;
        content.appendChild(message);
      }
      
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'flex-end';
      buttonContainer.style.marginTop = '16px';
      
      const buttons = params.buttons || [];
      buttons.forEach(button => {
        const btn = document.createElement('button');
        btn.textContent = button.text;
        btn.style.marginLeft = '8px';
        btn.style.padding = '8px 16px';
        btn.style.border = 'none';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';
        
        if (button.type === 'destructive') {
          btn.style.backgroundColor = '#ff3b30';
          btn.style.color = '#ffffff';
        } else if (button.type === 'ok') {
          btn.style.backgroundColor = themeParams.button_color;
          btn.style.color = themeParams.button_text_color;
        } else {
          btn.style.backgroundColor = themeParams.secondary_bg_color;
          btn.style.color = themeParams.text_color;
        }
        
        btn.onclick = () => {
          document.body.removeChild(popup);
          if (callback) callback(button.id);
        };
        
        buttonContainer.appendChild(btn);
      });
      
      content.appendChild(buttonContainer);
      popup.appendChild(content);
      document.body.appendChild(popup);
      
      return true;
    },
    
    showAlert(message, callback) {
      return this.showPopup({
        message,
        buttons: [new PopupButton('ok', 'OK', 'ok')]
      }, callback);
    },
    
    showConfirm(message, callback) {
      return this.showPopup({
        message,
        buttons: [
          new PopupButton('cancel', 'Cancel'),
          new PopupButton('ok', 'OK', 'ok')
        ]
      }, callback);
    },
    
    // Storage API
    CloudStorage: {
      setItem(key, value, callback) {
        const result = webAppStorage.setItem(key, value);
        if (callback) setTimeout(() => callback(result), 0);
        return result;
      },
      
      getItem(key, callback) {
        const value = webAppStorage.getItem(key);
        if (callback) setTimeout(() => callback(value), 0);
        return value;
      },
      
      getItems(keys, callback) {
        const values = {};
        keys.forEach(key => {
          values[key] = webAppStorage.getItem(key);
        });
        
        if (callback) setTimeout(() => callback(values), 0);
        return values;
      },
      
      removeItem(key, callback) {
        const result = webAppStorage.removeItem(key);
        if (callback) setTimeout(() => callback(result), 0);
        return result;
      },
      
      removeItems(keys, callback) {
        const results = {};
        keys.forEach(key => {
          results[key] = webAppStorage.removeItem(key);
        });
        
        if (callback) setTimeout(() => callback(results), 0);
        return results;
      },
      
      getKeys(callback) {
        const keys = [];
        for (let i = 0; i < webAppStorage.length; i++) {
          keys.push(webAppStorage.key(i));
        }
        
        if (callback) setTimeout(() => callback(keys), 0);
        return keys;
      }
    }
  };

  // Add window resize listener to update viewport height
  window.addEventListener('resize', () => {
    WebApp.viewportHeight = window.innerHeight;
    eventEmitter.emit('viewport_changed', window.innerHeight);
  });
  
  return WebApp;
}

// Export the local implementation
export const LocalTelegramWebApp = initializeTelegramWebApp();

/**
 * Initialize WebApp with either official Telegram WebApp or local implementation
 * @returns {Object} The WebApp object
 */
export function setupTelegramWebApp() {
  // Check if official WebApp is available (window.Telegram.WebApp)
  if (window.Telegram && window.Telegram.WebApp) {
    console.log('Using official Telegram WebApp API');
    return window.Telegram.WebApp;
  }
  
  // If not available, use our local implementation
  console.log('Using local Telegram WebApp implementation');
  window.Telegram = window.Telegram || {};
  window.Telegram.WebApp = LocalTelegramWebApp;
  
  return LocalTelegramWebApp;
}

// Export a hook that can be used in React components
export function useTelegramWebApp() {
  return setupTelegramWebApp();
}

// Default export for direct import
export default setupTelegramWebApp;