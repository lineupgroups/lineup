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
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            +12%
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                        <CountUp end={stats.totalRaised} prefix="₹" decimals={0} />
                    </h3>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                        <CountUp end={stats.uniqueSupporters} />
                    </h3>
                    <p className="text-sm text-gray-500">Unique Supporters</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                        <CountUp end={stats.avgDonation} prefix="₹" decimals={0} />
                    </h3>
                    <p className="text-sm text-gray-500">Avg. Donation</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <Calendar className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                        <CountUp end={stats.totalDonations} />
                    </h3>
                    <p className="text-sm text-gray-500">Total Donations</p>
                </div>
            </div>

            {/* Recent Donations Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Donations</h2>
                    <button className="text-sm text-orange-600 font-medium hover:text-orange-700 flex items-center gap-1">
                        Export CSV <Download className="w-4 h-4" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supporter</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {donations.length > 0 ? (
                                donations.map((donation) => (
                                    <tr key={donation.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                                                    {donation.anonymous ? 'A' : donation.displayName.charAt(0)}
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {donation.anonymous ? 'Anonymous Supporter' : donation.displayName}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{donation.paymentDetails.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatCurrency(donation.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(donation.backedAt.toDate(), 'MMM d, yyyy HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                            {donation.transactionId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                Completed
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
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
