import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTasks } from '../../contexts/TasksContext';
import TaskList from '../tasks/TaskList';
import StreakCalendar from '../tasks/StreakCalendar';
import RewardDisplay from '../tasks/RewardDisplay';
import AdRewardModal from '../tasks/AdRewardModal';
import DebugSupabase from '../debug/DebugSupabase';
import { getNextMilestone, getTimeUntilExpiration } from '../../utils/taskUtils';

const DailyTasksPage = () => {
  const { state, tasksManager, verifyTask } = useTasks();
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [showAdModal, setShowAdModal] = useState(false);
  const [currentTaskForAd, setCurrentTaskForAd] = useState(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const navigate = useNavigate();

  // Helper to map backend/variant game IDs to actual route slugs
  const normalizeTargetGameSlug = (id) => {
    try {
      if (!id || typeof id !== 'string') return null;
      // Handle PascalCase/camelCase (e.g., "FlameOfWisdom") before lowercasing
      const raw = id.trim();
      const kebabized = raw
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // insert dash before capitals
        .replace(/[\s_]+/g, '-'); // spaces/underscores to dashes
      let slug = kebabized.trim().toLowerCase();

      // Also normalize compact aliases with no separators
      if (slug === 'flameofwisdom') slug = 'flame-of-wisdom';
      if (slug === 'marksofdestiny') slug = 'marks-of-destiny';
      if (slug === 'pathofenlightenment' || slug === 'pathofknowledge') slug = 'path-of-enlightenment';
      if (slug === 'gatesofknowledge') slug = 'gates-of-knowledge';

      // Normalize known variants and multiplayer suffixes
      if (slug === 'tic-tac-toe' || slug === 'tic-tac-toe-multiplayer') slug = 'tic-tac-toe';
      if (slug.endsWith('-multiplayer') && slug !== 'marks-of-destiny-multiplayer') {
        slug = slug.replace(/-multiplayer$/, '');
      }
      // Map common aliases
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

  // Update the countdown timer every minute
  useEffect(() => {
    const updateCountdown = () => {
      if (state.tasks.length > 0 && state.tasks[0].expiresAt) {
        setTimeUntilReset(getTimeUntilExpiration(state.tasks[0].expiresAt));
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [state.tasks]);

  // Check if there's an available milestone reward to claim
  const nextMilestone = getNextMilestone(state.streak);

  // Handle task navigation (for game-specific tasks)
  const handleTaskNavigation = (task) => {
    console.log('=== HANDLE TASK NAVIGATION ===');
    console.log('Task received:', task);
    console.log('Task type:', task?.type);
    console.log('Target game:', task?.targetGame);
    console.log('Game identifier:', task?.game_identifier);
    
    if (!task) {
      console.error('No task provided to handleTaskNavigation');
      return;
    }

    // Check for direct link first (highest priority)
    if (task.link && typeof task.link === 'string') {
      const webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
      
      if ((task.link.startsWith('https://t.me/') || task.link.startsWith('t.me/')) && typeof webApp?.openTelegramLink === 'function') {
        console.log(`Opening Telegram link: ${task.link}`);
        webApp.openTelegramLink(task.link);
      } else if (typeof webApp?.openLink === 'function') {
        console.log(`Using Telegram WebApp openLink: ${task.link}`);
        webApp.openLink(task.link);
      } else if (typeof window !== 'undefined' && window.open) {
        console.log(`Opening link in new window: ${task.link}`);
        window.open(task.link, '_blank');
      }
      return;
    }

    const category = getNormalizedCategory(task);
    console.log('Normalized category:', category);

    // Category-based routing first
    if (category === 'referral') {
      // Use React Router navigation to stay within Telegram interface
      navigate('/referral');
      return;
    }

    if (category === 'play-game' || task.targetGame || task.game_identifier) {
      console.log('Game navigation condition met!');
      console.log('Category is play-game:', category === 'play-game');
      console.log('Has targetGame:', !!task.targetGame);
      console.log('Has game_identifier:', !!task.game_identifier);
      
      const routeSlug = normalizeTargetGameSlug(task.targetGame || task.game_identifier || '');
      console.log('Route slug generated:', routeSlug);
      
      if (routeSlug) {
        const gameUrl = `/games/${routeSlug}`;
        console.log(`Navigating to: ${gameUrl}`);
        
        // Use React Router navigation to stay within Telegram interface
        // This prevents opening a new browser tab
        navigate(gameUrl);
      } else {
        console.log('Unknown targetGame, navigating to daily tasks');
        navigate('/daily-tasks');
      }
      return;
    }

    // For social follow tasks, open the provided verifyUrl or platform link directly
    if (category === 'social-follow') {
      const webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

      // Prefer explicit verifyUrl if provided
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

      // Build URL from platform + target username if available
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
          // For Discord, username may not be resolvable via URL; prefer invite/verifyUrl when possible
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
    
    // Fallback to type-based handling
    console.log('Task has no targetGame, checking task type/category:', task.type, category);
    switch ((task.type || '').toUpperCase()) {
      case 'DAILY_LOGIN':
        // Daily login is auto-completed, no navigation needed
        console.log('Daily login task - no navigation needed');
        break;
      case 'CROSS_GAME':
        // Navigate to games page to let user choose
        console.log('Cross-game task - navigating to home games section');
        navigate('/');
        break;
      default:
        console.log('Unknown task type, navigating to home');
        navigate('/');
        break;
    }
  };

  // Handle opening external verification targets or flows
  const handleVerify = async (task) => {
    try {
      if (!task) return;

      // Add a small delay to show loading animation
      await new Promise(resolve => setTimeout(resolve, 500));

      const category = getNormalizedCategory(task);

      // Referral tasks use our in-app referral flow. Social follow should open the provided link.
      if (category === 'referral') {
        navigate('/referral');
        return;
      }

      const webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
      
      // For Telegram tasks, try to verify membership first
      const platformName = (task.platform || '').toLowerCase();
      if (platformName.includes('telegram') || platformName === 'tg') {
        const username = task.targetUsername || task.target_username || '';
        const chatId = username.startsWith('@') ? username : `@${username}`;
        
        if (webApp?.initDataUnsafe?.user?.id && username) {
          try {
            const response = await fetch('/api/verify-telegram-membership', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: webApp.initDataUnsafe.user.id,
                chatId: chatId,
                initData: webApp.initData
              })
            });
            
            const result = await response.json();
            
            if (result.success && result.isMember) {
              // User is already a member, complete the task
              console.log('User is already a member, completing task');
              if (tasksManager) {
                await tasksManager.completeTask(task.id);
              }
              return;
            } else if (result.success && !result.isMember) {
              // User is not a member, open the link for them to join
              console.log('User is not a member, opening Telegram link');
            } else {
              console.log('Membership check failed, opening link anyway');
            }
          } catch (error) {
            console.error('Error checking membership:', error);
            // Continue to open link if verification fails
          }
        }
      }

      // Check for direct link first (highest priority)
      if (task.link && typeof task.link === 'string') {
        if ((task.link.startsWith('https://t.me/') || task.link.startsWith('t.me/')) && typeof webApp?.openTelegramLink === 'function') {
          console.log(`Opening Telegram link for verification: ${task.link}`);
          webApp.openTelegramLink(task.link);
        } else if (typeof webApp?.openLink === 'function') {
          console.log(`Using Telegram WebApp openLink for verification: ${task.link}`);
          webApp.openLink(task.link);
        } else if (typeof window !== 'undefined' && window.open) {
          console.log(`Opening link in new window for verification: ${task.link}`);
          window.open(task.link, '_blank');
        }
        return;
      }

      // Prefer explicit verifyUrl if provided
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

      // Build URL from platform + target username if available
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
          // For Discord, username may not be resolvable via URL; prefer invite/verifyUrl when possible
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

      // Fallback to tasks page
      navigate('/daily-tasks');
    } catch (e) {
      console.error('DailyTasksPage: verify error', e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-deepLapis via-deepLapisDark to-black/60 pt-6 pb-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-primary text-textGold">Daily Tasks</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-textLight/80">Resets in {timeUntilReset || '24h'}</span>
            <Link to="/" className="text-royalGold hover:text-textGold">Home</Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            <TaskList
              tasks={state.tasks}
              onNavigate={handleTaskNavigation}
              onClaim={async (taskId) => {
                try {
                  await tasksManager.claimTaskReward(taskId, false);
                } catch (e) {
                  console.error('DailyTasksPage: failed to claim reward', e);
                }
              }}
              onAdBoost={(task) => {
                setCurrentTaskForAd(task);
                setShowAdModal(true);
              }}
              onVerify={handleVerify}
              showAdsButton
            />

            {/* Streak and Milestones */}
            <div className="mt-6 bg-deepLapisDark/60 rounded-lg p-4 border border-royalGold/30">
              <h2 className="text-xl font-primary text-textGold mb-3">Your Progress</h2>
              <StreakCalendar streak={state.streak} />
              {nextMilestone && (
                <div className="mt-4">
                  <h3 className="text-lg text-textGold">Next Milestone</h3>
                  <RewardDisplay rewards={nextMilestone.rewards} className="mt-2" />
                </div>
              )}
            </div>

            {/* Debug Info */}
            <div className="mt-6">
              <button
                className="text-sm text-royalGold hover:text-textGold"
                onClick={() => setShowDebugInfo((v) => !v)}
              >
                {showDebugInfo ? 'Hide' : 'Show'} Debug Info
              </button>
              {showDebugInfo && (
                <div className="mt-3">
                  <DebugSupabase />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Streak Info */}
          <div className="lg:col-span-1">
            <div className="bg-deepLapisDark/60 rounded-lg p-4 border border-royalGold/30">
              <h3 className="text-lg font-primary text-textGold mb-2">Streak</h3>
              <p className="text-textLight">You've completed {state.streak?.consecutiveDays || 0} days in a row!</p>
              <p className="text-textLight/80 text-sm mt-2">Keep going to achieve higher rewards.</p>
            </div>
          </div>
        </div>

        {/* Ad Modal */}
        {showAdModal && (
          <AdRewardModal
            task={currentTaskForAd}
            onClose={() => setShowAdModal(false)}
            onAdCompleted={async () => {
              try {
                if (currentTaskForAd) await tasksManager.claimTaskReward(currentTaskForAd.id, true);
              } catch (e) {
                console.error('DailyTasksPage: ad reward failed', e);
              } finally {
                setShowAdModal(false);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DailyTasksPage;