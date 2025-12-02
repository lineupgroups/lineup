/**
 * Utility functions for handling user names in UI components
 */

/**
 * Truncates a name to fit within a given character limit
 * @param name - The full name to truncate
 * @param maxLength - Maximum number of characters (default: 15)
 * @returns Truncated name with ellipsis if needed
 */
export const truncateName = (name: string, maxLength: number = 15): string => {
  if (!name) return '';
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 1).trim() + '…';
};

/**
 * Gets the first name from a full name
 * @param fullName - The full name
 * @returns First name only
 */
export const getFirstName = (fullName: string): string => {
  if (!fullName) return '';
  return fullName.split(' ')[0];
};

/**
 * Gets a responsive display name based on available space
 * @param fullName - The full name
 * @param context - The context where the name will be displayed
 * @returns Appropriately sized name
 */
export const getResponsiveName = (fullName: string, context: 'navbar' | 'mobile' | 'profile' = 'navbar'): string => {
  if (!fullName) return '';
  
  switch (context) {
    case 'navbar':
      // For navbar, show first name if full name is too long
      if (fullName.length > 12) {
        return getFirstName(fullName);
      }
      return fullName;
    
    case 'mobile':
      // For mobile, allow longer names but truncate if necessary
      return truncateName(fullName, 20);
    
    case 'profile':
      // For profile pages, show full name
      return fullName;
    
    default:
      return fullName;
  }
};
