import { Link } from 'react-router-dom';
import { Bell, Clock, ArrowRight, MessageSquare } from 'lucide-react';
import { FirestoreProjectUpdate } from '../../types/firestore';

interface UpdateWithProject extends FirestoreProjectUpdate {
    projectTitle: string;
    projectImage: string;
}

interface BackedProjectUpdatesProps {
    updates: UpdateWithProject[];
    loading?: boolean;
}

export default function BackedProjectUpdates({ updates, loading }: BackedProjectUpdatesProps) {
    const formatDate = (timestamp: any) => {
        try {
            const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                if (diffHours === 0) {
                    const diffMins = Math.floor(diffMs / (1000 * 60));
                    return `${diffMins} min ago`;
                }
                return `${diffHours}h ago`;
            } else if (diffDays === 1) {
                return 'Yesterday';
            } else if (diffDays < 7) {
                return `${diffDays} days ago`;
            } else {
                return date.toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric'
                });
            }
        } catch {
            return 'Recently';
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Bell className="w-5 h-5 text-orange-500" />
                        <h2 className="text-lg font-semibold text-gray-900">Latest Updates</h2>
                    </div>
                    <span className="text-sm text-gray-500">From projects you've backed</span>
                </div>
            </div>

            {updates.length === 0 ? (
                <div className="p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No updates yet</h3>
                    <p className="text-gray-500 mb-4">
                        Updates from projects you've backed will appear here.
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium"
                    >
                        Explore projects
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {updates.map((update) => (
                        <Link
                            key={update.id}
                            to={`/project/${update.projectId}`}
                            className="flex gap-4 p-4 hover:bg-gray-50 transition-colors"
                        >
                            {/* Project Image */}
                            <div className="flex-shrink-0">
                                <img
                                    src={update.projectImage || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=80&h=80&fit=crop'}
                                    alt={update.projectTitle}
                                    className="w-16 h-16 rounded-lg object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=80&h=80&fit=crop';
                                    }}
                                />
                            </div>

                            {/* Update Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {update.projectTitle}
                                        </p>
                                        <h3 className="text-base font-semibold text-gray-900 mt-1">
                                            {update.title}
                                        </h3>
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500 flex-shrink-0">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {formatDate(update.createdAt)}
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {/* Strip HTML tags for preview text */}
                                    {update.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')}
                                </p>

                                {/* Update image preview if available */}
                                {update.image && (
                                    <div className="mt-2">
                                        <img
                                            src={update.image}
                                            alt={update.title}
                                            className="h-24 rounded-lg object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Engagement stats */}
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        ❤️ {update.likes || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        💬 {update.commentCount || 0}
                                    </span>
                                    {update.visibility === 'supporters-only' && (
                                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                                            Supporters Only
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
