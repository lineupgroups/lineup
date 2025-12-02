import { Users, ArrowRight } from 'lucide-react';
import { useRecentSupporters } from '../../hooks/useRecentSupporters';
import LoadingSpinner from '../common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

interface RecentSupportersWidgetProps {
    creatorId: string;
    limit?: number;
}

export default function RecentSupportersWidget({ creatorId, limit = 5 }: RecentSupportersWidgetProps) {
    const { supporters, loading, error, totalCount } = useRecentSupporters(creatorId, limit);
    const navigate = useNavigate();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600 text-sm">{error}</p>
            </div>
        );
    }

    if (supporters.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">👥</div>
                <p className="text-gray-600">No supporters yet</p>
                <p className="text-sm text-gray-500 mt-1">
                    Share your projects to get your first supporters!
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Total count header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-bold text-gray-900">
                        {totalCount} {totalCount === 1 ? 'Supporter' : 'Supporters'}
                    </h3>
                </div>
                {totalCount > limit && (
                    <button
                        onClick={() => navigate('/dashboard/supporters')}
                        className="flex items-center text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                        View all
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                )}
            </div>

            {/* Supporters list */}
            <div className="space-y-3">
                {supporters.map((supporter) => (
                    <div
                        key={supporter.id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {supporter.userAvatar ? (
                                <img
                                    src={supporter.userAvatar}
                                    alt={supporter.userName}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-semibold">
                                    {supporter.userName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {supporter.userName}
                            </p>
                            <p className="text-xs text-gray-600">
                                Pledged {formatCurrency(supporter.amount)}
                            </p>
                            {supporter.projectTitle && (
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                    {supporter.projectTitle}
                                </p>
                            )}
                        </div>

                        {/* Time */}
                        <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatTimeAgo(supporter.createdAt)}
                        </span>
                    </div>
                ))}
            </div>

            {/* View all button (mobile) */}
            {totalCount > limit && (
                <button
                    onClick={() => navigate('/dashboard/supporters')}
                    className="mt-4 w-full flex items-center justify-center text-orange-600 hover:text-orange-700 font-medium transition-colors"
                >
                    View all {totalCount} supporters
                    <ArrowRight className="w-4 h-4 ml-2" />
                </button>
            )}
        </div>
    );
}
