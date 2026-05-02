import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Menu, X, BarChart3, Rocket, DollarSign, TrendingUp, Edit3, Users, Shield, ChevronDown, MessageSquare, Settings, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import AuthModal from '../auth/AuthModal';
import RoleSwitcher from '../common/RoleSwitcher';
import { UserProfilePicture } from '../common/ProfilePicture';
import { getResponsiveName } from '../../utils/nameUtils';
import NotificationBell from '../notifications/NotificationBell';
import Logo from '../common/Logo';
import ProjectSelector from './ProjectSelector';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';

function CreatorNavbarContent() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const scrollRef = useHorizontalScroll();

  const navItems = [
    { path: '/dashboard', label: 'DASHBOARD', icon: BarChart3 },
    { path: '/dashboard/updates', label: 'UPDATES', icon: Edit3 },
    { path: '/dashboard/comments', label: 'COMMENTS', icon: MessageSquare },
    { path: '/dashboard/backers', label: 'BACKERS', icon: Users },
    { path: '/dashboard/analytics', label: 'ANALYTICS', icon: TrendingUp },
    { path: '/dashboard/earnings', label: 'EARNINGS', icon: DollarSign },
    { path: '/dashboard/settings', label: 'SETTINGS', icon: Settings },
    ...(isAdmin ? [{ path: '/admin', label: 'ADMIN', icon: Shield, requiresAuth: true, adminOnly: true }] : []),
  ];

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <>
    <nav className="bg-brand-black/80 backdrop-blur-3xl border-b border-white/5 sticky top-0 z-50 pt-safe transition-all duration-500">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center h-16 gap-4">
          {/* System Origin & Project Protocol */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link to="/dashboard" className="group flex items-center gap-3 transition-transform active:scale-95">
              <div className="relative">
                <div className="absolute -inset-2 bg-brand-acid/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Logo size="md" tagline="" className="relative z-10" />
              </div>
            </Link>

            <div className="hidden lg:block h-6 w-[1px] bg-white/10 mx-1"></div>

            <div className="hidden lg:block flex-shrink-0">
              <ProjectSelector className="text-brand-white scale-90" />
            </div>
          </div>

          {/* Central Command - Tactical Navigation with Horizontal Stream */}
          <div className="hidden lg:flex items-center flex-1 min-w-0 relative">
            {/* Left Fade Mask */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-brand-black to-transparent z-10 pointer-events-none" />
            
            <div 
              ref={scrollRef}
              className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-nowrap px-8 py-2 w-full cursor-grab active:cursor-grabbing"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full text-[9px] font-black italic uppercase tracking-[0.2em] transition-all duration-500 whitespace-nowrap flex-shrink-0 ${isActive
                      ? 'text-brand-black bg-brand-acid shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                      : 'text-neutral-500 hover:text-brand-white hover:bg-white/5'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right Fade Mask */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-brand-black to-transparent z-10 pointer-events-none" />
          </div>

          {/* Tactical Actions & User Identity */}
          <div className="flex items-center gap-4 flex-shrink-0 ml-auto">
            <Link
              to="/dashboard/projects/create"
              className="hidden xl:flex items-center gap-2.5 px-6 py-2.5 bg-brand-acid text-brand-black rounded-xl text-[9px] font-black italic uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(204,255,0,0.2)]"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>DEPLOY</span>
            </Link>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <NotificationBell />
                  <RoleSwitcher className="scale-90" />

                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 p-1 pr-6 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all active:scale-95 group"
                  >
                    <UserProfilePicture user={user} size="sm" className="w-7 h-7 rounded-full ring-1 ring-white/5 group-hover:ring-brand-acid/30" />
                    <span className="hidden md:block text-[9px] font-black italic uppercase tracking-widest text-neutral-400 group-hover:text-brand-white">
                      {getResponsiveName(user.displayName || 'USER')}
                    </span>
                    <Settings className="w-3.5 h-3.5 text-neutral-600 group-hover:text-brand-acid transition-colors" />
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
                    className="px-6 py-2.5 bg-brand-acid text-brand-black rounded-xl text-[9px] font-black italic uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-[0_10px_30px_rgba(204,255,0,0.2)]"
                  >
                    START
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 text-neutral-400 hover:text-brand-acid rounded-xl bg-white/5 border border-white/10 transition-all"
                aria-label="TOGGLE MENU"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Tactical Interface */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-white/5 bg-brand-black/95 backdrop-blur-3xl absolute left-0 right-0 px-6 py-8 shadow-2xl animate-in slide-in-from-top-4 duration-500">
            <div className="space-y-4">
              <div className="py-4 border-b border-white/5 mb-4">
                <p className="text-[8px] font-black text-neutral-600 uppercase tracking-[0.4em] mb-4 px-2">SYSTEM FILTER: BY PROJECT</p>
                <ProjectSelector showInMobile={true} className="w-full" />
              </div>

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
                <Link
                  to="/dashboard/projects/create"
                  onClick={() => setShowMobileMenu(false)}
                  className="w-full flex items-center justify-center gap-4 py-5 bg-brand-acid text-brand-black rounded-2xl font-black italic uppercase tracking-[0.2em] text-[10px] shadow-xl"
                >
                  <Rocket className="w-5 h-5" />
                  <span>DEPLOY NEW PROJECT</span>
                </Link>

                {user && (
                  <>
                    <div className="px-2">
                      <RoleSwitcher showLabel={true} />
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setShowMobileMenu(false)}
                      className="w-full flex items-center gap-4 px-6 py-4 bg-white/5 rounded-2xl text-brand-white"
                    >
                      <UserProfilePicture user={user} size="sm" className="w-8 h-8 rounded-full" />
                      <span className="text-xs font-black italic uppercase tracking-widest truncate">
                        {getResponsiveName(user.displayName || 'USER', 'mobile')}
                      </span>
                    </Link>
                  </>
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

export default CreatorNavbarContent;
