/**
 * Telegram Web App Fallback Script
 * 
 * This script creates a mock implementation of the Telegram WebApp API
 * to allow the application to function when the official Telegram WebApp
 * script cannot be loaded.
 * 
 * Version: 1.0.0
 */

(function() {
  console.log('Using local fallback for Telegram WebApp API');
  
  // Create the Telegram namespace if it doesn't exist
  window.Telegram = window.Telegram || {};
  
  // Skip if already initialized
  if (window.Telegram.WebApp) {
    console.log('Telegram.WebApp already exists, skipping fallback initialization');
    return;
  }
  
  // Mock color schemes and theme parameters
  const defaultThemeParams = {
    bg_color: '#ffffff',
    text_color: '#000000',
    hint_color: '#999999',
    link_color: '#2481cc',
    button_color: '#5288c1',
    button_text_color: '#ffffff',
    secondary_bg_color: '#f0f0f0'
  };
  
  // Utility to safely call functions and handle errors
  const safeExecute = (fn, context, args) => {
    try {
      if (typeof fn === 'function') {
        return fn.apply(context, args);
      }
    } catch (error) {
      console.error('Error in Telegram WebApp fallback:', error);
    }
    return null;
  };

  // Create event handling mechanism
  const eventHandlers = {};
  
  const addEventListener = (event, callback) => {
    if (!eventHandlers[event]) {
      eventHandlers[event] = [];
    }
    eventHandlers[event].push(callback);
    return () => {
      eventHandlers[event] = eventHandlers[event].filter(cb => cb !== callback);
    };
  };
  
  const triggerEvent = (event, data) => {
    if (eventHandlers[event]) {
      eventHandlers[event].forEach(callback => safeExecute(callback, null, [data]));
    }
  };

  // Create a mock button class for both Main and Back buttons
  class Button {
    constructor(isMain = true) {
      this._isShown = false;
      this._isActive = true;
      this._text = isMain ? 'CONTINUE' : '';
      this._color = '#5288c1';
      this._textColor = '#ffffff';
      this._isProgressVisible = false;
      this._clickHandlers = [];
      this._isMain = isMain;
    }
    
    get isVisible() { return this._isShown; }
    set isVisible(val) { /* Read-only property */ }
    
    get isActive() { return this._isActive; }
    set isActive(val) { /* Read-only property */ }
    
    get isProgressVisible() { return this._isProgressVisible; }
    set isProgressVisible(val) { /* Read-only property */ }
    
    onClick(callback) {
      if (typeof callback === 'function') {
        this._clickHandlers.push(callback);
      }
      return this;
    }
    
    offClick(callback) {
      if (callback) {
        this._clickHandlers = this._clickHandlers.filter(cb => cb !== callback);
      } else {
        this._clickHandlers = [];
      }
      return this;
    }
    
    _triggerClick() {
      this._clickHandlers.forEach(handler => safeExecute(handler, null, []));
    }
    
    show() {
      this._isShown = true;
      console.log(`${this._isMain ? 'Main' : 'Back'} button shown`);
      return this;
    }
    
    hide() {
      this._isShown = false;
      console.log(`${this._isMain ? 'Main' : 'Back'} button hidden`);
      return this;
    }
    
    enable() {
      this._isActive = true;
      return this;
    }
    
    disable() {
      this._isActive = false;
      return this;
    }
  }

  // Create a MainButton implementation with additional methods
  class MainButton extends Button {
    constructor() {
      super(true);
    }
    
    setText(text) {
      if (text) {
        this._text = text.toString();
        console.log('Main button text set to:', this._text);
      }
      return this;
    }
    
    setColor(color) {
      if (color) {
        this._color = color;
      }
      return this;
    }
    
    setTextColor(color) {
      if (color) {
        this._textColor = color;
      }
      return this;
    }
    
    showProgress(leaveActive = true) {
      this._isProgressVisible = true;
      this._isActive = !!leaveActive;
      return this;
    }
    
    hideProgress() {
      this._isProgressVisible = false;
      return this;
    }
  }
  
  // Create a mock popup implementation
  const PopupParams = {
    message: '',
    title: '',
    buttons: []
  };
  
  const showPopup = (params, callback) => {
    console.log('Showing popup:', params);
    if (typeof callback === 'function') {
      // In a real environment, this would wait for user input
      // For the fallback, we'll just call it immediately with button index 0
      setTimeout(() => callback(0), 100);
    }
  };
  
  const showAlert = (message, callback) => {
    console.log('Showing alert:', message);
    if (typeof callback === 'function') {
      setTimeout(callback, 100);
    }
  };
  
  const showConfirm = (message, callback) => {
    console.log('Showing confirmation:', message);
    if (typeof callback === 'function') {
      // In a real environment, this would wait for user input
      // For the fallback, we'll just call it immediately with true
      setTimeout(() => callback(true), 100);
    }
  };
  
  // Create the mock WebApp object
  const webApp = {
    // Version and platform info
    version: 'fallback-1.0',
    platform: 'fallback',
    
    // Initialize with empty data
    initData: '',
    initDataUnsafe: {},
    colorScheme: 'light',
    themeParams: defaultThemeParams,
    
    // Status flags
    isExpanded: true,
    isClosingConfirmationEnabled: false,
    
    // Viewport properties that match window dimensions
    viewportHeight: window.innerHeight,
    viewportStableHeight: window.innerHeight,
    headerColor: '#ffffff',
    backgroundColor: defaultThemeParams.bg_color,
    
    // Create button instances
    MainButton: new MainButton(),
    BackButton: new Button(false),
    
    // Event handling
    onEvent: addEventListener,
    offEvent: (event, callback) => {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(cb => cb !== callback);
      }
    },
    
    // Method to signal app is ready
    ready: function() {
      console.log('WebApp.ready() called');
      // Simulate event handling
      triggerEvent('viewportChanged', { isStateStable: true });
      return webApp;
    },
    
    // Expansion methods
    expand: function() {
      console.log('WebApp.expand() called');
      webApp.isExpanded = true;
      triggerEvent('viewportChanged', { isStateStable: true });
      return webApp;
    },
    
    // Closing methods
    close: function() {
      console.log('WebApp.close() called - in fallback this just refreshes the page');
      window.location.reload();
    },
    
    // Closing confirmation
    enableClosingConfirmation: function() {
      webApp.isClosingConfirmationEnabled = true;
      return webApp;
    },
    
    disableClosingConfirmation: function() {
      webApp.isClosingConfirmationEnabled = false;
      return webApp;
    },
    
    // UI methods for popups
    showPopup,
    showAlert,
    showConfirm,
    
    // Payment-related methods (mock implementations)
    openInvoice: function(url, callback) {
      console.log('openInvoice called with URL:', url);
      if (typeof callback === 'function') {
        // Always fail in fallback mode
        setTimeout(() => callback(false), 100);
      }
    },
    
    // HapticFeedback API (mock implementations)
    HapticFeedback: {
      impactOccurred: function(style) {
        console.log('HapticFeedback.impactOccurred called with style:', style);
      },
      notificationOccurred: function(type) {
        console.log('HapticFeedback.notificationOccurred called with type:', type);
      },
      selectionChanged: function() {
        console.log('HapticFeedback.selectionChanged called');
      }
    },
    
    // Cloud storage methods (mock implementations)
    CloudStorage: {
      setItem: function(key, value, callback) {
        try {
          localStorage.setItem(`tg_fallback_${key}`, value);
          if (typeof callback === 'function') {
            callback(true);
          }
        } catch (error) {
          console.error('CloudStorage.setItem error:', error);
          if (typeof callback === 'function') {
            callback(false);
          }
        }
      },
      getItem: function(key, callback) {
        try {
          const value = localStorage.getItem(`tg_fallback_${key}`);
          if (typeof callback === 'function') {
            callback(value !== null, value || '');
          }
        } catch (error) {
          console.error('CloudStorage.getItem error:', error);
          if (typeof callback === 'function') {
            callback(false, '');
          }
        }
      },
      removeItem: function(key, callback) {
        try {
          localStorage.removeItem(`tg_fallback_${key}`);
          if (typeof callback === 'function') {
            callback(true);
          }
        } catch (error) {
          console.error('CloudStorage.removeItem error:', error);
          if (typeof callback === 'function') {
            callback(false);
          }
        }
      },
      getKeys: function(callback) {
        try {
          const keys = [];
          const prefix = 'tg_fallback_';
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
              keys.push(key.substring(prefix.length));
            }
          }
          if (typeof callback === 'function') {
            callback(true, keys);
          }
        } catch (error) {
          console.error('CloudStorage.getKeys error:', error);
          if (typeof callback === 'function') {
            callback(false, []);
          }
        }
      }
    },
    
    // Scanning QR code (mock implementation)
    showScanQrPopup: function(params, callback) {
      console.log('showScanQrPopup called with params:', params);
      if (typeof callback === 'function') {
        // Always fail in fallback mode
        setTimeout(() => callback({ data: 'fallback-qr-data' }), 1000);
      }
      return {
        close: function() {
          console.log('QR scanner popup closed');
        }
      };
    },
    
    // Opening links (mock implementation)
    openLink: function(url) {
      console.log('openLink called with URL:', url);
      window.open(url, '_blank');
    },
    
    // Clipboard operations (mock implementation)
    readTextFromClipboard: function(callback) {
      console.log('readTextFromClipboard called');
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText()
          .then(text => {
            if (typeof callback === 'function') {
              callback(text);
            }
          })
          .catch(err => {
            console.error('Failed to read from clipboard:', err);
            if (typeof callback === 'function') {
              callback('');
            }
          });
      } else {
        console.warn('Clipboard API not available');
        if (typeof callback === 'function') {
          callback('');
        }
      }
    }
  };

  // Set up window resize listener to update viewport values
  window.addEventListener('resize', () => {
    webApp.viewportHeight = window.innerHeight;
    webApp.viewportStableHeight = window.innerHeight;
    triggerEvent('viewportChanged', { isStateStable: true });
  });
  
  // Assign the WebApp to Telegram
  window.Telegram.WebApp = webApp;
  
  // Dispatch an event that the app can listen for
  const event = new Event('telegramWebAppReady');
  document.dispatchEvent(event);
  
  console.log('Telegram WebApp fallback initialized successfully');
})();