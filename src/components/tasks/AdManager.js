export class AdManager {
  constructor() {
    this.adProvider = null;
    this.adConfig = {
      maxAdsPerDay: 5,
      cooldownMinutes: 10,
      rewardMultiplier: 2
    };
    this.adHistory = {
      viewed: 0,
      lastTime: null,
      lastResetDate: null
    };
    this.adLoadCallbacks = {
      onComplete: null,
      onError: null
    };
  }

  async init() {
    try {
      // Load ad history from storage with safeguards for environments without localStorage
      let adHistory;
      try {
        if (typeof localStorage !== 'undefined') {
          adHistory = localStorage.getItem('gg_ad_history');
        }
      } catch (e) {
        console.warn('LocalStorage not available:', e.message);
      }
      
      if (adHistory) {
        try {
          const parsed = JSON.parse(adHistory);
          this.adHistory = {
            viewed: parsed.adsViewedToday || 0,
            lastTime: parsed.lastAdTime ? new Date(parsed.lastAdTime) : null,
            lastResetDate: parsed.lastResetDate ? new Date(parsed.lastResetDate) : new Date()
          };
        } catch (e) {
          console.warn('Failed to parse ad history:', e.message);
        }
      }

      // Check if we need to reset ad history (new day)
      this.checkForAdHistoryReset();

      // In a real implementation, we would initialize the ad provider SDK here
      // For now, we'll simulate ad behavior
      console.log('Ad Manager initialized');
      return true;
    } catch (error) {
      console.error('Error initializing Ad Manager:', error);
      return false;
    }
  }

  canShowAd(adType = 'reward') {
    // Check if we've exceeded daily limit
    if (this.adHistory.viewed >= this.adConfig.maxAdsPerDay) {
      return false;
    }
    
    // Check cooldown period
    if (this.adHistory.lastTime) {
      const now = new Date();
      const minutesSinceLastAd = (now - this.adHistory.lastTime) / (1000 * 60);
      if (minutesSinceLastAd < this.adConfig.cooldownMinutes) {
        return false;
      }
    }
    
    return true;
  }

  async loadRewardedAd() {
    return new Promise((resolve, reject) => {
      // In a real implementation, we would load the ad from provider
      // For now, simulate ad loading with a delay
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve(true);
        } else {
          reject(new Error('Failed to load ad'));
        }
      }, 1000);
    });
  }

  async showRewardedAd() {
    return new Promise((resolve, reject) => {
      if (!this.canShowAd()) {
        reject(new Error('Cannot show ad at this time'));
        return;
      }

      // In a real implementation, we would show the ad from provider
      // For now, simulate ad viewing with a delay
      setTimeout(() => {
        if (Math.random() > 0.05) { // 95% completion rate
          // Update ad history
          this.adHistory.viewed += 1;
          this.adHistory.lastTime = new Date();
          
          // Save to localStorage with safety check
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('gg_ad_history', JSON.stringify({
                adsViewedToday: this.adHistory.viewed,
                lastAdTime: this.adHistory.lastTime.toISOString(),
                lastResetDate: this.adHistory.lastResetDate.toISOString()
              }));
            }
          } catch (e) {
            console.warn('Failed to save ad history to localStorage:', e.message);
          }
          
          resolve(true);
        } else {
          reject(new Error('Ad was not completed'));
        }
      }, 2000); // Simulate ad duration
    });
  }

  onAdComplete(callback) {
    this.adLoadCallbacks.onComplete = callback;
  }

  onAdError(callback) {
    this.adLoadCallbacks.onError = callback;
  }

  getAdCooldown() {
    if (!this.adHistory.lastTime) return 0;
    
    const now = new Date();
    const minutesSinceLastAd = (now - this.adHistory.lastTime) / (1000 * 60);
    const remainingCooldown = Math.max(0, this.adConfig.cooldownMinutes - minutesSinceLastAd);
    
    return Math.round(remainingCooldown);
  }

  getAdsViewedToday() {
    return this.adHistory.viewed;
  }

  getAdStatus() {
    return {
      adsViewedToday: this.adHistory.viewed,
      lastAdTime: this.adHistory.lastTime,
      adCooldownRemaining: this.getAdCooldown(),
      maxAdsPerDay: this.adConfig.maxAdsPerDay
    };
  }

  checkForAdHistoryReset() {
    if (!this.adHistory.lastResetDate) {
      this.resetAdHistory();
      return;
    }
    
    const lastReset = new Date(this.adHistory.lastResetDate);
    const now = new Date();
    
    // Reset if it's a new day
    if (lastReset.getDate() !== now.getDate() || 
        lastReset.getMonth() !== now.getMonth() || 
        lastReset.getFullYear() !== now.getFullYear()) {
      this.resetAdHistory();
    }
  }

  resetAdHistory() {
    this.adHistory = {
      viewed: 0,
      lastTime: null,
      lastResetDate: new Date()
    };
    
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gg_ad_history', JSON.stringify({
          adsViewedToday: 0,
          lastAdTime: null,
          lastResetDate: this.adHistory.lastResetDate.toISOString()
        }));
      }
    } catch (e) {
      console.warn('Failed to save ad history reset to localStorage:', e.message);
    }
  }
}