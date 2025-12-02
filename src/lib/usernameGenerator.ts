import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const generateUniqueUsername = async (displayName: string): Promise<string> => {
  if (!displayName) {
    return `user${Math.floor(Math.random() * 10000)}`;
  }
  
  // Clean the name: remove spaces, special chars, make lowercase
  const cleanName = displayName.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15); // Limit length
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    // Generate username with random numbers
    const randomNum = Math.floor(Math.random() * 1000);
    const username = `${cleanName}${randomNum}`;
    
    try {
      // Check if username already exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return username; // Username is unique
      }
      
      attempts++;
    } catch (error) {
      console.error('Error checking username uniqueness:', error);
      // If there's an error, return the username anyway
      return username;
    }
  }
  
  // If we couldn't find a unique username after max attempts, add timestamp
  const timestamp = Date.now().toString().slice(-4);
  return `${cleanName}${timestamp}`;
};

export const validateUsername = (username: string): { isValid: boolean; error?: string } => {
  if (!username) {
    return { isValid: false, error: 'Username is required' };
  }
  
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (username.length > 20) {
    return { isValid: false, error: 'Username must be less than 20 characters' };
  }
  
  if (!/^[a-z0-9]+$/.test(username)) {
    return { isValid: false, error: 'Username can only contain lowercase letters and numbers' };
  }
  
  return { isValid: true };
};
