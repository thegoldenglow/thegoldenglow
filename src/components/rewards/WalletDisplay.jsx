import React from 'react';
import { useUser } from '../../contexts/UserContext';
import { useWallet } from '../../contexts/WalletContext';
import { FiCreditCard, FiTrendingUp, FiTrendingDown, FiInfo } from 'react-icons/fi';

const WalletDisplay = () => {
  const { user } = useUser();
  const { stats } = useWallet();
  
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };
  
  return (
    <div className="bg-deepLapisDark border border-royalGold/30 rounded-lg p-4 shadow-glow mb-6">
      <h3 className="text-center text-xl font-primary text-royalGold mb-4 flex items-center justify-center gap-2">
        <FiCreditCard className="text-royalGold" />
        Spiritual Wallet
      </h3>
      
      {/* Balance Display */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="text-sm text-textLight mb-1">Current Balance</div>
        <div className="text-4xl font-bold text-credits">
          {formatNumber(user?.points || 0)} GC
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-deepLapis/50 rounded-lg p-3 border border-royalGold/20">
          <div className="flex items-center gap-2 mb-1">
            <FiTrendingUp className="text-emerald-400" />
            <span className="text-sm text-textLight">Total Earned</span>
          </div>
          <div className="text-lg font-semibold text-emerald-400">
            +{formatNumber(stats.totalEarned)}
          </div>
        </div>
        
        <div className="bg-deepLapis/50 rounded-lg p-3 border border-royalGold/20">
          <div className="flex items-center gap-2 mb-1">
            <FiTrendingDown className="text-rose-400" />
            <span className="text-sm text-textLight">Total Spent</span>
          </div>
          <div className="text-lg font-semibold text-rose-400">
            -{formatNumber(stats.totalSpent)}
          </div>
        </div>
        
        <div className="bg-deepLapis/50 rounded-lg p-3 border border-royalGold/20">
          <div className="flex items-center gap-2 mb-1">
            <FiInfo className="text-blue-400" />
            <span className="text-sm text-textLight">Transactions</span>
          </div>
          <div className="text-lg font-semibold text-blue-400">
            {formatNumber(stats.totalTransactions)}
          </div>
        </div>
        
        <div className="bg-deepLapis/50 rounded-lg p-3 border border-royalGold/20">
          <div className="flex items-center gap-2 mb-1">
            <FiInfo className="text-amber-400" />
            <span className="text-sm text-textLight">Largest Transaction</span>
          </div>
          <div className="text-lg font-semibold text-amber-400">
            {formatNumber(stats.highestTransaction)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletDisplay;