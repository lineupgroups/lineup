import { useState } from 'react';
import { Bell, Check, ArrowLeft, Zap, Target, Flame, Activity, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { convertTimestamp } from '../../lib/firestore';
import LoadingSpinner from '../common/LoadingSpinner';

export default function NotificationsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead
    } = useNotifications(user?.uid);

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications;

    const getTimeAgo = (timestamp: any) => {
        if (!timestamp) return 'NOW';
        const date = convertTimestamp(timestamp);
        if (!date) return 'NOW';

        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'NOW';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}M`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}H`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}D`;
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }).toUpperCase();
    };

    const getTacticalIcon = (emoji?: string) => {
        if (emoji?.includes('💰') || emoji?.includes('💵')) return <Target className="w-5 h-5" />;
        if (emoji?.includes('🚀') || emoji?.includes('🔥')) return <Flame className="w-5 h-5" />;
        return <Zap className="w-5 h-5" />;
    };

    const handleNotificationClick = async (notification: any) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-black flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-black pt-12 pb-24">
            <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-10 lg:px-16">
                {/* Tactical Header */}
                <div className="mb-16">
                    <button
                        onClick={() => navigate(-1)}
                        className="group flex items-center gap-3 text-neutral-500 hover:text-brand-white transition-all mb-10"
                    >
                        <div className="p-2 bg-white/5 border border-white/5 rounded-xl group-hover:bg-brand-acid group-hover:text-brand-black transition-all">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-black italic uppercase tracking-[0.3em]">RETURN TO SYSTEM</span>
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-brand-acid/10 rounded-xl border border-brand-acid/20">
                                    <Activity className="w-5 h-5 text-brand-acid" />
                                </div>
                                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em]">LIVE TELEMETRY FEED</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-brand-white italic uppercase tracking-tighter leading-none">
                                INTELLIGENCE <span className="text-brand-acid">STREAM</span>
                            </h1>
                            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.3em] mt-6">
                                {unreadCount > 0 ? `${unreadCount} ACTIVE PROTOCOLS PENDING REVIEW` : 'SYSTEM BUFFER NOMINAL / ALL CAUGHT UP'}
                            </p>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-3 px-8 py-4 bg-brand-acid/10 border border-brand-acid/30 text-brand-acid rounded-2xl hover:bg-brand-acid hover:text-brand-black transition-all font-black italic text-[10px] uppercase tracking-widest shadow-lg hover:shadow-brand-acid/20"
                            >
                                <Check className="w-4 h-4" />
                                ARCHIVE ALL PROTOCOLS
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Grid */}
                <div className="flex items-center gap-4 mb-12">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black italic uppercase tracking-[0.2em] transition-all duration-500 border ${filter === 'all'
                            ? 'bg-brand-acid text-brand-black border-brand-acid shadow-[0_0_20px_rgba(204,255,0,0.3)]'
                            : 'bg-white/5 text-neutral-500 border-white/5 hover:border-white/20 hover:text-brand-white'
                            }`}
                    >
                        GLOBAL BUFFER ({notifications.length})
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black italic uppercase tracking-[0.2em] transition-all duration-500 border ${filter === 'unread'
                            ? 'bg-brand-orange text-brand-white border-brand-orange shadow-[0_0_20px_rgba(255,91,0,0.3)]'
                            : 'bg-white/5 text-neutral-500 border-white/5 hover:border-white/20 hover:text-brand-white'
                            }`}
                    >
                        PRIORITY ({unreadCount})
                    </button>
                </div>

                {/* Protocol Feed */}
                <div className="space-y-3">
                    {filteredNotifications.length === 0 ? (
                        <div className="text-center py-32 px-10 bg-white/[0.02] border border-white/5 rounded-[3rem]">
                            <div className="w-24 h-24 mx-auto mb-8 bg-white/5 border border-white/5 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-neutral-700" />
                            </div>
                            <h3 className="text-2xl font-black text-brand-white italic uppercase tracking-tight mb-4">
                                {filter === 'unread' ? 'BUFFER CLEAR' : 'NO ACTIVE DATA'}
                            </h3>
                            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
                                {filter === 'unread'
                                    ? 'ALL SYSTEM PROTOCOLS HAVE BEEN REVIEWED'
                                    : "WAITING FOR NEXT SYSTEM EVENT INGRESS"}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`
                                        group p-6 rounded-[2rem] transition-all duration-500 border relative overflow-hidden
                                        ${!notification.read 
                                            ? 'bg-white/[0.08] border-white/20 hover:bg-white/[0.12]' 
                                            : 'bg-transparent border-transparent opacity-80 hover:opacity-100 hover:bg-white/[0.03]'
                                        }
                                    `}
                                >
                                    {!notification.read && (
                                        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-brand-acid shadow-[0_0_15px_rgba(204,255,0,0.5)]" />
                                    )}

                                    <div className="flex items-center gap-8">
                                        {/* Tactical Icon - Slimmer */}
                                        <div className={`
                                            flex-shrink-0 w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 relative
                                            ${!notification.read 
                                                ? 'bg-brand-acid text-brand-black shadow-[0_0_20px_rgba(204,255,0,0.3)]' 
                                                : 'bg-white/10 text-neutral-200 border border-white/5 group-hover:text-brand-acid'
                                            }
                                        `}>
                                            {/* Ambient Glow */}
                                            {!notification.read && (
                                                <div className="absolute -inset-1 bg-brand-acid/20 blur-xl rounded-[1.25rem] animate-pulse" />
                                            )}
                                            <div className="relative z-10 group-hover:scale-110 transition-transform">
                                                {getTacticalIcon((notification as any).icon)}
                                            </div>
                                        </div>

                                        {/* Meta & Intel - Full Width Slim Layout */}
                                        <div
                                            className="flex-1 min-w-0 cursor-pointer"
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="flex items-center justify-between gap-6">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-4 mb-1">
                                                        <span className={`text-lg font-black italic uppercase tracking-tight ${!notification.read ? 'text-brand-white' : 'text-neutral-100'}`}>
                                                            {notification.title}
                                                        </span>
                                                        <span className="text-[10px] font-black text-neutral-400 tracking-[0.2em] group-hover:text-brand-white transition-colors">
                                                            {getTimeAgo(notification.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className={`text-[11px] font-bold leading-none ${!notification.read ? 'text-neutral-200' : 'text-neutral-400'}`}>
                                                        {notification.message.toUpperCase()}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-3 text-[10px] font-black text-brand-acid italic uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                                                        <span>EXECUTE</span>
                                                        <ChevronRight className="w-4 h-4" />
                                                    </div>

                                                    {/* Actions - Mark as read */}
                                                    {!notification.read && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                markAsRead(notification.id);
                                                            }}
                                                            className="p-2.5 bg-brand-acid/10 border border-brand-acid/20 text-brand-acid hover:bg-brand-acid hover:text-brand-black rounded-xl transition-all shadow-lg hover:shadow-brand-acid/20"
                                                            title="ARCHIVE PROTOCOL"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
