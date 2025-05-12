import React from 'react';
import { motion } from 'framer-motion';

// Tile colors based on values - Persian-themed color palette
const getTileStyle = (value) => {
  const styles = {
    2: {
      background: '#EAECD9', // Light sand
      text: '#796132',       // Dark bronze
      pattern: 'simple-dot'  // Simple pattern
    },
    4: {
      background: '#D5B469', // Light gold
      text: '#4F3A1F',       // Dark brown
      pattern: 'hexagon'
    },
    8: {
      background: '#D98656', // Terracotta
      text: '#FFFFFF',       // White
      pattern: 'triangle'
    },
    16: {
      background: '#B85D3C', // Rust
      text: '#FFFFFF',
      pattern: 'diamond'
    },
    32: {
      background: '#AF4034', // Persian Red
      text: '#FFFFFF',
      pattern: 'circle-square'
    },
    64: {
      background: '#4A5E7B', // Persian Blue
      text: '#FFFFFF',
      pattern: 'star-6'
    },
    128: {
      background: '#386FA4', // Royal Blue
      text: '#FFFFFF',
      pattern: 'flower'
    },
    256: {
      background: '#1E5096', // Deep Blue
      text: '#FFFFFF',
      pattern: 'octagon'
    },
    512: {
      background: '#5B3B8C', // Purple
      text: '#FFFFFF',
      pattern: 'star-8'
    },
    1024: {
      background: '#7854A4', // Royal Purple
      text: '#FFFFFF',
      pattern: 'complex'
    },
    2048: {
      background: '#DAA520', // Golden
      text: '#FFFFFF',
      pattern: 'enlightenment'
    }
  };
  
  // For values beyond 2048, use golden styles with more intensity
  if (value > 2048) {
    return {
      background: 'linear-gradient(135deg, #DAA520 0%, #FFD700 100%)',
      text: '#FFFFFF',
      pattern: 'enlightenment',
      boxShadow: '0 0 15px rgba(255, 215, 0, 0.7)'
    };
  }
  
  return {
    background: styles[value]?.background || '#DAA520',
    text: styles[value]?.text || '#FFFFFF',
    pattern: styles[value]?.pattern || 'simple'
  };
};

// SVG patterns based on Persian geometric art
const renderPattern = (pattern, value) => {
  // Base pattern style
  const baseStyle = {
    opacity: 0.2,
    stroke: getTileStyle(value).text,
    fill: 'none',
    strokeWidth: 1
  };
  
  switch (pattern) {
    case 'simple-dot':
      return (
        <circle cx="50%" cy="50%" r="10%" style={baseStyle} />
      );
    case 'hexagon':
      return (
        <polygon 
          points="50,15 85,35 85,75 50,95 15,75 15,35" 
          style={baseStyle} 
        />
      );
    case 'triangle':
      return (
        <polygon 
          points="50,15 85,85 15,85" 
          style={baseStyle} 
        />
      );
    case 'diamond':
      return (
        <polygon 
          points="50,15 85,50 50,85 15,50" 
          style={baseStyle} 
        />
      );
    case 'circle-square':
      return (
        <>
          <rect x="20" y="20" width="60" height="60" style={baseStyle} />
          <circle cx="50%" cy="50%" r="30%" style={baseStyle} />
        </>
      );
    case 'star-6':
      // Six-pointed star (Star of David) - common in Persian art
      return (
        <>
          <polygon 
            points="50,15 65,40 90,40 70,60 80,90 50,70 20,90 30,60 10,40 35,40" 
            style={baseStyle} 
          />
          <circle cx="50%" cy="50%" r="5%" style={{...baseStyle, fill: baseStyle.stroke}} />
        </>
      );
    case 'flower':
      // Stylized flower pattern
      return (
        <>
          <circle cx="50%" cy="50%" r="20%" style={baseStyle} />
          <circle cx="50%" cy="20%" r="15%" style={baseStyle} />
          <circle cx="80%" cy="50%" r="15%" style={baseStyle} />
          <circle cx="50%" cy="80%" r="15%" style={baseStyle} />
          <circle cx="20%" cy="50%" r="15%" style={baseStyle} />
        </>
      );
    case 'octagon':
      // Eight-sided shape
      return (
        <polygon 
          points="30,15 70,15 85,30 85,70 70,85 30,85 15,70 15,30" 
          style={baseStyle} 
        />
      );
    case 'star-8':
      // Eight-pointed star - common in Islamic art
      return (
        <polygon 
          points="50,10 61,30 85,30 70,50 85,70 61,70 50,90 39,70 15,70 30,50 15,30 39,30" 
          style={baseStyle} 
        />
      );
    case 'complex':
      // More complex geometric pattern
      return (
        <>
          <circle cx="50%" cy="50%" r="35%" style={baseStyle} />
          <polygon 
            points="50,15 85,50 50,85 15,50" 
            style={baseStyle} 
          />
          <circle cx="50%" cy="50%" r="15%" style={baseStyle} />
        </>
      );
    case 'enlightenment':
      // Enlightenment symbol - more complex and prominent
      return (
        <>
          <circle cx="50%" cy="50%" r="35%" style={{...baseStyle, opacity: 0.3}} />
          <circle cx="50%" cy="50%" r="25%" style={{...baseStyle, opacity: 0.3}} />
          <polygon 
            points="50,15 61,40 85,40 65,55 75,80 50,65 25,80 35,55 15,40 39,40" 
            style={{...baseStyle, opacity: 0.4}}
          />
          <circle cx="50%" cy="50%" r="10%" style={{...baseStyle, fill: baseStyle.stroke, opacity: 0.5}} />
        </>
      );
    default:
      return null;
  }
};

const Tile = ({ value, x, y, isNew, merged }) => {
  const style = getTileStyle(value);
  const pattern = style.pattern;
  
  // Animation variants
  const variants = {
    new: {
      scale: [0, 1.1, 1],
      opacity: [0, 1],
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    merge: {
      scale: [1, 1.15, 1],
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    normal: {
      scale: 1,
      opacity: 1
    }
  };
  
  return (
    <motion.div
      className="absolute rounded-md flex items-center justify-center overflow-hidden"
      style={{
        width: `calc(25% - 12px)`,
        height: `calc(25% - 12px)`,
        left: `calc(25% * ${x} + 6px)`,
        top: `calc(25% * ${y} + 6px)`,
        background: style.background,
        color: style.text,
        boxShadow: style.boxShadow || (value >= 128 ? '0 0 10px rgba(0, 0, 0, 0.1)' : 'none'),
        zIndex: value
      }}
      initial={isNew ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
      animate={isNew ? "new" : merged ? "merge" : "normal"}
      variants={variants}
    >
      {/* Pattern background */}
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {renderPattern(pattern, value)}
      </svg>
      
      {/* Tile value */}
      <span 
        className={`
          font-bold z-10 relative
          ${value < 100 ? 'text-2xl' : value < 1000 ? 'text-xl' : 'text-lg'}
        `}
      >
        {value}
      </span>
    </motion.div>
  );
};

export default Tile;