/**
 * HTML Sanitization Utilities
 * Prevents XSS attacks when rendering user-generated HTML content
 */
import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - Potentially unsafe HTML string
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export const sanitizeHTML = (dirty: string): string => {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [
            'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'strike',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'a', 'blockquote', 'code', 'pre',
            'span', 'div'
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
        ALLOW_DATA_ATTR: false,
        // Force links to open in new tab with security attributes
        FORCE_BODY: true,
        ADD_ATTR: ['target', 'rel'],
    });
};

/**
 * Sanitize and process HTML content for display
 * Adds security attributes to links
 * @param html - HTML content to process
 * @returns Processed HTML safe for rendering
 */
export const sanitizeAndProcessHTML = (html: string): string => {
    const sanitized = sanitizeHTML(html);

    // Add target="_blank" and rel="noopener noreferrer" to all links
    const processedHtml = sanitized.replace(
        /<a\s+([^>]*?)>/gi,
        (_fullMatch, attrs: string) => {
            let newAttrs = attrs;
            if (!attrs.includes('target=')) {
                newAttrs += ' target="_blank"';
            }
            if (!attrs.includes('rel=')) {
                newAttrs += ' rel="noopener noreferrer"';
            }
            return `<a ${newAttrs}>`;
        }
    );

    return processedHtml;
};

export default sanitizeHTML;
