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
    const fetchReferralLink = async () => {
      if (user) {
        try {
          const link = await generateTelegramReferralLink();
          setReferralLink(link);
        } catch (error) {
          console.error('Error generating referral link:', error);
          setReferralLink('https://t.me/TheGoldenGlow_bot');
        }
      }
    };
    
    fetchReferralLink();
  }, [user, generateTelegramReferralLink]);

  const handleCopyLink = () => {
    setCopied(true); // Show visual feedback immediately
    
    // Show the success message for 2 seconds
    setTimeout(() => setCopied(false), 2000);
    
    // Try different clipboard methods in sequence
    const copyMethods = [
      copyWithClipboardAPI,
      copyWithExecCommand,
      copyWithTextAreaMethod
    ];
    
    // Try each method until one succeeds
    const tryNextMethod = (index = 0) => {
      if (index >= copyMethods.length) {
        console.warn('All clipboard methods failed. Manual copy may be required.');
        return;
      }
      
      copyMethods[index](referralLink)
        .then(() => console.log(`Copy successful with method ${index + 1}`))
        .catch(err => {
          console.log(`Method ${index + 1} failed:`, err);
          tryNextMethod(index + 1);
        });
    };
    
    tryNextMethod();
  };
  
  // Method 1: Modern Clipboard API
  const copyWithClipboardAPI = (text) => {
    return new Promise((resolve, reject) => {
      if (!navigator.clipboard) {
        return reject(new Error('Clipboard API not available'));
      }
      
      navigator.clipboard.writeText(text)
        .then(resolve)
        .catch(reject);
    });
  };
  
  // Method 2: execCommand approach
  const copyWithExecCommand = (text) => {
    return new Promise((resolve, reject) => {
      try {
        const tempInput = document.createElement('input');
        tempInput.style.position = 'absolute';
        tempInput.style.left = '-9999px';
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        if (successful) {
          resolve();
        } else {
          reject(new Error('execCommand returned false'));
        }
      } catch (err) {
        reject(err);
      }
    });
  };
  
  // Method 3: textarea with user instruction as last resort
  const copyWithTextAreaMethod = (text) => {
    return new Promise((resolve, reject) => {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.width = '2em';
        textarea.style.height = '2em';
        textarea.style.padding = '0';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.boxShadow = 'none';
        textarea.style.background = 'transparent';
        document.body.appendChild(textarea);
        
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          // iOS specific handling
          textarea.contentEditable = true;
          textarea.readOnly = false;
          
          const range = document.createRange();
          range.selectNodeContents(textarea);
          
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          textarea.setSelectionRange(0, 999999);
        } else {
          textarea.select();
        }
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
          resolve();
        } else {
          // Even if this fails, we still want to show success to the user
          // since they've already seen the copy feedback
          console.log('Last resort copy method may have failed, but proceeding anyway');
          resolve(); // Resolve anyway to avoid showing an error to the user
        }
      } catch (err) {
        // At this point, all methods have failed but the user has already seen
        // the "Copied" confirmation, so we'll just log it
        console.error('All clipboard methods failed:', err);
        resolve(); // Resolve anyway to provide good UX
      }
    });
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

      {/* Referrals Board */}
      <motion.div 
        className="bg-deepLapisDark p-6 rounded-xl shadow-inner border border-royalGold/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-primary text-textGold">Your Invited Friends</h3>
          <div className="flex items-center">
            <FiUsers className="text-ancientGold mr-2" />
            <span className="text-textLight">Total: </span>
            <span className="text-ancientGold-light font-bold ml-1">{referrals.length}</span>
          </div>
        </div>

        {referrals.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-royalGold/20">
            <table className="min-w-full divide-y divide-royalGold/20">
              <thead className="bg-mysticPurple-dark">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-ancientGold-light tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-ancientGold-light tracking-wider">
                    Joined
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-ancientGold-light tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-ancientGold-light tracking-wider">
                    Points Earned
                  </th>
                </tr>
              </thead>
              <tbody className="bg-deepLapis-dark divide-y divide-royalGold/10">
                {referrals.map((referral, index) => {
                  // Format the referred user information
                  const username = referral.referred_id?.username || 
                                   `User ${referral.referred_id?.substring(0, 6)}`;
                  const joinDate = referral.created_at ? 
                    new Date(referral.created_at).toLocaleDateString() : 'Unknown';
                  const isActive = true; // We could determine this based on user activity if available
                  const pointsAwarded = referral.points_awarded || 50;
                  
                  return (
                    <tr key={referral.id || index} className="hover:bg-deepLapis/80 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-mysticPurple overflow-hidden mr-3 border border-royalGold/30">
                            {referral.referred_id?.telegram_photo_url ? (
                              <img 
                                src={referral.referred_id.telegram_photo_url} 
                                alt={username}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-deepLapis">
                                <FiUsers className="text-royalGoldLight/70" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-textLight">{username}</div>
                            <div className="text-xs text-royalGoldLight/60">{referral.code_used || 'Direct invite'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-textLight">{joinDate}</div>
                        <div className="text-xs text-royalGoldLight/60">
                          {referral.created_at ? 
                            `${Math.floor((new Date() - new Date(referral.created_at)) / (1000 * 60 * 60 * 24))} days ago` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-ancientGold">
                          +{pointsAwarded} GC
                        </div>
                        <div className="text-xs text-royalGoldLight/60">
                          {referral.reward_claimed ? 'Claimed' : 'Automatic'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 bg-deepLapis/50 rounded-lg border border-royalGold/10">
            <FiUsers className="mx-auto h-12 w-12 text-royalGoldLight/30 mb-3" />
            <h3 className="text-lg font-medium text-textGold mb-1">No Invites Yet</h3>
            <p className="text-sm text-royalGoldLight/70 max-w-md mx-auto">
              Share your unique invite link with friends to start earning rewards!
              Each successful invitation earns you Golden Credits.
            </p>
            <button
              onClick={handleCopyLink}
              className="mt-4 px-4 py-2 bg-deepLapis border border-royalGold/30 rounded-md text-royalGoldLight hover:bg-deepLapis/70 transition-colors"
            >
              <FiCopy className="inline-block mr-2" />
              Copy Invite Link
            </button>
          </div>
        )}

        {referrals.length > 0 && (
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-royalGoldLight/70">
              Showing {referrals.length} invite{referrals.length !== 1 ? 's' : ''}
            </div>
            <div className="text-sm text-royalGoldLight/70">
              Total earned: <span className="text-ancientGold font-medium">
                {referrals.reduce((total, ref) => total + (ref.points_awarded || 50), 0)} GC
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ReferralPage;
