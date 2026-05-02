import { useState, useRef, useEffect } from 'react';
import { Bell, Activity, Eye, CheckCircle2, ChevronRight, Zap, Target, Flame } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead
    } = useNotifications(user?.uid, 'creator');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification: any) => {
        await markAsRead(notification.id);
        setIsOpen(false);

        if (notification.actionUrl) {
            navigate(notification.actionUrl);
        }
    };

    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'NOW';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}M`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}H`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}D`;
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }).toUpperCase();
    };

    // Helper to get tactical icon based on notification type/emoji
    const getTacticalIcon = (emoji?: string) => {
        if (emoji?.includes('💰') || emoji?.includes('💵')) return <Target className="w-5 h-5" />;
        if (emoji?.includes('🚀') || emoji?.includes('🔥')) return <Flame className="w-5 h-5" />;
        return <Zap className="w-5 h-5" />;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Tactical Bell Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    relative p-2.5 rounded-xl transition-all duration-500 group
                    ${isOpen ? 'bg-brand-acid text-brand-black shadow-[0_0_20px_rgba(204,255,0,0.4)]' : 'text-neutral-300 hover:text-brand-white bg-white/10 border border-white/10 hover:border-white/20 shadow-lg'}
                `}
                aria-label="SYSTEM INTELLIGENCE"
            >
                <Bell className={`w-5 h-5 ${isOpen ? 'animate-none' : 'group-hover:animate-pulse'}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand-orange text-brand-white text-[8px] font-black italic rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-brand-black shadow-[0_0_10px_rgba(255,91,0,0.4)]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Intelligence Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-4 w-80 sm:w-[380px] bg-[#080808] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,1)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-500 rounded-[2rem]">
                    {/* Panel Header */}
                    <div className="p-6 border-b border-white/5 bg-white/[0.04]">
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-brand-acid/10 rounded-lg border border-brand-acid/20">
                                    <Activity className="w-3.5 h-3.5 text-brand-acid" />
                                </div>
                                <h3 className="text-lg font-black text-brand-white italic uppercase tracking-tighter">OPERATIONAL INTEL</h3>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[8px] font-black italic uppercase tracking-[0.2em] text-brand-acid hover:text-brand-white transition-colors"
                                >
                                    ARCHIVE ALL
                                </button>
                            )}
                        </div>
                        <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">
                            {unreadCount} ACTIVE PROTOCOLS PENDING REVIEW
                        </p>
                    </div>

                    {/* Stream Content */}
                    <div className="max-h-[420px] overflow-y-auto scrollbar-hide py-3 bg-[#080808]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-4">
                                <Zap className="w-6 h-6 text-brand-acid animate-pulse" />
                                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.4em]">SYNCING...</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-20 px-8">
                                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-5">
                                    <CheckCircle2 className="w-6 h-6 text-neutral-500" />
                                </div>
                                <p className="text-[9px] font-black text-brand-white uppercase tracking-[0.3em]">ALL SYSTEMS NOMINAL</p>
                                <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest mt-2">NO PENDING UPDATES IN CURRENT BUFFER</p>
                            </div>
                        ) : (
                            <div className="px-3 space-y-1.5">
                                {notifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`
                                            group w-full text-left p-4 rounded-[1.25rem] transition-all duration-500 border relative overflow-hidden
                                            ${!notification.read 
                                                ? 'bg-white/[0.08] border-white/20 hover:bg-white/[0.12]' 
                                                : 'bg-transparent border-transparent opacity-80 hover:opacity-100 hover:bg-white/[0.03]'
                                            }
                                        `}
                                    >
                                        {!notification.read && (
                                            <div className="absolute top-0 left-0 bottom-0 w-1 bg-brand-acid" />
                                        )}
                                        
                                        <div className="flex items-start gap-4">
                                            {/* Tactical Icon Redesign */}
                                            <div className={`
                                                flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 relative
                                                ${!notification.read 
                                                    ? 'bg-brand-acid text-brand-black shadow-[0_0_20px_rgba(204,255,0,0.4)]' 
                                                    : 'bg-white/5 text-neutral-400 border border-white/10 hover:border-brand-acid/30 group-hover:text-brand-acid'
                                                }
                                            `}>
                                                {/* Ambient Glow */}
                                                {!notification.read && (
                                                    <div className="absolute -inset-1 bg-brand-acid/20 blur-md rounded-2xl animate-pulse" />
                                                )}
                                                <div className="relative z-10 group-hover:scale-110 transition-transform">
                                                    {getTacticalIcon(notification.icon)}
                                                </div>
                                            </div>

                                            {/* Meta & Intel */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className={`text-[10px] font-black italic uppercase tracking-tight ${!notification.read ? 'text-brand-white' : 'text-neutral-100'}`}>
                                                        {notification.title}
                                                    </span>
                                                    <span className="text-[8px] font-black text-neutral-300 tracking-widest group-hover:text-brand-white transition-colors">
                                                        {formatTimeAgo(notification.createdAt.toDate())}
                                                    </span>
                                                </div>
                                                <p className={`text-[9px] font-bold leading-relaxed mb-3 ${!notification.read ? 'text-neutral-100' : 'text-neutral-300'}`}>
                                                    {notification.message.toUpperCase()}
                                                </p>
                                                
                                                <div className="flex items-center gap-2 text-[8px] font-black text-brand-acid italic uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-8px] group-hover:translate-x-0">
                                                    <span>EXECUTE PROTOCOL</span>
                                                    <ChevronRight className="w-2.5 h-2.5" />
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Operational Footer */}
                    {notifications.length > 0 && (
                        <div className="p-5 border-t border-white/5 bg-white/[0.04]">
                            <button
                                onClick={() => {
                                    navigate('/dashboard/notifications');
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center justify-center gap-3 py-4 bg-brand-acid/10 border border-brand-acid/30 hover:bg-brand-acid hover:text-brand-black rounded-xl text-[9px] font-black italic uppercase tracking-[0.2em] text-brand-acid transition-all duration-500 group shadow-lg hover:shadow-brand-acid/20"
                            >
                                <Eye className="w-4 h-4" />
                                <span>VIEW GLOBAL INTELLIGENCE STREAM</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
