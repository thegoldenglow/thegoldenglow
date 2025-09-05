// src/utils/animations.js
import { keyframes } from '@emotion/react';

/**
 * Animation utility functions and configurations for Golden Glow app
 * Enhanced with mystical Persian-Arabic inspired effects
 */

// Keyframes for common animations
export const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

export const slideUp = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

export const slideDown = keyframes`
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

export const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

export const glowPulse = keyframes`
  0% {
    box-shadow: 0 0 8px rgba(218, 165, 32, 0.5), 0 0 15px rgba(255, 215, 0, 0.3);
    text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(218, 165, 32, 0.8), 0 0 30px rgba(255, 215, 0, 0.5);
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
  }
  100% {
    box-shadow: 0 0 8px rgba(218, 165, 32, 0.5), 0 0 15px rgba(255, 215, 0, 0.3);
    text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
  }
`;

export const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Animation variants for Framer Motion
export const animationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 },
  },
  slideDown: {
    initial: { y: -20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  },
  slideLeft: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
  },
  slideRight: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
  },
  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
  },
  scaleDown: {
    initial: { scale: 1.1, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.1, opacity: 0 },
  },
};

// Animation transitions for Framer Motion
export const animationTransitions = {
  default: { 
    duration: 0.3,
    ease: "easeInOut" 
  },
  slow: { 
    duration: 0.5,
    ease: "easeInOut" 
  },
  fast: { 
    duration: 0.2, 
    ease: "easeInOut" 
  },
  bounce: {
    type: "spring",
    stiffness: 300,
    damping: 10
  },
  gentle: {
    type: "spring",
    stiffness: 100,
    damping: 15
  }
};

// Staggered animation for lists/grids
export const staggeredAnimation = (staggerTime = 0.1) => ({
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { 
      staggerChildren: staggerTime 
    }
  },
  exit: { 
    opacity: 0,
    transition: { 
      staggerChildren: staggerTime / 2,
      staggerDirection: -1 
    }
  }
});

// Shimmer loading animation for placeholder content
export const shimmerAnimation = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

// Persian style reveal animation (calligraphic style)
export const persianReveal = keyframes`
  0% {
    clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%);
    opacity: 0;
    filter: blur(5px);
  }
  50% {
    opacity: 0.7;
    filter: blur(3px);
  }
  100% {
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
    opacity: 1;
    filter: blur(0);
  }
`;

// Golden glow appear animation
export const goldenGlowAppear = keyframes`
  0% {
    opacity: 0;
    filter: blur(10px) brightness(1.5);
    transform: scale(0.95);
  }
  50% {
    filter: blur(5px) brightness(2);
  }
  100% {
    opacity: 1;
    filter: blur(0px) brightness(1);
    transform: scale(1);
  }
`;

// Utility function for delayed animation sequences
export const createSequencedAnimations = (animations, baseDelay = 0.1) => {
  return animations.map((animation, index) => ({
    ...animation,
    transition: {
      ...animation.transition,
      delay: baseDelay * index
    }
  }));
};

// Mystical symbols appear animation
export const mysticalSymbolsAppear = keyframes`
  0% {
    transform: scale(0.5) rotate(-10deg);
    opacity: 0;
    filter: blur(4px) brightness(1.5);
    text-shadow: 0 0 10px gold, 0 0 20px rgba(255, 215, 0, 0.8);
  }
  60% {
    transform: scale(1.2) rotate(5deg);
    filter: blur(1px) brightness(1.8);
    text-shadow: 0 0 20px gold, 0 0 30px rgba(255, 215, 0, 0.9);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
    filter: blur(0px) brightness(1.2);
    text-shadow: 0 0 5px gold, 0 0 10px rgba(255, 215, 0, 0.7);
  }
`;

// For particle effects in Flame of Wisdom game
export const particleRise = keyframes`
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
    filter: blur(0px) brightness(1);
  }
  50% {
    transform: translateY(-50px) scale(1.2) rotate(5deg);
    opacity: 0.7;
    filter: blur(2px) brightness(1.5);
  }
  100% {
    transform: translateY(-100px) scale(0) rotate(10deg);
    opacity: 0;
    filter: blur(4px) brightness(0.8);
  }
`;

// Calligraphic text reveal animation
export const calligraphicReveal = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.8) skewX(10deg);
    filter: blur(8px);
    text-shadow: 0 0 0px gold;
  }
  30% {
    opacity: 0.4;
    transform: scale(1.1) skewX(-5deg);
    filter: blur(4px);
    text-shadow: 0 0 10px gold, 0 0 20px rgba(255, 215, 0, 0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1) skewX(0deg);
    filter: blur(0);
    text-shadow: 0 0 5px gold, 0 0 10px rgba(255, 215, 0, 0.3);
  }
`;

// Magic burst animation
export const magicBurst = keyframes`
  0% {
    transform: scale(0);
    opacity: 0;
    filter: blur(20px) brightness(2);
    box-shadow: 0 0 0 rgba(255, 215, 0, 0);
  }
  50% {
    opacity: 0.8;
    filter: blur(10px) brightness(3);
    box-shadow: 0 0 50px rgba(255, 215, 0, 0.8), 0 0 100px rgba(255, 165, 0, 0.5);
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
    filter: blur(0px) brightness(1);
    box-shadow: 0 0 0 rgba(255, 215, 0, 0);
  }
`;

// Mystical floating effect
export const mysticalFloat = keyframes`
  0% {
    transform: translateY(0) rotate(0deg);
    filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5));
  }
  25% {
    transform: translateY(-5px) rotate(1deg);
    filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.7));
  }
  50% {
    transform: translateY(0) rotate(0deg);
    filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8));
  }
  75% {
    transform: translateY(5px) rotate(-1deg);
    filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.7));
  }
  100% {
    transform: translateY(0) rotate(0deg);
    filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5));
  }
`;

// Persian carpet unfold animation
export const carpetUnfold = keyframes`
  0% {
    transform: scaleY(0.1) perspective(500px) rotateX(60deg);
    opacity: 0;
    transform-origin: top center;
  }
  40% {
    opacity: 0.5;
  }
  100% {
    transform: scaleY(1) perspective(500px) rotateX(0deg);
    opacity: 1;
    transform-origin: center center;
  }
`;

export default {
  fadeIn,
  fadeOut,
  slideUp,
  slideDown,
  pulse,
  glowPulse,
  rotate,
  animationVariants,
  animationTransitions,
  staggeredAnimation,
  shimmerAnimation,
  persianReveal,
  goldenGlowAppear,
  mysticalSymbolsAppear,
  particleRise,
  calligraphicReveal,
  magicBurst,
  mysticalFloat,
  carpetUnfold
};