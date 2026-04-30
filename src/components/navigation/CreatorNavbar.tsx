import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Menu, LogOut, X, BarChart3, Rocket, DollarSign, TrendingUp, Edit3, Users, Shield, ChevronDown, MessageSquare, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import AuthModal from '../auth/AuthModal';
import RoleSwitcher from '../common/RoleSwitcher';
import { UserProfilePicture } from '../common/ProfilePicture';
import { getResponsiveName } from '../../utils/nameUtils';
import NotificationBell from '../notifications/NotificationBell';
import Logo from '../common/Logo';
import ProjectSelector from './ProjectSelector';

// Creator Navbar component that uses project context
function CreatorNavbarContent() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/dashboard/updates', label: 'Updates', icon: Edit3 },
    { path: '/dashboard/comments', label: 'Comments', icon: MessageSquare },
    { path: '/dashboard/backers', label: 'Backers', icon: Users },
    { path: '/dashboard/analytics', label: 'Analytics', icon: TrendingUp },
    { path: '/dashboard/earnings', label: 'Earnings', icon: DollarSign },
    { path: '/dashboard/settings', label: 'Settings', icon: Settings },
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
    <nav className="bg-brand-black shadow-sm border-b border-neutral-800 sticky top-0 z-50 pt-safe">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center h-16">
          {/* Left Section: Logo + Project Selector */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/dashboard" className="flex-shrink-0 text-brand-white hover:text-brand-acid transition-colors">
              <div className="hidden sm:block">
                <Logo size="md" tagline="Creator Studio" />
              </div>
              <div className="sm:hidden">
                <Logo size="sm" showText={false} tagline="" />
              </div>
            </Link>

            {/* Project Selector */}
            <div className="hidden lg:block ml-4">
              <ProjectSelector className="text-brand-white" />
            </div>
          </div>

          {/* Center Section: Navigation Items - Centered with flex-1 */}
          <div className="hidden lg:flex items-center justify-center flex-1 mx-4">
            <div className="flex items-center bg-[#111] border border-neutral-800 rounded-full px-1.5 py-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${isActive
                      ? 'text-brand-black bg-brand-acid shadow-[0_0_10px_rgba(204,255,0,0.2)]'
                      : 'text-neutral-400 hover:text-brand-white hover:bg-neutral-800'
                      }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Section: Actions + User */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto">
            {/* New Project Button */}
            <Link
              to="/dashboard/projects/create"
              className="hidden xl:flex items-center gap-1.5 px-5 py-2 bg-brand-acid text-brand-black rounded-full text-sm font-bold hover:bg-[#b3e600] transition-all shadow-[0_0_15px_rgba(204,255,0,0.2)]"
            >
              <Rocket className="w-4 h-4" />
              <span>New Project</span>
            </Link>

            {/* Right side - Role Switcher & User or Auth buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <NotificationBell />

                  {/* Role Switcher */}
                  <RoleSwitcher />

                  {/* User Profile with Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-1 px-2 py-1.5 bg-[#111] border border-neutral-800 rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <UserProfilePicture user={user} size="sm" />
                      <span className="hidden md:block font-bold text-brand-white text-sm truncate max-w-[80px] xl:max-w-[120px]">
                        {getResponsiveName(user.displayName || 'User')}
                      </span>
                      <ChevronDown className="w-4 h-4 text-neutral-400" />
                    </button>

                    {/* User Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-[#111] rounded-2xl shadow-xl border border-neutral-800 py-2 z-50">
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-brand-white transition-colors"
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
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
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
                    className="px-2 sm:px-3 py-1 sm:py-2 text-neutral-400 hover:text-brand-white font-bold transition-colors duration-200 text-xs sm:text-sm whitespace-nowrap"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="px-2 sm:px-4 py-1 sm:py-2 bg-brand-acid text-brand-black rounded-full font-bold hover:bg-[#b3e600] transition-all duration-200 transform hover:scale-105 shadow-[0_0_15px_rgba(204,255,0,0.2)] text-xs sm:text-sm whitespace-nowrap"
                  >
                    Start Creating
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 text-neutral-400 hover:text-brand-white rounded-lg hover:bg-neutral-800 transition-colors flex-shrink-0"
              aria-label="Toggle menu"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-neutral-800 bg-[#111]">
            <div className="px-4 py-2 space-y-1">
              {/* Mobile Project Selector */}
              <div className="py-2 border-b border-neutral-800 mb-2">
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-wide mb-2 px-1">Filter by Project</p>
                <ProjectSelector showInMobile={true} className="w-full" />
              </div>

              {/* Mobile Navigation Items */}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowMobileMenu(false)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-base font-bold rounded-xl transition-colors ${isActive
                      ? 'text-brand-black bg-brand-acid'
                      : 'text-neutral-400 hover:text-brand-white hover:bg-neutral-800'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Mobile Quick Action */}
              <Link
                to="/dashboard/projects/create"
                onClick={() => setShowMobileMenu(false)}
                className="w-full flex items-center space-x-3 px-3 py-2 bg-brand-acid text-brand-black rounded-xl font-bold hover:bg-[#b3e600] transition-all duration-200 mt-2"
              >
                <Rocket className="w-5 h-5" />
                <span>New Project</span>
              </Link>

              {/* Mobile User Actions */}
              <div className="border-t border-neutral-800 pt-2 mt-2">
                {user ? (
                  <>
                    {/* Mobile Role Switcher */}
                    <div className="px-3 py-2">
                      <RoleSwitcher showLabel={true} />
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setShowMobileMenu(false)}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-neutral-400 hover:text-brand-white rounded-xl hover:bg-neutral-800 transition-all duration-200 min-w-0"
                    >
                      <UserProfilePicture
                        user={user}
                        size="sm"
                        className="w-6 h-6 flex-shrink-0"
                        key={user?.profileImage || user?.photoURL || 'no-image-mobile'}
                      />
                      <span className="text-base font-bold truncate flex-1" title={user.displayName}>
                        {getResponsiveName(user.displayName, 'mobile')}
                      </span>
                    </Link>

                    <button
                      onClick={() => {
                        handleSignOut();
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-neutral-400 hover:text-red-400 rounded-xl hover:bg-neutral-800 transition-all duration-200"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-base font-bold">Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        handleAuthClick('login');
                        setShowMobileMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-neutral-400 hover:text-brand-white font-bold transition-colors duration-200 rounded-xl hover:bg-neutral-800"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        handleAuthClick('signup');
                        setShowMobileMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 bg-brand-acid text-brand-black rounded-xl font-bold hover:bg-[#b3e600] transition-all duration-200 mt-2"
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

// Export the navbar directly - ProjectProvider is now at Layout level
export default CreatorNavbarContent;
