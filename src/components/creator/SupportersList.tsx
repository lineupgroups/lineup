import React, { useState, useEffect } from 'react';
import { getProjectDonations, DonationData } from '../../lib/donationService';
import { formatDistanceToNow } from 'date-fns';
import { User, Heart, Calendar, DollarSign, Shield, Download } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import { convertTimestamp } from '../../lib/firestore';

interface SupportersListProps {
    projectId: string;
    limit?: number;
    showTitle?: boolean;
}

export default function SupportersList({ projectId, limit = 10, showTitle = true }: SupportersListProps) {
    const [donations, setDonations] = useState<DonationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDonations = async () => {
            try {
                setLoading(true);
                const data = await getProjectDonations(projectId, { limitCount: limit });
                setDonations(data);
            } catch (err) {
                console.error('Error fetching donations:', err);
                setError('Failed to load supporters');
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchDonations();
        }
    }, [projectId, limit]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return <LoadingSpinner size="sm" />;
    }

    if (error) {
        return <div className="text-red-500 text-sm">{error}</div>;
    }

    if (donations.length === 0) {
        return (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No supporters yet</p>
                <p className="text-xs text-gray-400 mt-1">Be the first to back this project!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {showTitle && (
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Supporters</h3>
                    <span className="text-sm text-gray-500">{donations.length} backers</span>
                </div>
            )}

            <div className="space-y-3">
                {donations.map((donation) => (
                    <div
                        key={donation.id}
                        className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                {donation.displayProfileImage && !donation.displayProfileImage.includes('default') ? (
                                    <img
                                        src={donation.displayProfileImage}
                                        alt={donation.displayName}
                                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                    />
                                ) : (
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${donation.anonymous ? 'bg-gray-100' : 'bg-orange-100'
                                        }`}>
                                        {donation.anonymous ? (
                                            <Shield className="w-5 h-5 text-gray-500" />
                                        ) : (
                                            <User className="w-5 h-5 text-orange-600" />
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center space-x-2">
                                    <p className="font-medium text-gray-900">
                                        {donation.displayName}
                                    </p>
                                    {donation.anonymous && (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                            Anonymous
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center text-xs text-gray-500 mt-0.5 space-x-3">
                                    <span className="flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {formatDistanceToNow(convertTimestamp(donation.backedAt), { addSuffix: true })}
                                    </span>
                                    {donation.rewardTier && (
                                        <span className="flex items-center text-orange-600">
                                            <Heart className="w-3 h-3 mr-1" />
                                            {donation.rewardTier}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="font-bold text-gray-900">
                                {formatCurrency(donation.amount)}
                            </p>
                            <button
                                className="text-xs text-gray-400 hover:text-orange-600 flex items-center justify-end mt-1 ml-auto transition-colors"
                                title="Download Receipt"
                            >
                                <Download className="w-3 h-3 mr-1" />
                                Receipt
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
