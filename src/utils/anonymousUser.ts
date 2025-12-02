/**
 * Anonymous User Utilities
 * Handles anonymous display for donors, backers, and supporters
 */

/**
 * Generate a consistent anonymous identifier for a user
 * Format: anonymous_user3284#2
 * The number is derived from the userId hash to ensure consistency
 */
export const generateAnonymousId = (userId: string): string => {
    // Create a simple hash from userId
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        const char = userId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    // Get positive number between 1000-9999
    const userNum = Math.abs(hash % 9000) + 1000;

    // Get check digit (last digit of hash)
    const checkDigit = Math.abs(hash % 10);

    return `anonymous_user${userNum}#${checkDigit}`;
};

/**
 * Check if a user should be displayed anonymously
 */
export interface AnonymousDisplayConfig {
    isAnonymous: boolean;
    displayName?: string;
    profileImage?: string;
    showEmail?: boolean;
    showStats?: boolean;
}

/**
 * Get the display configuration for a user based on privacy settings
 * and whether they've chosen to be anonymous in a specific context
 */
export const getAnonymousDisplayConfig = (
    user: {
        id: string;
        displayName: string;
        profileImage?: string;
        isPublic?: boolean;
        showEmail?: boolean;
        showStats?: boolean;
    },
    isAnonymousContext = false // e.g., anonymous backing
): AnonymousDisplayConfig => {
    if (isAnonymousContext) {
        return {
            isAnonymous: true,
            displayName: generateAnonymousId(user.id),
            profileImage: undefined,
            showEmail: false,
            showStats: false
        };
    }

    return {
        isAnonymous: false,
        displayName: user.displayName,
        profileImage: user.profileImage,
        showEmail: user.showEmail ?? false,
        showStats: user.showStats ?? true
    };
};

/**
 * Filter user data based on privacy settings and viewer relationship
 */
export const filterUserDataByPrivacy = (
    userData: any,
    viewerId: string | null,
    isOwnProfile: boolean
) => {
    // Owner sees everything
    if (isOwnProfile) {
        return userData;
    }

    // Not authenticated - show minimal public info
    if (!viewerId) {
        return {
            id: userData.id,
            username: userData.username,
            displayName: userData.displayName,
            profileImage: userData.profileImage,
            isPublic: userData.isPublic
        };
    }

    // Profile is private - show basic info only
    if (userData.isPublic === false) {
        return {
            id: userData.id,
            username: userData.username,
            displayName: userData.displayName,
            profileImage: userData.profileImage,
            isPublic: false,
            bio: "This profile is private"
        };
    }

    // Profile is public - filter based on individual privacy settings
    const filteredData = { ...userData };

    // Remove email if not allowed to show
    if (!userData.showEmail) {
        delete filteredData.email;
    }

    // Remove or hide stats if not allowed
    if (!userData.showStats) {
        filteredData.stats = {
            projectsCreated: 0,
            projectsBacked: 0,
            totalRaised: 0,
            totalBacked: 0,
            followersCount: userData.stats?.followersCount || 0,
            followingCount: 0,
            successRate: 0
        };
    }

    // Hide backed projects if not allowed
    if (!userData.showBackedProjects) {
        filteredData.showBackedProjects = false;
    }

    return filteredData;
};

/**
 * Determine if a user should be displayed as anonymous
 * @param userIsPublic - Whether the user's profile is public
 * @param userDonateAnonymousByDefault - User's global anonymous preference
 * @param transactionAnonymousOverride - Per-transaction anonymous choice
 * @returns true if should display as anonymous
 */
export const shouldDisplayAsAnonymous = (
    userIsPublic: boolean,
    userDonateAnonymousByDefault: boolean = false,
    transactionAnonymousOverride?: boolean
): boolean => {
    // Rule 1: Private profiles are ALWAYS anonymous
    if (!userIsPublic) {
        return true;
    }

    // Rule 2: If transaction has explicit override, use that
    if (transactionAnonymousOverride !== undefined) {
        return transactionAnonymousOverride;
    }

    // Rule 3: Use global preference
    return userDonateAnonymousByDefault;
};

/**
 * Get display information for a user (name and image)
 * @param user - User object
 * @param isAnonymous - Whether to display anonymously
 * @returns Display name and profile image
 */
export const getDisplayInfo = (
    user: {
        id: string;
        displayName: string;
        profileImage?: string;
    },
    isAnonymous: boolean
): { displayName: string; displayProfileImage?: string } => {
    if (isAnonymous) {
        return {
            displayName: generateAnonymousId(user.id),
            displayProfileImage: undefined
        };
    }

    return {
        displayName: user.displayName,
        displayProfileImage: user.profileImage
    };
};

/**
 * Generate a default profile picture URL based on user's name
 * Uses a deterministic color based on the user's ID
 */
export const generateDefaultProfilePic = (userId: string, displayName: string): string => {
    // Simple hash to generate consistent colors
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate a pleasant color palette
    const colors = [
        ['#4F46E5', '#818CF8'], // Indigo
        ['#7C3AED', '#A78BFA'], // Violet
        ['#DB2777', '#F472B6'], // Pink
        ['#DC2626', '#F87171'], // Red
        ['#EA580C', '#FB923C'], // Orange
        ['#CA8A04', '#FACC15'], // Yellow
        ['#16A34A', '#4ADE80'], // Green
        ['#0891B2', '#22D3EE'], // Cyan
        ['#2563EB', '#60A5FA'], // Blue
    ];

    const colorPair = colors[Math.abs(hash) % colors.length];
    const initials = displayName
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);

    // Return a data URL with SVG
    const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-${userId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colorPair[0]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colorPair[1]};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#grad-${userId})" />
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="80" font-weight="bold" 
            fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
    </svg>
  `.trim();

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};
