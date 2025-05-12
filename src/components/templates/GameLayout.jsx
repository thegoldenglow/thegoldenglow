import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from '../atoms/Icon';

const GameLayout = ({ 
  children, 
  title, 
  gameType, 
  onBackClick,
  backgroundPattern = "geometric"
}) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  // Handle back button if not provided
  const handleBack = onBackClick || (() => navigate('/'));
  
  // Get icon for game type
  const getGameTypeIcon = () => {
    switch(gameType) {
      case 'strategy': return 'game';
      case 'puzzle': return 'puzzle';
      case 'rhythm': return 'music';
      case 'clicker': return 'flame';
      case 'quiz': return 'book';
      case 'journey': return 'map';
      default: return 'game';
    }
  };
  
  // Get background pattern
  const getBackgroundPattern = () => {
    return theme.patterns[backgroundPattern] || theme.patterns.geometric;
  };
  
  return (
    <div className="h-screen max-h-screen text-white overflow-hidden flex flex-col relative">
      {/* Background decorative pattern - REMOVED to show main app background */}
      {/* 
      <div 
        className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none"
        style={{
          backgroundImage: getBackgroundPattern(),
          backgroundSize: '400px',
          backgroundRepeat: 'repeat'
        }}
      />
      */}
      
      {/* Game header */}
      <header className="flex-shrink-0 z-10 backdrop-filter backdrop-blur-md border-b border-royalGold/30">
        <div className="px-4 py-3 flex justify-between items-center" data-component-name="GameLayout">
          <button 
            onClick={handleBack}
            className="w-8 h-8 rounded-full flex items-center justify-center"
          >
            <Icon name="arrow-left" color="#FFFFFF" size={16} />
          </button>
          
          <h1 className="text-lg font-primary text-royalGold flex items-center">
            <Icon name={getGameTypeIcon()} color="#DAA520" size={18} className="mr-2" />
            {title}
          </h1>
          
          <div className="w-8"></div> {/* Spacer for alignment */}
        </div>
      </header>
      
      {/* Game content */}
      <main className="flex-grow py-3 px-3 overflow-hidden" data-component-name="GameLayout">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="h-full flex flex-col"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default GameLayout;