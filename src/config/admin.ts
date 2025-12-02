// Admin configuration
export const ADMIN_CONFIG = {
  // Admin email addresses
  ADMIN_EMAILS: ['book8stars@gmail.com'],
  
  // Admin permissions
  PERMISSIONS: {
    APPROVE_PROJECTS: true,
    REJECT_PROJECTS: true,
    VIEW_ALL_PROJECTS: true,
    MANAGE_USERS: true,
    VIEW_ANALYTICS: true,
    MODERATE_CONTENT: true,
  }
} as const;

// Helper function to check if user is admin
export const isAdminUser = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return ADMIN_CONFIG.ADMIN_EMAILS.includes(email.toLowerCase());
};

// Admin action types
export type AdminAction = 
  | 'approve_project'
  | 'reject_project'
  | 'view_pending_projects'
  | 'manage_users'
  | 'view_analytics';

// Check if admin has specific permission
export const hasAdminPermission = (email: string | null | undefined, action: AdminAction): boolean => {
  if (!isAdminUser(email)) return false;
  
  switch (action) {
    case 'approve_project':
    case 'reject_project':
      return ADMIN_CONFIG.PERMISSIONS.APPROVE_PROJECTS;
    case 'view_pending_projects':
      return ADMIN_CONFIG.PERMISSIONS.VIEW_ALL_PROJECTS;
    case 'manage_users':
      return ADMIN_CONFIG.PERMISSIONS.MANAGE_USERS;
    case 'view_analytics':
      return ADMIN_CONFIG.PERMISSIONS.VIEW_ANALYTICS;
    default:
      return false;
  }
};
