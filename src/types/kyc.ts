import { Timestamp } from 'firebase/firestore';

/**
 * KYC Document Interface
 * Contains identity verification documents
 */
export interface KYCDocument {
    aadhaarNumber: string; // Full number for verification (masked in UI)
    panCard: string; // PAN card number
    addressProof: string; // Image URL from Firebase Storage
    verified: boolean;
    verifiedAt?: Timestamp;
}

/**
 * Parent/Guardian KYC for Minors (15-17 years)
 */
export interface ParentGuardianKYC {
    parentName: string;
    parentPhone: string;
    relationship: 'parent' | 'guardian';
    consentGiven: boolean;
    consentDate?: Timestamp;
    kyc: KYCDocument;
}

/**
 * Payment Method Interface
 */
export interface PaymentMethod {
    type: 'bank' | 'upi';
    // For Bank Transfer
    bankDetails?: {
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
    };
    // For UPI
    upiId?: string;
    isPrimary: boolean;
}

/**
 * Complete KYC Data for a User
 * This is stored in the kyc_documents collection
 */
export interface UserKYCData {
    id: string; // Document ID
    userId: string; // Reference to users collection

    // KYC Type and Age
    creatorAge: number;
    kycType: 'self' | 'parent_guardian';

    // KYC Documents (one will be present based on kycType)
    selfKYC?: KYCDocument; // For adults (18+)
    parentGuardianKYC?: ParentGuardianKYC; // For minors (15-17)

    // Payment Details
    paymentMethods: PaymentMethod[];

    // Security PIN (NEW - for identity verification during project creation)
    securityPinHash: string; // Hashed 6-digit PIN (bcrypt)
    pinCreatedAt: Timestamp;

    // KYC Status
    status: 'pending' | 'under_review' | 'approved' | 'rejected';
    submittedAt: Timestamp;
    reviewedAt?: Timestamp;
    reviewedBy?: string; // Admin user ID who reviewed
    rejectionReason?: string; // Reason if rejected

    // Metadata
    lastUpdatedAt: Timestamp;
    ipAddress?: string; // IP address from which KYC was submitted
    deviceInfo?: string; // Browser/device information
}

/**
 * KYC Submission Data (used when submitting KYC)
 */
export interface KYCSubmissionData {
    creatorAge: number;
    kycType: 'self' | 'parent_guardian';
    selfKYC?: KYCDocument;
    parentGuardianKYC?: ParentGuardianKYC;
    paymentMethods: PaymentMethod[];
    // Note: securityPinHash is passed separately to submitKYC function
}

/**
 * KYC Status Type
 */
export type KYCStatus = 'not_started' | 'submitted' | 'under_review' | 'approved' | 'rejected';

/**
 * Helper type for KYC validation
 */
export interface KYCValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}

/**
 * Age validation constants
 */
export const KYC_AGE_LIMITS = {
    MIN_AGE: 15, // Minimum age to create projects (with parent consent)
    ADULT_AGE: 18, // Age at which self-KYC is required
    MAX_AGE: 100, // Maximum reasonable age
} as const;

/**
 * PIN validation constants
 */
export const PIN_REQUIREMENTS = {
    LENGTH: 6,
    REGEX_NUMERIC: /^\d{6}$/,
    REGEX_SEQUENTIAL: /012345|123456|234567|345678|456789|567890|098765|987654|876543|765432|654321|543210/,
    REGEX_REPEATING: /^(\d)\1{5}$/,
} as const;

/**
 * Validate Aadhaar number format
 */
export const validateAadhaarNumber = (aadhaar: string): boolean => {
    // Aadhaar is 12 digits
    return /^\d{12}$/.test(aadhaar.replace(/\s/g, ''));
};

/**
 * Validate PAN card format
 */
export const validatePANCard = (pan: string): boolean => {
    // PAN format: ABCDE1234F (5 letters, 4 digits, 1 letter)
    return /^[A-Z]{5}\d{4}[A-Z]$/.test(pan.toUpperCase());
};

/**
 * Validate 6-digit PIN
 */
export const validateSecurityPIN = (pin: string): KYCValidationResult => {
    const errors: string[] = [];

    // Must be exactly 6 digits
    if (!PIN_REQUIREMENTS.REGEX_NUMERIC.test(pin)) {
        errors.push('PIN must be exactly 6 digits');
    }

    // No sequential numbers
    if (PIN_REQUIREMENTS.REGEX_SEQUENTIAL.test(pin)) {
        errors.push('PIN cannot contain sequential numbers (e.g., 123456)');
    }

    // No repeating digits
    if (PIN_REQUIREMENTS.REGEX_REPEATING.test(pin)) {
        errors.push('PIN cannot be all same digits (e.g., 111111)');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Mask Aadhaar number for display (show only last 4 digits)
 */
export const maskAadhaarNumber = (aadhaar: string): string => {
    if (!aadhaar || aadhaar.length < 4) return '****';
    return `XXXX-XXXX-${aadhaar.slice(-4)}`;
};

/**
 * Mask PAN card for display (show only last 4 characters)
 */
export const maskPANCard = (pan: string): string => {
    if (!pan || pan.length < 4) return '****';
    return `******${pan.slice(-4)}`;
};

/**
 * Mask bank account number (show only last 4 digits)
 */
export const maskAccountNumber = (accountNumber: string): string => {
    if (!accountNumber || accountNumber.length < 4) return '****';
    return `XXXX-${accountNumber.slice(-4)}`;
};

/**
 * Check if user is a minor based on age
 */
export const isMinor = (age: number): boolean => {
    return age >= KYC_AGE_LIMITS.MIN_AGE && age < KYC_AGE_LIMITS.ADULT_AGE;
};

/**
 * Check if user is eligible for KYC based on age
 */
export const isEligibleForKYC = (age: number): boolean => {
    return age >= KYC_AGE_LIMITS.MIN_AGE && age <= KYC_AGE_LIMITS.MAX_AGE;
};
