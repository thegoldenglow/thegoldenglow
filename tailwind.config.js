/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary colors
        royalGold: '#DAA520',
        deepLapis: '#1A237E',
        mysticalPurple: '#4A148C',
        emeraldGreen: '#00695C',
        rubyRed: '#B71C1C',
        turquoise: '#00897B',
        persianBlue: '#2196F3',
        persianRose: '#E91E63',
        amber: '#FFC107',
        ivory: '#FFFFF0',
        
        // Shades
        royalGoldLight: '#F7E7B2',
        royalGoldDark: '#A67C00',
        deepLapisLight: '#534BAE',
        deepLapisDark: '#000051',
        
        // Text colors
        textLight: '#FFFFFF',
        textDark: '#121212',
        textGold: '#FFD700',
        
        // Mystical Colors
        mysticPurple: {
          DEFAULT: '#6A0DAD', // A deep purple
          light: '#8A2BE2',  // Lighter purple (BlueViolet)
          dark: '#4B0082',   // Darker purple (Indigo)
          '700': '#5A009A',
          '900': '#3D006F',
        },
        arcaneIndigo: {
          DEFAULT: '#4B0082', // Indigo
          light: '#6A5ACD',  // SlateBlue
          dark: '#3A006A',
        },
        ethericBlue: {
          DEFAULT: '#0077BE', // A celestial blue
          light: '#50A6D3',
          dark: '#00558B',
        },
        ancientGold: {
          DEFAULT: '#B8860B', // DarkGoldenRod
          light: '#D4AF37',  // More like an old gold
          dark: '#8B4513',   // SaddleBrown (can look like very old, tarnished gold)
        },
      },
      backgroundColor: {
        overlay: 'rgba(26, 35, 126, 0.85)',
      },
      fontFamily: {
        primary: ["'Cinzel'", "'Amiri'", "'serif'"],
        secondary: ["'Philosopher'", "'Poppins'", "'sans-serif'"],
        calligraphy: ["'Scheherazade New'", "'serif'"],
        mysticDisplay: ["'Cinzel'", "'serif'"],
        mysticBody: ["'Philosopher'", "'sans-serif'"],
      },
      backgroundImage: {
        'gradient-mystical': 'linear-gradient(135deg, #1A237E 0%, #4A148C 100%)',
        'gradient-gold': 'linear-gradient(135deg, #DAA520 0%, #FFD700 100%)',
        'gradient-emerald': 'linear-gradient(135deg, #00695C 0%, #00897B 100%)',
      },
      keyframes: {
        'wheel-flare': {
          '0%, 100%': { boxShadow: '0 0 20px 5px rgba(106, 13, 173, 0.3), 0 0 10px 2px rgba(138, 43, 226, 0.2)' }, // mysticPurple tones
          '50%': { boxShadow: '0 0 30px 10px rgba(106, 13, 173, 0.5), 0 0 15px 5px rgba(138, 43, 226, 0.4)' },    // mysticPurple tones, more intense
        },
      },
      boxShadow: {
        'glow': '0 0 15px rgba(218, 165, 32, 0.6)',
        'mystical-glow': '0 0 20px rgba(170, 120, 255, 0.4), 0 0 8px rgba(220, 180, 255, 0.6), inset 0 0 10px rgba(170, 120, 255, 0.3)',
        'mystic-glow': '0 0 20px 7px rgba(170, 120, 255, 0.4), 0 0 8px 2px rgba(220, 180, 255, 0.6), inset 0 0 10px 3px rgba(170, 120, 255, 0.3)',
      },
    },
  },
  plugins: [],
};
