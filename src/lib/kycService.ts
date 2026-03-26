import { db } from './firebase';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    query,
    where,
    getDocs,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import { UserKYCData, KYCSubmissionData } from '../types/kyc';

/**
 * Submit KYC for user profile (one-time)
 * @param userId - User's UID
 * @param kycData - KYC submission data
 * @param pinHash - Hashed security PIN (already hashed by component)
 * @returns KYC document ID
 */
export const submitKYC = async (
    userId: string,
    kycData: KYCSubmissionData,
    pinHash: string
): Promise<string> => {
    try {
        const kycRef = doc(collection(db, 'kyc_documents'));

        const kycDoc: any = {
            id: kycRef.id,
            userId,
            creatorAge: kycData.creatorAge,
            kycType: kycData.kycType,
            paymentMethods: kycData.paymentMethods,
            securityPinHash: pinHash,
            pinCreatedAt: Timestamp.now(),
            status: 'pending',
            submittedAt: Timestamp.now(),
            lastUpdatedAt: Timestamp.now(),
        };

        // Only add relevant KYC data based on type to avoid undefined values
        if (kycData.selfKYC) {
            kycDoc.selfKYC = kycData.selfKYC;
        }

        if (kycData.parentGuardianKYC) {
            kycDoc.parentGuardianKYC = kycData.parentGuardianKYC;
        }

        await setDoc(kycRef, kycDoc);

        // Update user document with KYC status
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            kycStatus: 'submitted',
            kycDocumentId: kycRef.id,
            kycSubmittedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        console.log('KYC submitted successfully:', kycRef.id);
        return kycRef.id;
    } catch (error) {
        console.error('Error submitting KYC:', error);
        throw new Error('Failed to submit KYC. Please try again.');
    }
};

/**
 * Get user's KYC data
 * @param userId - User's UID
 * @returns UserKYCData or null if not found
 */
export const getUserKYC = async (userId: string): Promise<UserKYCData | null> => {
    try {
        const q = query(
            collection(db, 'kyc_documents'),
            where('userId', '==', userId)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        // Return the first (and should be only) KYC document for this user
        return snapshot.docs[0].data() as UserKYCData;
    } catch (error) {
        console.error('Error fetching user KYC:', error);
        throw new Error('Failed to fetch KYC data');
    }
};

/**
 * Get KYC document by ID
 * @param kycDocId - KYC document ID
 * @returns UserKYCData or null if not found
 */
export const getKYCById = async (kycDocId: string): Promise<UserKYCData | null> => {
    try {
        const kycRef = doc(db, 'kyc_documents', kycDocId);
        const kycSnap = await getDoc(kycRef);

        if (!kycSnap.exists()) {
            return null;
        }

        return kycSnap.data() as UserKYCData;
    } catch (error) {
        console.error('Error fetching KYC by ID:', error);
        throw new Error('Failed to fetch KYC document');
    }
};

/**
 * Check if user has approved KYC
 * @param userId - User's UID
 * @returns boolean
 */
export const hasApprovedKYC = async (userId: string): Promise<boolean> => {
    try {
        const kycData = await getUserKYC(userId);
        return kycData?.status === 'approved';
    } catch (error) {
        console.error('Error checking KYC approval status:', error);
        return false;
    }
};

/**
 * Verify creator's security PIN (for project creation)
 * @param userId - User's UID
 * @param enteredPIN - PIN entered by user
 * @returns boolean - true if PIN is correct
 */
export const verifyCreatorPIN = async (userId: string, enteredPIN: string): Promise<boolean> => {
    try {
        const kycData = await getUserKYC(userId);

        if (!kycData || !kycData.securityPinHash) {
            throw new Error('No security PIN found for this account');
        }

        if (kycData.status !== 'approved') {
            throw new Error('KYC is not approved');
        }

        // Verify PIN using bcrypt
        const isValid = await bcrypt.compare(enteredPIN, kycData.securityPinHash);

        // Log verification attempt (for security audit)
        if (!isValid) {
            console.warn(`Failed PIN verification attempt for user: ${userId}`);
            // TODO: Implement failed attempt tracking and lockout mechanism
        } else {
            console.log(`Successful PIN verification for user: ${userId}`);
        }

        return isValid;
    } catch (error) {
        console.error('Error verifying creator PIN:', error);
        throw error;
    }
};

/**
 * Approve KYC (Admin only)
 * @param kycDocId - KYC document ID
 * @param adminId - Admin user ID
 */
export const approveKYC = async (kycDocId: string, adminId: string): Promise<void> => {
    try {
        const kycRef = doc(db, 'kyc_documents', kycDocId);
        const kycSnap = await getDoc(kycRef);

        if (!kycSnap.exists()) {
            throw new Error('KYC document not found');
        }

        const kycData = kycSnap.data() as UserKYCData;

        // Update KYC document status
        await updateDoc(kycRef, {
            status: 'approved',
            reviewedAt: serverTimestamp(),
            reviewedBy: adminId,
            lastUpdatedAt: serverTimestamp(),
        });

        // Update user profile - GRANT CREATOR ACCESS
        // Note: We set BOTH isCreatorVerified AND isVerifiedCreator for compatibility
        // - isCreatorVerified: used for KYC/creator mode access
        // - isVerifiedCreator: used for profile display (green ring, badge)
        const userRef = doc(db, 'users', kycData.userId);
        await updateDoc(userRef, {
            kycStatus: 'approved',
            kycApprovedAt: serverTimestamp(),
            isCreatorVerified: true,
            isVerifiedCreator: true, // This enables the green ring and verified badge on profile
            verifiedAt: serverTimestamp(),
            canCreateProjects: true,
            creatorActivatedAt: serverTimestamp(),
            'rolePreferences.canAccessCreatorMode': true,
            updatedAt: serverTimestamp(),
        });

        console.log(`KYC approved for user: ${kycData.userId} by admin: ${adminId}`);

        // TODO: Send email notification to user
    } catch (error) {
        console.error('Error approving KYC:', error);
        throw new Error('Failed to approve KYC');
    }
};

/**
 * Reject KYC (Admin only)
 * @param kycDocId - KYC document ID
 * @param adminId - Admin user ID
 * @param reason - Rejection reason
 */
export const rejectKYC = async (
    kycDocId: string,
    adminId: string,
    reason: string
): Promise<void> => {
    try {
        if (!reason || reason.trim().length === 0) {
            throw new Error('Rejection reason is required');
        }

        const kycRef = doc(db, 'kyc_documents', kycDocId);
        const kycSnap = await getDoc(kycRef);

        if (!kycSnap.exists()) {
            throw new Error('KYC document not found');
        }

        const kycData = kycSnap.data() as UserKYCData;

        // Update KYC document status
        await updateDoc(kycRef, {
            status: 'rejected',
            reviewedAt: serverTimestamp(),
            reviewedBy: adminId,
            rejectionReason: reason,
            lastUpdatedAt: serverTimestamp(),
        });

        // Update user profile
        const userRef = doc(db, 'users', kycData.userId);
        await updateDoc(userRef, {
            kycStatus: 'rejected',
            kycRejectedAt: serverTimestamp(),
            kycRejectionReason: reason,
            isCreatorVerified: false,
            isVerifiedCreator: false, // Also clear the profile verification badge
            verifiedAt: null,
            canCreateProjects: false,
            'rolePreferences.canAccessCreatorMode': false,
            updatedAt: serverTimestamp(),
        });

        console.log(`KYC rejected for user: ${kycData.userId} by admin: ${adminId}. Reason: ${reason}`);

        // TODO: Send email notification to user with rejection reason
    } catch (error) {
        console.error('Error rejecting KYC:', error);
        throw new Error('Failed to reject KYC');
    }
};

/**
 * Update KYC status to under review (Admin)
 * @param kycDocId - KYC document ID
 * @param adminId - Admin user ID
 */
export const markKYCUnderReview = async (kycDocId: string, adminId: string): Promise<void> => {
    try {
        const kycRef = doc(db, 'kyc_documents', kycDocId);
        const kycSnap = await getDoc(kycRef);

        if (!kycSnap.exists()) {
            throw new Error('KYC document not found');
        }

        const kycData = kycSnap.data() as UserKYCData;

        await updateDoc(kycRef, {
            status: 'under_review',
            lastUpdatedAt: serverTimestamp(),
        });

        const userRef = doc(db, 'users', kycData.userId);
        await updateDoc(userRef, {
            kycStatus: 'under_review',
            updatedAt: serverTimestamp(),
        });

        console.log(`KYC marked under review for user: ${kycData.userId}`);
    } catch (error) {
        console.error('Error marking KYC under review:', error);
        throw new Error('Failed to update KYC status');
    }
};

/**
 * Get all pending KYC submissions (Admin)
 * @returns Array of pending KYC documents
 */
export const getPendingKYCSubmissions = async (): Promise<UserKYCData[]> => {
    try {
        const q = query(
            collection(db, 'kyc_documents'),
            where('status', '==', 'pending')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as UserKYCData);
    } catch (error) {
        console.error('Error fetching pending KYC submissions:', error);
        throw new Error('Failed to fetch pending KYC submissions');
    }
};

/**
 * Get all KYC submissions by status (Admin)
 * @param status - KYC status to filter by
 * @returns Array of KYC documents
 */
export const getKYCSubmissionsByStatus = async (
    status: UserKYCData['status']
): Promise<UserKYCData[]> => {
    try {
        const q = query(
            collection(db, 'kyc_documents'),
            where('status', '==', status)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as UserKYCData);
    } catch (error) {
        console.error(`Error fetching KYC submissions with status ${status}:`, error);
        throw new Error('Failed to fetch KYC submissions');
    }
};

/**
 * Update payment methods (after KYC approval)
 * @param userId - User's UID
 * @param paymentMethods - Updated payment methods
 */
export const updatePaymentMethods = async (
    userId: string,

    paymentMethods: UserKYCData['paymentMethods']
): Promise<void> => {
    try {
        const kycData = await getUserKYC(userId);

        if (!kycData) {
            throw new Error('No KYC data found for user');
        }

        if (kycData.status !== 'approved') {
            throw new Error('Can only update payment methods for approved KYC');
        }

        const kycRef = doc(db, 'kyc_documents', kycData.id);
        await updateDoc(kycRef, {
            paymentMethods,
            lastUpdatedAt: serverTimestamp(),
        });

        console.log(`Payment methods updated for user: ${userId}`);
    } catch (error) {
        console.error('Error updating payment methods:', error);
        throw new Error('Failed to update payment methods');
    }
};

/**
 * Hash security PIN using bcrypt
 * @param pin - 6-digit PIN
 * @returns Hashed PIN
 */
export const hashSecurityPIN = async (pin: string): Promise<string> => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(pin, salt);
        return hash;
    } catch (error) {
        console.error('Error hashing PIN:', error);
        throw new Error('Failed to hash security PIN');
    }
};
