import React, { useState, useEffect } from 'react';
import { Search, User, Menu, LogOut, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './auth/AuthModal';
import AdvancedSearchModal from './common/AdvancedSearchModal';
import Logo from './common/Logo';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onProfileNavigate?: (userId?: string) => void;
  onUsernameProfileNavigate?: (username: string) => void;
}

export default function Navbar({ currentPage, onNavigate, onProfileNavigate, onUsernameProfileNavigate }: NavbarProps) {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Keyboard shortcut for search (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { id: 'home', label: 'Projects' },
    { id: 'start', label: 'Start a Project' },
    { id: 'socials', label: 'Lineup Socials' },
    { id: 'about', label: 'About' }
  ];

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <>
    <nav className="bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-neutral-800 sticky top-0 z-50 pt-safe transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 min-w-0">
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onNavigate('home')}>
            <Logo size="lg" tagline="For the Idea Nation™" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all duration-300 ${currentPage === item.id
                    ? 'text-brand-black bg-brand-acid shadow-[0_0_15px_rgba(204,255,0,0.3)] transform scale-105'
                    : 'text-neutral-400 hover:text-brand-white hover:bg-neutral-900'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSearchModal(true)}
              className="hidden sm:flex items-center space-x-2 px-4 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-brand-orange/50 hover:bg-neutral-800 rounded-xl transition-all duration-300 group"
            >
              <Search className="w-4 h-4 text-neutral-500 group-hover:text-brand-orange transition-colors" />
              <span className="text-sm font-medium text-neutral-400 group-hover:text-neutral-200 transition-colors">Search...</span>
              <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-500 ml-2 border border-neutral-700">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>

            {/* Mobile Search Button */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="sm:hidden p-2 text-neutral-400 hover:text-brand-orange hover:bg-neutral-900 rounded-xl transition-all"
            >
              <Search className="w-5 h-5" />
            </button>

            {user ? (
              <>
                <button
                  onClick={() => {
                    // Use username-based navigation if user has a username, otherwise fallback to old method
                    if (user.username && onUsernameProfileNavigate) {
                      onUsernameProfileNavigate(user.username);
                    } else if (onProfileNavigate) {
                      onProfileNavigate();
                    } else {
                      onNavigate('profile');
                    }
                  }}
                  className="flex items-center space-x-2 p-2 text-neutral-300 hover:text-brand-acid rounded-xl hover:bg-neutral-900 transition-all duration-200 border border-transparent hover:border-neutral-800"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-neutral-800"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center ring-2 ring-neutral-700">
                      <User className="w-4 h-4 text-neutral-400" />
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-bold tracking-wide">{user.displayName}</span>
                </button>

                <button
                  onClick={handleSignOut}
                  className="p-2.5 text-neutral-500 hover:text-brand-orange rounded-xl hover:bg-brand-orange/10 transition-all duration-200"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleAuthClick('login')}
                  className="px-5 py-2 text-neutral-300 hover:text-brand-white font-bold tracking-wide transition-colors duration-200"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleAuthClick('signup')}
                  className="px-6 py-2.5 bg-brand-acid text-brand-black rounded-xl font-bold hover:bg-[#b3e600] transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                >
                  Sign Up
                </button>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-neutral-400 hover:text-brand-acid rounded-xl hover:bg-neutral-900 transition-colors"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-neutral-800 bg-[#0A0A0A] absolute left-0 right-0 px-4 pb-6 shadow-2xl">
            <div className="py-4 space-y-2">
              {/* Mobile Navigation Items */}
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-base font-bold rounded-xl transition-all duration-200 ${currentPage === item.id
                      ? 'text-brand-black bg-brand-acid'
                      : 'text-neutral-400 hover:text-brand-white hover:bg-neutral-900'
                    }`}
                >
                  {item.label}
                </button>
              ))}

              {/* Mobile Search */}
              <div className="py-2">
                <button className="w-full flex items-center space-x-3 px-4 py-3 bg-neutral-900 border border-neutral-800 hover:border-brand-orange/50 rounded-xl transition-colors duration-200 group">
                  <Search className="w-5 h-5 text-neutral-500 group-hover:text-brand-orange" />
                  <span className="text-sm font-medium text-neutral-400 group-hover:text-neutral-200">Search projects...</span>
                </button>
              </div>

              {/* Mobile User Actions */}
              <div className="border-t border-neutral-800 pt-4 mt-2">
                {user ? (
                  <>
                    <button
                      onClick={() => {
                        if (user.username && onUsernameProfileNavigate) {
                          onUsernameProfileNavigate(user.username);
                        } else if (onProfileNavigate) {
                          onProfileNavigate();
                        } else {
                          onNavigate('profile');
                        }
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-neutral-300 hover:text-brand-acid rounded-xl hover:bg-neutral-900 transition-all duration-200"
                    >
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-neutral-800"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
                          <User className="w-5 h-5 text-neutral-400" />
                        </div>
                      )}
                      <span className="text-base font-bold tracking-wide">{user.displayName}</span>
                    </button>

                    <button
                      onClick={() => {
                        handleSignOut();
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-neutral-400 hover:text-brand-orange rounded-xl hover:bg-brand-orange/10 transition-all duration-200 mt-2"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-base font-bold tracking-wide">Sign Out</span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        handleAuthClick('login');
                        setShowMobileMenu(false);
                      }}
                      className="w-full text-center px-4 py-3 text-neutral-300 hover:text-brand-white font-bold transition-colors duration-200 rounded-xl bg-neutral-900 border border-neutral-800"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        handleAuthClick('signup');
                        setShowMobileMenu(false);
                      }}
                      className="w-full text-center px-4 py-3 bg-brand-acid text-brand-black rounded-xl font-bold hover:bg-[#b3e600] transition-all duration-200"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal - rendered outside nav to avoid stacking context issues */}
    </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </>
  );
}