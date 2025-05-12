export class StorageManager {
  constructor() {
    this.isStorageAvailable = this._checkStorageAvailability();
  }

  _checkStorageAvailability() {
    try {
      if (typeof localStorage === 'undefined') return false;
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      console.log('LocalStorage is available');
      return true;
    } catch (e) {
      console.warn('LocalStorage is not available:', e.message);
      return false;
    }
  }

  saveData(key, data) {
    try {
      if (!this.isStorageAvailable) {
        console.warn('LocalStorage not available, data not saved');
        return false;
      }
      localStorage.setItem(key, JSON.stringify({
        timestamp: Date.now(),
        data
      }));
      return true;
    } catch (error) {
      console.error('Error saving data to storage:', error);
      return false;
    }
  }
  
  loadData(key) {
    try {
      if (!this.isStorageAvailable) {
        console.warn('LocalStorage not available, cannot load data');
        return null;
      }
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      const { data } = JSON.parse(stored);
      return data;
    } catch (error) {
      console.error('Error loading data from storage:', error);
      return null;
    }
  }
  
  clearExpiredData() {
    try {
      if (!this.isStorageAvailable) {
        console.warn('LocalStorage not available, cannot clear expired data');
        return false;
      }
      
      const keysToCheck = [
        'gg_tasks',
        'gg_streak',
        'gg_user_stats',
        'gg_ad_history'
      ];
      
      for (const key of keysToCheck) {
        try {
          const stored = localStorage.getItem(key);
          if (!stored) continue;
          
          const { timestamp } = JSON.parse(stored);
          const now = Date.now();
          
          // Data older than 30 days is considered expired
          if (now - timestamp > 30 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          console.warn(`Error processing key ${key}:`, e.message);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error clearing expired data:', error);
      return false;
    }
  }
  
  isDataStale(key, maxAgeMs = 24 * 60 * 60 * 1000) { // Default max age: 1 day
    try {
      if (!this.isStorageAvailable) {
        console.warn('LocalStorage not available, assuming data is stale');
        return true;
      }
      
      const stored = localStorage.getItem(key);
      if (!stored) return true;
      
      const { timestamp } = JSON.parse(stored);
      return (Date.now() - timestamp) > maxAgeMs;
    } catch (error) {
      console.error('Error checking if data is stale:', error);
      return true;
    }
  }
  
  syncWithServer() {
    // This would be implemented if server synchronization is needed
    // For the current implementation, we're using only local storage
    return Promise.resolve(true);
  }
}