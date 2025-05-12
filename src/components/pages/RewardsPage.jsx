import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { FiChevronLeft, FiAward, FiCreditCard, FiActivity } from 'react-icons/fi';

// Import reward components
import DailyLoginCalendar from '../rewards/DailyLoginCalendar';
import WheelOfDestiny from '../rewards/WheelOfDestiny';
import WalletDisplay from '../rewards/WalletDisplay';
import TransactionHistory from '../rewards/TransactionHistory';

const RewardsPage = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  if (!user) {
    return (
      <div className="text-center py-10">
        <p className="text-textLight mb-4">Please log in to view your rewards.</p>
        <Link to="/" className="px-4 py-2 bg-royalGold text-deepLapis rounded hover:bg-royalGold/80">
          Go to Home
        </Link>
      </div>
    );
  }
  
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <FiAward /> },
    { id: 'daily', label: 'Daily Rewards', icon: <FiActivity /> },
    { id: 'wheel', label: 'Wheel of Destiny', icon: <FiAward /> },
    { id: 'wallet', label: 'Wallet', icon: <FiCreditCard /> }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Link to="/" className="flex items-center text-royalGold hover:text-royalGold/80 transition">
          <FiChevronLeft className="mr-1" /> Back to Home
        </Link>
        
        <div>
          <span className="text-textLight mr-2">Balance:</span>
          <span className="text-credits font-bold">{user.points || 0} GC</span>
        </div>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-primary text-textGold mb-2">Rewards & Golden Credits</h1>
        <p className="text-textLight">Earn rewards, track your progress and manage your Golden Credits</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto mb-6 pb-1 hide-scrollbar">
        <div className="flex space-x-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md whitespace-nowrap flex items-center ${
                activeTab === tab.id
                  ? 'bg-royalGold text-deepLapis font-medium shadow-glow'
                  : 'bg-deepLapisDark text-textLight hover:bg-deepLapisDark/70'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="bg-pattern-arabesque">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left side */}
            <div>
              <WalletDisplay />
              <DailyLoginCalendar />
            </div>
            
            {/* Right side */}
            <div>
              <WheelOfDestiny />
            </div>
          </div>
        )}
        
        {/* Daily Rewards Tab */}
        {activeTab === 'daily' && (
          <DailyLoginCalendar />
        )}
        
        {/* Wheel of Destiny Tab */}
        {activeTab === 'wheel' && (
          <div className="max-w-lg mx-auto">
            <WheelOfDestiny />
          </div>
        )}
        
        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            <WalletDisplay />
            <TransactionHistory />
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsPage;