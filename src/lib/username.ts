import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { UsernameValidation } from '../types/user';

// Reserved usernames that cannot be used
const RESERVED_USERNAMES = [
  'admin', 'api', 'www', 'mail', 'ftp', 'localhost', 'lineup',
  'support', 'help', 'about', 'contact', 'privacy', 'terms',
  'blog', 'news', 'press', 'legal', 'security', 'status',
  'app', 'mobile', 'web', 'beta', 'test', 'demo', 'staging',
  'root', 'null', 'undefined', 'true', 'false', 'public',
  'private', 'system', 'config', 'settings', 'profile', 'user',
  'users', 'account', 'accounts', 'login', 'logout', 'signup',
  'register', 'dashboard', 'home', 'index', 'main', 'default'
];

/**
 * Validates username format and rules
 */
export const validateUsernameFormat = (username: string): { isValid: boolean; error?: string } => {
  // Check length
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }

  if (username.length > 30) {
    return { isValid: false, error: 'Username cannot be longer than 30 characters' };
  }

  // Check format (alphanumeric + underscore only)
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }

  // Check if starts/ends with underscore
  if (username.startsWith('_') || username.endsWith('_')) {
    return { isValid: false, error: 'Username cannot start or end with underscore' };
  }

  // Check for consecutive underscores
  if (username.includes('__')) {
    return { isValid: false, error: 'Username cannot contain consecutive underscores' };
  }

  // Check if reserved
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    return { isValid: false, error: 'This username is reserved' };
  }

  return { isValid: true };
};

// Rate limiting for username checks
const usernameCheckCache = new Map<string, { result: boolean; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

const isRateLimited = (identifier: string): boolean => {
  const now = Date.now();
  const requests = rateLimitMap.get(identifier) || [];

  // Remove old requests outside the window
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  rateLimitMap.set(identifier, recentRequests);

  return recentRequests.length >= MAX_REQUESTS_PER_WINDOW;
};

const recordRequest = (identifier: string): void => {
  const requests = rateLimitMap.get(identifier) || [];
  requests.push(Date.now());
  rateLimitMap.set(identifier, requests);
};

/**
 * Check if username is available in database
 */
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  const cacheKey = username.toLowerCase();
  const identifier = 'username_check'; // In production, use IP address or user ID

  // Check rate limit
  if (isRateLimited(identifier)) {
    throw new Error('Too many requests. Please try again later.');
  }

  // Check cache first
  const cached = usernameCheckCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }

  recordRequest(identifier);

  try {
    // Check in usernames collection (Source of Truth)
    const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
    if (usernameDoc.exists()) {
      const result = false;
      usernameCheckCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }

    // Check in reserved usernames collection (if exists)
    const reservedDoc = await getDoc(doc(db, 'reserved-usernames', username.toLowerCase()));
    if (reservedDoc.exists()) {
      const result = false;
      usernameCheckCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }

    const result = true;
    usernameCheckCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error('Error checking username availability:', error);
    // Don't cache errors
    return false;
  }
};

/**
 * Generate username suggestions based on display name or existing username
 */
export const generateUsernameSuggestions = (baseName: string, count: number = 5): string[] => {
  const cleanBase = baseName
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 20);

  if (!cleanBase) {
    return ['user123', 'creator456', 'maker789', 'builder101', 'innovator202'];
  }

  const suggestions: string[] = [];

  // Add base name
  suggestions.push(cleanBase);

  // Add with numbers
  for (let i = 1; i <= count - 1; i++) {
    suggestions.push(`${cleanBase}${Math.floor(Math.random() * 1000)}`);
  }

  // Add with underscores and words
  const suffixes = ['_creator', '_maker', '_dev', '_pro', '_official'];
  suffixes.forEach(suffix => {
    if (suggestions.length < count) {
      suggestions.push(`${cleanBase}${suffix}`);
    }
  });

  return suggestions.slice(0, count);
};

/**
 * Complete username validation with availability check
 */
export const validateUsername = async (username: string): Promise<UsernameValidation> => {
  // First check format
  const formatValidation = validateUsernameFormat(username);
  if (!formatValidation.isValid) {
    return {
      isValid: false,
      isAvailable: false,
      error: formatValidation.error
    };
  }

  // Then check availability
  const isAvailable = await checkUsernameAvailability(username);

  if (!isAvailable) {
    const suggestions = generateUsernameSuggestions(username);
    return {
      isValid: true,
      isAvailable: false,
      suggestions,
      error: 'This username is already taken'
    };
  }

  return {
    isValid: true,
    isAvailable: true
  };
};

/**
 * Reserve a username for a user
 */
export const reserveUsername = async (userId: string, username: string): Promise<void> => {
  try {
    const usernameDoc = doc(db, 'usernames', username.toLowerCase());
    await setDoc(usernameDoc, {
      userId,
      username: username.toLowerCase(),
      originalUsername: username,
      createdAt: Timestamp.now(),
      isActive: true
    });

    console.log(`Username ${username} reserved for user ${userId}`);
  } catch (error) {
    console.error('Error reserving username:', error);
    throw new Error('Failed to reserve username');
  }
};

/**
 * Update user's username (with validation and rate limiting)
 */
export const updateUserUsername = async (userId: string, newUsername: string): Promise<void> => {
  try {
    // Validate new username
    const validation = await validateUsername(newUsername);
    if (!validation.isValid || !validation.isAvailable) {
      throw new Error(validation.error || 'Username is not available');
    }

    // Check rate limiting (30 days between changes)
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const lastChange = userData.usernameChangedAt;

      if (lastChange) {
        const daysSinceLastChange = (Date.now() - lastChange.toMillis()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastChange < 30) {
          throw new Error(`You can change your username again in ${Math.ceil(30 - daysSinceLastChange)} days`);
        }
      }

      // Release old username
      const oldUsername = userData.username;
      if (oldUsername) {
        const oldUsernameDoc = doc(db, 'usernames', oldUsername.toLowerCase());
        await updateDoc(oldUsernameDoc, {
          isActive: false,
          releasedAt: Timestamp.now()
        });
      }
    }

    // Reserve new username
    await reserveUsername(userId, newUsername);

    // Update user document
    await updateDoc(userRef, {
      username: newUsername.toLowerCase(),
      usernameChangedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

  } catch (error) {
    console.error('Error updating username:', error);
    throw error;
  }
};

/**
 * Get user by username
 */
export const getUserByUsername = async (username: string): Promise<string | null> => {
  try {
    const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));

    if (usernameDoc.exists() && usernameDoc.data().isActive) {
      return usernameDoc.data().userId;
    }

    return null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
};
