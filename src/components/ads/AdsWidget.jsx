import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseAvailable } from '../../utils/supabase';
import YouTubeVideoPlayer from './YouTubeVideoPlayer';

// Minimal YouTube URL parser supporting common patterns
function extractYouTubeId(url) {
  if (!url) return null;
  try {
    // Handle shorts, watch, and youtu.be links
    const shorts = url.match(/youtube\.com\/shorts\/([\w-]{6,})/i);
    if (shorts) return shorts[1];
    const watch = url.match(/[?&]v=([\w-]{6,})/i);
    if (watch) return watch[1];
    const youtu = url.match(/youtu\.be\/([\w-]{6,})/i);
    if (youtu) return youtu[1];
    // Fallback: try last path segment if it looks like an ID
    const u = new URL(url);
    const seg = u.pathname.split('/').filter(Boolean).pop();
    if (seg && /^[\w-]{6,}$/.test(seg)) return seg;
  } catch (_) {
    return null;
  }
  return null;
}

export default function AdsWidget() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showRewardNotification, setShowRewardNotification] = useState(false);
  const [lastReward, setLastReward] = useState(null);

  const selectedCampaign = campaigns.length > 0 ? campaigns[selectedIndex] : null;

  useEffect(() => {
    loadCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCampaigns() {
    setLoading(true);
    setError('');
    setInfo('');
    try {
      // Load active video campaigns from ad_campaigns table (Supabase-only)
      const { data, error: dbError } = await supabase
        .from('ad_campaigns')
        .select('id, name, description, direct_link, video_url, reward_amount, required_watch_percentage, status, created_at')
        .eq('type', 'Video')
        .eq('status', 'Active')
        .order('created_at', { ascending: false });
      
      if (dbError) throw dbError;
      
      // Filter to only campaigns with valid YouTube URLs
      const cleaned = (data || []).filter((campaign) => {
        const videoUrl = campaign.video_url || campaign.direct_link;
        return !!extractYouTubeId(videoUrl);
      });
      
      setCampaigns(cleaned);
      if (cleaned.length > 0) {
        setSelectedIndex(Math.floor(Math.random() * cleaned.length));
      }
      setInfo(cleaned.length === 0 ? 'No active video campaigns available.' : '');
    } catch (e) {
      console.error('Failed to load video campaigns', e);
      setError(e?.message || 'Failed to load video campaigns');
    } finally {
      setLoading(false);
    }
  }

  function shuffleCampaign() {
    if (campaigns.length < 2) return;
    let next = Math.floor(Math.random() * campaigns.length);
    if (next === selectedIndex) {
      next = (next + 1) % campaigns.length;
    }
    setSelectedIndex(next);
  }

  const handleVideoComplete = (result) => {
    console.log('Video completed with result:', result);
    setLastReward(result);
    setShowRewardNotification(true);
    
    // Hide notification after 5 seconds
    setTimeout(() => {
      setShowRewardNotification(false);
    }, 5000);
  };

  const handleVideoError = (errorMsg) => {
    console.error('Video player error:', errorMsg);
    setError(errorMsg);
  };

  return (
    <div className="bg-deepLapisDark/60 rounded-lg p-4 border border-royalGold/30">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-primary text-textGold">Sponsored Videos</h3>
        {campaigns.length > 1 && (
          <span className="text-xs text-textLight/60">
            {selectedIndex + 1} of {campaigns.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-6 text-center text-textLight/70">
          <div className="animate-spin w-10 h-10 border-3 border-royalGold/20 border-t-royalGold rounded-full mx-auto mb-3"></div>
          Loading video campaigns...
        </div>
      ) : error ? (
        <div className="mb-3 p-3 bg-rubyRed/10 border border-rubyRed/30 rounded text-rubyRed text-sm">{error}</div>
      ) : null}

      {selectedCampaign ? (
        <div className="mb-4">
          <YouTubeVideoPlayer
            campaign={selectedCampaign}
            onComplete={handleVideoComplete}
            onError={handleVideoError}
          />
          
          {/* Campaign Navigation */}
          {campaigns.length > 1 && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIndex((prev) => (prev === 0 ? campaigns.length - 1 : prev - 1))}
                className="text-xs px-3 py-1.5 rounded border border-royalGold/30 text-textLight/80 hover:bg-royalGold/10"
              >
                ← Previous
              </button>
              <button
                type="button"
                onClick={shuffleCampaign}
                className="text-xs px-3 py-1.5 rounded border border-royalGold/30 text-textLight/80 hover:bg-royalGold/10"
              >
                🎲 Random
              </button>
              <button
                type="button"
                onClick={() => setSelectedIndex((prev) => (prev === campaigns.length - 1 ? 0 : prev + 1))}
                className="text-xs px-3 py-1.5 rounded border border-royalGold/30 text-textLight/80 hover:bg-royalGold/10"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 p-4 text-sm text-textLight/60 bg-deepLapis/40 rounded border border-royalGold/20">
          {info || 'No video campaigns available. Admins can create video campaigns to display here.'}
        </div>
      )}

      {/* Global Reward Notification */}
      {showRewardNotification && lastReward && (
        <div className="mb-3 p-3 bg-emeraldGreen/10 border border-emeraldGreen/30 rounded animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎉</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-emeraldGreen">Reward Claimed!</p>
              <p className="text-xs text-textLight/80">
                +{lastReward.reward} Golden Credits from "{lastReward.campaignName}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={loadCampaigns}
          className="text-xs px-3 py-1.5 rounded border border-royalGold/30 text-textLight/80 hover:bg-royalGold/10"
        >
          Refresh
        </button>
        <div className="text-[11px] text-textLight/50">Data source: Database</div>
      </div>
    </div>
  );
}