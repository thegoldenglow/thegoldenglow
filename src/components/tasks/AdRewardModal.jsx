import React, { useState, useEffect } from 'react';
import { formatReward } from '../../utils/taskUtils';

const AdRewardModal = ({ task, onClose, onAdCompleted }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [adFinished, setAdFinished] = useState(false);
  
  // Calculate doubled rewards
  const regularRewards = task?.rewards || [];
  const doubledRewards = regularRewards.map(reward => ({
    ...reward,
    amount: reward.amount * 2
  }));
  
  // Format rewards for display
  const formattedRegularRewards = regularRewards.map(formatReward);
  const formattedDoubledRewards = doubledRewards.map(formatReward);
  
  // Simulate ad loading and viewing
  useEffect(() => {
    if (isLoading) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setAdProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          setAdFinished(true);
          setIsLoading(false);
        }
      }, 200); // Full ad takes about 4 seconds
      
      return () => clearInterval(interval);
    }
  }, [isLoading]);
  
  const handleStartAd = () => {
    setIsLoading(true);
  };
  
  const handleAdFinished = () => {
    onAdCompleted(true);
  };
  
  return (
    <div className="fixed inset-0 bg-deepLapis/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-deepLapisDark border border-royalGold/50 rounded-lg max-w-md w-full p-5 shadow-xl">
        {!isLoading && !adFinished ? (
          // Pre-ad screen
          <div className="text-center">
            <h3 className="text-xl font-calligraphy text-textGold mb-4 shimmer">Watch the wisdom of the ancients</h3>
            
            <div className="text-center mb-6">
              <p className="text-textLight mb-4">
                A short mystical vision will double your rewards
              </p>
              
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
                className="flex-1 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
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
        ) : isLoading ? (
          // During-ad experience
          <div className="text-center">
            <h3 className="text-xl font-calligraphy text-textGold mb-4">Discovering ancient wisdom...</h3>
            
            {/* Progress bar */}
            <div className="relative h-3 bg-deepLapis rounded-full mb-4 overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all"
                style={{ width: `${adProgress}%` }}
              ></div>
            </div>
            
            <p className="text-textGold">{adProgress}% complete</p>
            
            {/* Mystical animation as placeholder for ad content */}
            <div className="my-8 flex justify-center">
              <div className="w-32 h-32 border-4 border-royalGold/30 rounded-full relative animate-spin-slow">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 border-4 border-royalGold/50 rounded-full animate-spin-reverse"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl animate-pulse">✨</div>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-textLight italic">
              The mystics are revealing their secrets...
            </p>
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