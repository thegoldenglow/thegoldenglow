import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTasks } from '../../contexts/TasksContext';
import TaskList from './TaskList';
import { toast } from 'react-hot-toast';

// Lightweight embeddable tasks widget that can be dropped inside any div
// Assumes TasksProvider is mounted at app root (it is, in App.jsx)
const TasksWidget = ({ maxItems = 3, className = '' }) => {
  const { state, tasksManager, verifyTask } = useTasks();
  const navigate = useNavigate();

  const normalizeTargetGameSlug = (id) => {
    try {
      if (!id || typeof id !== 'string') return null;
      const raw = id.trim();
      const kebabized = raw
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-');
      let slug = kebabized.trim().toLowerCase();

      if (slug === 'flameofwisdom') slug = 'flame-of-wisdom';
      if (slug === 'marksofdestiny') slug = 'marks-of-destiny';
      if (slug === 'pathofenlightenment' || slug === 'pathofknowledge') slug = 'path-of-enlightenment';
      if (slug === 'gatesofknowledge') slug = 'gates-of-knowledge';

      if (slug === 'tic-tac-toe' || slug === 'tic-tac-toe-multiplayer') slug = 'tic-tac-toe';
      if (slug.endsWith('-multiplayer') && slug !== 'marks-of-destiny-multiplayer') {
        slug = slug.replace(/-multiplayer$/, '');
      }
      if (slug === 'mark-of-destiny') slug = 'marks-of-destiny';
      if (slug === 'path-of-knowledge') slug = 'path-of-enlightenment';
      const allowed = new Set(['marks-of-destiny','marks-of-destiny-multiplayer','path-of-enlightenment','flame-of-wisdom','sacred-tapping','tic-tac-toe','gates-of-knowledge','mystical-tap-journey']);
      return allowed.has(slug) ? slug : null;
    } catch {
      return null;
    }
  };

  // Simple category normalizer to support admin categories and legacy types
  const getNormalizedCategory = (task) => {
    const raw = (task?.type || '').toString().toLowerCase();
    if (!raw) return '';
    if (raw.includes('referr')) return 'referral';
    if (raw.includes('social')) return 'social-follow';
    if (raw.includes('play') || raw.includes('game')) return 'play-game';
    // map known enum types
    if (raw === 'social') return 'social-follow';
    if (raw === 'cross_game') return 'cross-game';
    if (raw === 'daily_login') return 'daily-login';
    if (raw === 'achievement') return 'achievement';
    if (raw === 'special_challenge') return 'special-challenge';
    return raw;
  };

  const handleNavigate = (task) => {
    try {
      if (!task) return;

      // Check for direct link first (highest priority)
      if (task.link && typeof task.link === 'string') {
        const webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
        
        if ((task.link.startsWith('https://t.me/') || task.link.startsWith('t.me/')) && typeof webApp?.openTelegramLink === 'function') {
          console.log(`TasksWidget: Opening Telegram link: ${task.link}`);
          webApp.openTelegramLink(task.link);
        } else if (typeof webApp?.openLink === 'function') {
          console.log(`TasksWidget: Using Telegram WebApp openLink: ${task.link}`);
          webApp.openLink(task.link);
        } else if (typeof window !== 'undefined' && window.open) {
          console.log(`TasksWidget: Opening link in new window: ${task.link}`);
          window.open(task.link, '_blank');
        }
        return;
      }

      const category = getNormalizedCategory(task);

      if (category === 'referral') {
        navigate('/referral');
        return;
      }

      if (category === 'play-game' || task.targetGame || task.game_identifier) {
        const slug = normalizeTargetGameSlug(task.targetGame || task.game_identifier || '');
        if (slug) {
          console.log('TasksWidget: navigating to', slug, 'from', task.targetGame, task.game_identifier);
          navigate(`/games/${slug}`);
        } else {
          navigate('/daily-tasks');
        }
        return;
      }

      // For social follow tasks, open the provided verifyUrl or platform link directly
      if (category === 'social-follow') {
        const webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
        const verifyUrl = task.verifyUrl || task.verify_url;
        if (verifyUrl && typeof verifyUrl === 'string') {
          if ((verifyUrl.startsWith('https://t.me/') || verifyUrl.startsWith('t.me/')) && typeof webApp?.openTelegramLink === 'function') {
            webApp.openTelegramLink(verifyUrl);
          } else if (typeof webApp?.openLink === 'function') {
            webApp.openLink(verifyUrl);
          } else if (typeof window !== 'undefined' && window.open) {
            window.open(verifyUrl, '_blank');
          }
          return;
        }

        const platform = (task.platform || '').toLowerCase();
        const username = task.targetUsername || task.target_username || '';

        if (platform && username) {
          let url = '';
          if (platform.includes('telegram') || platform === 'tg') {
            url = `https://t.me/${username.replace(/^@/, '')}`;
            if (typeof webApp?.openTelegramLink === 'function') {
              webApp.openTelegramLink(url);
            } else if (typeof webApp?.openLink === 'function') {
              webApp.openLink(url);
            } else if (typeof window !== 'undefined' && window.open) {
              window.open(url, '_blank');
            }
            return;
          }

          if (platform.includes('twitter') || platform === 'x') {
            url = `https://twitter.com/${username.replace(/^@/, '')}`;
          } else if (platform.includes('discord')) {
            url = `https://discord.com/${username}`;
          } else if (platform.includes('instagram') || platform.includes('ig')) {
            url = `https://instagram.com/${username.replace(/^@/, '')}`;
          } else if (platform.includes('facebook') || platform.includes('fb')) {
            url = `https://facebook.com/${username.replace(/^@/, '')}`;
          }

          if (url) {
            if (typeof webApp?.openLink === 'function') {
              webApp.openLink(url);
            } else if (typeof window !== 'undefined' && window.open) {
              window.open(url, '_blank');
            }
            return;
          }
        }
      }

      // Provide sensible fallbacks for tasks without a specific targetGame
      switch ((task.type || '').toUpperCase()) {
        case 'CROSS_GAME':
        case 'DAILY_LOGIN':
        case 'SPECIAL_CHALLENGE':
        case 'ACHIEVEMENT':
        default:
          // Default to the full tasks page so users can see details/progress
          navigate('/daily-tasks');
          break;
      }
    } catch (e) {
      console.error('TasksWidget: navigation error', e);
    }
  };

  const handleVerify = async (task) => {
    if (!task) return;

    setVerifyingTasks(prev => ({ ...prev, [task.id]: true }));
    
    try {
      // Determine if this is a Telegram task
      const isTelegramTask = task.platform?.toLowerCase().includes('telegram') || 
                            task.link?.includes('t.me') ||
                            task.verifyUrl?.includes('t.me');
      
      if (isTelegramTask) {
        // For Telegram tasks, verify membership first
        const userId = user?.telegram_id || user?.id;
        if (!userId) {
          console.error('No user ID available for Telegram verification');
          return;
        }
        
        // Get chat identifier - try multiple sources
        let chatCandidate = task.chat || task.verifyChat || task.targetUsername || task.target_username;
        
        // If no direct chat identifier, try to extract from link
        if (!chatCandidate && task.link) {
          const linkMatch = task.link.match(/t\.me\/([^/?]+)/);
          if (linkMatch) {
            chatCandidate = linkMatch[1];
          }
        }
        
        if (chatCandidate) {
          try {
            const response = await fetch('/api/verify-telegram-membership', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: userId.toString(),
                chat: chatCandidate,
                initData: window.Telegram?.WebApp?.initData || ''
              })
            });
            
            const result = await response.json();
            console.log('Telegram verification result:', result);
            
            if (result.success && result.isMember) {
              // User is a member, complete the task
              console.log('User verified as member, completing task');
              
              // Force complete the task locally and try to sync to server
              await forceCompleteTask(task.id);
              return;
            } else {
              console.log('User not verified as member:', result.error || 'Not a member');
            }
          } catch (error) {
            console.error('Error verifying Telegram membership:', error);
          }
        }
      }
      
      // Open the task link for manual verification
      if (task.link) {
        window.open(task.link, '_blank');
      } else if (task.verifyUrl) {
        window.open(task.verifyUrl, '_blank');
      } else if (task.platform && task.targetUsername) {
        const platformUrls = {
          telegram: `https://t.me/${task.targetUsername}`,
          twitter: `https://twitter.com/${task.targetUsername}`,
          youtube: `https://youtube.com/@${task.targetUsername}`,
          instagram: `https://instagram.com/${task.targetUsername}`
        };
        const url = platformUrls[task.platform.toLowerCase()];
        if (url) {
          window.open(url, '_blank');
        }
      }
      
      // For non-Telegram tasks or when verification fails, 
      // still allow manual completion after opening link
      setTimeout(async () => {
        await forceCompleteTask(task.id);
      }, 2000); // Give user 2 seconds to see the opened link
      
    } catch (error) {
      console.error('Error in handleVerify:', error);
    } finally {
      setVerifyingTasks(prev => ({ ...prev, [task.id]: false }));
    }
  };
  
  // Helper function to force complete a task both locally and on server
  const forceCompleteTask = async (taskId) => {
    try {
      // Complete locally first
      await tasksManager.completeTask(taskId);
      
      // Try to sync to server if user is authenticated
      if (user?.id) {
        try {
          // Direct API call to ensure server persistence
          const response = await fetch('/api/complete-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              taskId: taskId,
              userId: user.id,
              telegramId: user.telegram_id
            })
          });
          
          if (response.ok) {
            console.log('Task completion synced to server');
          } else {
            console.warn('Failed to sync task completion to server');
          }
        } catch (syncError) {
          console.warn('Error syncing task completion to server:', syncError);
        }
      }
    } catch (error) {
      console.error('Error force completing task:', error);
    }
  };

  const handleClaim = async (taskId) => {
    try {
      await tasksManager.claimTaskReward(taskId, false);
    } catch (e) {
      console.error('TasksWidget: failed to claim reward', e);
    }
  };

  return (
    <div className={`bg-deepLapisLight/30 border border-royalGold/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-primary text-textGold">Daily Tasks</h3>
        <Link to="/daily-tasks" className="text-royalGold hover:text-textGold text-sm">View all</Link>
      </div>

      {state.isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-royalGold border-t-transparent rounded-full"></div>
        </div>
      ) : !Array.isArray(state.tasks) || state.tasks.length === 0 ? (
        <div className="text-center py-6 text-textLight bg-deepLapisDark/30 rounded">
          No tasks available.
        </div>
      ) : (
        <TaskList
          tasks={state.tasks}
          onNavigate={handleNavigate}
          onClaim={handleClaim}
          maxItems={maxItems}
          onVerify={handleVerify}
          // omitting onAdBoost keeps the ad button hidden in compact widget
        />
      )}
    </div>
  );
};

export default TasksWidget;