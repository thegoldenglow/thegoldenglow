import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const AdminSidebar = ({ isOpen, currentPath }) => {
  const { adminUser, logout } = useAdminAuth();
  
  const menuItems = [
    {
      path: '/',
      name: 'Dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      path: '/users',
      name: 'Users',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      path: '/tasks',
      name: 'Tasks',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      path: '/ads',
      name: 'Ads',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      )
    },
    {
      path: '/analytics',
      name: 'Analytics',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      path: '/system',
      name: 'System Settings',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <aside 
      className={`bg-deepLapisDark border-r border-royalGold/20 transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-20'} flex flex-col`}
    >
      {/* Logo section */}
      <div className={`flex items-center h-16 px-4 border-b border-royalGold/20 ${isOpen ? 'justify-start' : 'justify-center'}`}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-royalGold to-textGold shadow-glow flex-shrink-0"></div>
        {isOpen && (
          <div className="ml-3 overflow-hidden">
            <h1 className="text-lg font-calligraphy text-textGold tracking-wider">Golden Glow</h1>
            <p className="text-xs text-textLight/50">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 pt-5 pb-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path || 
                        (currentPath !== '/' && item.path !== '/' && currentPath.startsWith(item.path));
            
            return (
              <li key={item.path}>
                <Link 
                  to={item.path}
                  className={`group flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive 
                    ? 'bg-royalGold/10 text-textGold' 
                    : 'text-textLight/80 hover:bg-royalGold/5 hover:text-textGold'}`}
                >
                  <div className={`${isActive ? 'text-textGold' : 'text-royalGold/70 group-hover:text-textGold'}`}>
                    {item.icon}
                  </div>
                  {isOpen && <span className="ml-3 whitespace-nowrap">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User profile section */}
      <div className="p-4 border-t border-royalGold/20">
        <div className={`flex ${isOpen ? 'items-center' : 'flex-col items-center space-y-2'}`}>
          <div className="w-8 h-8 rounded-full bg-deepLapis border border-royalGold/30 flex items-center justify-center text-textGold font-medium text-sm">
            {adminUser?.username?.[0].toUpperCase() || 'A'}
          </div>
          {isOpen && (
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-textGold">{adminUser?.username || 'Admin'}</p>
              <button 
                onClick={logout}
                className="text-xs text-royalGold hover:text-royalGold/80 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
          {!isOpen && (
            <button 
              onClick={logout}
              className="text-xs text-royalGold hover:text-royalGold/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;