import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    RefreshCw,
    Search,
    ChevronDown,
    ChevronUp,
    DollarSign,
    User,
    Heart,
    ExternalLink,
    FileText,
    Copy,
    Crown,
    Medal,
    Award,
    ArrowUpDown,
    Calendar,
    Download,
    Receipt,
    Trophy
} from 'lucide-react';
import { useProjectContext } from '../../hooks/useProjectContext';
import { useContextualSupporters } from '../../hooks/useContextualSupporters';
import { useAuth } from '../../contexts/AuthContext';
import { useNewBackersSinceLastVisit } from '../../hooks/useNewBackersSinceLastVisit';
import { markBackerAsThanked } from '../../lib/thankBacker';
import BackersStatsCard from '../creator/BackersStatsCard';
import ThankYouModal from '../creator/ThankYouModal';
import ReceiptModal from '../creator/ReceiptModal';
import toast from 'react-hot-toast';

// Filter types
type AmountFilter = 'all' | '0-500' | '500-2000' | '2000-5000' | '5000+';
type DateFilter = 'all' | '7' | '30' | '90' | 'year';
type TypeFilter = 'all' | 'named' | 'anonymous';
type SortOption = 'amount_high' | 'amount_low' | 'recent' | 'oldest' | 'count';

// Amount filter options
const AMOUNT_FILTER_OPTIONS: { value: AmountFilter; label: string; min: number; max: number }[] = [
    { value: 'all', label: 'Any Amount', min: 0, max: Infinity },
    { value: '0-500', label: '< ₹500', min: 0, max: 500 },
    { value: '500-2000', label: '₹500 - ₹2,000', min: 500, max: 2000 },
    { value: '2000-5000', label: '₹2,000 - ₹5,000', min: 2000, max: 5000 },
    { value: '5000+', label: '> ₹5,000', min: 5000, max: Infinity }
];

// Date filter options
const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
    { value: 'all', label: 'All Time' },
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 90 Days' },
    { value: 'year', label: 'This Year' }
];

// Sort options
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'amount_high', label: 'Amount (High → Low)' },
    { value: 'amount_low', label: 'Amount (Low → High)' },
    { value: 'recent', label: 'Most Recent' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'count', label: 'Most Donations' }
];

// Format currency in Indian format
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

// Get time ago string
const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString('en-IN');
};

// Get rank icon
const getRankIcon = (rank: number) => {
    switch (rank) {
        case 1:
            return <Crown className="w-5 h-5 text-yellow-500" />;
        case 2:
            return <Medal className="w-5 h-5 text-gray-400" />;
        case 3:
            return <Award className="w-5 h-5 text-orange-400" />;
        default:
            return <span className="w-5 h-5 text-gray-400 text-sm font-medium">{rank}</span>;
    }
};

export default function CreatorBackersPage() {
    const { selectedProject } = useProjectContext();
    const {
        supporters,
        topSupporters,
        stats,
        loading,
        error
    } = useContextualSupporters();
    const { user } = useAuth();
    const { markAsVisited } = useNewBackersSinceLastVisit(user?.uid || '');

    // Reset new backers count when visiting this page
    useEffect(() => {
        markAsVisited();
    }, [markAsVisited]);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [amountFilter, setAmountFilter] = useState<AmountFilter>('all');
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [sortOption, setSortOption] = useState<SortOption>('amount_high');

    // Dropdown state
    const [showAmountDropdown, setShowAmountDropdown] = useState(false);
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [showExportDropdown, setShowExportDropdown] = useState(false);

    // Expanded donation history state (track which supporters are expanded)
    const [expandedSupporters, setExpandedSupporters] = useState<Set<string>>(new Set());

    // Full leaderboard modal state
    const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

    // Thank You Modal state
    const [showThankYouModal, setShowThankYouModal] = useState(false);
    const [selectedSupporterForThankYou, setSelectedSupporterForThankYou] = useState<typeof supporters[0] | null>(null);

    // Receipt Modal state
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedSupporterForReceipt, setSelectedSupporterForReceipt] = useState<typeof supporters[0] | null>(null);
    const [selectedDonationForReceipt, setSelectedDonationForReceipt] = useState<{
        id: string;
        amount: number;
        projectTitle: string;
        projectId: string;
        date: Date;
        transactionId?: string;
    } | null>(null);

    // Track locally thanked IDs for immediate UI feedback
    const [locallyThankedIds, setLocallyThankedIds] = useState<Set<string>>(new Set());

    // Pagination
    const [displayCount, setDisplayCount] = useState(10);
    const LOAD_MORE_COUNT = 10;

    // Is filtering by project (from navbar)
    const isFilteringByProject = selectedProject !== null;

    // Toggle donation history expansion
    const toggleExpanded = useCallback((supporterId: string) => {
        setExpandedSupporters(prev => {
            const next = new Set(prev);
            if (next.has(supporterId)) {
                next.delete(supporterId);
            } else {
                next.add(supporterId);
            }
            return next;
        });
    }, []);

    // Open Thank You Modal
    const handleOpenThankYou = useCallback((supporter: typeof supporters[0]) => {
        setSelectedSupporterForThankYou(supporter);
        setShowThankYouModal(true);
    }, []);

    // Handle sending thank you message
    const handleSendThankYou = useCallback(async (supporterId: string, message: string) => {
        if (!user || !selectedSupporterForThankYou) return;

        try {
            // Mark as thanked in Firestore using the donation ID
            await markBackerAsThanked(selectedSupporterForThankYou.visibleDonationId, user.uid);

            // Update local state for immediate UI feedback
            setLocallyThankedIds(prev => new Set([...prev, selectedSupporterForThankYou.id]));

            // In production, you would also:
            // 1. Create a notification in Firebase
            // 2. Potentially send an email
            console.log('Thank you sent to:', supporterId, 'Message:', message);
        } catch (error) {
            console.error('Error sending thank you:', error);
            toast.error('Failed to send thank you');
        }
    }, [user, selectedSupporterForThankYou]);

    // Open Receipt Modal
    const handleOpenReceipt = useCallback((
        supporter: typeof supporters[0],
        donation: typeof supporters[0]['donationHistory'][0]
    ) => {
        setSelectedSupporterForReceipt(supporter);
        setSelectedDonationForReceipt(donation);
        setShowReceiptModal(true);
    }, []);

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Filtered and sorted supporters
    const filteredSupporters = useMemo(() => {
        let result = [...supporters];

        // Search filter
        if (debouncedSearch.trim()) {
            const query = debouncedSearch.toLowerCase();
            result = result.filter(s =>
                s.displayName.toLowerCase().includes(query) ||
                s.projects.some(p => p.toLowerCase().includes(query))
            );
        }

        // Amount filter
        if (amountFilter !== 'all') {
            const option = AMOUNT_FILTER_OPTIONS.find(o => o.value === amountFilter);
            if (option) {
                result = result.filter(s => s.totalAmount >= option.min && s.totalAmount < option.max);
            }
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            let cutoffDate: Date;

            if (dateFilter === 'year') {
                cutoffDate = new Date(now.getFullYear(), 0, 1);
            } else {
                const days = parseInt(dateFilter);
                cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
            }

            result = result.filter(s => s.latestDonation >= cutoffDate);
        }

        // Type filter
        if (typeFilter === 'named') {
            result = result.filter(s => !s.anonymous);
        } else if (typeFilter === 'anonymous') {
            result = result.filter(s => s.anonymous);
        }

        // Sort
        result.sort((a, b) => {
            switch (sortOption) {
                case 'amount_high':
                    return b.totalAmount - a.totalAmount;
                case 'amount_low':
                    return a.totalAmount - b.totalAmount;
                case 'recent':
                    return b.latestDonation.getTime() - a.latestDonation.getTime();
                case 'oldest':
                    return a.latestDonation.getTime() - b.latestDonation.getTime();
                case 'count':
                    return b.donationCount - a.donationCount;
                default:
                    return 0;
            }
        });

        return result;
    }, [supporters, debouncedSearch, amountFilter, dateFilter, typeFilter, sortOption]);

    // Paginated supporters
    const paginatedSupporters = useMemo(() => {
        return filteredSupporters.slice(0, displayCount);
    }, [filteredSupporters, displayCount]);

    // Reset display count when filters change
    useEffect(() => {
        setDisplayCount(10);
    }, [debouncedSearch, amountFilter, dateFilter, typeFilter, sortOption]);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        // Force re-fetch by remounting - in production you'd have a refetch function
        window.location.reload();
    }, []);

    // Handle load more
    const handleLoadMore = () => {
        setDisplayCount(prev => prev + LOAD_MORE_COUNT);
    };

    // Export to CSV
    const handleExportCSV = useCallback(() => {
        const headers = ['Name', 'Total Amount', 'Donations', 'Projects', 'Latest Donation', 'Type'];
        const rows = filteredSupporters.map(s => [
            s.anonymous ? 'Anonymous' : s.displayName,
            s.totalAmount.toString(),
            s.donationCount.toString(),
            s.projects.join('; '),
            s.latestDonation.toLocaleDateString('en-IN'),
            s.anonymous ? 'Anonymous' : 'Named'
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backers_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Exported to CSV!');
        setShowExportDropdown(false);
    }, [filteredSupporters]);

    // Export to JSON
    const handleExportJSON = useCallback(() => {
        const data = filteredSupporters.map(s => ({
            name: s.anonymous ? 'Anonymous' : s.displayName,
            totalAmount: s.totalAmount,
            donationCount: s.donationCount,
            projects: s.projects,
            latestDonation: s.latestDonation.toISOString(),
            anonymous: s.anonymous
        }));

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backers_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Exported to JSON!');
        setShowExportDropdown(false);
    }, [filteredSupporters]);

    // Export to PDF
    const handleExportPDF = useCallback(async () => {
        try {
            // Dynamic import to reduce bundle size
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Header
            doc.setFillColor(249, 115, 22); // Orange
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('Backers Report', 14, 25);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on ${new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })}`, 14, 35);

            // Summary Stats Box
            doc.setTextColor(0, 0, 0);
            doc.setFillColor(249, 250, 251);
            doc.roundedRect(14, 50, pageWidth - 28, 35, 3, 3, 'F');

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Summary', 20, 62);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            const totalAmount = filteredSupporters.reduce((sum, s) => sum + s.totalAmount, 0);
            const avgDonation = filteredSupporters.length > 0 ? totalAmount / filteredSupporters.length : 0;

            doc.text(`Total Backers: ${filteredSupporters.length}`, 20, 72);
            doc.text(`Total Raised: ${formatCurrency(totalAmount)}`, 80, 72);
            doc.text(`Avg. Donation: ${formatCurrency(avgDonation)}`, 150, 72);
            doc.text(`Named: ${filteredSupporters.filter(s => !s.anonymous).length} | Anonymous: ${filteredSupporters.filter(s => s.anonymous).length}`, 20, 80);

            // Backers Table
            const tableData = filteredSupporters.map((s, index) => [
                (index + 1).toString(),
                s.anonymous ? 'Anonymous' : s.displayName,
                formatCurrency(s.totalAmount),
                s.donationCount.toString(),
                s.projects.slice(0, 2).join(', ') + (s.projects.length > 2 ? '...' : ''),
                s.latestDonation.toLocaleDateString('en-IN')
            ]);

            autoTable(doc, {
                startY: 95,
                head: [['#', 'Backer Name', 'Total Amount', 'Donations', 'Projects', 'Latest']],
                body: tableData,
                theme: 'striped',
                headStyles: {
                    fillColor: [249, 115, 22],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [254, 249, 243]
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 3
                },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 45 },
                    2: { cellWidth: 30 },
                    3: { cellWidth: 20 },
                    4: { cellWidth: 50 },
                    5: { cellWidth: 25 }
                }
            });

            // Footer - use internal.pages.length for page count
            const pageCount = (doc as any).internal.pages.length - 1;
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text(
                    `Page ${i} of ${pageCount} | Lineup - Crowdfunding Platform`,
                    pageWidth / 2,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: 'center' }
                );
            }

            // Save
            doc.save(`backers_report_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('Exported to PDF!');
            setShowExportDropdown(false);
        } catch (error) {
            console.error('PDF export error:', error);
            toast.error('Failed to export PDF. Please try again.');
        }
    }, [filteredSupporters]);

    // Get current filter labels
    const currentAmountLabel = AMOUNT_FILTER_OPTIONS.find(o => o.value === amountFilter)?.label || 'Amount';
    const currentDateLabel = DATE_FILTER_OPTIONS.find(o => o.value === dateFilter)?.label || 'Date';
    const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortOption)?.label || 'Sort';

    // Loading state with skeleton
    if (loading && supporters.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                {/* Header Skeleton */}
                <div className="bg-white border-b border-gray-200">
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                        <div className="animate-pulse">
                            <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
                            <div className="h-4 w-72 bg-gray-100 rounded" />
                        </div>
                    </div>
                </div>

                <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
                    {/* Stats Cards Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                                    <div className="w-16 h-6 bg-gray-100 rounded-full" />
                                </div>
                                <div className="h-8 w-24 bg-gray-200 rounded mb-2" />
                                <div className="h-4 w-32 bg-gray-100 rounded" />
                            </div>
                        ))}
                    </div>

                    {/* Content Skeleton */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 space-y-4">
                            {/* Filter Bar Skeleton */}
                            <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                                <div className="flex gap-3">
                                    <div className="h-10 w-48 bg-gray-200 rounded-lg" />
                                    <div className="h-10 w-24 bg-gray-100 rounded-lg" />
                                    <div className="h-10 w-24 bg-gray-100 rounded-lg" />
                                </div>
                            </div>

                            {/* Backer Cards Skeleton */}
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full" />
                                        <div className="flex-1">
                                            <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
                                            <div className="h-4 w-48 bg-gray-100 rounded mb-2" />
                                            <div className="h-3 w-24 bg-gray-100 rounded" />
                                        </div>
                                        <div className="text-right">
                                            <div className="h-6 w-20 bg-green-100 rounded mb-2" />
                                            <div className="flex gap-1">
                                                <div className="w-8 h-8 bg-gray-100 rounded" />
                                                <div className="w-8 h-8 bg-gray-100 rounded" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Sidebar Skeleton */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                                <div className="h-6 w-28 bg-gray-200 rounded mb-4" />
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-gray-200 rounded-full" />
                                        <div className="w-8 h-8 bg-gray-100 rounded-full" />
                                        <div className="flex-1 h-4 bg-gray-100 rounded" />
                                        <div className="w-16 h-4 bg-gray-100 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="bg-white border-b border-gray-200">
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Users className="w-8 h-8 text-orange-500" />
                            Backers
                        </h1>
                    </div>
                </div>

                <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
                    <div className="max-w-md mx-auto text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                        <p className="text-gray-600 mb-6">
                            We couldn't load your backers data. Please check your connection and try again.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Try Again
                        </button>
                        <p className="text-sm text-gray-400 mt-4">
                            Error: {error}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Users className="w-8 h-8 text-orange-500" />
                                Backers
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {isFilteringByProject
                                    ? `Showing backers for: ${selectedProject?.title}`
                                    : 'View and engage with your supporters across all projects'
                                }
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Export Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Export
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showExportDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowExportDropdown(false)} />
                                        <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px]">
                                            <button
                                                onClick={handleExportCSV}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <FileText className="w-4 h-4" />
                                                Export as CSV
                                            </button>
                                            <button
                                                onClick={handleExportPDF}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <FileText className="w-4 h-4 text-red-500" />
                                                Export as PDF
                                            </button>
                                            <button
                                                onClick={handleExportJSON}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <FileText className="w-4 h-4" />
                                                Export as JSON
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={handleRefresh}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
                {/* Stats Cards Component */}
                <BackersStatsCard
                    supporters={supporters}
                    stats={stats}
                    loading={loading}
                    isFilteringByProject={isFilteringByProject}
                />

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left Column - Backers List (2/3) */}
                    <div className="xl:col-span-2">
                        {/* Filters */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
                                {/* Search */}
                                <div className="relative flex-1 w-full lg:max-w-xs">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search backers..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>

                                {/* Amount Filter */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowAmountDropdown(!showAmountDropdown)}
                                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                                    >
                                        <DollarSign className="w-4 h-4 text-gray-500" />
                                        {currentAmountLabel}
                                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showAmountDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showAmountDropdown && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowAmountDropdown(false)} />
                                            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[150px]">
                                                {AMOUNT_FILTER_OPTIONS.map(option => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => { setAmountFilter(option.value); setShowAmountDropdown(false); }}
                                                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${amountFilter === option.value ? 'bg-orange-50 text-orange-600' : ''}`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Date Filter */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowDateDropdown(!showDateDropdown)}
                                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                                    >
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        {currentDateLabel}
                                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showDateDropdown && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowDateDropdown(false)} />
                                            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[130px]">
                                                {DATE_FILTER_OPTIONS.map(option => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => { setDateFilter(option.value); setShowDateDropdown(false); }}
                                                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${dateFilter === option.value ? 'bg-orange-50 text-orange-600' : ''}`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Type Filter */}
                                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setTypeFilter('all')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${typeFilter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'}`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setTypeFilter('named')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${typeFilter === 'named' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'}`}
                                    >
                                        Named
                                    </button>
                                    <button
                                        onClick={() => setTypeFilter('anonymous')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${typeFilter === 'anonymous' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'}`}
                                    >
                                        Anonymous
                                    </button>
                                </div>

                                {/* Sort */}
                                <div className="relative ml-auto">
                                    <button
                                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                                    >
                                        <ArrowUpDown className="w-4 h-4 text-gray-500" />
                                        {currentSortLabel}
                                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showSortDropdown && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
                                            <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[180px]">
                                                {SORT_OPTIONS.map(option => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => { setSortOption(option.value); setShowSortDropdown(false); }}
                                                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${sortOption === option.value ? 'bg-orange-50 text-orange-600' : ''}`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Backers List */}
                        <div className="space-y-3">
                            {paginatedSupporters.length === 0 ? (
                                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                    {stats.totalSupporters === 0 ? (
                                        <>
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Users className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Backers Yet</h3>
                                            <p className="text-gray-600 mb-4">
                                                When supporters back your project, they'll appear here.
                                            </p>
                                            <Link
                                                to="/dashboard/projects"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Share Your Projects
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Search className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
                                            <p className="text-gray-600">
                                                Try adjusting your filters or search query.
                                            </p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {paginatedSupporters.map((supporter, index) => (
                                        <div
                                            key={supporter.id}
                                            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Rank or Avatar */}
                                                <div className="flex-shrink-0">
                                                    {index < 3 && sortOption === 'amount_high' ? (
                                                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center">
                                                            {getRankIcon(index + 1)}
                                                        </div>
                                                    ) : supporter.displayProfileImage ? (
                                                        <img
                                                            src={supporter.displayProfileImage}
                                                            alt={supporter.displayName}
                                                            className="w-12 h-12 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                            <User className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-gray-900">
                                                            {supporter.anonymous ? 'Anonymous Supporter' : supporter.displayName}
                                                        </span>
                                                        {supporter.anonymous && (
                                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                                Anonymous
                                                            </span>
                                                        )}
                                                        {supporter.donationCount > 1 && (
                                                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                                                                {supporter.donationCount}x Backer
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500 mt-1">
                                                        {supporter.donationCount} donation{supporter.donationCount !== 1 ? 's' : ''} • Latest: {getTimeAgo(supporter.latestDonation)}
                                                    </div>
                                                    <div className="text-sm text-gray-500 mt-1 truncate">
                                                        Projects: {supporter.projects.join(', ')}
                                                    </div>
                                                </div>

                                                {/* Amount */}
                                                <div className="flex-shrink-0 text-right">
                                                    <div className="text-xl font-bold text-green-600">
                                                        {formatCurrency(supporter.totalAmount)}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {!supporter.anonymous && (
                                                            <>
                                                                {/* Thank You Button or Thanked Badge */}
                                                                {supporter.isThanked || locallyThankedIds.has(supporter.id) ? (
                                                                    <span
                                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg"
                                                                        title="Already thanked"
                                                                    >
                                                                        ✓ Thanked
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleOpenThankYou(supporter)}
                                                                        className="p-1.5 text-pink-500 hover:bg-pink-50 rounded-lg transition-colors"
                                                                        title="Send Thank You"
                                                                    >
                                                                        <Heart className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => window.open(`/user/${supporter.userId}`, '_blank')}
                                                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="View Profile"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(`${supporter.displayName} - ${formatCurrency(supporter.totalAmount)}`);
                                                                toast.success('Copied to clipboard!');
                                                            }}
                                                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="Copy Details"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expand/Collapse Button - Only show if more than 1 donation */}
                                            {supporter.donationCount > 1 && (
                                                <button
                                                    onClick={() => toggleExpanded(supporter.id)}
                                                    className="w-full flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                                >
                                                    {expandedSupporters.has(supporter.id) ? (
                                                        <>
                                                            <ChevronUp className="w-4 h-4" />
                                                            Hide donation history
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="w-4 h-4" />
                                                            Show {supporter.donationCount} donations
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {/* Expandable Donation History */}
                                            {expandedSupporters.has(supporter.id) && supporter.donationHistory && (
                                                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                                                    {supporter.donationHistory.map((donation) => (
                                                        <div
                                                            key={donation.id}
                                                            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                                <div>
                                                                    <div className="font-medium text-gray-900 text-sm">
                                                                        {formatCurrency(donation.amount)}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {donation.date.toLocaleDateString('en-IN', {
                                                                            day: 'numeric',
                                                                            month: 'short',
                                                                            year: 'numeric'
                                                                        })} • {donation.projectTitle}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleOpenReceipt(supporter, donation)}
                                                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                                                title="Generate Receipt"
                                                            >
                                                                <Receipt className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Load More */}
                                    {displayCount < filteredSupporters.length && (
                                        <div className="text-center pt-4">
                                            <button
                                                onClick={handleLoadMore}
                                                className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                            >
                                                Load More ({filteredSupporters.length - displayCount} remaining)
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Results Count */}
                        {paginatedSupporters.length > 0 && (
                            <div className="text-center text-sm text-gray-500 mt-4">
                                Showing {paginatedSupporters.length} of {filteredSupporters.length} backers
                            </div>
                        )}
                    </div>

                    {/* Right Column - Top Backers & Stats (1/3) */}
                    <div className="space-y-6">
                        {/* Top Backers Leaderboard */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                                <Crown className="w-5 h-5 text-yellow-500" />
                                Top Backers
                            </h3>

                            {topSupporters.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">No backers yet</p>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        {(showLeaderboardModal ? supporters.slice(0, 20) : topSupporters).map((supporter, index) => (
                                            <div key={supporter.id} className="flex items-center gap-3">
                                                <div className="flex-shrink-0 w-8 flex justify-center">
                                                    {getRankIcon(index + 1)}
                                                </div>
                                                {supporter.displayProfileImage && !supporter.anonymous ? (
                                                    <img
                                                        src={supporter.displayProfileImage}
                                                        alt={supporter.displayName}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <User className="w-4 h-4 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-900 truncate text-sm">
                                                        {supporter.anonymous ? 'Anonymous' : supporter.displayName}
                                                    </div>
                                                    {showLeaderboardModal && (
                                                        <div className="text-xs text-gray-500">
                                                            {supporter.donationCount} donation{supporter.donationCount !== 1 ? 's' : ''}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="font-bold text-green-600 text-sm">
                                                    {formatCurrency(supporter.totalAmount)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* View All / Show Less Button */}
                                    {supporters.length > 5 && (
                                        <button
                                            onClick={() => setShowLeaderboardModal(!showLeaderboardModal)}
                                            className="w-full mt-4 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Trophy className="w-4 h-4" />
                                            {showLeaderboardModal ? (
                                                <>Show Top 5 Only</>
                                            ) : (
                                                <>View All {supporters.length} Rankings</>
                                            )}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Quick Stats
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">Named vs Anonymous</span>
                                    <span className="font-medium text-sm">
                                        {stats.uniqueNonAnonymous} / {stats.anonymousCount}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">Repeat backer rate</span>
                                    <span className="font-medium text-sm">
                                        {stats.totalSupporters > 0
                                            ? `${((stats.repeatSupporters / stats.totalSupporters) * 100).toFixed(0)}%`
                                            : '0%'
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">Top contribution</span>
                                    <span className="font-bold text-green-600 text-sm">
                                        {topSupporters[0] ? formatCurrency(topSupporters[0].totalAmount) : '₹0'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Thank You Modal */}
            {selectedSupporterForThankYou && (
                <ThankYouModal
                    isOpen={showThankYouModal}
                    onClose={() => {
                        setShowThankYouModal(false);
                        setSelectedSupporterForThankYou(null);
                    }}
                    supporter={selectedSupporterForThankYou}
                    onSend={handleSendThankYou}
                />
            )}

            {/* Receipt Modal */}
            {selectedSupporterForReceipt && selectedDonationForReceipt && (
                <ReceiptModal
                    isOpen={showReceiptModal}
                    onClose={() => {
                        setShowReceiptModal(false);
                        setSelectedSupporterForReceipt(null);
                        setSelectedDonationForReceipt(null);
                    }}
                    supporter={selectedSupporterForReceipt}
                    donation={selectedDonationForReceipt}
                    creatorName={selectedProject?.title ? `${selectedProject.title} Creator` : 'Project Creator'}
                />
            )}
        </div>
    );
}
