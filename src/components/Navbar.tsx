import React, { useState, useEffect } from 'react';
import { Search, User, Menu, LogOut, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './auth/AuthModal';
import AdvancedSearchModal from './common/AdvancedSearchModal';

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
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Lineup</h1>
                <p className="text-xs text-orange-600 font-medium">For the Idea Nation™</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  currentPage === item.id
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-700 hover:text-orange-600'
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
              className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              <Search className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Search projects...</span>
            </button>

            {/* Mobile Search Button */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="sm:hidden p-2 text-gray-600 hover:text-orange-600 hover:bg-gray-100 rounded-lg transition-all"
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
                  className="flex items-center space-x-2 p-2 text-gray-600 hover:text-orange-600 rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  <span className="hidden sm:block text-sm font-medium">{user.displayName}</span>
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-all duration-200"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => handleAuthClick('login')}
                  className="px-4 py-2 text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => handleAuthClick('signup')}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105"
                >
                  Sign Up
                </button>
              </>
            )}

            {/* Mobile menu button */}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-600 hover:text-orange-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {/* Mobile Navigation Items */}
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200 ${
                    currentPage === item.id
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              {/* Mobile Search */}
              <div className="px-3 py-2">
                <button className="w-full flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200">
                  <Search className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Search projects...</span>
                </button>
              </div>

              {/* Mobile User Actions */}
              <div className="border-t border-gray-200 pt-2 mt-2">
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
                      className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-orange-600 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    >
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                      <span className="text-base font-medium">{user.displayName}</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        handleSignOut();
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-base font-medium">Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        handleAuthClick('login');
                        setShowMobileMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200 rounded-lg hover:bg-gray-50"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={() => {
                        handleAuthClick('signup');
                        setShowMobileMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 mt-2"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Auth Modal */}
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
    </nav>
  );
}