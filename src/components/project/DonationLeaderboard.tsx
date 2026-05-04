import { useState, useEffect } from 'react';
import { Trophy, Crown, Medal, Award, Star, ArrowRight } from 'lucide-react';
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

    const getRankStyles = (index: number) => {
        switch (index) {
            case 0:
                return {
                    icon: <Crown className="w-5 h-5 text-brand-acid" />,
                    bg: 'bg-brand-acid/10',
                    border: 'border-brand-acid/30',
                    ring: 'ring-brand-acid',
                    text: 'text-brand-acid'
                };
            case 1:
                return {
                    icon: <Medal className="w-5 h-5 text-neutral-300" />,
                    bg: 'bg-white/5',
                    border: 'border-white/10',
                    ring: 'ring-neutral-500',
                    text: 'text-neutral-300'
                };
            case 2:
                return {
                    icon: <Award className="w-5 h-5 text-brand-orange" />,
                    bg: 'bg-brand-orange/10',
                    border: 'border-brand-orange/30',
                    ring: 'ring-brand-orange',
                    text: 'text-brand-orange'
                };
            default:
                return {
                    icon: <span className="text-[10px] font-black italic tracking-tighter text-neutral-500">#{index + 1}</span>,
                    bg: 'bg-transparent',
                    border: 'border-transparent',
                    ring: 'ring-neutral-800',
                    text: 'text-neutral-500'
                };
        }
    };

    const handleDonorClick = (donor: TopDonor) => {
        if (!donor.isAnonymous) {
            navigate(`/profile/${donor.userId}`);
        }
    };

    if (loading) {
        return (
            <div className="bg-[#111] rounded-[2rem] p-8 border border-neutral-800 flex items-center justify-center">
                <LoadingSpinner size="md" />
            </div>
        );
    }

    if (topDonors.length === 0) {
        return (
            <div className="bg-[#111] rounded-[2rem] p-8 border border-neutral-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-orange/5 to-transparent rounded-bl-full pointer-events-none" />
                <h3 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-neutral-600 mb-8 flex items-center gap-2">
                    <span className="w-8 h-px bg-neutral-800" />
                    Support Leaderboard
                </h3>
                <div className="text-center py-10 relative z-10">
                    <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="w-8 h-8 text-neutral-700" />
                    </div>
                    <p className="text-brand-white font-black italic uppercase tracking-wider text-sm mb-1">No legends yet</p>
                    <p className="text-xs text-neutral-500 font-medium tracking-wide">Be the first to secure a spot at the top.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#111] rounded-[2rem] border border-neutral-800 overflow-hidden relative group">
            {/* Luxury Background Accents */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-orange/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-brand-orange/10 transition-all duration-1000" />
            
            {/* Header */}
            <div className="px-6 pt-6 pb-4 relative z-10">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-brand-white">Top Supporters</h3>
                    <span className="text-xs text-neutral-500 font-medium">{topDonors.length} backers</span>
                </div>
            </div>

            {/* Leaderboard List */}
            <div className="px-3 pb-3 space-y-0.5 relative z-10">
                {topDonors.map((donor, index) => {
                    const styles = getRankStyles(index);
                    const isTop3 = index < 3;
                    
                    return (
                        <div
                            key={`${donor.userId}-${index}`}
                            onClick={() => handleDonorClick(donor)}
                            className={`group/item relative flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-300 border border-transparent ${
                                !donor.isAnonymous ? 'hover:bg-white/5 hover:border-neutral-800 cursor-pointer' : 'cursor-default'
                            }`}
                        >
                            {/* Rank Indicator */}
                            <div className="flex-shrink-0 w-7 flex justify-center">
                                {styles.icon}
                            </div>

                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                {donor.isAnonymous ? (
                                    <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-neutral-600 font-black text-xs">
                                        ?
                                    </div>
                                ) : (
                                    <img
                                        src={
                                            donor.displayProfileImage ||
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(donor.displayName)}&background=1a1a1a&color=fff`
                                        }
                                        alt={donor.displayName}
                                        className={`w-10 h-10 rounded-full object-cover transition-all duration-300 group-hover/item:scale-105 ${
                                            isTop3 ? `ring-2 ${styles.ring} ring-offset-1 ring-offset-[#111]` : 'ring-1 ring-neutral-800'
                                        }`}
                                    />
                                )}
                            </div>

                            {/* Donor Info */}
                            <div className="flex-1 min-w-0">
                                <p className={`font-bold text-brand-white truncate transition-colors duration-300 group-hover/item:text-brand-acid ${
                                    isTop3 ? 'text-sm' : 'text-xs'
                                }`}>
                                    {donor.displayName}
                                </p>
                                <p className="text-[10px] text-neutral-600 mt-0.5">
                                    {donor.donationCount} {donor.donationCount === 1 ? 'donation' : 'donations'}
                                </p>
                            </div>

                            {/* Amount */}
                            <div className="text-right flex-shrink-0">
                                <div className={`font-black tracking-tight leading-none ${
                                    isTop3 ? 'text-base text-brand-orange' : 'text-sm text-neutral-300'
                                }`}>
                                    {formatCurrency(donor.totalAmount)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            {topDonors.length >= limit && (
                <div className="p-6 pt-2 pb-8 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-6 py-2 bg-neutral-900 border border-neutral-800 rounded-full text-[9px] font-black italic uppercase tracking-[0.2em] text-neutral-500 hover:text-brand-acid hover:border-brand-acid/30 transition-all cursor-default">
                        Restricted Access: Showing top {limit} backers
                    </div>
                </div>
            )}
        </div>
    );
}
