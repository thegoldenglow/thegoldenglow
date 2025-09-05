import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const JourneyCanvas = ({
  distance = 0,
  speed = 0,
  tapRate = 0,
  currentCity = null,
  visitedCities = [],
  milestone = null,
  maxDistance = 1000
}) => {
  const canvasRef = useRef(null);
  const [showMilestone, setShowMilestone] = useState(false);
  
  // Background layers for parallax effect
  const backgrounds = [
    '/assets/images/journey/mountains-bg.jpg',
    '/assets/images/journey/middle-layer.png',
    '/assets/images/journey/foreground.png'
  ];

  // City marker image
  const cityMarker = '/assets/images/journey/city-marker.png';

  // Handle milestone display
  useEffect(() => {
    if (milestone) {
      setShowMilestone(true);
      
      // Hide milestone notification after 3 seconds
      const timer = setTimeout(() => {
        setShowMilestone(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [milestone]);

  // Calculate the visual position based on the journey progress
  const journeyProgress = Math.min(distance / maxDistance, 1);
  
  // Calculate parallax values for different layers
  const parallaxLayers = backgrounds.map((_, index) => {
    // Deeper layers move slower (layer 0 is the farthest/slowest)
    const parallaxFactor = (backgrounds.length - index) / backgrounds.length;
    // Calculate offset based on journey progress and parallax factor
    return -journeyProgress * maxDistance * parallaxFactor * 0.1;
  });

  // Calculate city dots positions
  const getCityPosition = (cityDistance) => {
    const trackWidth = window.innerWidth * 3; // Make track 3x wider than screen for scrolling
    return (cityDistance / maxDistance) * trackWidth;
  };

  // Animation for the traveler marker
  const travelerVariants = {
    idle: { y: [0, -5, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
    fast: { y: [0, -8, 0], transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } }
  };

  // Animation for milestone notification
  const milestoneVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  // Generate a pulsing effect matching the tap rhythm
  const pulseTiming = tapRate > 0 ? 60 / tapRate : 2000; // Convert taps per second to milliseconds between pulses
  
  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: pulseTiming / 1000, // Convert to seconds
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Mock cities along the Silk Road for visualization
  const silkRoadCities = [
    { name: "Isfahan", distance: 0, size: 16 },
    { name: "Yazd", distance: 200, size: 12 },
    { name: "Kerman", distance: 400, size: 14 },
    { name: "Bam", distance: 600, size: 12 },
    { name: "Zahedan", distance: 800, size: 14 },
    { name: "Mary (Merv)", distance: 1200, size: 15 },
    { name: "Bukhara", distance: 1600, size: 16 },
    { name: "Samarkand", distance: 2000, size: 18 },
    { name: "Kashgar", distance: 2800, size: 15 },
    { name: "Dunhuang", distance: 3600, size: 14 },
    { name: "Chang'an (Xi'an)", distance: 4500, size: 18 }
  ];

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background layers with parallax effect */}
      {backgrounds.map((bg, index) => (
        <div 
          key={`bg-layer-${index}`} 
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `url(${bg})`,
            backgroundSize: 'cover',
            backgroundPosition: `${parallaxLayers[index]}px center`,
            backgroundRepeat: 'repeat-x',
            zIndex: index,
            opacity: 0.8,
            transform: `translateZ(${index * -10}px)`,
            transition: 'background-position 0.2s ease-out'
          }}
        />
      ))}
      
      {/* Journey track */}
      <div className="absolute bottom-20 left-0 right-0 h-2 bg-deepLapisLight/50" />
      
      {/* City markers */}
      <div className="absolute bottom-16 left-0 h-10">
        {silkRoadCities.map((city, index) => {
          // Only show cities that are within our maximum distance
          if (city.distance > maxDistance) return null;
          
          const cityPos = getCityPosition(city.distance);
          const adjustedPos = cityPos - (distance / maxDistance) * window.innerWidth * 3;
          const isVisited = distance >= city.distance;
          const isCurrent = currentCity && currentCity.name === city.name;
          
          return (
            <div
              key={`city-${index}`}
              className={`absolute flex flex-col items-center transition-opacity duration-300 ${isVisited ? 'opacity-100' : 'opacity-50'}`}
              style={{ 
                left: adjustedPos + window.innerWidth / 2,
                bottom: 0,
                transform: 'translateX(-50%)'
              }}
            >
              {/* City marker */}
              <motion.div 
                className={`w-${city.size / 4} h-${city.size / 4} rounded-full ${isVisited ? 'bg-royalGold' : 'bg-white/50'} ${isCurrent ? 'ring-2 ring-royalGold' : ''}`}
                animate={isCurrent ? { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] } : {}}
                transition={isCurrent ? { duration: 2, repeat: Infinity } : {}}
              />
              
              {/* City name */}
              <p className={`text-xs mt-1 ${isVisited ? 'text-royalGold' : 'text-white/70'}`}>
                {city.name}
              </p>
            </div>
          );
        })}
      </div>
      
      {/* Traveler marker */}
      <motion.div
        className="absolute bottom-[4.5rem] left-1/2 transform -translate-x-1/2"
        variants={travelerVariants}
        animate={speed > 5 ? 'fast' : 'idle'}
      >
        <div className="flex flex-col items-center">
          {/* Traveler icon */}
          <motion.div
            className="w-8 h-8 bg-royalGold rounded-full flex items-center justify-center shadow-lg"
            variants={pulseVariants}
            animate="pulse"
            style={{ animationDuration: `${pulseTiming}ms` }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A237E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v16m-8-8h16" />
            </svg>
          </motion.div>
          
          {/* Speed indicator */}
          <div className="mt-1">
            <div className="relative w-16 h-1 bg-deepLapisLight rounded-full overflow-hidden">
              <motion.div 
                className="absolute left-0 top-0 h-full bg-royalGold"
                initial={{ width: '0%' }}
                animate={{ width: `${Math.min(speed * 10, 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Animated tap rhythm indicators */}
      {tapRate > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`pulse-${i}`}
              className="absolute left-1/2 bottom-[4.5rem] w-8 h-8 rounded-full bg-royalGold/30"
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ 
                scale: [1, 2, 3],
                opacity: [0.6, 0.3, 0],
                transition: { 
                  duration: pulseTiming / 500,
                  repeat: Infinity,
                  delay: i * (pulseTiming / 1500),
                  ease: "easeOut" 
                }
              }}
              style={{ transform: 'translate(-50%, -50%)' }}
            />
          ))}
        </div>
      )}
      
      {/* Milestone notification */}
      <AnimatePresence>
        {showMilestone && milestone && (
          <motion.div
            className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-deepLapis/90 border border-royalGold/50 rounded-lg px-6 py-3 text-center"
            variants={milestoneVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {milestone.type === 'city' ? (
              <>
                <h3 className="text-royalGold font-primary text-lg mb-1">Arrived at {milestone.name}</h3>
                {milestone.bonus > 0 && (
                  <p className="text-white">
                    +{milestone.bonus} <span className="text-royalGold">Wisdom Points</span>
                  </p>
                )}
              </>
            ) : (
              <h3 className="text-royalGold font-primary text-lg">
                Beginning your journey from {milestone.name}
              </h3>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Speed particles - more particles at higher speeds */}
      {speed > 2 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(Math.floor(speed))].map((_, i) => {
            const delay = i * 0.2;
            const top = 30 + Math.random() * 40; // Random vertical position
            const size = 2 + Math.random() * 6;  // Random size
            
            return (
              <motion.div
                key={`particle-${i}`}
                className="absolute bg-white/60 rounded-full"
                style={{ 
                  width: `${size}px`, 
                  height: `${size}px`,
                  top: `${top}%`
                }}
                initial={{ right: -10, opacity: 0.6 }}
                animate={{ 
                  right: '105%',
                  opacity: [0.6, 0.8, 0],
                  transition: { 
                    duration: 2 - Math.min(speed/10, 0.8),
                    delay,
                    repeat: Infinity,
                    ease: "linear"
                  }
                }}
              />
            );
          })}
        </div>
      )}
      
      {/* Distance text */}
      <div className="absolute bottom-2 right-2 bg-deepLapis/70 px-3 py-1 rounded text-xs">
        <span className="text-white/70">Distance: </span>
        <span className="text-royalGold">{Math.floor(distance)}</span>
      </div>
    </div>
  );
};

export default JourneyCanvas;