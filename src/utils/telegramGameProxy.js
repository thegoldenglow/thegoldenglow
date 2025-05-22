/**
 * Telegram Game Proxy API Helper
 * This provides a safe wrapper for the Telegram Game API and fallbacks
 * when running outside of a Telegram Game context.
 */

// Check if we're running in a Telegram Game environment
export const isTelegramGameEnvironment = () => {
  return typeof window !== 'undefined' && 
         window.TelegramGameProxy !== undefined;
};

// Safe implementation of Telegram Game API with fallbacks
class SafeTelegramGameProxy {
  constructor() {
    this.isGameEnvironment = isTelegramGameEnvironment();
    this.fallbackEvents = {};
    
    // Initialize console information
    if (!this.isGameEnvironment) {
      console.log('Running outside Telegram Game environment - using fallback implementation');
    } else {
      console.log('Telegram Game environment detected');
    }
  }
  
  // Safely call receiveEvent with fallback
  receiveEvent(eventName, eventData) {
    if (this.isGameEnvironment) {
      try {
        window.TelegramGameProxy.receiveEvent(eventName, eventData);
        return true;
      } catch (error) {
        console.error('Error calling TelegramGameProxy.receiveEvent:', error);
        return false;
      }
    } else {
      // Fallback behavior for non-Telegram Game environments
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
