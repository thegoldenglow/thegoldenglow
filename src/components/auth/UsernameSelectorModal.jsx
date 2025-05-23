import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * UsernameSelectorModal component
 * Displays a modal for users to select a username after wallet connection
 */
const UsernameSelectorModal = ({ isOpen, onClose, onSubmit, defaultUsername }) => {
  const [username, setUsername] = useState(defaultUsername || '');
  const [error, setError] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    if (username.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }
    
    // Allow alphanumeric characters, underscores, and hyphens
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }
    
    setError('');
    onSubmit(username);
  };
  
  if (!isOpen) return null;
  
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-deepLapis/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-deepLapisLight p-6 rounded-lg border border-royalGold/30 shadow-mystical-glow max-w-md w-full"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 15 }}
      >
        <h2 className="text-2xl font-primary text-royalGold mb-4 mystic-title">Choose Your Username</h2>
        <p className="text-royalGoldLight/80 mb-6">
          Welcome to Golden Glow! Please choose a username for your magical journey.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-royalGoldLight mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-deepLapis border border-royalGold/30 rounded-md px-4 py-2 text-textLight focus:outline-none focus:ring-2 focus:ring-royalGold/50"
              placeholder="Enter a username"
              autoFocus
            />
            {error && (
              <p className="text-rubyRed mt-2 text-sm">{error}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-deepLapis border border-royalGold/30 rounded-md text-royalGoldLight hover:bg-deepLapis/70 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-royalGold text-deepLapis rounded-md hover:bg-royalGold/80 transition-colors"
            >
              Confirm
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default UsernameSelectorModal;
