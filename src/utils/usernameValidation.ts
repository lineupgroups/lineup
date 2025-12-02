// Username validation rules and utilities

export const USERNAME_RULES = {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    RATE_LIMIT_DAYS: 7, // Can change username once every 7 days
    PATTERN: /^[a-zA-Z0-9_]+$/, // Alphanumeric and underscores only
};

// Reserved usernames that cannot be used
export const RESERVED_USERNAMES = [
    'admin',
    'administrator',
    'moderator',
    'mod',
    'support',
    'help',
    'api',
    'system',
    'root',
    'superuser',
    'lineup',
    'official',
    'team',
    'staff',
    'bot',
    'null',
    'undefined',
    'discover',
    'trending',
    'explore',
    'settings',
    'profile',
    'user',
    'users',
    'login',
    'logout',
    'signup',
    'register',
    'signin',
    'signout',
];

export interface UsernameValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validate username format and rules
 */
export const validateUsername = (username: string): UsernameValidationResult => {
    // Check if empty
    if (!username || username.trim() === '') {
        return {
            isValid: false,
            error: 'Username is required'
        };
    }

    // Trim and convert to lowercase for validation
    const trimmedUsername = username.trim();
    const lowerUsername = trimmedUsername.toLowerCase();

    // Check length
    if (trimmedUsername.length < USERNAME_RULES.MIN_LENGTH) {
        return {
            isValid: false,
            error: `Username must be at least ${USERNAME_RULES.MIN_LENGTH} characters`
        };
    }

    if (trimmedUsername.length > USERNAME_RULES.MAX_LENGTH) {
        return {
            isValid: false,
            error: `Username cannot exceed ${USERNAME_RULES.MAX_LENGTH} characters`
        };
    }

    // Check pattern (alphanumeric and underscores only)
    if (!USERNAME_RULES.PATTERN.test(trimmedUsername)) {
        return {
            isValid: false,
            error: 'Username can only contain letters, numbers, and underscores'
        };
    }

    // Check if starts or ends with underscore
    if (trimmedUsername.startsWith('_') || trimmedUsername.endsWith('_')) {
        return {
            isValid: false,
            error: 'Username cannot start or end with an underscore'
        };
    }

    // Check for consecutive underscores
    if (trimmedUsername.includes('__')) {
        return {
            isValid: false,
            error: 'Username cannot contain consecutive underscores'
        };
    }

    // Check reserved usernames
    if (RESERVED_USERNAMES.includes(lowerUsername)) {
        return {
            isValid: false,
            error: 'This username is reserved and cannot be used'
        };
    }

    return {
        isValid: true
    };
};

/**
 * Normalize username for storage (lowercase, trimmed)
 */
export const normalizeUsername = (username: string): string => {
    return username.trim().toLowerCase();
};

/**
 * Format username for display (preserve original case, trimmed)
 */
export const formatUsernameForDisplay = (username: string): string => {
    return username.trim();
};

/**
 * Calculate days remaining until next username change is allowed
 */
export const getDaysUntilNextChange = (lastChangedAt: Date | null): number => {
    if (!lastChangedAt) {
        return 0; // Can change immediately if never changed
    }

    const now = new Date();
    const daysSinceChange = Math.floor((now.getTime() - lastChangedAt.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, USERNAME_RULES.RATE_LIMIT_DAYS - daysSinceChange);

    return daysRemaining;
};

/**
 * Check if user can change username based on rate limit
 */
export const canChangeUsername = (lastChangedAt: Date | null): boolean => {
    return getDaysUntilNextChange(lastChangedAt) === 0;
};

/**
 * Get the next allowed change date
 */
export const getNextAllowedChangeDate = (lastChangedAt: Date | null): Date | null => {
    if (!lastChangedAt) {
        return null;
    }

    const nextDate = new Date(lastChangedAt);
    nextDate.setDate(nextDate.getDate() + USERNAME_RULES.RATE_LIMIT_DAYS);
    return nextDate;
};
