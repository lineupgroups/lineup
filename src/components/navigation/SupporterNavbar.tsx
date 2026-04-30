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
    <>
    <nav className="bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-neutral-800 sticky top-0 z-50 pt-safe transition-all duration-300">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 min-w-0">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 min-w-0 hover:opacity-80 transition-opacity">
            <div className="hidden sm:block">
              <Logo size="lg" tagline="Discover Amazing Ideas" />
            </div>
            <div className="sm:hidden">
              <Logo size="sm" showText={true} tagline="" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
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
                    className="flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all duration-300 text-neutral-400 hover:text-brand-white hover:bg-neutral-900"
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
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all duration-300 ${isActive
                    ? 'text-brand-black bg-brand-acid shadow-[0_0_15px_rgba(204,255,0,0.3)] transform scale-105'
                    : 'text-neutral-400 hover:text-brand-white hover:bg-neutral-900'
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
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-brand-orange transition-colors" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="pl-10 pr-4 py-2 w-48 xl:w-64 bg-neutral-900 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange text-sm text-brand-white placeholder-neutral-500 transition-all duration-300"
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
                  className="flex items-center space-x-2 p-2 text-neutral-300 hover:text-brand-acid rounded-xl hover:bg-neutral-900 transition-all duration-200 border border-transparent hover:border-neutral-800 min-w-0 max-w-[120px] sm:max-w-[160px]"
                >
                  <UserProfilePicture
                    user={user}
                    size="sm"
                    className="w-8 h-8 flex-shrink-0 ring-2 ring-neutral-800"
                    key={user?.profileImage || user?.photoURL || 'no-image'}
                  />
                  <span className="hidden sm:block text-sm font-bold tracking-wide truncate" title={user.displayName}>
                    {getResponsiveName(user.displayName, 'navbar')}
                  </span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="p-2.5 text-neutral-500 hover:text-brand-orange rounded-xl hover:bg-brand-orange/10 transition-all duration-200 flex-shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => handleAuthClick('login')}
                  className="px-4 py-2 text-neutral-300 hover:text-brand-white font-bold tracking-wide transition-colors duration-200 text-sm whitespace-nowrap"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleAuthClick('signup')}
                  className="px-5 py-2.5 bg-brand-acid text-brand-black rounded-xl font-bold hover:bg-[#b3e600] transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(204,255,0,0.2)] text-sm whitespace-nowrap"
                >
                  Join Now
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-neutral-400 hover:text-brand-acid rounded-xl hover:bg-neutral-900 transition-colors flex-shrink-0"
              aria-label="Toggle menu"
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
                      className="w-full flex items-center space-x-3 px-4 py-3 text-base font-bold rounded-xl text-neutral-400 hover:text-brand-white hover:bg-neutral-900 transition-all duration-200"
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
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-base font-bold rounded-xl transition-all duration-200 ${isActive
                      ? 'text-brand-black bg-brand-acid'
                      : 'text-neutral-400 hover:text-brand-white hover:bg-neutral-900'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Mobile Search */}
              <div className="py-2">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-brand-orange transition-colors" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange text-sm text-brand-white placeholder-neutral-500 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Mobile User Actions */}
              <div className="border-t border-neutral-800 pt-4 mt-2">
                {user ? (
                  <>
                    {/* Mobile Role Switcher OR Become Creator CTA */}
                    <div className="px-4 py-2">
                      {user.isCreatorVerified ? (
                        <RoleSwitcher showLabel={true} />
                      ) : (
                        <BecomeCreatorCTA variant="card" />
                      )}
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setShowMobileMenu(false)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-neutral-300 hover:text-brand-acid rounded-xl hover:bg-neutral-900 transition-all duration-200 min-w-0"
                    >
                      <UserProfilePicture
                        user={user}
                        size="sm"
                        className="w-8 h-8 flex-shrink-0 ring-2 ring-neutral-800"
                        key={user?.profileImage || user?.photoURL || 'no-image-mobile'}
                      />
                      <span className="text-base font-bold tracking-wide truncate flex-1" title={user.displayName}>
                        {getResponsiveName(user.displayName, 'mobile')}
                      </span>
                    </Link>

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
                      Join Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </nav>

      {/* Auth Modal - rendered outside nav to avoid stacking context issues */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
}
