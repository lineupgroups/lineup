import { useState, useMemo } from 'react';
import { useProjectSupporters } from '../../hooks/useProjectSupporters';
import { Users, Download, Search, Filter, MapPin, DollarSign, Calendar } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

interface SupportersDetailTabProps {
    projectId: string;
}

export default function SupportersDetailTab({ projectId }: SupportersDetailTabProps) {
    const { supporters, loading, error } = useProjectSupporters(projectId);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTier, setFilterTier] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Get unique reward tiers
    const rewardTiers = useMemo(() => {
        const tiers = new Set(supporters.map(s => s.rewardTier).filter(Boolean));
        return Array.from(tiers);
    }, [supporters]);

    // Filter and sort supporters
    const filteredSupporters = useMemo(() => {
        let filtered = supporters;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(s =>
                s.userName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Tier filter
        if (filterTier !== 'all') {
            filtered = filtered.filter(s => s.rewardTier === filterTier);
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'date') {
                return b.createdAt.getTime() - a.createdAt.getTime();
            } else {
                return b.amount - a.amount;
            }
        });

        return filtered;
    }, [supporters, searchTerm, filterTier, sortBy]);

    // Export to CSV
    const handleExport = () => {
        const headers = ['Name', 'Amount', 'Reward Tier', 'Location', 'Date'];
        const rows = filteredSupporters.map(s => [
            s.userName,
            s.amount.toString(),
            s.rewardTier || 'No reward',
            s.location || '',
            s.createdAt.toLocaleDateString('en-IN')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `supporters-${projectId}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <p className="text-red-800">{error}</p>
            </div>
        );
    }

    if (supporters.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No supporters yet</h3>
                <p className="text-gray-600">
                    Supporters who back your project will appear here
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">
                        {supporters.length} {supporters.length === 1 ? 'Supporter' : 'Supporters'}
                    </h3>
                    <p className="text-sm text-gray-600">
                        Total raised: {formatCurrency(supporters.reduce((sum, s) => sum + s.amount, 0))}
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search supporters..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>

                    {/* Filter by tier */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={filterTier}
                            onChange={(e) => setFilterTier(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                        >
                            <option value="all">All reward tiers</option>
                            {rewardTiers.map(tier => (
                                <option key={tier} value={tier}>{tier}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                    >
                        <option value="date">Sort by Date</option>
                        <option value="amount">Sort by Amount</option>
                    </select>
                </div>
            </div>

            {/* Supporters list */}
            {filteredSupporters.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No supporters match your filters</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Supporter
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Reward
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredSupporters.map((supporter) => (
                                    <tr key={supporter.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {supporter.userAvatar ? (
                                                    <img
                                                        src={supporter.userAvatar}
                                                        alt={supporter.userName}
                                                        className="w-10 h-10 rounded-full object-cover mr-3"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-semibold mr-3">
                                                        {supporter.userName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{supporter.userName}</p>
                                                    {supporter.location && (
                                                        <p className="text-xs text-gray-500 flex items-center mt-0.5">
                                                            <MapPin className="w-3 h-3 mr-1" />
                                                            {supporter.location}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm font-medium text-gray-900">
                                                <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                                                {formatCurrency(supporter.amount)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                                                {supporter.rewardTier || 'No reward'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {supporter.createdAt.toLocaleDateString('en-IN', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
