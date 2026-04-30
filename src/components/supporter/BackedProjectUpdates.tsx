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
            <div className="bg-[#111] rounded-3xl border border-neutral-800 p-6 flex flex-col">
                <div className="animate-pulse">
                    <div className="h-6 bg-neutral-800 rounded w-1/3 mb-6"></div>
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-16 h-16 bg-neutral-800 rounded-2xl"></div>
                                <div className="flex-1 space-y-3 py-1">
                                    <div className="h-4 bg-neutral-800 rounded w-3/4"></div>
                                    <div className="h-3 bg-neutral-800 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#111] rounded-3xl border border-neutral-800 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-brand-acid/10 rounded-lg">
                        <Bell className="w-5 h-5 text-brand-acid" />
                    </div>
                    <h2 className="text-xl font-bold text-brand-white tracking-tight">Latest Updates</h2>
                </div>
                <span className="text-sm font-medium text-neutral-500 hidden sm:block">From projects you back</span>
            </div>

            {updates.length === 0 ? (
                <div className="p-12 flex-1 flex flex-col items-center justify-center text-center">
                    <MessageSquare className="w-12 h-12 text-neutral-700 mb-4" />
                    <h3 className="text-lg font-medium text-brand-white mb-2">No updates yet</h3>
                    <p className="text-neutral-500 mb-6 max-w-sm">
                        When creators you back post updates, they will appear right here.
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center text-brand-acid hover:text-[#b3e600] font-bold group"
                    >
                        Explore projects
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            ) : (
                <div className="divide-y divide-neutral-800/50">
                    {updates.map((update) => (
                        <Link
                            key={update.id}
                            to={`/project/${update.projectId}`}
                            className="group flex gap-5 p-6 hover:bg-neutral-800/30 transition-colors"
                        >
                            {/* Project Image */}
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-neutral-800 group-hover:border-brand-acid/30 transition-colors">
                                    <img
                                        src={update.projectImage || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=80&h=80&fit=crop'}
                                        alt={update.projectTitle}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=80&h=80&fit=crop';
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Update Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-brand-acid tracking-wide uppercase truncate mb-1">
                                            {update.projectTitle}
                                        </p>
                                        <h3 className="text-base font-bold text-brand-white group-hover:text-brand-acid transition-colors">
                                            {update.title}
                                        </h3>
                                    </div>
                                    <div className="flex items-center text-xs font-medium text-neutral-500 flex-shrink-0 bg-neutral-900 px-2 py-1 rounded-md">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {formatDate(update.createdAt)}
                                    </div>
                                </div>

                                <p className="text-sm text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                                    {/* Strip HTML tags for preview text */}
                                    {update.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')}
                                </p>

                                {/* Update image preview if available */}
                                {update.image && (
                                    <div className="mt-4 rounded-xl overflow-hidden border border-neutral-800">
                                        <img
                                            src={update.image}
                                            alt={update.title}
                                            className="h-32 w-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Engagement stats */}
                                <div className="flex items-center gap-4 mt-4 text-xs font-medium text-neutral-500">
                                    <span className="flex items-center gap-1.5 hover:text-brand-white transition-colors">
                                        <Heart className="w-3.5 h-3.5" /> {update.likes || 0}
                                    </span>
                                    <span className="flex items-center gap-1.5 hover:text-brand-white transition-colors">
                                        <MessageSquare className="w-3.5 h-3.5" /> {update.commentCount || 0}
                                    </span>
                                    {update.visibility === 'supporters-only' && (
                                        <span className="px-2 py-0.5 bg-brand-orange/10 text-brand-orange rounded-md text-xs font-bold uppercase tracking-wider ml-auto border border-brand-orange/20">
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
