import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Filter, Download, DollarSign, Users, TrendingUp,
    Calendar, Heart, Shield, ExternalLink, FileText, SortAsc, SortDesc
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectsByCreator } from '../../hooks/useProjects';
import { getProjectDonations, DonationData } from '../../lib/donationService';
import LoadingSpinner from '../common/LoadingSpinner';
import { convertTimestamp } from '../../lib/firestore';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function CreatorDonationsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { projects, loading: projectsLoading } = useProjectsByCreator(user?.uid || '');

    // State
    const [allDonations, setAllDonations] = useState<(DonationData & { projectTitle: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
    const [amountFilter, setAmountFilter] = useState<'all' | 'small' | 'medium' | 'large'>('all');
    const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Fetch all donations
    useEffect(() => {
        const fetchAllDonations = async () => {
            if (projects.length === 0) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const allPromises = projects.map(async (project) => {
                    const donations = await getProjectDonations(project.id, { limitCount: 500 });
                    return donations.map(d => ({ ...d, projectTitle: project.title }));
                });

                const results = await Promise.all(allPromises);
                setAllDonations(results.flat());
            } catch (error) {
                console.error('Error fetching donations:', error);
                toast.error('Failed to load donations');
            } finally {
                setLoading(false);
            }
        };

        if (!projectsLoading) {
            fetchAllDonations();
        }
    }, [projects, projectsLoading]);

    // Filter and sort donations
    const filteredDonations = useMemo(() => {
        let filtered = [...allDonations];

        // Filter by project
        if (selectedProjectId !== 'all') {
            filtered = filtered.filter(d => d.projectId === selectedProjectId);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(d =>
                d.displayName.toLowerCase().includes(query) ||
                d.projectTitle.toLowerCase().includes(query) ||
                d.amount.toString().includes(query)
            );
        }

        // Filter by amount range
        if (amountFilter !== 'all') {
            filtered = filtered.filter(d => {
                switch (amountFilter) {
                    case 'small': return d.amount < 500;
                    case 'medium': return d.amount >= 500 && d.amount < 2000;
                    case 'large': return d.amount >= 2000;
                    default: return true;
                }
            });
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'date') {
                const dateA = convertTimestamp(a.backedAt).getTime();
                const dateB = convertTimestamp(b.backedAt).getTime();
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            } else {
                return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
            }
        });

        return filtered;
    }, [allDonations, selectedProjectId, searchQuery, amountFilter, sortBy, sortOrder]);

    // Stats
    const stats = useMemo(() => {
        const total = filteredDonations.reduce((sum, d) => sum + d.amount, 0);
        const count = filteredDonations.length;
        const avg = count > 0 ? total / count : 0;
        const anonymous = filteredDonations.filter(d => d.anonymous).length;
        const thisWeek = filteredDonations.filter(d => {
            const date = convertTimestamp(d.backedAt);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return date >= weekAgo;
        }).length;

        return { total, count, avg, anonymous, thisWeek };
    }, [filteredDonations]);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Export to CSV
    const handleExportCSV = () => {
        if (filteredDonations.length === 0) {
            toast.error('No donations to export');
            return;
        }

        const headers = ['Date', 'Name', 'Amount', 'Project', 'Anonymous', 'Tier'];
        const rows = filteredDonations.map(d => [
            convertTimestamp(d.backedAt).toLocaleDateString('en-IN'),
            d.anonymous ? 'Anonymous' : d.displayName,
            d.amount.toString(),
            d.projectTitle,
            d.anonymous ? 'Yes' : 'No',
            d.rewardTier || 'N/A'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `donations_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Exported ${filteredDonations.length} donations`);
    };

    // Generate receipt
    const handleGenerateReceipt = (donation: DonationData & { projectTitle: string }) => {
        const receipt = {
            receiptNumber: `RCP-${donation.id.slice(0, 8).toUpperCase()}`,
            date: convertTimestamp(donation.backedAt).toLocaleDateString('en-IN'),
            donorName: donation.anonymous ? 'Anonymous Donor' : donation.displayName,
            amount: donation.amount,
            project: donation.projectTitle,
            status: 'Confirmed',
            generatedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt_${donation.id.slice(0, 8)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('Receipt downloaded');
    };

    // Toggle sort
    const toggleSort = (field: 'date' | 'amount') => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    if (projectsLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Donations</h1>
                                <p className="text-sm text-gray-500">
                                    {allDonations.length} total donations across all projects
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <div className="flex items-center space-x-2 mb-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-medium text-gray-500 uppercase">Total</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.total)}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <div className="flex items-center space-x-2 mb-1">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-medium text-gray-500 uppercase">Count</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{stats.count}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <div className="flex items-center space-x-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-orange-600" />
                            <span className="text-xs font-medium text-gray-500 uppercase">Average</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.avg)}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <div className="flex items-center space-x-2 mb-1">
                            <Shield className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-medium text-gray-500 uppercase">Anonymous</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{stats.anonymous}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="w-4 h-4 text-red-600" />
                            <span className="text-xs font-medium text-gray-500 uppercase">This Week</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{stats.thisWeek}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, amount, or project..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>

                        {/* Project Filter */}
                        <div className="relative">
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="appearance-none bg-white border border-gray-300 rounded-lg py-2.5 pl-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[180px]"
                            >
                                <option value="all">All Projects</option>
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>{project.title}</option>
                                ))}
                            </select>
                            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                        </div>

                        {/* Amount Filter */}
                        <div className="relative">
                            <select
                                value={amountFilter}
                                onChange={(e) => setAmountFilter(e.target.value as any)}
                                className="appearance-none bg-white border border-gray-300 rounded-lg py-2.5 pl-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[150px]"
                            >
                                <option value="all">All Amounts</option>
                                <option value="small">Under ₹500</option>
                                <option value="medium">₹500 - ₹2,000</option>
                                <option value="large">Above ₹2,000</option>
                            </select>
                            <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                        </div>

                        {/* Sort Buttons */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => toggleSort('date')}
                                className={`flex items-center space-x-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${sortBy === 'date'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <Calendar className="w-4 h-4" />
                                <span>Date</span>
                                {sortBy === 'date' && (sortOrder === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />)}
                            </button>
                            <button
                                onClick={() => toggleSort('amount')}
                                className={`flex items-center space-x-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${sortBy === 'amount'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <DollarSign className="w-4 h-4" />
                                <span>Amount</span>
                                {sortBy === 'amount' && (sortOrder === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />)}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Donations Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                            {filteredDonations.length} Donation{filteredDonations.length !== 1 ? 's' : ''}
                        </h3>
                    </div>

                    {filteredDonations.length === 0 ? (
                        <div className="text-center py-12">
                            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No donations found</p>
                            <p className="text-sm text-gray-400">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Donor</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Project</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredDonations.map((donation) => (
                                        <tr key={donation.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${donation.anonymous ? 'bg-gray-100' : 'bg-gradient-to-br from-orange-400 to-red-500'
                                                        }`}>
                                                        {donation.displayProfileImage && !donation.anonymous ? (
                                                            <img
                                                                src={donation.displayProfileImage}
                                                                alt={donation.displayName}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                        ) : donation.anonymous ? (
                                                            <Shield className="w-5 h-5 text-gray-400" />
                                                        ) : (
                                                            <span className="text-white font-bold">
                                                                {donation.displayName.charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{donation.displayName}</p>
                                                        {donation.anonymous && (
                                                            <span className="text-xs text-gray-500">Anonymous</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                                    {donation.projectTitle}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-900">{formatCurrency(donation.amount)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm text-gray-900">
                                                        {convertTimestamp(donation.backedAt).toLocaleDateString('en-IN')}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatDistanceToNow(convertTimestamp(donation.backedAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleGenerateReceipt(donation)}
                                                        className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                        <span>Receipt</span>
                                                    </button>
                                                    {!donation.anonymous && (
                                                        <button
                                                            onClick={() => navigate(`/profile/${donation.userId}`)}
                                                            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            <span>Profile</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
