import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useReward } from '../../contexts/RewardContext';
import { useWallet } from '../../contexts/WalletContext';
import { useUser } from '../../contexts/UserContext';
import { FiArrowRight, FiHelpCircle, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const WheelOfDestiny = () => {
  const { wheelOfDestiny, spinWheel, claimWheelReward, purchaseWheelSpin } = useReward();
  const { addTransaction } = useWallet();
  const { user } = useUser();

  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);

  const wheelRef = useRef(null);

  const segments = wheelOfDestiny?.segments || [];
  const totalSegments = segments.length > 0 ? segments.length : 8; // Default to 8 if segments not loaded
  const segmentAngle = 360 / totalSegments;

  // Helper to get Tailwind classes for segment styling
  const getSegmentClasses = (segment) => {
    let bgColorClass = segment.colorName ? `bg-${segment.colorName}` : 'bg-gray-500'; // Default if no colorName
    // Handle shades like 'mysticPurple-700' or 'ancientGold-dark' automatically if colorName is full class e.g. 'mysticPurple-700'
    // If colorName is just 'mysticPurple', Tailwind typically applies the DEFAULT shade.
    // Ensure your tailwind.config.js has DEFAULT shades for 'mysticPurple', 'ancientGold', etc.
    
    let textColorClass = segment.textColorName ? `text-${segment.textColorName}` : 'text-white'; // Default if no textColorName
    if (segment.textColorName && segment.textColorName.startsWith('text-')) {
      textColorClass = segment.textColorName; // Handles full class like 'text-offWhite'
    }
    return { bgClass: bgColorClass, textClass: textColorClass };
  };

  const handleSpin = useCallback(async (spinType) => {
    if (isSpinning || !wheelOfDestiny) return;

    if (spinType === 'free' && !wheelOfDestiny.freeSpinAvailable) {
      alert('Your daily free spin is not available yet. Come back tomorrow!');
      return;
    }

    if (spinType === 'paid' && wheelOfDestiny.spinsAvailable <= 0) {
      setShowPurchaseModal(true);
      return;
    }

    setIsSpinning(true);
    setSelectedSegment(null); // Clear previous selection

    const startRotation = currentRotation;
    let result;

    try {
      result = await spinWheel(spinType);
      if (!result || !result.segment) {
        throw new Error('Failed to spin wheel or invalid result from API.');
      }

      const segmentIndex = segments.findIndex(s => s.id === result.segment.id);
      if (segmentIndex === -1) {
        console.error('Winning segment from API:', result.segment, 'Available segments:', segments);
        throw new Error('Winning segment not found in local configuration.');
      }

      const extraRotations = 7 + Math.floor(Math.random() * 3); // 7-10 full rotations for visual appeal
      // Calculate angle to the middle of the target segment for pointer alignment
      const targetAngleForSegment = (totalSegments - segmentIndex - 0.5) * segmentAngle;
      const targetRotation = (360 * extraRotations) + targetAngleForSegment;
      
      // Set the wheel animation duration to 6 seconds
      const spinDuration = 6000;
      
      if (wheelRef.current) {
        wheelRef.current.style.transition = `transform ${spinDuration/1000}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
        wheelRef.current.style.transform = `rotate(${targetRotation}deg)`;
      }

      // Wait for the animation to complete plus a small buffer to ensure wheel is fully stopped
      // before showing the result and updating state
      setTimeout(() => {
        setIsSpinning(false);
        // Update the state with the final rotation first
        setCurrentRotation(targetRotation);
        
        // Wait a tiny bit more to show the result after the wheel has fully stopped
        setTimeout(() => {
          setSelectedSegment(result.segment);
          
          // Auto-claim logic (ensure currentSpin is updated in context for this to work if needed elsewhere)
          if (result.segment.value > 0 && wheelOfDestiny.currentSpin?.id) {
              handleClaimReward(wheelOfDestiny.currentSpin.id, result.segment); 
          } else if (result.segment.value === 0 && wheelOfDestiny.currentSpin?.id) {
              // Handle 'Try Again' - could mark as claimed or just update UI
              claimWheelReward(wheelOfDestiny.currentSpin.id); // Mark as processed
          }
        }, 200); // Short delay after wheel stops before showing result
      }, spinDuration + 100);

    } catch (error) {
      console.error('Error spinning wheel:', error);
      setIsSpinning(false);
      alert(`Error spinning wheel: ${error.message}`);
    }
  }, [isSpinning, wheelOfDestiny, currentRotation, spinWheel, segments, totalSegments, segmentAngle, claimWheelReward]); // Added claimWheelReward to dependencies

  const handleClaimReward = useCallback((spinIdToClaim, segmentToClaim) => {
    if (!spinIdToClaim || !segmentToClaim) return;

    try {
      // Assuming claimWheelReward in context updates the spin's 'claimed' status
      const claimResult = claimWheelReward(spinIdToClaim);

      if (claimResult && claimResult.success) {
        if (claimResult.amount > 0) {
          addTransaction(
            claimResult.amount,
            'wheel_of_destiny',
            `Wheel of Destiny: ${segmentToClaim.label}`
          );
        }
        // UI update to reflect reward claimed can happen via useEffect watching wheelOfDestiny.currentSpin
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  }, [claimWheelReward, addTransaction]);

  const handlePurchaseSpins = async () => {
    if (purchaseQuantity <= 0) return;
    
    try {
        const success = await purchaseWheelSpin(purchaseQuantity);
        if (success) {
          addTransaction(
            -(purchaseQuantity * 100), // Assuming 100 GC per spin
            'wheel_purchase',
            `Purchased ${purchaseQuantity} wheel spin${purchaseQuantity !== 1 ? 's' : ''}`
          );
          setShowPurchaseModal(false);
        } else {
          alert('Not enough Golden Credits or error purchasing spins.');
        }
    } catch(error) {
        console.error('Error purchasing spins:', error);
        alert('Failed to purchase spins. Please try again.');
    }
  };

  // Effect to show unclaimed spin result when component loads or user changes
  useEffect(() => {
    if (wheelOfDestiny && wheelOfDestiny.currentSpin && !wheelOfDestiny.currentSpin.claimed) {
      setSelectedSegment(wheelOfDestiny.currentSpin.segment);
      // Optionally, set currentRotation to show this segment at the top if not spinning
      // This part might need refinement based on exact desired UX for pre-spun wheels
    } else {
      setSelectedSegment(null);
    }
  }, [user?.id, wheelOfDestiny?.currentSpin]);

  // Constants for styling - adjust as needed
  const WHEEL_SIZE = 288; // Tailwind w-72 (72*4px)
  const WHEEL_BORDER_WIDTH = 8; // Tailwind border-8
  const HUB_DIAMETER = 64; // Tailwind w-16
  const HUB_BORDER_WIDTH = 4; // Tailwind border-4
  const HUB_EFFECTIVE_RADIUS = (HUB_DIAMETER / 2) + HUB_BORDER_WIDTH;
  const DIVIDER_TOP_OFFSET = HUB_EFFECTIVE_RADIUS;
  const DIVIDER_HEIGHT = (WHEEL_SIZE / 2) - HUB_EFFECTIVE_RADIUS - WHEEL_BORDER_WIDTH;
  const TEXT_ROTATION_OFFSET = -90 - (segmentAngle / 2); // Orients text correctly in segment

  return (
    <div className="flex flex-col items-center justify-center p-4 font-sans bg-deepLapisDark min-h-screen text-textLight">
      <div className="relative mb-6 w-full max-w-md">
        <h2 className="text-4xl font-primary text-ancientGold text-center">Wheel of Destiny</h2>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="absolute top-0 right-0 -mt-1 text-ancientGold-light hover:text-royalGold text-2xl p-2"
          aria-label="Show wheel information"
        >
          <FiHelpCircle />
        </button>
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 md:absolute md:top-20 md:left-auto md:right-0 md:transform-none bg-mysticPurple-dark border border-ancientGold rounded-lg p-6 z-[100] shadow-mystic-glow w-80 max-w-sm"
          >
            <button onClick={() => setShowInfo(false)} className="absolute top-2 right-2 text-ancientGold-light text-xl"><FiX /></button>
            <h3 className="text-xl font-primary text-ancientGold mb-3">Wheel Info</h3>
            <ul className="list-disc list-inside text-sm text-textLight space-y-1">
              <li>You get one free spin daily!</li>
              <li>Purchase additional spins for 100 Golden Credits.</li>
              <li>Win rewards ranging from 5 to 500 GC.</li>
              <li>Prizes are automatically added to your wallet.</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wheel Area */}
      <div className="relative my-8" style={{ width: `${WHEEL_SIZE}px`, height: `${WHEEL_SIZE}px` }}>
        {/* Pointer - Styled with CSS for a triangle shape */}
        <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-[calc(100%_-_8px)] z-20">
            <div style={{
                width: 0, 
                height: 0, 
                borderLeft: '16px solid transparent', 
                borderRight: '16px solid transparent', 
                borderBottom: `28px solid var(--color-ancientGold-light, #D4AF37)`, // Ensure ancientGold-light is defined in Tailwind or use direct hex
                filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.4))',
                transform: 'rotate(180deg)'
            }} data-component-name="WheelOfDestiny"></div>
        </div>

        {/* Mystic glow effect around the wheel using Framer Motion */}
        <motion.div 
          className="absolute inset-0 rounded-full z-0" 
          animate={{
            boxShadow: [
              '0px 0px 20px 0px rgba(75, 0, 130, 0.5), 0px 0px 30px 5px rgba(138, 43, 226, 0.3)', // State 1: Indigo base, fainter purple outer
              '0px 0px 30px 5px rgba(75, 0, 130, 0.7), 0px 0px 45px 10px rgba(138, 43, 226, 0.5), 0px 0px 15px 0px rgba(0, 255, 255, 0.2)', // State 2: Indigo intensifies, purple expands, teal appears softly
              '0px 0px 40px 10px rgba(75, 0, 130, 0.6), 0px 0px 60px 15px rgba(138, 43, 226, 0.7), 0px 0px 25px 5px rgba(0, 255, 255, 0.4)', // State 3 (Peak): Purple at peak, teal brightens
              '0px 0px 30px 5px rgba(75, 0, 130, 0.7), 0px 0px 45px 10px rgba(138, 43, 226, 0.5), 0px 0px 15px 0px rgba(0, 255, 255, 0.2)', // State 4: Receding
              '0px 0px 20px 0px rgba(75, 0, 130, 0.5), 0px 0px 30px 5px rgba(138, 43, 226, 0.3)'  // State 5: Return to State 1
            ],
            scale: [1, 1.01, 1.02, 1.01, 1],
            opacity: [0.6, 0.8, 1, 0.8, 0.6]
          }}
          transition={{
            duration: 4.5, 
            ease: "linear", 
            repeat: Infinity,
            // repeatType: "loop" // Framer Motion defaults to 'loop' with repeat: Infinity
          }}
        />
        
        {/* Inner mystical energy ripples - Commented out for now to focus on the main glow
        <motion.div 
          className="absolute inset-0 rounded-full z-0" 
          animate={{
            boxShadow: [
              'inset 0px 0px 15px 5px rgba(138, 43, 226, 0.5)',
              'inset 0px 0px 30px 10px rgba(138, 43, 226, 0.7)',
              'inset 0px 0px 15px 5px rgba(138, 43, 226, 0.5)'
            ],
            scale: [0.96, 0.98, 0.96],
          }}
          transition={{
            duration: 2.8,
            ease: "easeInOut",
            times: [0, 0.5, 1],
            repeat: Infinity,
            repeatType: "mirror",
            delay: 0.5
          }}
          style={{ 
            opacity: 0.7,
          }}
        />
        */}
        
        {/* Wheel container for rotation */}
        <div
          ref={wheelRef}
          className={`w-full h-full rounded-full border-${WHEEL_BORDER_WIDTH} border-ancientGold bg-mysticPurple-900 overflow-hidden relative`}
          style={{ 
            transform: `rotate(${currentRotation}deg)`
          }}
        >
          {/* Segments rendered here */}
          {segments.map((segment, index) => {
            const { bgClass, textClass } = getSegmentClasses(segment);
            const rotationForSegmentContainer = index * segmentAngle;
            return (
              // This outer div rotates each segment into place
              <div
                key={segment.id || index}
                className="absolute top-0 left-0 w-full h-full origin-center"
                style={{ transform: `rotate(${rotationForSegmentContainer}deg)` }}
              >
                {/* This div is the actual visible triangular segment */}
                <div 
                    className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1/2 origin-bottom-center ${bgClass}`}
                    style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}
                >
                    {/* Text Label for the segment */}
                    {/* Use a radial text arrangement */}
                    <div
                        className="absolute w-0.5 h-1/2 bg-transparent"
                        style={{
                            top: 0,
                            left: '50%',
                            transformOrigin: 'bottom center',
                            transform: 'translateX(-50%) rotate(0deg)', // No additional rotation needed
                        }}
                    >
                        {/* Red arrow pointer */}
                        <div 
                            className="absolute text-red-600"
                            style={{
                                top: '65%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                fontSize: '16px'
                            }}
                        >
                            ↑
                        </div>
                        
                        {/* Text positioned to match the angle of the segment */}
                        <div
                            className={`absolute ${textClass} font-primary font-bold`}
                            style={{
                                top: '25%', // Position in the top part of the segment
                                left: '0',
                                width: '80px',
                                transform: 'translateX(-50%)',
                                fontSize: '11px',
                                lineHeight: '1.1',
                                textAlign: 'center',
                                userSelect: 'none',
                            }}
                        >
                            {segment.label}
                        </div>
                    </div>
                </div>
                {/* Divider Line - Positioned at the 'start' (left edge) of this rotated container */}
                <div 
                    className="absolute top-0 left-0 w-px bg-ancientGold-dark opacity-60"
                    style={{
                        height: `${DIVIDER_HEIGHT}px`,
                        top: `${DIVIDER_TOP_OFFSET}px`,
                        zIndex: 3 // Above segment bg, below text potentially
                    }}
                />
              </div>
            );
          })}
        </div>

        {/* Central Hub Styling */}
        <div
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full z-10 shadow-inner`}
          style={{
            width: `${HUB_DIAMETER}px`, 
            height: `${HUB_DIAMETER}px`, 
            borderWidth: `${HUB_BORDER_WIDTH}px`,
            borderColor: 'var(--color-ancientGold, #B8860B)', // Use CSS var for ancientGold or direct hex
            backgroundColor: 'var(--color-arcaneIndigo-dark, #3A006A)', // Use CSS var or direct hex
            boxShadow: '0 0 12px 4px rgba(138, 43, 226, 0.3), inset 0 0 10px 3px rgba(0,0,0,0.4)' // mystic-glow variant + inner shadow
          }}
        ></div>
      </div>

      {/* UI Controls and Status Messages */}
      <div className="mt-8 text-center w-full max-w-md">
        {selectedSegment && (
          <motion.div 
            initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.2}}
            className="mb-4 p-4 bg-mysticPurple-light border border-ancientGold rounded-lg shadow-lg"
          >
            <p className="text-xl font-primary text-ancientGold-light">
              Landed on: <span className="font-bold">{selectedSegment.label}</span>
            </p>
            {selectedSegment.value > 0 && <p className="text-md mt-1">You won {selectedSegment.value} Golden Credits!</p>}
            {selectedSegment.value === 0 && <p className="text-md mt-1">Better luck next time!</p>}
          </motion.div>
        )}

        <div className="space-y-3 md:space-y-0 md:space-x-4 flex flex-col md:flex-row items-center justify-center">
          <button
            onClick={() => handleSpin('free')}
            disabled={isSpinning || !wheelOfDestiny?.freeSpinAvailable}
            className="w-full md:w-auto px-8 py-3 bg-ancientGold hover:bg-ancientGold-light text-mysticPurple-dark font-primary text-lg rounded-lg shadow-md transition-all duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-royalGold focus:ring-opacity-75"
          >
            {isSpinning ? 'Spinning...' : (wheelOfDestiny?.freeSpinAvailable ? 'Daily Free Spin' : 'Free Spin Used')}
          </button>
          <button
            onClick={() => handleSpin('paid')}
            disabled={isSpinning || (wheelOfDestiny && wheelOfDestiny.spinsAvailable <= 0 && !showPurchaseModal)}
            className="w-full md:w-auto px-8 py-3 bg-mysticPurple hover:bg-mysticPurple-light text-ancientGold-light font-primary text-lg rounded-lg shadow-md transition-all duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-royalGold focus:ring-opacity-75"
          >
            {isSpinning ? 'Spinning...' : `Spin (100 GC) - ${wheelOfDestiny?.spinsAvailable || 0} Left`}
          </button>
        </div>
        {wheelOfDestiny && wheelOfDestiny.spinsAvailable <= 0 && !wheelOfDestiny.freeSpinAvailable && (
             <button 
                onClick={() => setShowPurchaseModal(true)} 
                className="mt-6 px-6 py-2 text-sm bg-transparent border-2 border-ancientGold text-ancientGold hover:bg-ancientGold hover:text-mysticPurple-dark rounded-lg transition-colors duration-200 ease-in-out font-semibold"
            >
                Buy More Spins
            </button>
        )}
      </div>

      {/* Purchase Modal using Framer Motion */}
      <AnimatePresence>
        {showPurchaseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{duration: 0.3}}
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4"
          >
            <motion.div 
                initial={{ scale: 0.8, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -20 }}
                transition={{type: 'spring', stiffness: 300, damping: 25}}
                className="bg-deepLapis p-8 rounded-xl shadow-mystic-glow border-2 border-ancientGold w-full max-w-lg relative font-primary"
            >
              <button onClick={() => setShowPurchaseModal(false)} className="absolute top-3 right-4 text-ancientGold-light hover:text-royalGold text-3xl"><FiX /></button>
              <h3 className="text-3xl text-ancientGold mb-8 text-center">Purchase Spins</h3>
              <div className="mb-6">
                <label htmlFor="spinQuantity" className="block text-md text-textLight mb-2">Quantity (100 GC each):</label>
                <input
                  type="number"
                  id="spinQuantity"
                  value={purchaseQuantity}
                  onChange={(e) => setPurchaseQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="w-full p-3 bg-mysticPurple-dark border-2 border-ancientGold text-textLight rounded-lg focus:ring-2 focus:ring-royalGold outline-none text-lg"
                />
              </div>
              <p className="text-center text-xl text-textLight mb-8">
                Total Cost: <span className="font-bold text-ancientGold">{purchaseQuantity * 100} GC</span>
              </p>
              <button
                onClick={handlePurchaseSpins}
                disabled={!user || user.points < purchaseQuantity * 100} // Check user.points for balance
                className="w-full px-6 py-4 bg-ancientGold hover:bg-ancientGold-light text-mysticPurple-dark font-bold text-xl rounded-lg shadow-md transition-all duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-royalGold focus:ring-opacity-75"
              >
                {user && user.points < purchaseQuantity * 100 ? 'Not Enough Credits' : 'Confirm Purchase'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WheelOfDestiny;
