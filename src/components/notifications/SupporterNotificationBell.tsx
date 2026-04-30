import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Notification Bell for Supporter Dashboard
 * Shows notifications for backers/supporters (project updates, thank you messages, etc.)
 */
export default function SupporterNotificationBell() {
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
    } = useNotifications(user?.uid, 'supporter');

    // Close dropdown when clicking outside
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

        // Navigate to relevant page
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
        }
    };

    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    };

    // Don't show the bell if user is not logged in
    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-xl transition-all duration-300 group ${isOpen 
                    ? 'bg-neutral-900 text-brand-acid shadow-[0_0_15px_rgba(204,255,0,0.1)] border border-brand-acid/20' 
                    : 'text-neutral-400 hover:text-brand-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800'
                }`}
                aria-label="Notifications"
            >
                <Bell className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'scale-110' : 'group-hover:scale-110'}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 bg-brand-orange text-brand-white text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center shadow-lg shadow-brand-orange/40 animate-in zoom-in duration-300">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-brand-black rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-neutral-800 z-50 max-h-[500px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/30">
                        <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand-white">Inbox</h3>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 bg-brand-orange/10 text-brand-orange text-[10px] font-black rounded-full border border-brand-orange/20">
                                    {unreadCount} NEW
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-[10px] font-black uppercase tracking-widest text-brand-acid hover:text-brand-acid/80 transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 border-2 border-brand-acid border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-16 px-6">
                                <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Bell className="w-8 h-8 text-neutral-700" />
                                </div>
                                <p className="text-brand-white font-bold tracking-tight">All caught up!</p>
                                <p className="text-xs text-neutral-500 font-medium mt-2 leading-relaxed">
                                    When projects you follow have updates, they'll show up here in your personal lineup.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-900">
                                {notifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full text-left p-5 hover:bg-neutral-900 transition-all duration-300 group/item ${!notification.read ? 'bg-brand-acid/[0.02]' : ''
                                            }`}
                                    >
                                        <div className="flex items-start space-x-4">
                                            {/* Icon */}
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${!notification.read 
                                                ? 'bg-brand-acid/10 border border-brand-acid/20' 
                                                : 'bg-neutral-800 border border-neutral-700'
                                                }`}>
                                                <span className="text-lg grayscale-[0.5] group-hover/item:grayscale-0 transition-all">{notification.icon || '🔔'}</span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <p className={`text-sm font-bold tracking-tight leading-tight ${!notification.read ? 'text-brand-white' : 'text-neutral-400'
                                                        }`}>
                                                        {notification.title}
                                                    </p>
                                                    {!notification.read && (
                                                        <div className="flex-shrink-0 w-1.5 h-1.5 bg-brand-acid rounded-full mt-1 animate-pulse shadow-[0_0_8px_rgba(204,255,0,0.5)]"></div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-neutral-500 font-medium mt-1 line-clamp-2 leading-normal group-hover/item:text-neutral-400 transition-colors">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest mt-2">
                                                    {formatTimeAgo(notification.createdAt.toDate())}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-4 border-t border-neutral-800 bg-neutral-900/10">
                            <button
                                onClick={() => {
                                    navigate('/notifications');
                                    setIsOpen(false);
                                }}
                                className="w-full py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-acid transition-all duration-300"
                            >
                                View Timeline
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
