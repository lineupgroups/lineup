import { collection, query, where, getDocs, doc, updateDoc, Timestamp, limit } from 'firebase/firestore';
import { db } from './firebase';
import { normalizeUsername, validateUsername, canChangeUsername } from '../utils/usernameValidation';

export interface UsernameAvailabilityResult {
    isAvailable: boolean;
    message?: string;
}

export interface UsernameChangeResult {
    success: boolean;
    message: string;
    error?: string;
}

/**
 * Check if a username is available (not taken by another user)
 */
export const checkUsernameAvailability = async (
    username: string,
    currentUserId: string
): Promise<UsernameAvailabilityResult> => {
    try {
        // Validate format first
        const validation = validateUsername(username);
        if (!validation.isValid) {
            return {
                isAvailable: false,
                message: validation.error
            };
        }

        // Normalize username for case-insensitive search
        const normalizedUsername = normalizeUsername(username);

        // Query Firestore for existing username (case-insensitive)
        // IMPORTANT: limit(1) is required to match Firestore security rules
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('username', '==', normalizedUsername),
            limit(1) // Explicitly limit to 1 result for security rules
        );
        const snapshot = await getDocs(q);

        // Check if username exists and belongs to another user
        if (!snapshot.empty) {
            const existingUser = snapshot.docs[0];

            // If it's the current user's own username, it's "available" (no change needed)
            if (existingUser.id === currentUserId) {
                return {
                    isAvailable: true,
                    message: 'This is your current username'
                };
            }

            return {
                isAvailable: false,
                message: 'This username is already taken'
            };
        }

        return {
            isAvailable: true,
            message: 'Username is available!'
        };
    } catch (error) {
        console.error('Error checking username availability:', error);
        return {
            isAvailable: false,
            message: 'Error checking availability. Please try again.'
        };
    }
};

/**
 * Change user's username with rate limiting
 */
export const changeUsername = async (
    userId: string,
    newUsername: string,
    currentUsername: string,
    lastChangedAt: Date | null
): Promise<UsernameChangeResult> => {
    try {
        // Check if trying to set the same username
        const normalizedNew = normalizeUsername(newUsername);
        const normalizedCurrent = normalizeUsername(currentUsername);

        if (normalizedNew === normalizedCurrent) {
            return {
                success: false,
                message: 'This is already your current username',
                error: 'NO_CHANGE'
            };
        }

        // Validate format
        const validation = validateUsername(newUsername);
        if (!validation.isValid) {
            return {
                success: false,
                message: validation.error || 'Invalid username format',
                error: 'INVALID_FORMAT'
            };
        }

        // Check rate limiting
        if (!canChangeUsername(lastChangedAt)) {
            return {
                success: false,
                message: 'You can only change your username once every 7 days',
                error: 'RATE_LIMITED'
            };
        }

        // Check availability
        const availability = await checkUsernameAvailability(newUsername, userId);
        if (!availability.isAvailable) {
            return {
                success: false,
                message: availability.message || 'Username is not available',
                error: 'NOT_AVAILABLE'
            };
        }

        // Update username in Firestore
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            username: normalizedNew,
            usernameChangedAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });

        return {
            success: true,
            message: 'Username changed successfully!'
        };
    } catch (error) {
        console.error('Error changing username:', error);
        return {
            success: false,
            message: 'Failed to change username. Please try again.',
            error: 'SERVER_ERROR'
        };
    }
};
