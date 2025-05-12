import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../atoms/Icon';

// Navigation items
const navItems = [
  { id: 'home', label: 'Home', icon: 'home', path: '/' },
  { id: 'profile', label: 'Profile', icon: 'profile', path: '/profile' },
  { id: 'wisdom', label: 'Wisdom', icon: 'wisdom', path: '/wisdom' },
  { id: 'rewards', label: 'Rewards', icon: 'coin', path: '/rewards' },
];

// Animation variants
const navVariants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.3,
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const itemVariants = {
  inactive: {
    color: "#ffffff",
    scale: 1
  },
  active: {
    color: "#DAA520",
    scale: 1.1,
    transition: {
      duration: 0.2,
      type: "spring",
      stiffness: 300
    }
  }
};

const glowVariants = {
  inactive: {
    opacity: 0,
    scale: 0.95
  },
  active: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2
    }
  }
};

const NavigationBar = () => {
  const location = useLocation();
  
  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 bg-deepLapis border-t-2 border-royalGold z-20"
      variants={navVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex justify-around items-center px-2 py-2">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          
          return (
            <Link to={item.path} key={item.id} className="relative">
              <motion.div
                className="flex flex-col items-center py-2 px-4 relative z-10"
                variants={itemVariants}
                animate={isActive ? "active" : "inactive"}
              >
                <Icon name={item.icon} size={24} animate={false} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
                
                {/* Active indicator - Glow effect */}
                <motion.div
                  className="absolute -top-1 -bottom-1 -left-1 -right-1 rounded-md bg-royalGold/20"
                  variants={glowVariants}
                  animate={isActive ? "active" : "inactive"}
                  layoutId="navGlow"
                />
              </motion.div>
              
              {/* Gold dot for active item */}
              {isActive && (
                <motion.div 
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-royalGold rounded-full"
                  layoutId="navDot"
                />
              )}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default NavigationBar;