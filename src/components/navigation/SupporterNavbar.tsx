import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X, Compass, TrendingUp, Shield, Heart, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import AuthModal from '../auth/AuthModal';
import RoleSwitcher from '../common/RoleSwitcher';
import BecomeCreatorCTA from '../creator/BecomeCreatorCTA';
import { UserProfilePicture } from '../common/ProfilePicture';
import { getResponsiveName } from '../../utils/nameUtils';
import Logo from '../common/Logo';
import SupporterNotificationBell from '../notifications/SupporterNotificationBell';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';

export default function SupporterNavbar() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const scrollRef = useHorizontalScroll();

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

  return (
    <>
    <nav className="bg-brand-black/80 backdrop-blur-3xl border-b border-white/5 sticky top-0 z-50 pt-safe transition-all duration-500">
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Logo Section */}
          <Link to="/" className="flex-shrink-0 group flex items-center gap-4 transition-transform active:scale-95">
            <div className="relative">
              <div className="absolute -inset-2 bg-brand-acid/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Logo size="md" tagline="" className="relative z-10" />
            </div>
          </Link>

          {/* Desktop Navigation - Centered Horizontal Stream */}
          <div className="hidden lg:flex items-center flex-1 min-w-0 relative">
            {/* Left Fade Mask */}
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-brand-black to-transparent z-10 pointer-events-none" />
            
            <div 
              ref={scrollRef}
              className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-nowrap px-6 py-2 w-full cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-2xl">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  if (item.requiresAuth && !user) {
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleAuthClick('login')}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black italic uppercase tracking-[0.2em] transition-all duration-300 text-neutral-500 hover:text-brand-white hover:bg-white/5 whitespace-nowrap flex-shrink-0"
                      >
                        <Icon className="w-3 h-3" />
                        <span>{item.label}</span>
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black italic uppercase tracking-[0.2em] transition-all duration-500 whitespace-nowrap flex-shrink-0 ${isActive
                        ? 'text-brand-black bg-brand-acid shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                        : 'text-neutral-500 hover:text-brand-white hover:bg-white/5'
                        }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Fade Mask */}
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-brand-black to-transparent z-10 pointer-events-none" />
          </div>

          {/* Right Side - Actions & User Protocol */}
          <div className="flex items-center gap-4 min-w-0 flex-shrink-0 ml-auto">
            {/* Precision Search */}
            <div className="hidden xl:flex items-center">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 group-focus-within:text-brand-acid transition-colors" />
                <input
                  type="text"
                  placeholder="SEARCH..."
                  className="pl-10 pr-4 py-2 w-36 xl:w-48 bg-white/5 border border-white/10 rounded-xl focus:ring-1 focus:ring-brand-acid/50 focus:border-brand-acid text-[9px] font-bold tracking-widest text-brand-white placeholder-neutral-700 transition-all duration-500 uppercase italic"
                />
              </div>
            </div>

            {/* Role Protocol & Identity */}
            {user ? (
              <div className="flex items-center gap-3 sm:gap-4">
                <SupporterNotificationBell />
                
                {user.isCreatorVerified ? (
                  <RoleSwitcher className="hidden sm:block scale-90" />
                ) : (
                  <BecomeCreatorCTA variant="navbar" className="hidden sm:block scale-90" />
                )}

                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 p-1 pr-3 bg-white/5 border border-white/10 rounded-full hover:bg-brand-acid group transition-all duration-500 active:scale-95"
                >
                  <UserProfilePicture
                    user={user}
                    size="sm"
                    className="w-7 h-7 rounded-full ring-1 ring-white/5 group-hover:ring-brand-black/20"
                  />
                  <span className="hidden md:block text-[9px] font-black italic uppercase tracking-widest text-neutral-400 group-hover:text-brand-black">
                    {getResponsiveName(user.displayName, 'navbar')}
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAuthClick('login')}
                  className="px-4 py-2 text-[9px] font-black italic uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-white transition-colors"
                >
                  SIGN IN
                </button>
                <button
                  onClick={() => handleAuthClick('signup')}
                  className="px-6 py-2.5 bg-brand-acid text-brand-black rounded-xl text-[9px] font-black italic uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all"
                >
                  JOIN NOW
                </button>
              </div>
            )}

            {/* Mobile Interface Toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 text-neutral-400 hover:text-brand-acid rounded-xl bg-white/5 border border-white/10 transition-all"
              aria-label="TOGGLE MENU"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Tactical Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-white/5 bg-brand-black/95 backdrop-blur-3xl absolute left-0 right-0 px-6 py-8 shadow-2xl animate-in slide-in-from-top-4 duration-500">
            <div className="space-y-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowMobileMenu(false)}
                    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all ${isActive
                      ? 'text-brand-black bg-brand-acid'
                      : 'text-neutral-500 hover:text-brand-white hover:bg-white/5'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-black italic uppercase tracking-widest">{item.label}</span>
                    </div>
                    {isActive && <Activity className="w-4 h-4 animate-pulse" />}
                  </Link>
                );
              })}

              <div className="pt-8 border-t border-white/5 space-y-6">
                {user ? (
                  <>
                    <div className="px-2">
                      {user.isCreatorVerified ? (
                        <RoleSwitcher showLabel={true} />
                      ) : (
                        <BecomeCreatorCTA variant="card" />
                      )}
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setShowMobileMenu(false)}
                      className="w-full flex items-center gap-4 px-6 py-4 bg-white/5 rounded-2xl text-brand-white"
                    >
                      <UserProfilePicture user={user} size="sm" className="w-8 h-8 rounded-full" />
                      <span className="text-xs font-black italic uppercase tracking-widest truncate">
                        {getResponsiveName(user.displayName, 'mobile')}
                      </span>
                    </Link>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        handleAuthClick('login');
                        setShowMobileMenu(false);
                      }}
                      className="py-4 bg-white/5 text-neutral-400 font-black italic uppercase tracking-widest text-[9px] rounded-2xl border border-white/10"
                    >
                      SIGN IN
                    </button>
                    <button
                      onClick={() => {
                        handleAuthClick('signup');
                        setShowMobileMenu(false);
                      }}
                      className="py-4 bg-brand-acid text-brand-black font-black italic uppercase tracking-widest text-[9px] rounded-2xl"
                    >
                      JOIN NOW
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>

    <AuthModal
      isOpen={showAuthModal}
      onClose={() => setShowAuthModal(false)}
      initialMode={authMode}
    />
    </>
  );
}
