import React, { useRef, useEffect, useState, useCallback } from 'react';
import YouTube from 'react-youtube';
import { useUser } from '../../contexts/UserContext';
import { supabase, isSupabaseAvailable } from '../../utils/supabase';

// Minimal YouTube URL parser supporting common patterns
function extractYouTubeId(url) {
  if (!url) return null;
  try {
    const shorts = url.match(/youtube\.com\/shorts\/([\w-]{6,})/i);
    if (shorts) return shorts[1];
    const watch = url.match(/[?&]v=([\w-]{6,})/i);
    if (watch) return watch[1];
    const youtu = url.match(/youtu\.be\/([\w-]{6,})/i);
    if (youtu) return youtu[1];
    const u = new URL(url);
    const seg = u.pathname.split('/').filter(Boolean).pop();
    if (seg && /^[\w-]{6,}$/.test(seg)) return seg;
  } catch (_) {
    return null;
  }
  return null;
}

const YouTubeVideoPlayer = ({ campaign, onComplete, onError }) => {
  const { user, isAuthenticated, updateUserPoints } = useUser();
  const playerRef = useRef(null);
  const [videoId, setVideoId] = useState(null);
  const [playerState, setPlayerState] = useState(-1); // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: cued
  const [watchProgress, setWatchProgress] = useState(0); // Percentage watched
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const intervalRef = useRef(null);
  const watchedTimeRef = useRef(0); // Total unique watched time
  const lastReportedTimeRef = useRef(0); // Last time reported by player

  const requiredWatchPercentage = campaign.required_watch_percentage || 80;
  const rewardAmount = campaign.reward_amount || 50;

  useEffect(() => {
    const id = extractYouTubeId(campaign.video_url || campaign.direct_link);
    setVideoId(id);
    setRewardClaimed(false); // Reset reward status for new campaign
    setWatchProgress(0);
    watchedTimeRef.current = 0;
    lastReportedTimeRef.current = 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [campaign]);

  const handleReward = useCallback(async () => {
    if (rewardClaimed) return; // Double check to prevent multiple rewards

    console.log(`Awarding ${rewardAmount} credits for watching "${campaign.name}"`);

    // Award points to the user
    if (isAuthenticated && user) {
      const result = await updateUserPoints(rewardAmount, {
        source: 'video_ad',
        campaignId: campaign.id,
        campaignName: campaign.name,
      });
      if (result.success) {
        console.log('Credits awarded successfully via UserContext.');
        onComplete({ reward: rewardAmount, campaignName: campaign.name });
      } else {
        console.error('Failed to award credits:', result.error);
        onError(`Failed to award credits: ${result.error}`);
      }
    } else {
      // For guest mode, we might update a local score or just log it
      console.log(`Guest user would have earned ${rewardAmount} credits.`);
      onComplete({ reward: rewardAmount, campaignName: campaign.name });
    }

    // Record ad impression/completion in Supabase
    if (isSupabaseAvailable() && isAuthenticated && user) {
      try {
        const { error: impressionError } = await supabase
          .from('ad_impressions')
          .insert({
            campaign_id: campaign.id,
            user_id: user.id,
            count: 1, // Increment count for this user/campaign
          });
        if (impressionError) console.error('Error recording ad impression:', impressionError);
        else console.log('Ad impression recorded successfully.');
      } catch (e) {
        console.error('Supabase error recording ad impression:', e);
      }
    }
    setRewardClaimed(true); // Mark as claimed after processing
  }, [campaign, isAuthenticated, user, updateUserPoints, rewardAmount, onComplete, onError]);

  const onPlayerReady = useCallback((event) => {
    playerRef.current = event.target;
    setDuration(playerRef.current.getDuration());
    console.log('YouTube Player Ready. Duration:', playerRef.current.getDuration());
  }, []);

  const onPlayerStateChange = useCallback((event) => {
    setPlayerState(event.data);
    console.log('Player state changed:', event.data);

    if (event.data === 1) { // Playing
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (!playerRef.current) return;
        
        const current = playerRef.current.getCurrentTime();
        setCurrentTime(current);

        // Track unique watched time
        if (current > lastReportedTimeRef.current) {
          watchedTimeRef.current += (current - lastReportedTimeRef.current);
        }
        lastReportedTimeRef.current = current;

        const newProgress = (watchedTimeRef.current / duration) * 100;
        setWatchProgress(Math.min(100, newProgress));

        if (newProgress >= requiredWatchPercentage && !rewardClaimed) {
          console.log(`Required watch percentage (${requiredWatchPercentage}%) reached!`);
          handleReward();
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, 1000); // Check every second
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [duration, requiredWatchPercentage, rewardClaimed, handleReward]);

  const onPlayerError = useCallback((event) => {
    console.error('YouTube Player Error:', event.data);
    onError(`YouTube Player Error: ${event.data}`);
  }, [onError]);

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const opts = {
    height: '200',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
      rel: 0,
      modestbranding: 1,
      fs: 1,
      disablekb: 1,
      iv_load_policy: 3,
      showinfo: 0,
      loop: 0,
      start: 0,
    },
  };

  if (!videoId) {
    return (
      <div className="aspect-video w-full flex items-center justify-center bg-deepLapis/40 rounded-lg border border-royalGold/30 text-textLight/60">
        Invalid YouTube URL for this campaign.
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border border-royalGold/30 relative">
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={onPlayerReady}
        onStateChange={onPlayerStateChange}
        onError={onPlayerError}
        className="w-full h-full"
      />
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-deepLapisDark/80 p-2 text-xs text-textLight flex justify-between items-center">
          <span>
            Watch progress: {Math.round(watchProgress)}% / {requiredWatchPercentage}%
          </span>
          {!rewardClaimed && watchProgress < requiredWatchPercentage && (
            <span className="text-royalGold">
              Watch {requiredWatchPercentage - Math.round(watchProgress)}% more to earn reward
            </span>
          )}
          {rewardClaimed && (
            <span className="text-emeraldGreen">
              Reward claimed! +{rewardAmount} Credits
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default YouTubeVideoPlayer;

