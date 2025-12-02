/**
 * Social Link Validation Utility
 * Provides strict validation for social media links with domain whitelisting
 * and security checks to prevent malicious URLs
 */

export interface ValidationResult {
    isValid: boolean;
    error?: string;
    sanitized?: string;
}

// Strict domain whitelists for each platform
const ALLOWED_DOMAINS = {
    twitter: ['twitter.com', 'x.com'],
    linkedin: ['linkedin.com'],
    github: ['github.com'],
    instagram: ['instagram.com'],
    facebook: ['facebook.com', 'fb.com'],
    youtube: ['youtube.com', 'youtu.be'],
    website: [] // No restrictions for custom websites, but still validated
};

// Dangerous protocols to block
const BLOCKED_PROTOCOLS = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
];

/**
 * Validates and sanitizes a social media link
 */
export const validateSocialLink = (
    platform: keyof typeof ALLOWED_DOMAINS,
    value: string
): ValidationResult => {
    // Empty values are allowed (user can clear a field)
    if (!value || value.trim() === '') {
        return { isValid: true, sanitized: '' };
    }

    const trimmedValue = value.trim();

    // Check for dangerous protocols
    const lowerValue = trimmedValue.toLowerCase();
    for (const protocol of BLOCKED_PROTOCOLS) {
        if (lowerValue.startsWith(protocol)) {
            return {
                isValid: false,
                error: 'Invalid protocol. Only http:// and https:// are allowed.',
            };
        }
    }

    // Platform-specific validation
    switch (platform) {
        case 'twitter':
            return validateTwitter(trimmedValue);
        case 'linkedin':
            return validateLinkedIn(trimmedValue);
        case 'github':
            return validateGitHub(trimmedValue);
        case 'instagram':
            return validateInstagram(trimmedValue);
        case 'facebook':
            return validateFacebook(trimmedValue);
        case 'youtube':
            return validateYouTube(trimmedValue);
        case 'website':
            return validateWebsite(trimmedValue);
        default:
            return { isValid: false, error: 'Unknown platform' };
    }
};

/**
 * Twitter/X validation
 * Accepts: @username, username, https://twitter.com/username, https://x.com/username
 */
const validateTwitter = (value: string): ValidationResult => {
    // Remove @ prefix if present
    const cleanValue = value.startsWith('@') ? value.slice(1) : value;

    // If it's a URL
    if (cleanValue.startsWith('http://') || cleanValue.startsWith('https://')) {
        try {
            const url = new URL(cleanValue);
            const allowedDomains = ALLOWED_DOMAINS.twitter;

            // Check if domain is whitelisted
            if (!allowedDomains.some(domain => url.hostname === domain || url.hostname === `www.${domain}`)) {
                return {
                    isValid: false,
                    error: `Only ${allowedDomains.join(', ')} URLs are allowed for Twitter.`,
                };
            }

            // Extract username from path
            const pathParts = url.pathname.split('/').filter(Boolean);
            if (pathParts.length === 0) {
                return { isValid: false, error: 'Invalid Twitter profile URL.' };
            }

            const username = pathParts[0];
            if (!isValidTwitterUsername(username)) {
                return { isValid: false, error: 'Invalid Twitter username format.' };
            }

            return { isValid: true, sanitized: `https://twitter.com/${username}` };
        } catch {
            return { isValid: false, error: 'Invalid URL format.' };
        }
    }

    // Plain username validation
    if (!isValidTwitterUsername(cleanValue)) {
        return {
            isValid: false,
            error: 'Twitter usernames can only contain letters, numbers, and underscores (max 15 chars).',
        };
    }

    return { isValid: true, sanitized: `https://twitter.com/${cleanValue}` };
};

const isValidTwitterUsername = (username: string): boolean => {
    return /^[a-zA-Z0-9_]{1,15}$/.test(username);
};

/**
 * LinkedIn validation
 * Accepts: https://linkedin.com/in/username
 */
const validateLinkedIn = (value: string): ValidationResult => {
    try {
        const url = value.startsWith('http') ? new URL(value) : new URL(`https://${value}`);
        const allowedDomains = ALLOWED_DOMAINS.linkedin;

        if (!allowedDomains.some(domain => url.hostname === domain || url.hostname === `www.${domain}`)) {
            return {
                isValid: false,
                error: 'Only linkedin.com URLs are allowed.',
            };
        }

        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length < 2 || pathParts[0] !== 'in') {
            return {
                isValid: false,
                error: 'LinkedIn URL must be in format: linkedin.com/in/your-profile',
            };
        }

        const username = pathParts[1];
        if (!/^[a-zA-Z0-9-]{3,100}$/.test(username)) {
            return { isValid: false, error: 'Invalid LinkedIn profile name format.' };
        }

        return { isValid: true, sanitized: `https://linkedin.com/in/${username}` };
    } catch {
        return { isValid: false, error: 'Invalid LinkedIn URL format.' };
    }
};

/**
 * GitHub validation
 * Accepts: username, https://github.com/username
 */
const validateGitHub = (value: string): ValidationResult => {
    try {
        let username: string;

        if (value.startsWith('http://') || value.startsWith('https://')) {
            const url = new URL(value);
            const allowedDomains = ALLOWED_DOMAINS.github;

            if (!allowedDomains.some(domain => url.hostname === domain || url.hostname === `www.${domain}`)) {
                return { isValid: false, error: 'Only github.com URLs are allowed.' };
            }

            const pathParts = url.pathname.split('/').filter(Boolean);
            if (pathParts.length === 0) {
                return { isValid: false, error: 'Invalid GitHub profile URL.' };
            }

            username = pathParts[0];
        } else {
            username = value;
        }

        // GitHub username rules: alphanumeric and hyphens, cannot start/end with hyphen
        if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(username) || username.length > 39) {
            return {
                isValid: false,
                error: 'Invalid GitHub username format (max 39 chars, alphanumeric and hyphens).',
            };
        }

        return { isValid: true, sanitized: `https://github.com/${username}` };
    } catch {
        return { isValid: false, error: 'Invalid GitHub URL format.' };
    }
};

/**
 * Instagram validation
 * Accepts: @username, username, https://instagram.com/username
 */
const validateInstagram = (value: string): ValidationResult => {
    const cleanValue = value.startsWith('@') ? value.slice(1) : value;

    try {
        let username: string;

        if (cleanValue.startsWith('http://') || cleanValue.startsWith('https://')) {
            const url = new URL(cleanValue);
            const allowedDomains = ALLOWED_DOMAINS.instagram;

            if (!allowedDomains.some(domain => url.hostname === domain || url.hostname === `www.${domain}`)) {
                return { isValid: false, error: 'Only instagram.com URLs are allowed.' };
            }

            const pathParts = url.pathname.split('/').filter(Boolean);
            if (pathParts.length === 0) {
                return { isValid: false, error: 'Invalid Instagram profile URL.' };
            }

            username = pathParts[0];
        } else {
            username = cleanValue;
        }

        // Instagram username rules: alphanumeric, periods, underscores (max 30 chars)
        if (!/^[a-zA-Z0-9._]{1,30}$/.test(username)) {
            return {
                isValid: false,
                error: 'Instagram usernames can contain letters, numbers, periods, and underscores (max 30 chars).',
            };
        }

        return { isValid: true, sanitized: `https://instagram.com/${username}` };
    } catch {
        return { isValid: false, error: 'Invalid Instagram URL format.' };
    }
};

/**
 * Facebook validation
 * Accepts: https://facebook.com/username
 */
const validateFacebook = (value: string): ValidationResult => {
    try {
        const url = value.startsWith('http') ? new URL(value) : new URL(`https://${value}`);
        const allowedDomains = ALLOWED_DOMAINS.facebook;

        if (!allowedDomains.some(domain => url.hostname === domain || url.hostname === `www.${domain}`)) {
            return { isValid: false, error: 'Only facebook.com or fb.com URLs are allowed.' };
        }

        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length === 0) {
            return { isValid: false, error: 'Invalid Facebook profile URL.' };
        }

        const username = pathParts[0];
        if (!/^[a-zA-Z0-9.]{5,50}$/.test(username)) {
            return { isValid: false, error: 'Invalid Facebook username format.' };
        }

        return { isValid: true, sanitized: `https://facebook.com/${username}` };
    } catch {
        return { isValid: false, error: 'Invalid Facebook URL format.' };
    }
};

/**
 * YouTube validation
 * Accepts: https://youtube.com/c/channel, https://youtube.com/channel/ID, https://youtube.com/user/username
 */
const validateYouTube = (value: string): ValidationResult => {
    try {
        const url = value.startsWith('http') ? new URL(value) : new URL(`https://${value}`);
        const allowedDomains = ALLOWED_DOMAINS.youtube;

        if (!allowedDomains.some(domain => url.hostname === domain || url.hostname === `www.${domain}`)) {
            return { isValid: false, error: 'Only youtube.com or youtu.be URLs are allowed.' };
        }

        // YouTube has multiple URL formats, so we don't strictly enforce structure
        // Just ensure it's a valid domain
        return { isValid: true, sanitized: url.toString() };
    } catch {
        return { isValid: false, error: 'Invalid YouTube URL format.' };
    }
};

/**
 * Website validation
 * More lenient but still checks for valid URL structure and blocks dangerous protocols
 */
const validateWebsite = (value: string): ValidationResult => {
    try {
        const url = value.startsWith('http://') || value.startsWith('https://')
            ? new URL(value)
            : new URL(`https://${value}`);

        // Check protocol
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return { isValid: false, error: 'Only http:// and https:// protocols are allowed.' };
        }

        // Basic domain validation
        if (!url.hostname || url.hostname.length < 3 || !url.hostname.includes('.')) {
            return { isValid: false, error: 'Invalid domain name.' };
        }

        // Block localhost and private IPs
        if (
            url.hostname === 'localhost' ||
            url.hostname.startsWith('127.') ||
            url.hostname.startsWith('192.168.') ||
            url.hostname.startsWith('10.') ||
            /^172\.(1[6-9]|2[0-9]|3[01])\./.test(url.hostname)
        ) {
            return { isValid: false, error: 'Private/local addresses are not allowed.' };
        }

        return { isValid: true, sanitized: url.toString() };
    } catch {
        return { isValid: false, error: 'Invalid website URL format.' };
    }
};

/**
 * Get user-friendly platform names
 */
export const getPlatformLabel = (platform: string): string => {
    const labels: Record<string, string> = {
        twitter: 'Twitter/X',
        linkedin: 'LinkedIn',
        github: 'GitHub',
        instagram: 'Instagram',
        facebook: 'Facebook',
        youtube: 'YouTube',
        website: 'Website',
    };
    return labels[platform] || platform;
};
