/**
 * Simple HTML sanitization utility to prevent XSS attacks
 * For production, consider using DOMPurify library
 */

export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // Basic HTML entity encoding
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  
  // Allow only http, https, and mailto protocols
  const allowedProtocols = ['http:', 'https:', 'mailto:'];
  
  try {
    const parsedUrl = new URL(url);
    if (allowedProtocols.includes(parsedUrl.protocol)) {
      return url;
    }
  } catch (_e) {
    // Invalid URL
  }
  
  // If no protocol or invalid, assume https
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
    return `https://${url}`;
  }
  
  return '';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const validateImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const parsedUrl = new URL(url);
    const allowedDomains = [
      'res.cloudinary.com',
      'images.unsplash.com', 
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com' // Google profile images
    ];
    
    return allowedDomains.some(domain => parsedUrl.hostname.includes(domain));
  } catch (_e) {
    return false;
  }
};
