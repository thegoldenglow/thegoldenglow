import React from 'react';
import { motion } from 'framer-motion';

const TapCircle = ({ circle, onTap }) => {
  const { id, x, y, size, type, tapped, tapQuality, speedMultiplier = 1 } = circle;
  
  // Determine circle colors based on type and state
  const getCircleColors = () => {
    if (tapped) {
      // Tapped circle colors based on tap quality
      switch (tapQuality) {
        case 'perfect':
          return {
            outer: '#00C853', // Green
            middle: '#69F0AE',
            inner: '#B9F6CA',
            glow: 'rgba(0, 200, 83, 0.7)'
          };
        case 'good':
          return {
            outer: '#FFC107', // Amber
            middle: '#FFD54F',
            inner: '#FFECB3',
            glow: 'rgba(255, 193, 7, 0.7)'
          };
        case 'early':
          return {
            outer: '#FF5722', // Orange
            middle: '#FF8A65',
            inner: '#FFCCBC',
            glow: 'rgba(255, 87, 34, 0.7)'
          };
        default:
          return {
            outer: '#BDBDBD', // Gray
            middle: '#E0E0E0',
            inner: '#F5F5F5',
            glow: 'rgba(189, 189, 189, 0.5)'
          };
      }
    } else if (type === 'golden') {
      // Golden circle
      return {
        outer: '#DAA520', // Gold
        middle: '#FFD700',
        inner: '#FFECB3',
        glow: 'rgba(218, 165, 32, 0.7)'
      };
    } else {
      // Regular circle
      return {
        outer: '#4A148C', // Deep Purple
        middle: '#7B1FA2',
        inner: '#D1C4E9',
        glow: 'rgba(74, 20, 140, 0.5)'
      };
    }
  };
  
  const colors = getCircleColors();
  
  // Animation variants - adjust speed based on the speedMultiplier
  const circleVariants = {
    initial: {
      opacity: 0,
      scale: 0.5,
    },
    animate: {
      opacity: 1,
      scale: [0.9, 1.05, 0.95, 1],
      transition: {
        duration: 0.5 / (speedMultiplier || 1),
        ease: "easeOut"
      }
    },
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [0.9, 1, 0.9],
      boxShadow: [
        `0 0 10px ${colors.glow}`,
        `0 0 25px ${colors.glow}`,
        `0 0 10px ${colors.glow}`,
      ],
      transition: {
        duration: 1.5 / (speedMultiplier || 1),
        repeat: Infinity,
        repeatType: "reverse"
      }
    },
    tap: {
      scale: [1, 1.5],
      opacity: [1, 0],
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };
  
  // Special decorative elements for the circle
  const renderCircleDetails = () => {
    if (type === 'golden') {
      // Golden circle has more detailed pattern
      return (
        <>
          <circle 
            cx="50%" 
            cy="50%" 
            r="30%" 
            stroke={colors.inner} 
            fill="none" 
            strokeWidth="2"
            strokeDasharray="5,3" 
          />
          <polygon 
            points="50,30 55,45 70,45 60,55 65,70 50,60 35,70 40,55 30,45 45,45" 
            stroke={colors.inner}
            fill="none"
            strokeWidth="1.5"
          />
        </>
      );
    } else {
      // Regular circle has simpler pattern
      return (
        <>
          <circle 
            cx="50%" 
            cy="50%" 
            r="25%" 
            stroke={colors.inner} 
            fill="none" 
            strokeWidth="1.5" 
          />
          <circle 
            cx="50%" 
            cy="50%" 
            r="40%" 
            stroke={colors.inner} 
            fill="none" 
            strokeWidth="1" 
            strokeDasharray="3,3" 
          />
        </>
      );
    }
  };
  
  // Render a feedback message based on tap quality
  const renderTapFeedback = () => {
    if (!tapped) return null;
    
    let message = '';
    let color = '';
    
    switch (tapQuality) {
      case 'perfect':
        message = 'Perfect!';
        color = '#00C853';
        break;
      case 'good':
        message = 'Good';
        color = '#FFC107';
        break;
      case 'early':
        message = 'Early';
        color = '#FF5722';
        break;
      default:
        return null;
    }
    
    return (
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-bold text-lg"
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: -20 }}
        exit={{ opacity: 0 }}
        style={{ color }}
      >
        {message}
      </motion.div>
    );
  };
  
  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: x - size/2,
        top: y - size/2,
        width: size,
        height: size
      }}
      variants={circleVariants}
      initial="initial"
      animate={tapped ? "tap" : ["animate", "pulse"]}
      exit={{ opacity: 0, scale: 0.5 }}
      onClick={() => !tapped && onTap(id)}
    >
      {/* Outer glow */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{ 
          boxShadow: `0 0 15px ${colors.glow}`,
          background: `radial-gradient(circle, ${colors.outer}40 0%, transparent 70%)`,
        }}
      />
      
      {/* Circle layers */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{ 
          background: `radial-gradient(circle, ${colors.inner} 0%, ${colors.middle} 50%, ${colors.outer} 100%)`
        }}
      />
      
      {/* Decorative patterns */}
      <svg 
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        style={{ opacity: 0.7 }}
      >
        {renderCircleDetails()}
      </svg>
      
      {/* Tap feedback */}
      {renderTapFeedback()}
    </motion.div>
  );
};

export default TapCircle;