/**
 * Telegram Game Proxy API Helper
 * This provides a safe wrapper for the Telegram Game API and fallbacks
 * when running outside of a Telegram Game context.
 */

// Check if we're running in a Telegram Game environment
export const isTelegramGameEnvironment = () => {
  if (typeof window === 'undefined') return false;
  
  // Check for native TelegramGameProxy (real Telegram Game environment)
  const hasNativeProxy = window.TelegramGameProxy !== undefined &&
                         typeof window.TelegramGameProxy.receiveEvent === 'function';
  
  // Check if we're in Telegram context (either Game or WebApp)
  const isInTelegram = window.Telegram !== undefined || 
                       window.TelegramWebviewProxy !== undefined ||
                       (window.TelegramGameProxy !== undefined);
  
  return hasNativeProxy || isInTelegram;
};

// Check if we're running in a Telegram WebApp environment
export const isTelegramWebAppEnvironment = () => {
  return typeof window !== 'undefined' && 
         window.Telegram && window.Telegram.WebApp;
};

// Safe implementation of Telegram Game API with fallbacks
class SafeTelegramGameProxy {
  constructor() {
    this.isGameEnvironment = isTelegramGameEnvironment();
    this.isWebAppEnvironment = isTelegramWebAppEnvironment();
    this.fallbackEvents = {};
    
    // Initialize console information
    if (this.isGameEnvironment) {
      console.log('Telegram Game environment detected');
    } else if (this.isWebAppEnvironment) {
      console.log('Telegram WebApp environment detected');
    } else {
      console.log('Running outside Telegram environment - using fallback implementation');
    }
    
    // Process any polyfill events that were stored before our proxy was initialized
    this.processPolyfillEvents();
  }
  
  // Process events stored by the polyfill
  processPolyfillEvents() {
    if (typeof window !== 'undefined' && window._telegramGameEvents) {
      console.log(`Processing ${window._telegramGameEvents.length} polyfill events`);
      window._telegramGameEvents.forEach(event => {
        console.log(`[Polyfill Event Processed] ${event.eventName}:`, event.eventData);
      });
      // Clear the polyfill events after processing
      window._telegramGameEvents = [];
    }
  }
  
  // Safely call receiveEvent with fallback
  receiveEvent(eventName, eventData) {
    // Handle Telegram Game environment (with TelegramGameProxy)
    if (this.isGameEnvironment && typeof window !== 'undefined') {
      try {
        const proxy = window.TelegramGameProxy;
        
        // Check if we have a real TelegramGameProxy (not our polyfill)
        if (proxy && typeof proxy.receiveEvent === 'function') {
          // Check if this is our polyfill or the real thing
          const isPolyfill = window._telegramGameEvents !== undefined;
          
          if (isPolyfill) {
            console.log(`[Telegram Game Event - Polyfill] ${eventName}:`, eventData);
          } else {
            console.log(`[Telegram Game Event - Native] ${eventName}:`, eventData);
          }
          
          proxy.receiveEvent(eventName, eventData);
          return true;
        } else {
          console.warn('TelegramGameProxy.receiveEvent not available, falling back to WebApp mode');
        }
      } catch (error) {
        console.error('Error calling TelegramGameProxy.receiveEvent:', error);
      }
    }
    
    // Handle Telegram WebApp environment or fallback from Game environment
    if (this.isWebAppEnvironment || this.isGameEnvironment) {
      console.log(`[Telegram WebApp Game Event] ${eventName}:`, eventData);
      
      // Try to use Telegram WebApp haptic feedback if available
      if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
        try {
          const webApp = window.Telegram.WebApp;
          if (eventName === 'gameOver' && webApp.HapticFeedback) {
            webApp.HapticFeedback.notificationOccurred('success');
          }
        } catch (e) {
          console.log('Haptic feedback not available:', e.message);
        }
      }
      
      return true;
    }
    
    // Handle non-Telegram environments
    console.log(`[Game Event Fallback] ${eventName}:`, eventData);
    
    // Trigger any registered fallback handlers
    if (this.fallbackEvents[eventName]) {
      this.fallbackEvents[eventName].forEach(handler => {
        try {
          handler(eventData);
        } catch (e) {
          console.error('Error in fallback event handler:', e);
        }
      });
    }
    
    return true;
  }
  
  // Register fallback event handlers for testing outside Telegram
  onFallbackEvent(eventName, handler) {
    if (!this.fallbackEvents[eventName]) {
      this.fallbackEvents[eventName] = [];
    }
    this.fallbackEvents[eventName].push(handler);
    
    return () => {
      // Return function to remove this handler
      if (this.fallbackEvents[eventName]) {
        this.fallbackEvents[eventName] = this.fallbackEvents[eventName].filter(h => h !== handler);
      }
    };
  }
  
  // Share score with the game platform
  shareScore(score) {
    return this.receiveEvent('share_score', { score });
  }
  
  // Report game loaded
  gameLoaded() {
    return this.receiveEvent('game_loaded', {});
  }
  
  // Report game initialized
  gameInitialized() {
    return this.receiveEvent('game_initialized', {});
  }
  
  // Report level completed
  levelCompleted(level, score) {
    return this.receiveEvent('level_completed', { level, score });
  }
  
  // Report game over
  gameOver(score) {
    return this.receiveEvent('game_over', { score });
  }
}

// Create a singleton instance
const gameTelegram = new SafeTelegramGameProxy();

// Export the safe API
export default gameTelegram;
