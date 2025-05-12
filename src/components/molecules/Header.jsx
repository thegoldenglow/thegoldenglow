import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';

const Header = ({ userName, userPoints, userLevel }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  // Animation variants
  const headerVariants = {
    initial: { y: -20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { 
        duration: 0.5,
        ease: "easeOut" 
      }
    }
  };
  
  const glowVariants = {
    initial: { opacity: 0.5 },
    animate: { 
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  };

  // Decorative pattern animation
  const patternVariants = {
    initial: { opacity: 0.1 },
    animate: { 
      opacity: [0.1, 0.18, 0.1], 
      transition: {
        duration: 5,
        repeat: Infinity,
        repeatType: "reverse"
      } 
    }
  };

  return (
    <motion.header
      className="relative px-4 py-4 bg-deepLapisDark bg-pattern-arabesque shadow-lg z-10"
      variants={headerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Background pattern animation */}
      <motion.div 
        className="absolute inset-0 bg-pattern-stars pointer-events-none z-0"
        variants={patternVariants}
        initial="initial"
        animate="animate"
      />
      
      {/* Golden border at the bottom of the header */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-gold shadow-glow z-20" />
      
      {/* Golden glow effect at the bottom of the header */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-royalGold/0 via-royalGold/80 to-royalGold/0"
        variants={glowVariants}
        initial="initial"
        animate="animate"
      />
      
      <div className="container mx-auto flex flex-wrap items-center justify-between relative z-10">
        {/* Logo and title section */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center group">
            <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center mr-3 shadow-glow group-hover:scale-110 transition-transform duration-300">
              <Icon name="flame" size={24} color="#1A237E" className="group-hover:animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-textGold font-primary tracking-wide shimmer">
                Golden Glow
              </h1>
              <p className="text-xs text-royalGoldLight/80 font-calligraphy">The Path of Enlightenment</p>
            </div>
          </Link>
        </div>
        
        {/* User info section */}
        {userName && (
          <div className="flex items-center space-x-3">
            {/* Wisdom points display */}
            <div className="hidden sm:flex items-center bg-deepLapis/70 backdrop-blur-sm rounded-full px-4 py-2 border border-royalGold/30 shadow-glow">
              <Icon name="wisdom" size={18} color="#FFD700" className="mr-2 shimmer" />
              <span className="text-textGold font-medium">{userPoints || 0} <span className="text-xs text-royalGoldLight/80">points</span></span>
            </div>
            
            {/* Level display */}
            <div className="hidden sm:flex items-center bg-deepLapis/70 backdrop-blur-sm rounded-full px-4 py-2 border border-royalGold/30 shadow-glow">
              <Icon name="star" size={18} color="#FFD700" className="mr-2 shimmer" />
              <span className="text-textGold font-medium">Level {userLevel || 1}</span>
            </div>
            
            {/* User profile button */}
            <Link to="/profile">
              <Button 
                variant="secondary" 
                size="md" 
                className="flex items-center shadow-glow bg-gradient-gold border-royalGoldLight/50 hover:bg-royalGoldLight hover:text-deepLapis transition-colors duration-300"
                icon={<Icon name="profile" size={18} />}
                iconPosition="left"
              >
                {userName}
              </Button>
            </Link>
          </div>
        )}
        
        {/* Show back button if not on home page */}
        {!isHomePage && (
          <Link to="/" className="sm:hidden">
            <Button 
              variant="outline" 
              size="md"
              className="border-royalGold/60 text-royalGold hover:bg-royalGold/20 transition-colors duration-300"
              icon={<Icon name="arrow" size={18} />}
            >
              Back
            </Button>
          </Link>
        )}
      </div>
    </motion.header>
  );
};

export default Header;