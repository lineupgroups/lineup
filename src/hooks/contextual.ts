/**
 * Contextual Hooks
 * 
 * These hooks automatically respect the selected project from ProjectContext.
 * When a project is selected in the navbar, these hooks filter their data accordingly.
 * When "All Projects" is selected, they return data across all projects.
 */

// Re-export all contextual hooks
export { useContextualProjects } from './useContextualProjects';
export { useContextualDonations } from './useContextualDonations';
export { useContextualAnalytics } from './useContextualAnalytics';
export { useContextualSupporters } from './useContextualSupporters';
export { useContextualEarnings } from './useContextualEarnings';

// Also re-export the base project context hook
export { useProjectContext } from './useProjectContext';
