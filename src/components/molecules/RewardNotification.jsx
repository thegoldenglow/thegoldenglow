import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../atoms/Icon';

const RewardNotification = ({ amount, source, autoHideDuration = 3000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Make notification visible when props change
    setVisible(true);
    
    // Auto-hide after duration
    const timer = setTimeout(() => {
      setVisible(false);
    }, autoHideDuration);
    
    return () => clearTimeout(timer);
  }, [amount, source, autoHideDuration]);

  // Determine notification tier styling
  const getTierStyle = () => {
    if (amount >= 50) {
      return {
        bgColor: 'bg-gradient-to-r from-amber-500 to-yellow-300',
        textColor: 'text-deepLapis',
        iconColor: '#1D3461',
        animation: 'animate-pulse'
      };
    } else if (amount >= 20) {
      return {
        bgColor: 'bg-gradient-to-r from-royalGold to-amber-400',
        textColor: 'text-deepLapis',
        iconColor: '#1D3461',
        animation: ''
      };
    } else if (amount >= 10) {
      return {
        bgColor: 'bg-gradient-to-r from-amber-400 to-amber-300',
        textColor: 'text-deepLapis',
        iconColor: '#1D3461',
        animation: ''
      };
    } else {
      return {
        bgColor: 'bg-deepLapisLight',
        textColor: 'text-royalGold',
        iconColor: '#DAA520',
        animation: ''
      };
    }
  };

  const { bgColor, textColor, iconColor, animation } = getTierStyle();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 ${animation}`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${bgColor}`}>
            <div className="p-1 rounded-full bg-white/20">
              <Icon name="coin" size={24} color={iconColor} />
            </div>
            <div>
              <p className={`font-bold ${textColor}`}>
                +{amount} <span className="font-normal">Golden Credits</span>
              </p>
              <p className="text-sm text-white/80">{source}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

RewardNotification.propTypes = {
  amount: PropTypes.number.isRequired,
  source: PropTypes.string.isRequired,
  autoHideDuration: PropTypes.number
};

export default RewardNotification;