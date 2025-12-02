import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, User, Menu, LogOut, X, BarChart3, Rocket, DollarSign, Settings, TrendingUp, Edit3, Heart, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import AuthModal from '../auth/AuthModal';
import RoleSwitcher from '../common/RoleSwitcher';
import { UserProfilePicture } from '../common/ProfilePicture';
import { getResponsiveName } from '../../utils/nameUtils';
import NotificationCenter from '../notifications/NotificationCenter';
import NotificationBell from '../notifications/NotificationBell';

export default function CreatorNavbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/dashboard/projects', label: 'Projects', icon: Rocket },
    { path: '/dashboard/updates', label: 'Updates', icon: Edit3 },
    { path: '/dashboard/supporters', label: 'Supporters', icon: Heart },
    { path: '/dashboard/analytics', label: 'Analytics', icon: TrendingUp },
    { path: '/dashboard/earnings', label: 'Earnings', icon: DollarSign },
    ...(isAdmin ? [{ path: '/admin', label: 'Admin Panel', icon: Shield, requiresAuth: true, adminOnly: true }] : []),
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 min-w-0">
          {/* Logo */}
          <Link to="/dashboard" className="flex-shrink-0 min-w-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">Lineup</h1>
                <p className="text-xs text-orange-600 font-medium">Creator Studio</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-gray-900">Lineup</h1>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                    ? 'text-orange-600 bg-orange-50'
                    : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side - Role Switcher & User */}
          <div className="flex items-center space-x-2 lg:space-x-4 min-w-0 flex-shrink-0">
            {/* Quick Actions */}
            <Link
              to="/dashboard/create"
              className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105 flex-shrink-0"
            >
              <Rocket className="w-4 h-4" />
              <span>New Project</span>
            </Link>

            {/* Right side - Role Switcher & User or Auth buttons */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 min-w-0">
              {user ? (
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  <NotificationBell />

                  {/* Role Switcher */}
                  <RoleSwitcher />

                  {/* User Profile with Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer min-w-0"
                    >
                      <UserProfilePicture user={user} size="sm" />
                      <span className="hidden sm:block font-medium text-gray-700 text-sm truncate max-w-[100px] lg:max-w-none">
                        {getResponsiveName(user.displayName || 'User')}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    </button>

                    {/* User Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>View Profile</span>
                          </div>
                        </Link>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            handleSignOut();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => handleAuthClick('login')}
                    className="px-2 sm:px-3 py-1 sm:py-2 text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200 text-xs sm:text-sm whitespace-nowrap"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="px-2 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105 text-xs sm:text-sm whitespace-nowrap"
                  >
                    Start Creating
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-600 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors flex-shrink-0"
              aria-label="Toggle menu"
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
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowMobileMenu(false)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-base font-medium rounded-lg transition-colors ${isActive
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Mobile Quick Action */}
              <Link
                to="/dashboard/create"
                onClick={() => setShowMobileMenu(false)}
                className="w-full flex items-center space-x-3 px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 mt-2"
              >
                <Rocket className="w-5 h-5" />
                <span>New Project</span>
              </Link>

              {/* Mobile User Actions */}
              <div className="border-t border-gray-200 pt-2 mt-2">
                {user ? (
                  <>
                    {/* Mobile Role Switcher */}
                    <div className="px-3 py-2">
                      <RoleSwitcher showLabel={true} />
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setShowMobileMenu(false)}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-all duration-200 min-w-0"
                    >
                      <UserProfilePicture
                        user={user}
                        size="sm"
                        className="w-6 h-6 flex-shrink-0"
                        key={user?.profileImage || user?.photoURL || 'no-image-mobile'}
                      />
                      <span className="text-base font-medium truncate flex-1" title={user.displayName}>
                        {getResponsiveName(user.displayName, 'mobile')}
                      </span>
                    </Link>

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
                      className="w-full text-left px-3 py-2 text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200 rounded-lg hover:bg-orange-50"
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
                      Start Creating
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
    </nav>
  );
}
