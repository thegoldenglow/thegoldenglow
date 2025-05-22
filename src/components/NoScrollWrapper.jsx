import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// This component wraps the application and prevents scrolling
// on specific routes like the Path of Enlightenment game
const NoScrollWrapper = ({ children }) => {
  const location = useLocation();
  
  useEffect(() => {
    const isPathOfEnlightenment = location.pathname === '/games/path-of-enlightenment';
    
    if (isPathOfEnlightenment) {
      // Add no-scroll class to body
      document.body.classList.add('no-scroll');
      
      // Prevent scroll but allow button clicks
      const preventScroll = (e) => {
        // Only prevent default if the touch event is not on a button or interactive element
        const target = e.target;
        const isButton = 
          target.tagName === 'BUTTON' || 
          target.closest('button') || 
          target.role === 'button' ||
          target.closest('[role="button"]');
          
        if (!isButton) {
          e.preventDefault();
        }
      };
      
      // Only prevent touchmove (scrolling) but allow touchstart for buttons
      document.addEventListener('touchmove', preventScroll, { passive: false });
      
      // Add a class to improve touch response on buttons
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        button.classList.add('touch-button-enabled');
      });
      
      // Clean up
      return () => {
        document.body.classList.remove('no-scroll');
        document.removeEventListener('touchmove', preventScroll);
        
        // Remove the touch-button-enabled class from all buttons
        const buttons = document.querySelectorAll('.touch-button-enabled');
        buttons.forEach(button => {
          button.classList.remove('touch-button-enabled');
        });
      };
    }
  }, [location.pathname]);
  
  // Check if we're on the Path of Enlightenment page
  const isGamePage = location.pathname === '/games/path-of-enlightenment';
  
  return (
    <div className={isGamePage ? 'game-container' : ''}>
      {children}
    </div>
  );
};

export default NoScrollWrapper;
