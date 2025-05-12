import React from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const AdminHeader = ({ toggleSidebar }) => {
  const { adminUser } = useAdminAuth();
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <header className="bg-deepLapisDark border-b border-royalGold/20 shadow-sm h-16 flex items-center px-4">
      {/* Sidebar toggle button */}
      <button
        onClick={toggleSidebar}
        className="p-1.5 mr-4 rounded-md text-royalGold hover:bg-royalGold/10 focus:outline-none focus:ring-1 focus:ring-royalGold/50 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      {/* Date display */}
      <div className="hidden md:block">
        <p className="text-sm text-textLight/60">{currentDate}</p>
      </div>
      
      {/* Spacer */}
      <div className="flex-1"></div>
      
      {/* Right side actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="relative p-1.5 rounded-md text-royalGold hover:bg-royalGold/10 focus:outline-none focus:ring-1 focus:ring-royalGold/50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          
          {/* Notification badge */}
          <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-rubyRed flex items-center justify-center text-xs text-white font-bold">3</span>
        </button>
        
        {/* Quick settings */}
        <button className="p-1.5 rounded-md text-royalGold hover:bg-royalGold/10 focus:outline-none focus:ring-1 focus:ring-royalGold/50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        
        {/* User profile - only shows on smaller viewports as sidebar collapses */}
        <div className="md:hidden flex items-center">
          <div className="w-8 h-8 rounded-full bg-mysticalPurple/30 flex items-center justify-center overflow-hidden"> 
            <span className="text-textGold font-medium">{adminUser?.username?.[0].toUpperCase() || 'A'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;