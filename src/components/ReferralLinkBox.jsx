import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { toast } from 'react-hot-toast';

/**
 * Component for displaying and copying the Telegram referral link
 */
const ReferralLinkBox = () => {
  const { user, generateTelegramReferralLink, getReferralCode, referrals } = useUser();
  const [referralLink, setReferralLink] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [showReferrals, setShowReferrals] = useState(false);

  useEffect(() => {
    const loadReferralData = async () => {
      if (user) {
        setLoading(true);
        try {
          // Initialize with default value in case of errors
          setReferralLink('https://t.me/TheGoldenGlow_bot');
          
          // Get referral link with proper await
          const link = await generateTelegramReferralLink();
          if (link) {
            setReferralLink(link);
          }

          // Get referral code with proper await
          const code = await getReferralCode();
          setReferralCode(code || '');
        } catch (error) {
          console.error('Error generating referral link:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadReferralData();
  }, [user, generateTelegramReferralLink, getReferralCode]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="bg-base-200 p-4 rounded-lg shadow-md animate-pulse">
        <div className="h-6 bg-base-300 rounded w-3/4 mb-4"></div>
        <div className="h-10 bg-base-300 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-base-200 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-2">Your Referral Link</h3>
      <p className="text-sm text-textLight/70 mb-4">
        Share this link with friends and earn rewards when they join!
      </p>
      
      {referralCode && (
        <div className="mb-4">
          <div className="text-sm text-textLight/70 mb-1">Your Referral Code:</div>
          <div className="flex items-center">
            <code className="bg-base-300 px-3 py-2 rounded flex-grow font-mono text-sm">
              {referralCode}
            </code>
            <button 
              onClick={() => copyToClipboard(referralCode)}
              className="ml-2 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition"
            >
              Copy
            </button>
          </div>
        </div>
      )}
      
      <div className="text-sm text-textLight/70 mb-1">Telegram Invite Link:</div>
      <div className="flex items-center">
        <input
          type="text"
          readOnly
          value={referralLink}
          className="bg-transparent text-textLight w-full outline-none overflow-ellipsis border border-base-300 rounded-l px-3 py-2"
        />
        <button 
          onClick={() => copyToClipboard(referralLink)}
          className="px-3 py-2 bg-primary text-white rounded-r-md hover:bg-primary/80 transition whitespace-nowrap"
        >
          Copy
        </button>
      </div>
      
      <div className="mt-4 flex gap-2">
        <a
          href={referralLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center px-3 py-2 bg-success/20 text-success rounded-md hover:bg-success/30 transition"
        >
          Open in Telegram
        </a>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Join The Golden Glow!',
                text: 'Hey! Join me in The Golden Glow game. Use my referral link:',
                url: referralLink,
              });
            } else {
              copyToClipboard(referralLink);
            }
          }}
          className="flex-1 px-3 py-2 bg-secondary/20 text-secondary rounded-md hover:bg-secondary/30 transition"
        >
          Share
        </button>
      </div>
      
      <div className="mt-4 text-xs text-textLight/50">
        Earn 100 points for each friend who joins using your referral link!
      </div>
      
      {/* Referral Stats */}
      <div className="mt-6 pt-4 border-t border-base-300">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-textLight">Your Referral Stats</h4>
          <button
            onClick={() => setShowReferrals(!showReferrals)}
            className="text-sm text-primary hover:text-primary/80 transition"
          >
            {showReferrals ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        
        <div className="mt-2 flex items-center bg-base-300/50 p-3 rounded-md">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-3">
            <span className="text-lg font-bold text-primary">{referrals?.length || 0}</span>
          </div>
          <div>
            <div className="text-md font-medium text-textLight">Total Invites</div>
            <div className="text-sm text-textLight/70">
              {referrals?.length === 0
                ? 'You haven\'t invited anyone yet'
                : referrals?.length === 1
                ? 'You\'ve invited 1 friend'
                : `You've invited ${referrals?.length} friends`}
            </div>
          </div>
        </div>
        
        {/* Recent Referrals */}
        {showReferrals && referrals && referrals.length > 0 && (
          <div className="mt-4">
            <h5 className="text-sm font-medium text-textLight mb-2">Recent Invites</h5>
            <div className="max-h-40 overflow-y-auto">
              {referrals.slice(0, 5).map((referral, index) => (
                <div key={index} className="flex justify-between items-center text-sm py-2 border-b border-base-300/50 last:border-b-0">
                  <div className="text-textLight">
                    {referral.username || `Friend ${index + 1}`}
                  </div>
                  <div className="text-xs text-textLight/70">
                    {new Date(referral.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
            
            {referrals.length > 5 && (
              <div className="text-xs text-center mt-2 text-textLight/50">
                + {referrals.length - 5} more invites
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralLinkBox;
