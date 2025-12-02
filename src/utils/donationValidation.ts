/**
 * Donation Validation
 * 
 * Comprehensive validation rules for donations including amount checks,
 * project status verification, and user permissions.
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FirestoreProject } from '../types/firestore';

export interface DonationValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

// Validation constants
export const VALIDATION_RULES = {
    MIN_AMOUNT: 100,
    MAX_AMOUNT: 1000000, // 10 lakhs
    MAX_DONATIONS_PER_MINUTE: 5,
    RATE_LIMIT_WINDOW: 60000, // 1 minute in milliseconds
} as const;

// Track recent donations for rate limiting
const recentDonations = new Map<string, number[]>();

/**
 * Main validation function for donations
 * Checks all business rules before processing a donation
 */
export async function validateDonation(
    userId: string,
    projectId: string,
    amount: number
): Promise<DonationValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate user ID
    if (!userId || userId.trim() === '') {
        errors.push('User ID is required. Please sign in to continue.');
        return { isValid: false, errors, warnings };
    }

    // 2. Validate project ID
    if (!projectId || projectId.trim() === '') {
        errors.push('Project ID is required');
        return { isValid: false, errors, warnings };
    }

    // 3. Validate amount
    const amountValidation = validateAmount(amount);
    if (!amountValidation.isValid) {
        errors.push(...amountValidation.errors);
    }
    warnings.push(...amountValidation.warnings);

    // 4. Check rate limiting
    const rateLimitCheck = checkRateLimit(userId);
    if (!rateLimitCheck.isValid) {
        errors.push(...rateLimitCheck.errors);
    }
    warnings.push(...rateLimitCheck.warnings);

    // 5. Validate project status (async)
    try {
        const projectValidation = await validateProject(projectId, userId);
        if (!projectValidation.isValid) {
            errors.push(...projectValidation.errors);
        }
        warnings.push(...projectValidation.warnings);
    } catch (error) {
        errors.push('Failed to validate project. Please try again.');
        console.error('Project validation error:', error);
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validates donation amount
 */
export function validateAmount(amount: number): DonationValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if amount is a valid number
    if (typeof amount !== 'number' || isNaN(amount)) {
        errors.push('Invalid amount. Please enter a valid number.');
        return { isValid: false, errors, warnings };
    }

    // Check minimum amount
    if (amount < VALIDATION_RULES.MIN_AMOUNT) {
        errors.push(`Minimum donation amount is ₹${VALIDATION_RULES.MIN_AMOUNT.toLocaleString('en-IN')}`);
    }

    // Check maximum amount
    if (amount > VALIDATION_RULES.MAX_AMOUNT) {
        errors.push(`Maximum donation amount is ₹${VALIDATION_RULES.MAX_AMOUNT.toLocaleString('en-IN')}`);
    }

    // Warning for large donations
    if (amount >= 100000 && amount <= VALIDATION_RULES.MAX_AMOUNT) {
        warnings.push('You are making a large donation. Please verify the amount.');
    }

    // Check for decimal places (donations should be whole rupees)
    if (!Number.isInteger(amount)) {
        errors.push('Donation amount must be in whole rupees (no decimals)');
    }

    // Check for negative amounts
    if (amount < 0) {
        errors.push('Donation amount cannot be negative');
    }

    // Check for zero
    if (amount === 0) {
        errors.push('Donation amount must be greater than zero');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validates project eligibility for donations
 */
export async function validateProject(
    projectId: string,
    userId: string
): Promise<DonationValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
        // Fetch project document
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        // Check if project exists
        if (!projectDoc.exists()) {
            errors.push('Project not found. It may have been deleted.');
            return { isValid: false, errors, warnings };
        }

        const project = projectDoc.data() as FirestoreProject;

        // Check if user is trying to donate to their own project
        if (project.creatorId === userId) {
            errors.push('You cannot donate to your own project');
        }

        // Check project status
        if (project.status === 'draft') {
            errors.push('This project is still in draft mode and not accepting donations');
        } else if (project.status === 'paused') {
            errors.push('This project is currently paused and not accepting donations');
        } else if (project.status === 'cancelled') {
            errors.push('This project has been cancelled and is no longer accepting donations');
        } else if (project.status === 'completed') {
            errors.push('This project has already been completed');
        } else if (project.status === 'suspended') {
            errors.push('This project has been suspended and cannot accept donations');
        } else if (project.status === 'rejected') {
            errors.push('This project has been rejected and cannot accept donations');
        } else if (project.status === 'pending_verification') {
            errors.push('This project is pending verification and cannot accept donations yet');
        }

        // Check if project has ended (based on endDate)
        if (project.endDate) {
            const endDate = project.endDate.toDate();
            const now = new Date();

            if (endDate < now) {
                errors.push('This project has ended and is no longer accepting donations');
            } else {
                // Warning if project is ending soon (within 24 hours)
                const hoursRemaining = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                if (hoursRemaining <= 24 && hoursRemaining > 0) {
                    warnings.push(`This project ends in ${Math.floor(hoursRemaining)} hours`);
                }
            }
        }

        // Check funding goal (optional warning)
        if (project.goal && project.raised) {
            const remaining = project.goal - project.raised;
            if (remaining <= 0) {
                warnings.push('This project has already reached its funding goal! Your contribution will still help.');
            } else if (remaining > 0 && remaining < VALIDATION_RULES.MIN_AMOUNT) {
                warnings.push(`This project only needs ₹${remaining.toLocaleString('en-IN')} more to reach its goal`);
            }
        }

        // Check approval status
        if (project.approvalStatus === 'rejected') {
            errors.push('This project has been rejected by administrators');
        } else if (project.approvalStatus === 'pending') {
            warnings.push('This project is awaiting approval');
        }

    } catch (error) {
        console.error('Error validating project:', error);
        errors.push('Failed to validate project. Please try again.');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Checks rate limiting for donations
 * Prevents users from making too many donations too quickly
 */
export function checkRateLimit(userId: string): DonationValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const now = Date.now();
    const userDonations = recentDonations.get(userId) || [];

    // Filter donations within the rate limit window
    const recentUserDonations = userDonations.filter(
        timestamp => now - timestamp < VALIDATION_RULES.RATE_LIMIT_WINDOW
    );

    // Update the map with filtered timestamps
    recentDonations.set(userId, recentUserDonations);

    // Check if user has exceeded the rate limit
    if (recentUserDonations.length >= VALIDATION_RULES.MAX_DONATIONS_PER_MINUTE) {
        errors.push(
            `You are making donations too quickly. Please wait a moment before trying again. ` +
            `(Maximum ${VALIDATION_RULES.MAX_DONATIONS_PER_MINUTE} donations per minute)`
        );
    } else if (recentUserDonations.length >= VALIDATION_RULES.MAX_DONATIONS_PER_MINUTE - 1) {
        warnings.push('You are approaching the donation rate limit');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Records a donation attempt for rate limiting
 * Should be called after a successful donation
 */
export function recordDonationAttempt(userId: string): void {
    const now = Date.now();
    const userDonations = recentDonations.get(userId) || [];
    userDonations.push(now);
    recentDonations.set(userId, userDonations);

    // Cleanup old entries periodically
    if (Math.random() < 0.1) { // 10% chance to cleanup
        cleanupRateLimitCache();
    }
}

/**
 * Cleans up old rate limit entries
 * Removes entries older than the rate limit window
 */
function cleanupRateLimitCache(): void {
    const now = Date.now();

    for (const [userId, timestamps] of recentDonations.entries()) {
        const recentTimestamps = timestamps.filter(
            timestamp => now - timestamp < VALIDATION_RULES.RATE_LIMIT_WINDOW
        );

        if (recentTimestamps.length === 0) {
            recentDonations.delete(userId);
        } else {
            recentDonations.set(userId, recentTimestamps);
        }
    }
}

/**
 * Validates payment details
 */
export function validatePaymentDetails(details: {
    name?: string;
    email?: string;
    phone?: string;
}): DonationValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate name
    if (!details.name || details.name.trim() === '') {
        errors.push('Name is required');
    } else if (details.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    } else if (details.name.trim().length > 100) {
        errors.push('Name must be less than 100 characters');
    }

    // Validate email
    if (!details.email || details.email.trim() === '') {
        errors.push('Email is required');
    } else {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(details.email)) {
            errors.push('Please enter a valid email address');
        }
    }

    // Validate phone (optional)
    if (details.phone && details.phone.trim() !== '') {
        // Remove spaces and special characters for validation
        const cleanPhone = details.phone.replace(/[\s\-\(\)]/g, '');

        // Check if it's a valid Indian phone number (10 digits, optionally with +91)
        const phonePattern = /^(\+91)?[6-9]\d{9}$/;
        if (!phonePattern.test(cleanPhone)) {
            warnings.push('Phone number format may be invalid. Expected format: +91 XXXXX XXXXX');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Comprehensive pre-donation validation
 * Call this before showing the payment modal
 */
export async function preValidateDonation(
    userId: string,
    projectId: string
): Promise<DonationValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Quick checks
    if (!userId) {
        errors.push('Please sign in to make a donation');
        return { isValid: false, errors, warnings };
    }

    if (!projectId) {
        errors.push('Invalid project');
        return { isValid: false, errors, warnings };
    }

    // Validate project
    const projectValidation = await validateProject(projectId, userId);
    errors.push(...projectValidation.errors);
    warnings.push(...projectValidation.warnings);

    // Check rate limit
    const rateLimitCheck = checkRateLimit(userId);
    errors.push(...rateLimitCheck.errors);
    warnings.push(...rateLimitCheck.warnings);

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}
