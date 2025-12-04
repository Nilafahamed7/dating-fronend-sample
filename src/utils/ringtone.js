/**
 * Premium ringtone management for incoming calls
 */

let ringtoneAudio = null;
let isPlaying = false;

// Premium ringtone URL - you can replace this with your actual ringtone file
const PREMIUM_RINGTONE_URL = '/sounds/premium-ringtone.mp3';
const DEFAULT_RINGTONE_URL = '/sounds/default-ringtone.mp3';

/**
 * Initialize ringtone audio
 */
const initRingtone = (isPremium = false) => {
  // Clean up existing audio if any
  if (ringtoneAudio) {
    ringtoneAudio.pause();
    ringtoneAudio = null;
  }

  const ringtoneUrl = isPremium ? PREMIUM_RINGTONE_URL : DEFAULT_RINGTONE_URL;

  try {
    ringtoneAudio = new Audio(ringtoneUrl);
    ringtoneAudio.loop = true;
    ringtoneAudio.volume = 0.7;

    // Handle errors gracefully
    ringtoneAudio.addEventListener('error', (e) => {
      // Fallback to default if premium fails
      if (isPremium && ringtoneUrl === PREMIUM_RINGTONE_URL) {
        initRingtone(false);
      }
    });
  } catch (error) {
    // Error handling for ringtone initialization
  }
};

/**
 * Play ringtone (with user gesture requirement handling)
 */
export const playRingtone = async (isPremium = false) => {
  // Stop any existing ringtone
  stopRingtone();

  initRingtone(isPremium);

  if (!ringtoneAudio) {
    return;
  }

  try {
    // Attempt to play - may require user gesture
    await ringtoneAudio.play();
    isPlaying = true;
  } catch (error) {
    // Autoplay blocked - this is expected in many browsers
    // The ringtone will play when user interacts with the page
    // For now, we'll rely on visual/vibration notifications
  }
};

/**
 * Stop ringtone
 */
export const stopRingtone = () => {
  if (ringtoneAudio && isPlaying) {
    try {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
      isPlaying = false;
    } catch (error) {
      // Error handling for stopping ringtone
    }
  }
};

/**
 * Set ringtone volume
 */
export const setRingtoneVolume = (volume) => {
  if (ringtoneAudio) {
    ringtoneAudio.volume = Math.max(0, Math.min(1, volume));
  }
};

/**
 * Cleanup ringtone resources
 */
export const cleanupRingtone = () => {
  stopRingtone();
  if (ringtoneAudio) {
    ringtoneAudio = null;
  }
};

/**
 * Check if user has premium account
 */
export const isPremiumUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.isPremium === true;
  } catch {
    return false;
  }
};

/**
 * Vibrate device (if supported)
 */
export const vibrate = (pattern = [200, 100, 200]) => {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      // Error handling for vibration
    }
  }
};

