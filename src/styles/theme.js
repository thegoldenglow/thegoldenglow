// Persian-Arabic themed color palette and design tokens
const theme = {
  colors: {
    // Primary Colors
    royalGold: '#DAA520',
    deepLapis: '#1A237E',
    mysticalPurple: '#4A148C',
    emeraldGreen: '#00695C',
    rubyRed: '#B71C1C',
    turquoise: '#00897B',
    
    // Shades of primary colors
    royalGoldLight: '#F7E7B2',
    royalGoldDark: '#A67C00',
    deepLapisLight: '#534BAE',
    deepLapisDark: '#000051',
    
    // Text Colors
    textLight: '#FFFFFF',
    textDark: '#121212',
    textGold: '#FFD700',
    
    // Utility Colors
    success: '#00695C',
    warning: '#FFC107',
    error: '#B71C1C',
    info: '#0288D1',
    
    // Background gradients
    gradientMystical: 'linear-gradient(135deg, #1A237E 0%, #4A148C 100%)',
    gradientGold: 'linear-gradient(135deg, #DAA520 0%, #FFD700 100%)',
    gradientEmerald: 'linear-gradient(135deg, #00695C 0%, #00897B 100%)'
  },
  
  // Font families
  fonts: {
    primary: "'Amiri', serif", // For Arabic/Persian stylized text
    secondary: "'Poppins', sans-serif", // For general content
    calligraphy: "'Scheherazade New', serif" // For decorative elements
  },
  
  // Border and shape styles
  borders: {
    arabesque: "url('/assets/images/arabesque-border.png')", // Border image path
    roundedSm: '0.25rem',
    roundedMd: '0.5rem',
    roundedLg: '1rem',
    roundedFull: '9999px',
  },
  
  // Spacing scale (in rems)
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  
  // Shadows for depth
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    md: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
    lg: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
    glow: '0 0 15px rgba(218,165,32,0.6)', // Gold glow effect
    mysticalGlow: '0 0 20px rgba(74,20,140,0.7)' // Purple mystical glow
  },
  
  // Animation durations
  animation: {
    fast: '0.2s',
    normal: '0.3s',
    slow: '0.5s',
    very_slow: '1s'
  },
  
  // Media breakpoints
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
  
  // Z-index scale
  zIndex: {
    base: 1,
    menu: 10,
    modal: 100,
    tooltip: 500,
  }
};

export default theme;