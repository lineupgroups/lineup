import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Users, RefreshCw, Search, ChevronDown, ChevronUp, DollarSign, User, Heart, AlertCircle,
    ExternalLink, FileText, Download, Trophy, Plus, Sparkles, Pin, Medal, Award, Crown,
    ArrowUpDown, Calendar, Receipt, Filter, Star, Copy
} from 'lucide-react';
import PageTitle from '../common/PageTitle';
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
            return <Crown className="w-5 h-5 text-brand-acid" />;
        case 2:
            return <Medal className="w-5 h-5 text-neutral-600" />;
        case 3:
            return <Award className="w-5 h-5 text-brand-orange" />;
        default:
            return <span className="w-5 h-5 text-neutral-600 text-sm font-medium">{rank}</span>;
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
            <div className="min-h-screen bg-brand-black text-brand-white font-sans">
                {/* Header Skeleton */}
                <div className="bg-[#111] border-b border-neutral-800">
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                        <div className="animate-pulse">
                            <div className="h-8 w-48 bg-neutral-800 rounded mb-2" />
                            <div className="h-4 w-72 bg-neutral-900 rounded" />
                        </div>
                    </div>
                </div>

                <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
                    {/* Stats Cards Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-[#111] rounded-3xl border border-neutral-800 p-6 animate-pulse">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-neutral-800 rounded-3xl" />
                                    <div className="w-16 h-6 bg-neutral-900 rounded-full" />
                                </div>
                                <div className="h-8 w-24 bg-neutral-800 rounded mb-2" />
                                <div className="h-4 w-32 bg-neutral-900 rounded" />
                            </div>
                        ))}
                    </div>

                    {/* Content Skeleton */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 space-y-4">
                            {/* Filter Bar Skeleton */}
                            <div className="bg-[#111] rounded-3xl border border-neutral-800 p-4 animate-pulse">
                                <div className="flex gap-3">
                                    <div className="h-10 w-48 bg-neutral-800 rounded-2xl" />
                                    <div className="h-10 w-24 bg-neutral-900 rounded-2xl" />
                                    <div className="h-10 w-24 bg-neutral-900 rounded-2xl" />
                                </div>
                            </div>

                            {/* Backer Cards Skeleton */}
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="bg-[#111] rounded-3xl border border-neutral-800 p-4 animate-pulse">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-neutral-800 rounded-full" />
                                        <div className="flex-1">
                                            <div className="h-5 w-32 bg-neutral-800 rounded mb-2" />
                                            <div className="h-4 w-48 bg-neutral-900 rounded mb-2" />
                                            <div className="h-3 w-24 bg-neutral-900 rounded" />
                                        </div>
                                        <div className="text-right">
                                            <div className="h-6 w-20 bg-brand-acid/20 rounded mb-2" />
                                            <div className="flex gap-1">
                                                <div className="w-8 h-8 bg-neutral-900 rounded" />
                                                <div className="w-8 h-8 bg-neutral-900 rounded" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Content Skeleton */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            <div className="xl:col-span-2 space-y-6">
                                <div className="h-20 bg-white/5 rounded-[2.5rem] border border-white/10" />
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-32 bg-white/5 rounded-[2rem] border border-white/10" />
                                ))}
                            </div>
                            <div className="h-96 bg-white/5 rounded-[2.5rem] border border-white/10" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-brand-black text-brand-white font-sans py-8">
                <PageTitle title="Network Error" description="Supporter sync failed" />
                <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-center py-20">
                    <div className="max-w-xl w-full bg-white/5 backdrop-blur-xl rounded-[3rem] border border-brand-orange/20 p-12 text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-brand-orange/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-brand-orange/20 shadow-[0_0_30px_rgba(255,91,0,0.1)]">
                                <AlertCircle className="w-12 h-12 text-brand-orange" />
                            </div>
                            <h2 className="text-4xl font-black text-brand-white italic uppercase tracking-tight mb-4">
                                Sync <span className="text-brand-orange">Interrupted</span>
                            </h2>
                            <p className="text-neutral-400 font-medium mb-10 leading-relaxed">
                                Our elite data channels are currently experiencing interference. We couldn't establish a secure connection to your supporter network.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full sm:w-auto px-10 py-5 bg-brand-orange text-brand-black font-black italic uppercase tracking-widest text-xs rounded-2xl hover:bg-brand-white transition-all active:scale-95 shadow-2xl shadow-brand-orange/20"
                                >
                                    Force Re-Sync
                                </button>
                                <Link
                                    to="/creator/dashboard"
                                    className="w-full sm:w-auto px-10 py-5 bg-white/5 text-brand-white border border-white/10 font-black italic uppercase tracking-widest text-xs rounded-2xl hover:bg-white/10 transition-all active:scale-95"
                                >
                                    Return to HQ
                                </Link>
                            </div>
                            {error && (
                                <div className="mt-8 pt-8 border-t border-white/5">
                                    <code className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Error Code: {error}</code>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-black text-brand-white font-sans py-8">
            {/* Dynamic Page Title */}
            <PageTitle title="Backers" description="Network with your elite supporters" />

            <div className="w-full px-4 sm:px-6 lg:px-8">
                {/* Header - Editorial Style */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-4 bg-brand-orange/10 rounded-3xl border border-brand-orange/20 shadow-[0_0_20px_rgba(255,91,0,0.1)]">
                                    <Users className="w-8 h-8 text-brand-orange" />
                                </div>
                                <span className="px-4 py-1.5 bg-brand-acid/10 text-brand-acid text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-brand-acid/20">
                                    Elite Network
                                </span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-brand-white tracking-tighter italic uppercase leading-none">
                                Supporter <span className="text-brand-acid">Network</span>
                            </h1>
                            <p className="text-lg sm:text-xl text-neutral-400 font-medium mt-4 max-w-2xl leading-relaxed">
                                Forge deeper connections and manage the elite inner circle who believe in your mission.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mb-2">
                            {/* Export Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                                    className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-brand-white rounded-2xl font-black italic uppercase tracking-wider hover:bg-white/10 transition-all active:scale-95 group"
                                >
                                    <Download className="w-5 h-5 text-brand-orange" />
                                    <span>Export Intel</span>
                                    <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showExportDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowExportDropdown(false)} />
                                        <div className="absolute top-full right-0 mt-2 bg-brand-black border border-white/10 rounded-[1.5rem] shadow-2xl z-20 min-w-[200px] overflow-hidden">
                                            <button
                                                onClick={handleExportCSV}
                                                className="w-full text-left px-5 py-4 hover:bg-white/5 text-[10px] font-black italic uppercase tracking-widest text-neutral-400 hover:text-brand-acid transition-all flex items-center gap-3"
                                            >
                                                <FileText className="w-4 h-4" />
                                                Export as CSV
                                            </button>
                                            <button
                                                onClick={handleExportPDF}
                                                className="w-full text-left px-5 py-4 hover:bg-white/5 text-[10px] font-black italic uppercase tracking-widest text-neutral-400 hover:text-brand-orange transition-all flex items-center gap-3 border-t border-white/5"
                                            >
                                                <FileText className="w-4 h-4" />
                                                Export as PDF
                                            </button>
                                            <button
                                                onClick={handleExportJSON}
                                                className="w-full text-left px-5 py-4 hover:bg-white/5 text-[10px] font-black italic uppercase tracking-widest text-neutral-400 hover:text-brand-white transition-all flex items-center gap-3 border-t border-white/5"
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
                                className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-brand-white rounded-2xl font-black italic uppercase tracking-wider hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50 group"
                            >
                                <RefreshCw className={`w-5 h-5 text-brand-acid ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                                <span>Sync Network</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="mt-8">
                {/* Stats Cards Component */}
                <BackersStatsCard
                    supporters={supporters}
                    stats={stats}
                    loading={loading}
                    isFilteringByProject={isFilteringByProject}
                />

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 space-y-6">
                        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-acid/5 rounded-full blur-3xl pointer-events-none"></div>
                            
                            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center relative z-10">
                                <div className="relative flex-1 w-full lg:max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Scan supporters..."
                                        className="w-full pl-12 pr-6 py-3.5 bg-brand-black/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-acid focus:border-brand-acid text-brand-white placeholder-neutral-700 transition-all font-black italic uppercase tracking-widest text-[10px]"
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowAmountDropdown(!showAmountDropdown)}
                                            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all border font-black italic uppercase tracking-widest text-[10px] ${amountFilter !== 'all' ? 'bg-brand-acid text-brand-black border-brand-acid' : 'bg-brand-black/50 border-white/10 text-neutral-400 hover:border-brand-acid'}`}
                                        >
                                            <Filter className="w-3.5 h-3.5" />
                                            {currentAmountLabel}
                                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAmountDropdown ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showAmountDropdown && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setShowAmountDropdown(false)} />
                                                <div className="absolute top-full left-0 mt-2 bg-brand-black border border-white/10 rounded-[1.2rem] shadow-2xl z-20 min-w-[200px] overflow-hidden">
                                                    {AMOUNT_FILTER_OPTIONS.map(option => (
                                                        <button
                                                            key={option.value}
                                                            onClick={() => { setAmountFilter(option.value); setShowAmountDropdown(false); }}
                                                            className={`w-full text-left px-5 py-3 hover:bg-white/5 text-[10px] font-black italic uppercase tracking-widest transition-all ${amountFilter === option.value ? 'text-brand-acid bg-brand-acid/10' : 'text-neutral-500'}`}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={() => setShowDateDropdown(!showDateDropdown)}
                                            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all border font-black italic uppercase tracking-widest text-[10px] ${dateFilter !== 'all' ? 'bg-brand-acid text-brand-black border-brand-acid' : 'bg-brand-black/50 border-white/10 text-neutral-400 hover:border-brand-acid'}`}
                                        >
                                            <Calendar className="w-3.5 h-3.5" />
                                            {currentDateLabel}
                                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showDateDropdown && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setShowDateDropdown(false)} />
                                                <div className="absolute top-full left-0 mt-2 bg-brand-black border border-white/10 rounded-[1.2rem] shadow-2xl z-20 min-w-[180px] overflow-hidden">
                                                    {DATE_FILTER_OPTIONS.map(option => (
                                                        <button
                                                            key={option.value}
                                                            onClick={() => { setDateFilter(option.value); setShowDateDropdown(false); }}
                                                            className={`w-full text-left px-5 py-3 hover:bg-white/5 text-[10px] font-black italic uppercase tracking-widest transition-all ${dateFilter === option.value ? 'text-brand-acid bg-brand-acid/10' : 'text-neutral-500'}`}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex items-center bg-brand-black/50 border border-white/10 rounded-2xl p-1">
                                        {['all', 'named', 'anonymous'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setTypeFilter(type as TypeFilter)}
                                                className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] transition-all ${typeFilter === type ? 'bg-brand-acid text-brand-black' : 'text-neutral-600 hover:text-brand-white'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="relative lg:ml-auto">
                                        <button
                                            onClick={() => setShowSortDropdown(!showSortDropdown)}
                                            className="flex items-center gap-3 px-5 py-3.5 bg-brand-black/50 border border-white/10 rounded-2xl hover:border-brand-acid text-neutral-400 font-black italic uppercase tracking-widest text-[10px] transition-all"
                                        >
                                            <ArrowUpDown className="w-3.5 h-3.5" />
                                            {currentSortLabel}
                                        </button>

                                        {showSortDropdown && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
                                                <div className="absolute top-full right-0 mt-2 bg-brand-black border border-white/10 rounded-[1.2rem] shadow-2xl z-20 min-w-[220px] overflow-hidden">
                                                    {SORT_OPTIONS.map(option => (
                                                        <button
                                                            key={option.value}
                                                            onClick={() => { setSortOption(option.value); setShowSortDropdown(false); }}
                                                            className={`w-full text-left px-5 py-3 hover:bg-white/5 text-[10px] font-black italic uppercase tracking-widest transition-all ${sortOption === option.value ? 'text-brand-acid bg-brand-acid/10' : 'text-neutral-500'}`}
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
                        </div>

                        {/* Backers List */}
                        <div className="space-y-3">
                            {paginatedSupporters.length === 0 ? (
                                <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-12 text-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                                    {stats.totalSupporters === 0 ? (
                                        <>
                                            <div className="w-20 h-20 bg-brand-orange/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-brand-orange/20 shadow-[0_0_20px_rgba(255,91,0,0.1)]">
                                                <Users className="w-10 h-10 text-brand-orange" />
                                            </div>
                                            <h3 className="text-3xl font-black text-brand-white italic uppercase tracking-tight mb-3">No Backers <span className="text-brand-orange">Yet</span></h3>
                                            <p className="text-neutral-400 font-medium mb-8 max-w-sm mx-auto">
                                                The elite network is waiting for your first project deployment.
                                            </p>
                                            <Link
                                                to="/dashboard/projects"
                                                className="inline-flex items-center gap-3 px-8 py-4 bg-brand-orange text-brand-black font-black italic uppercase tracking-widest text-xs rounded-2xl hover:bg-brand-white transition-all active:scale-95 shadow-2xl shadow-brand-orange/20"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Deploy Projects
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/10">
                                                <Search className="w-10 h-10 text-neutral-500" />
                                            </div>
                                            <h3 className="text-3xl font-black text-brand-white italic uppercase tracking-tight mb-3">No Results <span className="text-brand-acid">Found</span></h3>
                                            <p className="text-neutral-400 font-medium">
                                                Adjust your search parameters to find the specific entity.
                                            </p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {paginatedSupporters.map((supporter, index) => (
                                        <div
                                            key={supporter.id}
                                            className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6 hover:bg-white/10 transition-all group relative overflow-hidden"
                                        >
                                            <div className="flex items-start gap-5 relative z-10">
                                                {/* Rank or Avatar */}
                                                <div className="flex-shrink-0">
                                                    {index < 3 && sortOption === 'amount_high' ? (
                                                        <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center border border-brand-orange/20 shadow-[0_0_15px_rgba(255,91,0,0.1)]">
                                                            {getRankIcon(index + 1)}
                                                        </div>
                                                    ) : supporter.displayProfileImage ? (
                                                        <div className="p-1 bg-white/10 rounded-full">
                                                            <img
                                                                src={supporter.displayProfileImage}
                                                                alt={supporter.displayName}
                                                                className="w-14 h-14 rounded-full object-cover border-2 border-brand-black"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-16 h-16 bg-brand-black border border-white/10 rounded-full flex items-center justify-center">
                                                            <User className="w-8 h-8 text-neutral-700" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <span className="text-xl font-black text-brand-white tracking-tight uppercase italic">
                                                            {supporter.anonymous ? 'Ghost Operative' : supporter.displayName}
                                                        </span>
                                                        <div className="flex gap-2">
                                                            {supporter.anonymous && (
                                                                <span className="px-3 py-1 bg-white/5 text-neutral-500 text-[8px] font-black uppercase tracking-[0.2em] rounded-full border border-white/5">
                                                                    Anonymous
                                                                </span>
                                                            )}
                                                            {supporter.donationCount > 1 && (
                                                                <span className="px-3 py-1 bg-brand-orange/10 text-brand-orange text-[8px] font-black uppercase tracking-[0.2em] rounded-full border border-brand-orange/20">
                                                                    {supporter.donationCount}x Veteran
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-3 h-3" />
                                                            Latest: {getTimeAgo(supporter.latestDonation)}
                                                        </div>
                                                        <div className="w-1 h-1 bg-neutral-800 rounded-full"></div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Receipt className="w-3 h-3" />
                                                            {supporter.donationCount} Commitments
                                                        </div>
                                                    </div>
                                                    <div className="text-[9px] font-black text-brand-acid/50 mt-2 uppercase tracking-widest flex items-center gap-2">
                                                        <Pin className="w-3 h-3" />
                                                        {supporter.projects.join(' // ')}
                                                    </div>
                                                </div>

                                                {/* Amount */}
                                                <div className="flex-shrink-0 text-right">
                                                    <div className="text-2xl md:text-3xl font-black text-brand-acid tracking-tighter italic uppercase">
                                                        {formatCurrency(supporter.totalAmount)}
                                                    </div>
                                                    <div className="flex items-center justify-end gap-2 mt-4">
                                                        {!supporter.anonymous && (
                                                            <>
                                                                {/* Thank You Button or Thanked Badge */}
                                                                {supporter.isThanked || locallyThankedIds.has(supporter.id) ? (
                                                                    <span
                                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-acid/10 text-brand-acid text-[9px] font-black uppercase tracking-widest rounded-xl border border-brand-acid/20"
                                                                    >
                                                                        <Heart className="w-3 h-3 fill-brand-acid" />
                                                                        Acknowledged
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleOpenThankYou(supporter)}
                                                                        className="p-3 bg-white/5 text-brand-orange hover:bg-brand-orange hover:text-brand-black rounded-xl transition-all border border-white/5 active:scale-95"
                                                                        title="Acknowledge Supporter"
                                                                    >
                                                                        <Heart className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => window.open(`/user/${supporter.userId}`, '_blank')}
                                                                    className="p-3 bg-white/5 text-brand-white hover:bg-brand-acid hover:text-brand-black rounded-xl transition-all border border-white/5 active:scale-95"
                                                                    title="View Intel"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(`${supporter.displayName} - ${formatCurrency(supporter.totalAmount)}`);
                                                                toast.success('Supporter Intel Copied');
                                                            }}
                                                            className="p-3 bg-white/5 text-neutral-500 hover:text-brand-white rounded-xl transition-all border border-white/5 active:scale-95"
                                                            title="Copy Intel"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expand/Collapse Button */}
                                            {supporter.donationCount > 1 && (
                                                <button
                                                    onClick={() => toggleExpanded(supporter.id)}
                                                    className="w-full flex items-center justify-center gap-3 mt-6 pt-6 border-t border-white/5 text-[9px] font-black italic uppercase tracking-widest text-neutral-600 hover:text-brand-acid transition-all"
                                                >
                                                    {expandedSupporters.has(supporter.id) ? (
                                                        <>
                                                            <ChevronUp className="w-4 h-4" />
                                                            Redact Transaction History
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="w-4 h-4" />
                                                            Analyze {supporter.donationCount} Transactions
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {/* Expandable Donation History */}
                                            {expandedSupporters.has(supporter.id) && supporter.donationHistory && (
                                                <div className="mt-4 space-y-3 relative z-10">
                                                    {supporter.donationHistory.map((donation) => (
                                                        <div
                                                            key={donation.id}
                                                            className="flex items-center justify-between py-4 px-5 bg-brand-black/50 border border-white/5 rounded-2xl group/item"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-1.5 h-1.5 bg-brand-acid rounded-full shadow-[0_0_8px_rgba(204,255,0,0.5)]" />
                                                                <div>
                                                                    <div className="text-sm font-black text-brand-white italic uppercase">
                                                                        {formatCurrency(donation.amount)}
                                                                    </div>
                                                                    <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
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
                                                                className="p-2.5 text-neutral-600 hover:text-brand-acid hover:bg-brand-acid/10 rounded-xl transition-all border border-transparent hover:border-brand-acid/20"
                                                                title="Generate Intel Receipt"
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
                                        <div className="text-center pt-8">
                                            <button
                                                onClick={handleLoadMore}
                                                className="px-10 py-5 bg-white/5 border border-white/10 text-brand-white rounded-2xl font-black italic uppercase tracking-widest text-xs hover:bg-brand-acid hover:text-brand-black transition-all active:scale-95 shadow-xl hover:shadow-brand-acid/20"
                                            >
                                                Load More Network Data ({filteredSupporters.length - displayCount})
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Results Count */}
                        {paginatedSupporters.length > 0 && (
                            <div className="text-center text-[10px] font-black italic uppercase tracking-[0.2em] text-neutral-700 mt-8">
                                Manifesting {paginatedSupporters.length} of {filteredSupporters.length} Elite Entities
                            </div>
                        )}
                    </div>

                    {/* Right Column - Top Backers & Stats (1/3) */}
                    <div className="space-y-8">
                        {/* Top Backers Leaderboard */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none"></div>
                            
                            <h3 className="text-xl font-black text-brand-white flex items-center gap-3 mb-8 italic uppercase tracking-tight">
                                <Crown className="w-6 h-6 text-brand-orange" />
                                Top Contributors
                            </h3>

                            {topSupporters.length === 0 ? (
                                <div className="text-center py-12">
                                    <Sparkles className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">No elite activity detected</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-6">
                                        {(showLeaderboardModal ? supporters.slice(0, 20) : topSupporters).map((supporter, index) => (
                                            <div key={supporter.id} className="flex items-center gap-4 group/row">
                                                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                                                    {index < 3 ? (
                                                        <div className="p-2 bg-brand-orange/10 rounded-xl border border-brand-orange/20">
                                                            {getRankIcon(index + 1)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-neutral-700">{index + 1}</span>
                                                    )}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-black text-brand-white truncate text-xs italic uppercase tracking-tight group-hover/row:text-brand-acid transition-colors">
                                                        {supporter.anonymous ? 'Operative' : supporter.displayName}
                                                    </div>
                                                    <div className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest mt-1">
                                                        {supporter.donationCount} Commitments
                                                    </div>
                                                </div>
                                                
                                                <div className="font-black text-brand-acid text-sm italic uppercase tracking-tighter">
                                                    {formatCurrency(supporter.totalAmount)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* View All / Show Less Button */}
                                    {supporters.length > 5 && (
                                        <button
                                            onClick={() => setShowLeaderboardModal(!showLeaderboardModal)}
                                            className="w-full mt-10 py-4 bg-brand-orange/10 text-brand-orange border border-brand-orange/20 text-[10px] font-black italic uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-orange hover:text-brand-black transition-all flex items-center justify-center gap-3 shadow-lg"
                                        >
                                            <Trophy className="w-4 h-4" />
                                            {showLeaderboardModal ? (
                                                <span>Minimize Intel</span>
                                            ) : (
                                                <span>Full Leaderboard</span>
                                            )}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 relative overflow-hidden">
                            <h3 className="text-xl font-black text-brand-white mb-8 italic uppercase tracking-tight">
                                Intelligence
                            </h3>
                            <div className="space-y-6">
                                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                    <div>
                                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Entity Split</span>
                                        <p className="text-xs font-black text-brand-white italic uppercase tracking-tight mt-1">Named / Ghost</p>
                                    </div>
                                    <span className="text-xl font-black text-brand-acid italic uppercase tracking-tighter">
                                        {stats.uniqueNonAnonymous} / {stats.anonymousCount}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                    <div>
                                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Loyalty Rate</span>
                                        <p className="text-xs font-black text-brand-white italic uppercase tracking-tight mt-1">Repeat Interaction</p>
                                    </div>
                                    <span className="text-xl font-black text-brand-orange italic uppercase tracking-tighter">
                                        {stats.totalSupporters > 0
                                            ? `${((stats.repeatSupporters / stats.totalSupporters) * 100).toFixed(0)}%`
                                            : '0%'
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Max Commitment</span>
                                        <p className="text-xs font-black text-brand-white italic uppercase tracking-tight mt-1">Record Donation</p>
                                    </div>
                                    <span className="text-xl font-black text-brand-acid italic uppercase tracking-tighter">
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
        </div>
    );
}
