import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { FiCopy, FiShare2, FiUsers, FiGift, FiCheck, FiStar } from 'react-icons/fi';
import { motion } from 'framer-motion';

const ReferralPage = () => {
  const { user, generateTelegramReferralLink, recordReferral, referrals, getUserLevel } = useUser();
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const navigate = useNavigate();
  const userLevel = getUserLevel();

  useEffect(() => {
    // Generate Telegram referral link when component mounts
    if (user) {
      const link = generateTelegramReferralLink();
      setReferralLink(link);
    }
  }, [user, generateTelegramReferralLink]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      // Try to use Telegram's native sharing if available
      if (window.Telegram?.WebApp?.ready) {
        const message = `Join me on Golden Glow - an enchanting journey of games and rewards! Use my invite link: ${referralLink}`;
        
        window.Telegram.WebApp.switchInlineQuery(message, ['users', 'groups', 'channels']);
      } else if (navigator.share) {
        // Use Web Share API as fallback
        await navigator.share({
          title: 'Join me on Golden Glow!',
          text: 'I invite you to join Golden Glow - an enchanting journey of games and rewards!',
          url: referralLink,
        });
      } else {
        // Manual copy fallback
        handleCopyLink();
      }
    } catch (error) {
      console.error('Error sharing referral link:', error);
      // Fallback to copy
      handleCopyLink();
    } finally {
      setIsSharing(false);
    }
  };

  // Calculate next reward milestone
  const calculateNextMilestone = () => {
    const milestones = [5, 10, 25, 50];
    const count = referrals.length;
    
    for (const milestone of milestones) {
      if (count < milestone) {
        return {
          current: count,
          next: milestone,
          remaining: milestone - count,
          progress: Math.floor((count / milestone) * 100)
        };
      }
    }
    
    // If above all milestones
    return {
      current: count,
      next: null,
      remaining: 0,
      progress: 100
    };
  };

  const nextMilestone = calculateNextMilestone();

  // Tile variants for animation
  const tileVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <a
          className="flex items-center text-royalGold hover:text-royalGold/80 transition"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
        >
          <FiStar className="mr-1" /> Back to Home
        </a>
        <div>
          <span className="text-textLight mr-2">Balance:</span>
          <span className="text-credits font-bold">{user?.points || 0} GC</span>
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-primary text-textGold mb-2">Invite Friends & Earn Rewards</h1>
        <p className="text-textLight">Share your unique invite link with friends on Telegram and earn Golden Credits when they join!</p>
      </div>

      {/* Referral Link Card */}
      <motion.div 
        className="bg-deepLapisDark p-6 rounded-xl mb-8 shadow-glow border border-royalGold/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-primary text-ancientGold mb-4">Your Unique Invite Link</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 bg-mysticPurple-dark p-3 rounded-lg border border-ancientGold/30 flex items-center overflow-hidden">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="bg-transparent text-textLight w-full outline-none overflow-ellipsis"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-royalGold text-deepLapis font-medium rounded-md flex items-center shadow-glow hover:bg-royalGold/90 transition"
              disabled={copied}
            >
              {copied ? <FiCheck className="mr-2" /> : <FiCopy className="mr-2" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-mysticPurple hover:bg-mysticPurple-light text-ancientGold-light font-medium rounded-md flex items-center shadow-md transition"
              disabled={isSharing}
            >
              <FiShare2 className="mr-2" />
              Share
            </button>
          </div>
        </div>
        <p className="text-textLight text-sm">
          Share this link with your friends on Telegram. When they join using your link, you'll both receive rewards!
        </p>
      </motion.div>

      {/* Progress and Rewards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div 
          className="bg-deepLapisDark p-5 rounded-xl shadow-inner border border-royalGold/20"
          variants={tileVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center mb-4">
            <FiUsers className="text-ancientGold text-xl mr-3" />
            <h3 className="text-xl font-primary text-textGold">Your Referrals</h3>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-textLight">Total Friends Invited</span>
            <span className="text-ancientGold font-bold text-xl">{referrals.length}</span>
          </div>
          
          {nextMilestone.next && (
            <>
              <div className="h-2 bg-mysticPurple-dark rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-ancientGold to-royalGold"
                  style={{ width: `${nextMilestone.progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-textLight mb-4">
                <span>{nextMilestone.current} friends</span>
                <span>Next milestone: {nextMilestone.next} friends</span>
              </div>
              <p className="text-textLight text-sm">
                Invite {nextMilestone.remaining} more friends to unlock the next reward!
              </p>
            </>
          )}
        </motion.div>

        <motion.div 
          className="bg-deepLapisDark p-5 rounded-xl shadow-inner border border-royalGold/20"
          variants={tileVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="flex items-center mb-4">
            <FiGift className="text-ancientGold text-xl mr-3" />
            <h3 className="text-xl font-primary text-textGold">Rewards</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex justify-between items-center">
              <span className="text-textLight">
                <span className={referrals.length >= 1 ? "text-royalGold" : ""}>1 Friend</span>
              </span>
              <span className="text-ancientGold-light font-semibold">
                50 GC per friend
              </span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-textLight">
                <span className={referrals.length >= 5 ? "text-royalGold" : ""}>5 Friends</span>
              </span>
              <span className="text-ancientGold-light font-semibold">
                500 GC + "Friend of Many" Badge
              </span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-textLight">
                <span className={referrals.length >= 10 ? "text-royalGold" : ""}>10 Friends</span>
              </span>
              <span className="text-ancientGold-light font-semibold">
                1,000 GC + "Light Spreader" Badge
              </span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-textLight">
                <span className={referrals.length >= 25 ? "text-royalGold" : ""}>25 Friends</span>
              </span>
              <span className="text-ancientGold-light font-semibold">
                2,500 GC + "Spiritual Guide" Title
              </span>
            </li>
          </ul>
        </motion.div>
      </div>

      {/* Recent Referrals List */}
      {referrals.length > 0 && (
        <motion.div 
          className="bg-deepLapisDark p-6 rounded-xl shadow-inner border border-royalGold/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3 className="text-xl font-primary text-textGold mb-4">Recent Invites</h3>
          <div className="overflow-hidden rounded-lg border border-royalGold/20">
            <table className="min-w-full divide-y divide-royalGold/20">
              <thead className="bg-mysticPurple-dark">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-ancientGold-light tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-ancientGold-light tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-ancientGold-light tracking-wider">
                    Reward
                  </th>
                </tr>
              </thead>
              <tbody className="bg-deepLapis-dark divide-y divide-royalGold/10">
                {referrals.slice(0, 5).map((referral, index) => (
                  <tr key={referral.userId || index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-textLight">
                        {referral.username || `User ${referral.userId.substring(0, 6)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-textLight">
                        {new Date(referral.timestamp).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-ancientGold">
                        50 GC
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ReferralPage;
