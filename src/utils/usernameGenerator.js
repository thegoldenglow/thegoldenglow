/**
 * Username Generator
 * Generates random usernames for users who haven't set a custom username
 */

// Arrays of words to create random usernames
const adjectives = [
  'golden', 'mystic', 'cosmic', 'eternal', 'radiant', 'serene', 'shining', 'peaceful',
  'wise', 'vibrant', 'sacred', 'divine', 'gentle', 'mindful', 'tranquil', 'enlightened',
  'joyful', 'stellar', 'glowing', 'luminous', 'brilliant', 'graceful', 'spiritual', 'harmonious'
];

const nouns = [
  'spirit', 'soul', 'light', 'sage', 'journey', 'path', 'seeker', 'guardian',
  'wisdom', 'flame', 'lotus', 'dreamer', 'voyager', 'healer', 'mentor', 'guide',
  'phoenix', 'horizon', 'beacon', 'traveler', 'oracle', 'aurora', 'essence', 'harmony'
];

/**
 * Generate a random username
 * @returns {string} A randomly generated username
 */
export const generateRandomUsername = () => {
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000);
  
  return `${randomAdjective}_${randomNoun}${randomNumber}`;
};

/**
 * Check if a username is valid
 * @param {string} username - The username to validate
 * @returns {boolean} Whether the username is valid
 */
export const isValidUsername = (username) => {
  // Username should be 3-20 characters long and only contain letters, numbers, and underscores
  const regex = /^[a-zA-Z0-9_]{3,20}$/;
  return regex.test(username);
};

/**
 * Check if a username is available (not taken by another user)
 * @param {object} supabase - Supabase client
 * @param {string} username - The username to check
 * @param {string} currentUserId - Current user's ID to exclude from check
 * @returns {Promise<{available: boolean, error: string|null}>} Result with availability status and any error
 */
export const isUsernameAvailable = async (supabase, username, currentUserId) => {
  try {
    console.log(`Checking availability for username: ${username}, excluding ID: ${currentUserId || 'none'}`);
    
    // First, check if username is already taken by any user (more reliable than using .neq and .single)
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username);
    
    if (error) {
      console.error('Error in username availability check:', error);
      return { available: false, error: 'Unable to check username availability. Please try again.' };
    }
    
    // If no data or empty array, username is available
    if (!data || data.length === 0) {
      console.log('Username is available (no matching records)');
      return { available: true, error: null };
    }
    
    // If there's exactly one result and it's the current user, username is available to keep
    if (data.length === 1 && currentUserId && data[0].id.toString() === currentUserId.toString()) {
      console.log('Username is available (belongs to current user)');
      return { available: true, error: null };
    }
    
    // Otherwise, username is taken
    console.log('Username is already taken');
    return { available: false, error: 'This username is already taken. Please choose another one.' };
  } catch (error) {
    console.error('Unexpected error checking username availability:', error);
    return { available: false, error: 'An error occurred while checking username availability.' };
  }
};
