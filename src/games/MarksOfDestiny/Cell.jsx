import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

// Cell variants for animation
const cellVariants = {
  initial: {
    opacity: 0,
    scale: 0.8
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 15
    }
  },
  hover: {
    scale: 1.05,
    boxShadow: "0 0 10px rgba(218, 165, 32, 0.5)",
    transition: {
      duration: 0.2
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  },
  winning: {
    backgroundColor: "rgba(218, 165, 32, 0.3)",
    boxShadow: "0 0 15px rgba(218, 165, 32, 0.7)",
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatType: "reverse"
    }
  }
};

// Symbol variants
const symbolVariants = {
  initial: {
    opacity: 0,
    scale: 0.5,
    rotate: -20
  },
  animate: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 10
    }
  }
};

const Cell = ({ value, onClick, isWinning = false }) => {
  // Use animation controls for better control over animations
  const cellControls = useAnimation();
  const symbolControls = useAnimation();
  
  // Cleanup and reset animations when component updates
  useEffect(() => {
    // Initialize cell animation
    cellControls.start("animate")
      .then(() => {
        // After initial animation, apply winning animation if needed
        if (isWinning) {
          cellControls.start("winning");
        }
      });
      
    // Cleanup function to stop any ongoing animations
    return () => {
      cellControls.stop();
      symbolControls.stop();
    };
  }, [isWinning, value, cellControls, symbolControls]);
  
  // Effect to animate the symbol when value changes
  useEffect(() => {
    if (value) {
      symbolControls.start("animate");
    }
  }, [value, symbolControls]);
  
  // Render the cell with the appropriate symbol
  const renderCellContent = () => {
    if (!value) return null;

    // Create unique, stable keys based on cell position rather than using dynamic keys
    // This prevents React from preserving animations when symbols change or
    // reusing DOM elements in ways that can cause visual artifacts
    
    // Sun symbol (X)
    if (value === 'X') {
      return (
        <motion.div
          className="w-14 h-14 flex items-center justify-center"
          variants={symbolVariants}
          initial="initial"
          animate={symbolControls}
          exit={{ opacity: 0, scale: 0 }} // Add exit animation
          key={`sun-symbol-${value}`} // Stable key based on value
          onAnimationComplete={() => {
            // Ensure animation cleanly completes
            symbolControls.set({ opacity: 1, scale: 1, rotate: 0 });
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" className="text-royalGold">
            <circle cx="12" cy="12" r="7" fill="currentColor" />
            <g stroke="currentColor" strokeWidth="1.5">
              <line x1="12" y1="2" x2="12" y2="4" />
              <line x1="12" y1="20" x2="12" y2="22" />
              <line x1="2" y1="12" x2="4" y2="12" />
              <line x1="20" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
              <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
              <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
              <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
            </g>
          </svg>
        </motion.div>
      );
    }

    // Moon symbol (O)
    return (
      <motion.div
        className="w-14 h-14 flex items-center justify-center"
        variants={symbolVariants}
        initial="initial"
        animate={symbolControls}
        exit={{ opacity: 0, scale: 0 }} // Add exit animation
        key={`moon-symbol-${value}`} // Stable key based on value
        onAnimationComplete={() => {
          // Ensure animation cleanly completes
          symbolControls.set({ opacity: 1, scale: 1, rotate: 0 });
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" className="text-mysticalPurple">
          <path
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
            fill="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </motion.div>
    );
  };

  return (
    <motion.div
      className={`
        w-full aspect-square flex items-center justify-center 
        rounded-lg cursor-pointer bg-deepLapis
        ${value ? 'cursor-default' : 'hover:bg-deepLapisLight/40'} 
        ${isWinning ? 'border-2 border-royalGold' : 'border border-royalGold/30'}
      `}
      variants={cellVariants}
      initial="initial"
      animate={cellControls}
      whileHover={!value ? "hover" : undefined}
      whileTap={!value ? "tap" : undefined}
      onClick={onClick}
      onAnimationComplete={() => {
        // Ensure animations don't get stuck by explicitly ending them
        if (!isWinning) {
          cellControls.stop();
        }
      }}
    >
      {renderCellContent()}
    </motion.div>
  );
};

export default Cell;