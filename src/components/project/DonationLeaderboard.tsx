import { useState, useEffect } from 'react';
import { Trophy, Crown, Medal, Award } from 'lucide-react';
import { getProjectDonations, DonationData } from '../../lib/donationService';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';

interface DonationLeaderboardProps {
    projectId: string;
    limit?: number;
}

interface TopDonor {
    userId: string;
    displayName: string;
    displayProfileImage?: string | null;
    totalAmount: number;
    donationCount: number;
    isAnonymous: boolean;
}

export default function DonationLeaderboard({ projectId, limit = 10 }: DonationLeaderboardProps) {
    const [topDonors, setTopDonors] = useState<TopDonor[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTopDonors = async () => {
            try {
                setLoading(true);
                const donations = await getProjectDonations(projectId, { limitCount: 1000 });

                // Aggregate donations by user
                const donorMap = new Map<string, TopDonor>();

                donations.forEach((donation: DonationData) => {
                    const key = donation.anonymous ? `anon_${donation.id}` : donation.userId;
                    const existing = donorMap.get(key);

                    if (existing) {
                        existing.totalAmount += donation.amount;
                        existing.donationCount += 1;
                    } else {
                        donorMap.set(key, {
                            userId: donation.userId,
                            displayName: donation.anonymous ? 'Anonymous Supporter' : donation.displayName,
                            displayProfileImage: donation.anonymous ? null : donation.displayProfileImage,
                            totalAmount: donation.amount,
                            donationCount: 1,
                            isAnonymous: donation.anonymous
                        });
                    }
                });

                // Convert to array and sort by total amount
                const sortedDonors = Array.from(donorMap.values())
                    .sort((a, b) => b.totalAmount - a.totalAmount)
                    .slice(0, limit);

                setTopDonors(sortedDonors);
            } catch (error) {
                console.error('Error fetching top donors:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTopDonors();
    }, [projectId, limit]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getRankBadge = (index: number) => {
        switch (index) {
            case 0:
                return <Crown className="w-5 h-5 text-yellow-500" />;
            case 1:
                return <Medal className="w-5 h-5 text-gray-400" />;
            case 2:
                return <Award className="w-5 h-5 text-amber-600" />;
            default:
                return <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>;
        }
    };

    const getRankEmoji = (index: number) => {
        switch (index) {
            case 0:
                return '🥇';
            case 1:
                return '🥈';
            case 2:
                return '🥉';
            default:
                return '🏅';
        }
    };

    const handleDonorClick = (donor: TopDonor) => {
        if (!donor.isAnonymous) {
            navigate(`/profile/${donor.userId}`);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="md" />
                </div>
            </div>
        );
    }

    if (topDonors.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Top Supporters</h3>
                </div>
                <div className="text-center py-8 text-gray-500">
                    <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No supporters yet</p>
                    <p className="text-sm mt-1">Be the first to support this project!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
                <div className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Top Supporters</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">Our amazing backers making this possible</p>
            </div>

            {/* Leaderboard List */}
            <div className="divide-y divide-gray-100">
                {topDonors.map((donor, index) => (
                    <div
                        key={`${donor.userId}-${index}`}
                        onClick={() => handleDonorClick(donor)}
                        className={`p-4 transition-all duration-200 ${!donor.isAnonymous
                                ? 'hover:bg-gray-50 cursor-pointer'
                                : 'cursor-default'
                            } ${index < 3 ? 'bg-gradient-to-r from-orange-50/30 to-transparent' : ''}`}
                    >
                        <div className="flex items-center gap-4">
                            {/* Rank Badge */}
                            <div className="flex-shrink-0 w-12 flex justify-center">
                                <div className={`flex items-center justify-center ${index < 3 ? 'scale-110' : ''}`}>
                                    {getRankBadge(index)}
                                </div>
                            </div>

                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                {donor.isAnonymous ? (
                                    <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                                        ?
                                    </div>
                                ) : (
                                    <img
                                        src={
                                            donor.displayProfileImage ||
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(donor.displayName)}&background=f97316&color=fff`
                                        }
                                        alt={donor.displayName}
                                        className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-white"
                                    />
                                )}
                            </div>

                            {/* Donor Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className={`font-semibold text-gray-900 truncate ${index < 3 ? 'text-lg' : 'text-base'}`}>
                                        {getRankEmoji(index)} {donor.displayName}
                                    </p>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {donor.donationCount} {donor.donationCount === 1 ? 'donation' : 'donations'}
                                </p>
                            </div>

                            {/* Amount */}
                            <div className="text-right flex-shrink-0">
                                <div className={`font-bold ${index < 3 ? 'text-xl text-orange-600' : 'text-lg text-gray-900'}`}>
                                    {formatCurrency(donor.totalAmount)}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer (optional) */}
            {topDonors.length >= limit && (
                <div className="p-4 bg-gray-50 text-center text-sm text-gray-600">
                    Showing top {limit} supporters
                </div>
            )}
        </div>
    );
}
