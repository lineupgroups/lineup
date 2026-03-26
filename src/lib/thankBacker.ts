import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Mark a backer/donation as thanked
 * Updates the backed-projects document with thankedAt timestamp
 * 
 * @param donationId - The ID of the backed-projects document
 * @param creatorId - The creator who is sending the thank you
 * @returns Promise<void>
 */
export const markBackerAsThanked = async (
    donationId: string,
    creatorId: string
): Promise<void> => {
    try {
        const docRef = doc(db, 'backed-projects', donationId);
        await updateDoc(docRef, {
            thankedAt: serverTimestamp(),
            thankedBy: creatorId
        });
    } catch (error) {
        console.error('Error marking backer as thanked:', error);
        throw new Error('Failed to mark backer as thanked');
    }
};
