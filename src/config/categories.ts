// Project categories configuration
export const PROJECT_CATEGORIES = [
  'All',
  'Tech',
  'Education', 
  'Art',
  'Social Impact',
  'Health',
  'Environment',
  'Gaming',
  'Fashion',
  'Food & Beverage'
] as const;

export type ProjectCategory = typeof PROJECT_CATEGORIES[number];

// Categories with icons for the interest selection component
export const categories = [
  { name: 'Tech', icon: '💻' },
  { name: 'Education', icon: '📚' },
  { name: 'Art', icon: '🎨' },
  { name: 'Social Impact', icon: '🤝' },
  { name: 'Health', icon: '🏥' },
  { name: 'Environment', icon: '🌿' },
  { name: 'Gaming', icon: '🎮' },
  { name: 'Fashion', icon: '👕' },
  { name: 'Food & Beverage', icon: '🍔' }
];

// Category display information
export const CATEGORY_INFO: Record<string, { 
  label: string; 
  description: string; 
  color: string; 
}> = {
  'All': {
    label: 'All Projects',
    description: 'Browse all available projects',
    color: 'gray'
  },
  'Tech': {
    label: 'Technology',
    description: 'Innovative tech solutions and software',
    color: 'blue'
  },
  'Education': {
    label: 'Education',
    description: 'Learning and educational initiatives',
    color: 'green'
  },
  'Art': {
    label: 'Arts & Culture',
    description: 'Creative and artistic projects',
    color: 'purple'
  },
  'Social Impact': {
    label: 'Social Impact',
    description: 'Projects making a positive social difference',
    color: 'orange'
  },
  'Health': {
    label: 'Health & Wellness',
    description: 'Healthcare and wellness innovations',
    color: 'red'
  },
  'Environment': {
    label: 'Environment',
    description: 'Sustainable and eco-friendly projects',
    color: 'emerald'
  },
  'Gaming': {
    label: 'Gaming',
    description: 'Video games and interactive entertainment',
    color: 'indigo'
  },
  'Fashion': {
    label: 'Fashion',
    description: 'Fashion and lifestyle products',
    color: 'pink'
  },
  'Food & Beverage': {
    label: 'Food & Beverage',
    description: 'Culinary and beverage innovations',
    color: 'yellow'
  }
};

export const getCategoryColor = (category: string): string => {
  return CATEGORY_INFO[category]?.color || 'gray';
};

export const getCategoryLabel = (category: string): string => {
  return CATEGORY_INFO[category]?.label || category;
};

export const getCategoryDescription = (category: string): string => {
  return CATEGORY_INFO[category]?.description || '';
};
