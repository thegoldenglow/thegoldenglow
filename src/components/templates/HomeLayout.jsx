import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import Icon from '../atoms/Icon';

const HomeLayout = ({ children }) => {
  const { theme } = useTheme();
  const { user } = useUser();
  
  return (
    <div className="min-h-screen text-white relative overflow-y-auto">
      {/* Background decorative elements - REMOVED */}
      {/*
      <div 
        className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none"
        style={{
          backgroundImage: theme.patterns.stars,
          backgroundSize: '400px',
          backgroundRepeat: 'repeat'
        }}
      />
      */}
      
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-filter backdrop-blur-md border-b border-royalGold/30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center" data-component-name="HomeLayout">
          <Link to="/" className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-royalGold flex items-center justify-center mr-2">
              <span className="text-deepLapis text-sm font-bold">GG</span>
            </div>
            <span className="text-lg font-primary text-royalGold">Golden Glow</span>
          </Link>
          
          <div className="flex items-center">
            {user && (
              <div className="flex items-center mr-2">
                <Icon name="wisdom" color="#DAA520" size={16} className="mr-1" />
                <span className="text-royalGold font-medium">{user.points}</span>
              </div>
            )}
            
            <Link to="/profile" className="p-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center">
                <Icon name="user" color="#FFFFFF" size={16} />
              </div>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main>
        {children}
      </main>
      
      {/* Navigation footer */}
      <footer className="backdrop-filter backdrop-blur-md border-t border-royalGold/30 py-3 px-4" data-component-name="HomeLayout">
        <div className="max-w-4xl mx-auto flex justify-between">
          <motion.div 
            className="flex items-center space-x-6 mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/" className="text-center">
              <div className="w-10 h-10 rounded-full hover:bg-royalGold/20 flex items-center justify-center mx-auto mb-1 transition-colors">
                <Icon name="home" color="#FFFFFF" size={20} />
              </div>
              <span className="text-white/70 text-xs">Home</span>
            </Link>
            
            <Link to="/daily-tasks" className="text-center">
              <div className="w-10 h-10 rounded-full hover:bg-royalGold/20 flex items-center justify-center mx-auto mb-1 transition-colors">
                <Icon name="star" color="#FFFFFF" size={20} />
              </div>
              <span className="text-white/70 text-xs">Daily Tasks</span>
            </Link>
            
            <Link to="/profile" className="text-center">
              <div className="w-10 h-10 rounded-full hover:bg-royalGold/20 flex items-center justify-center mx-auto mb-1 transition-colors">
                <Icon name="user" color="#FFFFFF" size={20} />
              </div>
              <span className="text-white/70 text-xs">Profile</span>
            </Link>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default HomeLayout;