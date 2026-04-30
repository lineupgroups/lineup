import { useState, useEffect } from 'react';
import { DollarSign, Users, TrendingUp, Download, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCreatorDonations, DonationData } from '../../lib/donationService';
import { format } from 'date-fns';
import LoadingSpinner from '../common/LoadingSpinner';
import CountUp from '../animations/CountUp';

export default function DonationsTab() {
    const { user } = useAuth();
    const [donations, setDonations] = useState<DonationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRaised: 0,
        totalDonations: 0,
        avgDonation: 0,
        uniqueSupporters: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const data = await getCreatorDonations(user.uid, 100);
                setDonations(data);

                // Calculate stats
                const totalRaised = data.reduce((sum, d) => sum + d.amount, 0);
                const uniqueSupporters = new Set(data.map(d => d.userId)).size;

                setStats({
                    totalRaised,
                    totalDonations: data.length,
                    avgDonation: data.length > 0 ? totalRaised / data.length : 0,
                    uniqueSupporters
                });

            } catch (error) {
                console.error('Error fetching donations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#111] p-6 rounded-3xl shadow-sm border border-neutral-800/50">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-500/10 rounded-2xl">
                            <DollarSign className="w-6 h-6 text-green-400" />
                        </div>
                        <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                            +12%
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-brand-white">
                        <CountUp end={stats.totalRaised} prefix="₹" decimals={0} />
                    </h3>
                    <p className="text-sm text-neutral-500">Total Revenue</p>
                </div>

                <div className="bg-[#111] p-6 rounded-3xl shadow-sm border border-neutral-800/50">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-2xl">
                            <Users className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-brand-white">
                        <CountUp end={stats.uniqueSupporters} />
                    </h3>
                    <p className="text-sm text-neutral-500">Unique Supporters</p>
                </div>

                <div className="bg-[#111] p-6 rounded-3xl shadow-sm border border-neutral-800/50">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-2xl">
                            <TrendingUp className="w-6 h-6 text-purple-400" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-brand-white">
                        <CountUp end={stats.avgDonation} prefix="₹" decimals={0} />
                    </h3>
                    <p className="text-sm text-neutral-500">Avg. Donation</p>
                </div>

                <div className="bg-[#111] p-6 rounded-3xl shadow-sm border border-neutral-800/50">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-brand-orange/10 rounded-2xl">
                            <Calendar className="w-6 h-6 text-brand-orange" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-brand-white">
                        <CountUp end={stats.totalDonations} />
                    </h3>
                    <p className="text-sm text-neutral-500">Total Donations</p>
                </div>
            </div>

            {/* Recent Donations Table */}
            <div className="bg-[#111] rounded-3xl shadow-sm border border-neutral-800/50 overflow-hidden">
                <div className="p-6 border-b border-neutral-800/50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-brand-white">Recent Donations</h2>
                    <button className="text-sm text-brand-orange font-medium hover:text-brand-orange flex items-center gap-1">
                        Export CSV <Download className="w-4 h-4" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-brand-black">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Supporter</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Transaction ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                            {donations.length > 0 ? (
                                donations.map((donation) => (
                                    <tr key={donation.id} className="hover:bg-brand-black transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold text-xs">
                                                    {donation.anonymous ? 'A' : donation.displayName.charAt(0)}
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-brand-white">
                                                        {donation.anonymous ? 'Anonymous Supporter' : donation.displayName}
                                                    </p>
                                                    <p className="text-xs text-neutral-500">{donation.paymentDetails.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-white">
                                            {formatCurrency(donation.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                            {format(donation.backedAt.toDate(), 'MMM d, yyyy HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 font-mono">
                                            {donation.transactionId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-800">
                                                Completed
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                                        No donations received yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
