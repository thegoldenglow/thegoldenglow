import React, { useState, useEffect } from 'react';
import { formatReward } from '../../utils/taskUtils';
import YouTubeVideoPlayer from '../ads/YouTubeVideoPlayer';
import { supabase } from '../../utils/supabase';

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

const AdRewardModal = ({ task, onClose, onAdCompleted }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [adFinished, setAdFinished] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [campaignError, setCampaignError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Calculate doubled rewards
  const regularRewards = task?.rewards || [];
  const doubledRewards = regularRewards.map(reward => ({
    ...reward,
    amount: reward.amount * 2
  }));
  
  // Format rewards for display
  const formattedRegularRewards = regularRewards.map(formatReward);
  const formattedDoubledRewards = doubledRewards.map(formatReward);
  
  // Load active video campaigns once when modal opens
  useEffect(() => {
    let cancelled = false;
    async function loadCampaigns() {
      setLoadingCampaigns(true);
      setCampaignError('');
      try {
        const { data, error } = await supabase
          .from('ad_campaigns')
          .select('id, name, description, direct_link, video_url, reward_amount, required_watch_percentage, status, created_at')
          .eq('type', 'Video')
          .eq('status', 'Active')
          .order('created_at', { ascending: false });
        if (error) throw error;
        const cleaned = (data || []).filter((c) => !!extractYouTubeId(c.video_url || c.direct_link));
        if (!cancelled) {
          setCampaigns(cleaned);
          setSelectedCampaign(cleaned[0] || null);
        }
      } catch (e) {
        if (!cancelled) setCampaignError(e?.message || 'Failed to load video campaigns');
      } finally {
        if (!cancelled) setLoadingCampaigns(false);
      }
    }
    loadCampaigns();
    return () => { cancelled = true; };
  }, []);
  
  const handleStartAd = () => {
    // Switch to video playback view
    setIsPlaying(true);
  };
  
  const handleAdFinished = () => {
    onAdCompleted(true);
  };
  
  return (
    <div className="fixed inset-0 bg-deepLapis/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-deepLapisDark border border-royalGold/50 rounded-lg max-w-md w-full p-5 shadow-xl">
        {!isPlaying && !adFinished ? (
          // Pre-ad screen
          <div className="text-center">
            <h3 className="text-xl font-calligraphy text-textGold mb-4 shimmer">Watch the wisdom of the ancients</h3>
            
            <div className="text-center mb-6">
              <p className="text-textLight mb-4">
                A short mystical vision will double your rewards
              </p>
              {campaignError && (
                <div className="mb-3 p-3 bg-rubyRed/10 border border-rubyRed/30 rounded text-rubyRed text-sm">
                  {campaignError}
                </div>
              )}
              {!campaignError && (
                <div className="text-xs text-textLight/70 mb-2">
                  {loadingCampaigns
                    ? 'Loading available video...' 
                    : (selectedCampaign ? `Ready to play: ${selectedCampaign.name}` : 'No active video campaigns available')}
                </div>
              )}
              
              <div className="flex justify-center">
                <div className="flex items-center space-x-8">
                  {/* Regular rewards */}
                  <div className="text-center">
                    <p className="text-xs text-textLight mb-2">Regular</p>
                    <div className="space-y-2">
                      {formattedRegularRewards.map((reward, index) => (
                        <div key={index} className="flex items-center space-x-1">
                          <span className="text-xl">{reward.icon}</span>
                          <span className="text-sm text-textGold">{reward.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <div className="text-textGold text-2xl">→</div>
                  
                  {/* Doubled rewards */}
                  <div className="text-center">
                    <p className="text-xs text-emerald-400 mb-2">With Ad</p>
                    <div className="space-y-2">
                      {formattedDoubledRewards.map((reward, index) => (
                        <div key={index} className="flex items-center space-x-1">
                          <span className="text-xl">{reward.icon}</span>
                          <span className="text-sm text-emerald-400 font-bold">{reward.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleStartAd}
                disabled={loadingCampaigns || !selectedCampaign}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Proceed
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-deepLapis text-textLight rounded-md hover:bg-deepLapis/80 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        ) : isPlaying ? (
          // During-ad experience (real video)
          <div>
            <h3 className="text-xl font-calligraphy text-textGold mb-3">Discovering ancient wisdom...</h3>
            {loadingCampaigns && (
              <div className="py-6 text-center text-textLight/70">
                <div className="animate-spin w-10 h-10 border-3 border-royalGold/20 border-t-royalGold rounded-full mx-auto mb-3"></div>
                Loading video campaign...
              </div>
            )}
            {!loadingCampaigns && selectedCampaign && (
              <YouTubeVideoPlayer
                campaign={selectedCampaign}
                onComplete={() => {
                  setAdFinished(true);
                  setIsPlaying(false);
                  onAdCompleted(true);
                }}
                onError={(msg) => setCampaignError(msg)}
              />
            )}
            {!loadingCampaigns && !selectedCampaign && (
              <div className="p-4 text-sm text-textLight/60 bg-deepLapis/40 rounded border border-royalGold/20">
                No video campaigns available right now.
              </div>
            )}
          </div>
        ) : (
          // Post-ad screen
          <div className="text-center">
            <h3 className="text-xl font-calligraphy text-textGold mb-3 shimmer">Wisdom received!</h3>
            
            <div className="py-6">
              <div className="text-5xl mb-4 animate-bounce">🎁</div>
              
              <div className="space-y-2 mb-6">
                {formattedDoubledRewards.map((reward, index) => (
                  <div key={index} className="flex items-center justify-center space-x-2 animate-fade-in">
                    <span className="text-2xl">{reward.icon}</span>
                    <span className="text-lg text-emerald-400 font-bold">+{reward.amount} {reward.displayName}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleAdFinished}
              className="w-full py-2 bg-gradient-gold text-deepLapis font-medium rounded-md hover:opacity-90 transition-opacity"
            >
              Continue your journey
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdRewardModal;