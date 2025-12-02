import { Timestamp } from 'firebase/firestore';

/**
 * Gets the status of a project based on its end date and funding
 */
export function getProjectStatus(
    endDate: Timestamp | Date | any,
    raised: number,
    goal: number
): {
    status: 'active' | 'expired' | 'successful' | 'failed';
    daysLeft: number;
    isExpired: boolean;
    isSuccessful: boolean;
} {
    // Calculate actual days (can be negative)
    const daysLeft = calculateDaysLeft(endDate);
    const isExpired = daysLeft <= 0;
    const fundingPercentage = (raised / goal) * 100;
    const isFullyFunded = fundingPercentage >= 100;

    // Determine status
    let status: 'active' | 'expired' | 'successful' | 'failed';

    if (!isExpired) {
        status = 'active';
    } else if (isFullyFunded) {
        status = 'successful';
    } else {
        status = 'failed';
    }

    return {
        status,
        daysLeft: Math.max(0, daysLeft), // UI shows 0 for expired
        isExpired,
        isSuccessful: isFullyFunded
    };
}

/**
 * Calculates days left (can return negative for expired projects)
 */
function calculateDaysLeft(endDate: Timestamp | Date | any): number {
    if (!endDate) return 0;

    try {
        const now = new Date();
        let endDateTime: Date;

        // Handle Firestore Timestamp
        if (endDate && typeof endDate.toDate === 'function') {
            endDateTime = endDate.toDate();
        }
        // Handle Date object
        else if (endDate instanceof Date) {
            endDateTime = endDate;
        }
        // Handle timestamp number or string
        else if (typeof endDate === 'number' || typeof endDate === 'string') {
            endDateTime = new Date(endDate);
        }
        // Handle object with seconds (Firestore timestamp-like)
        else if (endDate && typeof endDate === 'object' && 'seconds' in endDate) {
            endDateTime = new Date(endDate.seconds * 1000);
        }
        // Handle object with _seconds (Firestore internal format)
        else if (endDate && typeof endDate === 'object' && '_seconds' in endDate) {
            endDateTime = new Date((endDate._seconds || endDate._seconds) * 1000);
        }
        else {
            console.warn('Unknown endDate format:', endDate);
            return 0;
        }

        const diffTime = endDateTime.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Return actual days (can be negative)
        return diffDays;
    } catch (error) {
        console.error('Error calculating days left:', error);
        return 0;
    }
}

/**
 * Gets a human-readable status label
 */
export function getStatusLabel(status: 'active' | 'expired' | 'successful' | 'failed'): string {
    switch (status) {
        case 'active':
            return 'Active';
        case 'expired':
            return 'Expired';
        case 'successful':
            return 'Successful';
        case 'failed':
            return 'Funding Failed';
        default:
            return 'Unknown';
    }
}

/**
 * Gets status badge color classes
 */
export function getStatusColor(status: 'active' | 'expired' | 'successful' | 'failed'): string {
    switch (status) {
        case 'active':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'successful':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'expired':
        case 'failed':
            return 'bg-gray-100 text-gray-800 border-gray-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}
