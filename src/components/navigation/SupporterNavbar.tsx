import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, LogOut, X, Compass, TrendingUp, Shield, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import AuthModal from '../auth/AuthModal';
import RoleSwitcher from '../common/RoleSwitcher';
import BecomeCreatorCTA from '../creator/BecomeCreatorCTA';
import { UserProfilePicture } from '../common/ProfilePicture';
import { getResponsiveName } from '../../utils/nameUtils';
import Logo from '../common/Logo';
import SupporterNotificationBell from '../notifications/SupporterNotificationBell';

export default function SupporterNavbar() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navItems = [
    { path: '/', label: 'Discover', icon: Compass },
    { path: '/trending', label: 'Trending', icon: TrendingUp },
    { path: '/dashboard/supporter', label: 'My Pledges', icon: Heart, requiresAuth: true },
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
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 min-w-0">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 min-w-0">
            <div className="hidden sm:block">
              <Logo size="md" tagline="Discover Amazing Ideas" taglineColor="text-blue-600" />
            </div>
            <div className="sm:hidden">
              <Logo size="sm" showText={true} tagline="" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              // Check hideWhenLoggedIn if it exists
              if ('hideWhenLoggedIn' in item && item.hideWhenLoggedIn && user) {
                return null;
              }

              if (item.requiresAuth && !user) {
                return (
                  <button
                    key={item.path}
                    onClick={() => handleAuthClick('login')}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side - Search, Role Switcher & User */}
          <div className="flex items-center space-x-2 lg:space-x-4 min-w-0 flex-shrink-0">
            {/* Search Bar */}
            <div className="hidden lg:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="pl-10 pr-4 py-2 w-48 xl:w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Role Switcher OR Become Creator CTA */}
            {user && (
              user.isCreatorVerified ? (
                <RoleSwitcher className="hidden sm:block flex-shrink-0" />
              ) : (
                <BecomeCreatorCTA variant="navbar" className="hidden sm:block flex-shrink-0" />
              )
            )}

            {/* User Menu */}
            {user ? (
              <div className="flex items-center space-x-1 sm:space-x-3 min-w-0 flex-shrink-0">
                {/* Notification Bell */}
                <SupporterNotificationBell />

                <Link
                  to="/profile"
                  className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 min-w-0 max-w-[120px] sm:max-w-[160px]"
                >
                  <UserProfilePicture
                    user={user}
                    size="sm"
                    className="w-6 h-6 flex-shrink-0"
                    key={user?.profileImage || user?.photoURL || 'no-image'}
                  />
                  <span className="hidden sm:block text-sm font-medium truncate" title={user.displayName}>
                    {getResponsiveName(user.displayName, 'navbar')}
                  </span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="p-1 sm:p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-all duration-200 flex-shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-4 sm:w-5 h-4 sm:h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => handleAuthClick('login')}
                  className="px-2 sm:px-3 py-1 sm:py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 text-xs sm:text-sm whitespace-nowrap"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleAuthClick('signup')}
                  className="px-2 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 text-xs sm:text-sm whitespace-nowrap"
                >
                  Join Now
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex-shrink-0"
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

                // Check hideWhenLoggedIn if it exists
                if ('hideWhenLoggedIn' in item && item.hideWhenLoggedIn && user) {
                  return null;
                }

                if (item.requiresAuth && !user) {
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        handleAuthClick('login');
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-base font-medium rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowMobileMenu(false)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-base font-medium rounded-lg transition-colors ${isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Mobile Search */}
              <div className="px-3 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Mobile User Actions */}
              <div className="border-t border-gray-200 pt-2 mt-2">
                {user ? (
                  <>
                    {/* Mobile Role Switcher OR Become Creator CTA */}
                    <div className="px-3 py-2">
                      {user.isCreatorVerified ? (
                        <RoleSwitcher showLabel={true} />
                      ) : (
                        <BecomeCreatorCTA variant="card" />
                      )}
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setShowMobileMenu(false)}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 min-w-0"
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
                      className="w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 rounded-lg hover:bg-blue-50"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        handleAuthClick('signup');
                        setShowMobileMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 mt-2"
                    >
                      Join Now
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
