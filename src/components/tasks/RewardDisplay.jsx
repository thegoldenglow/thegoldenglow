import React from 'react';

const RewardDisplay = ({ userStats }) => {
  return (
    <div className="bg-deepLapisDark/50 backdrop-blur-sm p-4 rounded-lg border border-royalGold/30">
      <h3 className="text-lg font-medium text-textGold mb-3">Your Treasures</h3>
      
      <div className="grid grid-cols-3 gap-3">
        {/* Mystic Coins */}
        <div className="bg-deepLapis/30 rounded-lg p-3 text-center flex flex-col items-center">
          <span className="text-2xl mb-1">🪙</span>
          <span className="text-textGold text-xl font-medium">{userStats.mysticCoins}</span>
          <span className="text-xs text-textLight">Mystic Coins</span>
        </div>
        
        {/* Mystical Essence */}
        <div className="bg-deepLapis/30 rounded-lg p-3 text-center flex flex-col items-center">
          <span className="text-2xl mb-1">✨</span>
          <span className="text-textGold text-xl font-medium">{userStats.mysticalEssence}</span>
          <span className="text-xs text-textLight">Mystical Essence</span>
        </div>
        
        {/* Wisdom Scrolls */}
        <div className="bg-deepLapis/30 rounded-lg p-3 text-center flex flex-col items-center">
          <span className="text-2xl mb-1">📜</span>
          <span className="text-textGold text-xl font-medium">{userStats.wisdomScrolls}</span>
          <span className="text-xs text-textLight">Wisdom Scrolls</span>
        </div>
      </div>
      
      {/* Special Items */}
      {userStats.items && userStats.items.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-textGold mb-2">Special Items</h4>
          <div className="bg-deepLapis/20 rounded-lg p-3">
            <ul className="space-y-2">
              {userStats.items.map((item, index) => (
                <li key={index} className="flex items-center">
                  <span className="text-lg mr-2">🎁</span>
                  <span className="text-sm text-textLight">
                    {item.id.replace(/_/g, ' ')} x{item.amount}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-center">
        <p className="text-xs text-textLight italic">
          Complete daily tasks to earn more treasures and unlock game enhancements
        </p>
      </div>
    </div>
  );
};

export default RewardDisplay;