/**
 * Keyword Extraction and Matching System
 * Extracts meaningful keywords from text and matches them for recommendations
 */

// Common stop words to filter out (Hindi + English)
const STOP_WORDS = new Set([
  // English
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
  'very', 'just', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down',
  // Hindi/Hinglish common
  'ka', 'ki', 'ke', 'ko', 'se', 'me', 'par', 'hai', 'hain', 'tha', 'thi', 'the', 'aur', 'ya', 'kya'
]);

// Category-specific important keywords
const CATEGORY_KEYWORDS: { [key: string]: Set<string> } = {
  technology: new Set(['tech', 'software', 'app', 'ai', 'ml', 'iot', 'blockchain', 'web', 'mobile', 'cloud', 'digital', 'innovation']),
  education: new Set(['education', 'learning', 'school', 'college', 'student', 'teacher', 'course', 'training', 'skill', 'knowledge']),
  health: new Set(['health', 'medical', 'doctor', 'hospital', 'medicine', 'wellness', 'fitness', 'healthcare', 'clinic', 'therapy']),
  environment: new Set(['environment', 'green', 'eco', 'sustainable', 'climate', 'nature', 'renewable', 'pollution', 'conservation']),
  social: new Set(['social', 'community', 'ngo', 'charity', 'volunteer', 'help', 'support', 'welfare', 'awareness', 'empowerment']),
  art: new Set(['art', 'music', 'dance', 'painting', 'creative', 'artist', 'performance', 'exhibition', 'culture', 'craft']),
  business: new Set(['business', 'startup', 'entrepreneur', 'enterprise', 'company', 'venture', 'commerce', 'trade', 'market']),
  agriculture: new Set(['agriculture', 'farming', 'farmer', 'crop', 'organic', 'rural', 'harvest', 'irrigation', 'food']),
  sports: new Set(['sports', 'athlete', 'game', 'tournament', 'competition', 'training', 'fitness', 'team', 'player'])
};

/**
 * Extract keywords from text
 */
export function extractKeywords(text: string, maxKeywords = 20): string[] {
  if (!text) return [];

  // Convert to lowercase and clean
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Split into words
  const words = cleaned.split(' ');

  // Count word frequency (excluding stop words)
  const frequency: { [word: string]: number } = {};
  
  words.forEach(word => {
    if (word.length > 2 && !STOP_WORDS.has(word)) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
  });

  // Boost category-relevant keywords
  Object.keys(frequency).forEach(word => {
    Object.values(CATEGORY_KEYWORDS).forEach(catKeywords => {
      if (catKeywords.has(word)) {
        frequency[word] *= 2; // 2x boost for category keywords
      }
    });
  });

  // Sort by frequency and return top keywords
  const keywords = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);

  return keywords;
}

/**
 * Extract keywords from project title
 */
export function extractFromTitle(title: string): string[] {
  return extractKeywords(title, 10);
}

/**
 * Extract keywords from project description
 */
export function extractFromDescription(description: string): string[] {
  return extractKeywords(description, 15);
}

/**
 * Extract keywords from both title and description
 */
export function extractFromProject(title: string, description: string): string[] {
  const titleKeywords = extractFromTitle(title);
  const descKeywords = extractFromDescription(description);
  
  // Merge and deduplicate
  const combined = [...new Set([...titleKeywords, ...descKeywords])];
  
  return combined.slice(0, 20);
}

/**
 * Build user keyword profile from their interaction history
 */
export function buildUserKeywordProfile(
  viewedProjects: Array<{ title: string; description: string; category: string }>,
  interactions: Array<{ projectTitle?: string; category: string }>
): string[] {
  const allText: string[] = [];

  // Add viewed project data
  viewedProjects.forEach(project => {
    allText.push(project.title);
    allText.push(project.description);
    allText.push(project.category.toLowerCase());
  });

  // Add interaction data
  interactions.forEach(interaction => {
    if (interaction.projectTitle) {
      allText.push(interaction.projectTitle);
    }
    allText.push(interaction.category.toLowerCase());
  });

  // Extract keywords from combined text
  const combinedText = allText.join(' ');
  return extractKeywords(combinedText, 30);
}

/**
 * Match keywords between user profile and project
 */
export function matchKeywords(
  userKeywords: string[],
  projectKeywords: string[],
  projectTitle: string
): {
  matches: string[];
  score: number;
  titleMatches: number;
} {
  const userSet = new Set(userKeywords);
  const projectSet = new Set(projectKeywords);
  
  // Find matching keywords
  const matches = Array.from(projectSet).filter(keyword => userSet.has(keyword));
  
  // Check title matches (worth more)
  const titleWords = extractFromTitle(projectTitle);
  const titleMatches = matches.filter(keyword => titleWords.includes(keyword)).length;
  
  // Calculate score
  // Base: 10 points per match
  // Title matches: 20 points each
  const score = (matches.length * 10) + (titleMatches * 20);
  
  return {
    matches,
    score,
    titleMatches
  };
}

/**
 * Calculate keyword similarity between two projects
 */
export function calculateKeywordSimilarity(
  keywords1: string[],
  keywords2: string[]
): number {
  if (keywords1.length === 0 || keywords2.length === 0) return 0;

  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);

  // Calculate Jaccard similarity
  const intersection = Array.from(set1).filter(k => set2.has(k)).length;
  const union = new Set([...set1, ...set2]).size;

  return union > 0 ? (intersection / union) * 100 : 0;
}

/**
 * Get category-specific boost for keywords
 */
export function getCategoryKeywordBoost(keywords: string[], category: string): number {
  const categoryKey = category.toLowerCase().replace(/\s+/g, '_');
  const categorySet = CATEGORY_KEYWORDS[categoryKey];
  
  if (!categorySet) return 1.0;

  const matchingKeywords = keywords.filter(k => categorySet.has(k));
  
  // 10% boost per matching category keyword, max 50%
  return 1.0 + Math.min(matchingKeywords.length * 0.1, 0.5);
}

/**
 * Filter out generic/low-value keywords
 */
export function filterQualityKeywords(keywords: string[]): string[] {
  // Remove very short or very long keywords
  return keywords.filter(keyword => {
    const len = keyword.length;
    return len >= 3 && len <= 20;
  });
}

/**
 * Extract location-related keywords
 */
export function extractLocationKeywords(city: string, state: string): string[] {
  const keywords: string[] = [];
  
  if (city) {
    keywords.push(city.toLowerCase());
  }
  
  if (state) {
    keywords.push(state.toLowerCase());
  }

  // Add common location-related terms
  keywords.push('local', 'regional', 'community');

  return keywords;
}

/**
 * Generate search-friendly keyword string
 */
export function generateSearchKeywords(
  title: string,
  description: string,
  category: string,
  location?: { city: string; state: string }
): string {
  const keywords = extractFromProject(title, description);
  keywords.push(category.toLowerCase());
  
  if (location) {
    keywords.push(...extractLocationKeywords(location.city, location.state));
  }

  return keywords.join(' ');
}


