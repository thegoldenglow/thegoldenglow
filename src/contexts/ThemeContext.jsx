import React, { createContext, useContext, useState } from 'react';

// Theme context provides Persian-Arabic themed color palette and visual settings
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState({
    colors: {
      // Primary colors
      deepLapis: '#1A237E',      // Deep blue - primary background
      deepLapisLight: '#534BAE', // Lighter deep blue for card backgrounds
      deepLapisDark: '#000051',  // Darker deep blue for depth
      royalGold: '#DAA520',      // Golden color for accents and highlights
      royalGoldLight: '#F7E7B2', // Light gold for subtle accents
      royalGoldDark: '#A67C00',  // Dark gold for text highlights
      emeraldGreen: '#00695C',   // Success/positive color
      rubyRed: '#B71C1C',        // Error/negative color
      
      // Secondary colors
      persianBlue: '#2196F3',    // Lighter blue for secondary elements
      mysticalPurple: '#4A148C', // Deep purple for mystical elements
      persianRose: '#E91E63',    // Pinkish rose color for special elements
      turquoise: '#00897B',      // Turquoise for calm elements
      amber: '#FFC107',          // Amber for warnings/alerts
      ivory: '#FFFFF0',          // Off-white for text on dark backgrounds
      
      // Text colors
      textLight: '#FFFFFF',      // White text for dark backgrounds
      textDark: '#121212',       // Near black for light backgrounds
      textGold: '#FFD700',       // Gold for headings and important text
      
      // Gradients
      goldGradient: 'linear-gradient(135deg, #DAA520 0%, #F8D568 100%)',
      blueGradient: 'linear-gradient(135deg, #1A237E 0%, #303F9F 100%)',
      mysticalGradient: 'linear-gradient(135deg, #1A237E 0%, #4A148C 100%)'
    },
    
    // Font families
    fonts: {
      primary: "'Amiri', serif",
      secondary: "'Poppins', sans-serif",
      calligraphy: "'Scheherazade New', serif"
    },
    
    // Decorative patterns for backgrounds
    patterns: {
      default: 'bg-pattern',
      arabesque: 'bg-pattern-arabesque',
      stars: 'bg-pattern-stars'
    },
    
    // Animation definitions
    animations: {
      shimmer: 'shimmer 1.5s ease-in-out infinite',
      pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      float: 'float 3s ease-in-out infinite'
    },
    
    // Shadows
    shadows: {
      glow: '0 0 15px rgba(218, 165, 32, 0.6)',
      mysticalGlow: '0 0 20px rgba(74, 20, 140, 0.7)'
    }
  });

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;