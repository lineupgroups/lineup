/**
 * Transaction Utilities
 * 
 * Handles generation of unique transaction IDs, payment references,
 * and transaction validation for the donation system.
 */

/**
 * Generates a unique transaction ID
 * Format: TXN_timestamp_randomString
 * Example: TXN_1732812345678_ABC123XYZ
 */
export function generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `TXN_${timestamp}_${random}`.toUpperCase();
}

/**
 * Validates transaction ID format
 * @param id - The transaction ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidTransactionId(id: string): boolean {
    if (!id || typeof id !== 'string') return false;

    // Format: TXN_digits_alphanumeric
    const pattern = /^TXN_\d{13}_[A-Z0-9]+$/;
    return pattern.test(id);
}

/**
 * Generates a payment reference number
 * Format: PAY_timestamp_randomString
 * Example: PAY_1732812345678_XYZ789ABC
 */
export function generatePaymentReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `PAY_${timestamp}_${random}`.toUpperCase();
}

/**
 * Validates payment reference format
 * @param ref - The payment reference to validate
 * @returns true if valid, false otherwise
 */
export function isValidPaymentReference(ref: string): boolean {
    if (!ref || typeof ref !== 'string') return false;

    // Format: PAY_digits_alphanumeric
    const pattern = /^PAY_\d{13}_[A-Z0-9]+$/;
    return pattern.test(ref);
}

/**
 * Generates a receipt number for donation receipts
 * Format: RCP_timestamp_randomString
 * Example: RCP_1732812345678_123ABC
 */
export function generateReceiptNumber(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `RCP_${timestamp}_${random}`.toUpperCase();
}

/**
 * Extracts timestamp from a transaction ID
 * @param transactionId - The transaction ID
 * @returns Date object or null if invalid
 */
export function getTransactionTimestamp(transactionId: string): Date | null {
    if (!isValidTransactionId(transactionId)) return null;

    try {
        const parts = transactionId.split('_');
        const timestamp = parseInt(parts[1], 10);
        return new Date(timestamp);
    } catch (error) {
        return null;
    }
}

/**
 * Formats a transaction ID for display
 * @param transactionId - The full transaction ID
 * @returns Shortened version for display (e.g., TXN_***_ABC123)
 */
export function formatTransactionIdForDisplay(transactionId: string): string {
    if (!isValidTransactionId(transactionId)) return transactionId;

    try {
        const parts = transactionId.split('_');
        const suffix = parts[2].substring(0, 6);
        return `TXN_***_${suffix}`;
    } catch (error) {
        return transactionId;
    }
}

/**
 * Generates a unique donation ID
 * Combines user ID, project ID, and timestamp for uniqueness
 */
export function generateDonationId(userId: string, projectId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    return `DON_${userId.substring(0, 8)}_${projectId.substring(0, 8)}_${timestamp}_${random}`.toUpperCase();
}
