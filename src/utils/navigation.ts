// Centralized navigation utilities for the Lineup platform

export interface NavigationState {
  currentPage: string;
  selectedProjectId?: string;
  previousPage?: string;
}

export const PAGES = {
  HOME: 'home',
  PROJECT: 'project',
  SUPPORT: 'support',
  DASHBOARD: 'dashboard',
  PROFILE: 'profile',
  USER_PROFILE: 'user-profile', // NEW: For @username URLs
  SOCIALS: 'socials',
  START: 'start',
  ABOUT: 'about'
} as const;

export type PageType = typeof PAGES[keyof typeof PAGES];

export class NavigationManager {
  private static instance: NavigationManager;
  private navigationHistory: string[] = [];
  
  static getInstance(): NavigationManager {
    if (!NavigationManager.instance) {
      NavigationManager.instance = new NavigationManager();
    }
    return NavigationManager.instance;
  }

  navigateTo(page: PageType, projectId?: string): NavigationState {
    this.navigationHistory.push(page);
    return {
      currentPage: page,
      selectedProjectId: projectId,
      previousPage: this.getPreviousPage()
    };
  }

  goBack(): string | null {
    if (this.navigationHistory.length > 1) {
      this.navigationHistory.pop();
      return this.navigationHistory[this.navigationHistory.length - 1];
    }
    return null;
  }

  getPreviousPage(): string | undefined {
    return this.navigationHistory.length > 1 
      ? this.navigationHistory[this.navigationHistory.length - 2]
      : undefined;
  }

  buildProjectUrl(projectId: string): string {
    return `#project=${projectId}`;
  }

  buildProfileUrl(userId?: string): string {
    return userId ? `#profile=${userId}` : `#profile`;
  }

  buildUsernameUrl(username: string): string {
    return `/@${username}`;
  }

  parseProjectIdFromUrl(): string | null {
    const hash = window.location.hash;
    const match = hash.match(/project=([^&]+)/);
    return match ? match[1] : null;
  }

  parseProfileUserIdFromUrl(): string | null {
    const hash = window.location.hash;
    const match = hash.match(/profile=([^&]+)/);
    return match ? match[1] : null;
  }

  parseUsernameFromUrl(): string | null {
    const pathname = window.location.pathname;
    const match = pathname.match(/^\/@([a-zA-Z0-9_]+)$/);
    return match ? match[1] : null;
  }

  parsePageFromUrl(): { page: PageType | null; projectId?: string; userId?: string; username?: string } {
    const hash = window.location.hash;
    const pathname = window.location.pathname;
    
    // Check for username-based URLs first (/@username)
    const username = this.parseUsernameFromUrl();
    if (username) {
      return { page: PAGES.USER_PROFILE, username };
    }
    
    // Check for hash-based URLs (legacy)
    if (hash.includes('project=')) {
      const projectId = this.parseProjectIdFromUrl();
      return { page: PAGES.PROJECT, projectId: projectId || undefined };
    }
    
    if (hash.includes('profile')) {
      const userId = this.parseProfileUserIdFromUrl();
      return { page: PAGES.PROFILE, userId: userId || undefined };
    }
    
    return { page: null };
  }

  // Navigate to user profile by username
  navigateToUserProfile(username: string): void {
    const url = this.buildUsernameUrl(username);
    window.history.pushState(null, '', url);
  }

  // Check if current URL is a username profile
  isUsernameProfile(): boolean {
    return this.parseUsernameFromUrl() !== null;
  }

  clearHistory(): void {
    this.navigationHistory = [];
  }
}

export const navigationManager = NavigationManager.getInstance();
