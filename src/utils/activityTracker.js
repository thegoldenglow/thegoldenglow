// Activity Tracker utility for tracking game activities and user engagement

class ActivityTracker {
  constructor() {
    this.activities = [];
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  trackActivity(type, data = {}) {
    const activity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    this.activities.push(activity);
    
    // Keep only last 100 activities to prevent memory issues
    if (this.activities.length > 100) {
      this.activities = this.activities.slice(-100);
    }

    // Log activity for debugging
    console.log('Activity tracked:', activity);
    
    return activity;
  }

  getActivities(type = null) {
    if (type) {
      return this.activities.filter(activity => activity.type === type);
    }
    return this.activities;
  }

  getSessionActivities() {
    return this.activities.filter(activity => activity.sessionId === this.sessionId);
  }

  clearActivities() {
    this.activities = [];
  }

  getActivityStats() {
    const stats = {
      total: this.activities.length,
      byType: {},
      session: this.getSessionActivities().length
    };

    this.activities.forEach(activity => {
      stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1;
    });

    return stats;
  }

  gameStart(gameId, sessionId = null) {
    return this.trackActivity('game_start', {
      gameId,
      sessionId: sessionId || this.sessionId,
      startTime: Date.now()
    });
  }
}

// Global activity tracker instance
const globalTracker = new ActivityTracker();

// Convenience function for tracking game activities
export const trackGameActivity = (gameId, activityType, data = {}) => {
  return globalTracker.trackActivity('game_activity', {
    gameId,
    activityType,
    ...data
  });
};

// Convenience function for tracking user activities
export const trackUserActivity = (activityType, data = {}) => {
  return globalTracker.trackActivity('user_activity', {
    activityType,
    ...data
  });
};

// Export the global tracker
export { globalTracker as ActivityTracker };

// Export default
export default {
  trackGameActivity,
  trackUserActivity
};