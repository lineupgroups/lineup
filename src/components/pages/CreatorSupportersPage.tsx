import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Filter, Download, Users, Heart,
  Trophy, Crown, Medal, Star, MessageSquare, Send,
  ExternalLink, X, TrendingUp, DollarSign, Calendar,
  ChevronDown, ChevronUp, RefreshCw, Award, Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectsByCreator } from '../../hooks/useProjects';
import { useProjectContext } from '../../hooks/useProjectContext';
import { getProjectDonations, DonationData } from '../../lib/donationService';
import { createNotification } from '../../lib/notifications';
import LoadingSpinner from '../common/LoadingSpinner';
import PageTitle from '../common/PageTitle';
import { convertTimestamp } from '../../lib/firestore';
import { formatDistanceToNow, subDays, isAfter } from 'date-fns';
import toast from 'react-hot-toast';

// S-OPT-01: Items per page for pagination
const ITEMS_PER_PAGE = 20;

// S-MISS-03: Date range options
const DATE_RANGE_OPTIONS = [
  { label: 'All Time', value: 'all' },
  { label: 'Last 7 Days', value: '7' },
  { label: 'Last 30 Days', value: '30' },
  { label: 'Last 90 Days', value: '90' },
  { label: 'This Year', value: 'year' },
];

// S-MISS-04: Amount range options
const AMOUNT_RANGE_OPTIONS = [
  { label: 'Any Amount', value: 'all', min: 0, max: Infinity },
  { label: '₹1 - ₹500', value: '1-500', min: 1, max: 500 },
  { label: '₹501 - ₹1,000', value: '501-1000', min: 501, max: 1000 },
  { label: '₹1,001 - ₹5,000', value: '1001-5000', min: 1001, max: 5000 },
  { label: '₹5,001+', value: '5001+', min: 5001, max: Infinity },
];

export default function CreatorSupportersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projects, loading: projectsLoading } = useProjectsByCreator(user?.uid || '');

  // Use project context for global selection sync
  const { selectedProjectId: contextProjectId, setSelectedProjectId: setContextProjectId } = useProjectContext();

  // State - initialize from context if available
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [allDonations, setAllDonations] = useState<(DonationData & { projectTitle: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [selectedSupporter, setSelectedSupporter] = useState<DonationData | null>(null);
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // S-LOG-02: Show more top supporters
  const [showAllTopSupporters, setShowAllTopSupporters] = useState(false);

  // S-OPT-01: Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // S-MISS-03: Date range filter
  const [dateRange, setDateRange] = useState('all');

  // S-MISS-04: Amount range filter
  const [amountRange, setAmountRange] = useState('all');

  // S-OPT-02: User profile cache - prepared for batch fetching optimization
  // const userProfileCache = new Map<string, { displayName: string; photoURL: string | null }>();

  // Sync with context when it changes (from navbar selection)
  useEffect(() => {
    if (contextProjectId) {
      setSelectedProjectId(contextProjectId);
    } else {
      setSelectedProjectId('all');
    }
  }, [contextProjectId]);

  // Handle local selection change and sync to context
  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentPage(1); // Reset pagination on filter change
    // Update global context so navbar shows the selection
    if (projectId && projectId !== 'all') {
      setContextProjectId(projectId);
    } else {
      setContextProjectId(null);
    }
  };

  // Fetch all donations for all projects
  const fetchAllDonations = useCallback(async () => {
    if (projects.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const allPromises = projects.map(async (project) => {
        const donations = await getProjectDonations(project.id, { limitCount: 200 });
        return donations.map(d => ({ ...d, projectTitle: project.title }));
      });

      const results = await Promise.all(allPromises);
      const flatDonations = results.flat();

      // Sort by date (newest first)
      flatDonations.sort((a, b) => {
        const dateA = convertTimestamp(a.backedAt).getTime();
        const dateB = convertTimestamp(b.backedAt).getTime();
        return dateB - dateA;
      });

      setAllDonations(flatDonations);
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast.error('Failed to load supporters');
    } finally {
      setLoading(false);
    }
  }, [projects]);

  useEffect(() => {
    if (!projectsLoading) {
      fetchAllDonations();
    }
  }, [projectsLoading, fetchAllDonations]);

  // S-LOG-03: Stats recalculate based on filtered data
  const filteredDonations = useMemo(() => {
    let filtered = [...allDonations];

    // Filter by project
    if (selectedProjectId !== 'all') {
      filtered = filtered.filter(d => d.projectId === selectedProjectId);
    }

    // S-MISS-03: Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      if (dateRange === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
      } else {
        startDate = subDays(now, parseInt(dateRange));
      }

      filtered = filtered.filter(d => {
        const donationDate = convertTimestamp(d.backedAt);
        return isAfter(donationDate, startDate);
      });
    }

    // S-MISS-04: Filter by amount range
    if (amountRange !== 'all') {
      const rangeOption = AMOUNT_RANGE_OPTIONS.find(r => r.value === amountRange);
      if (rangeOption) {
        filtered = filtered.filter(d => d.amount >= rangeOption.min && d.amount <= rangeOption.max);
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.displayName.toLowerCase().includes(query) ||
        d.projectTitle.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allDonations, selectedProjectId, searchQuery, dateRange, amountRange]);

  // S-OPT-01: Paginated donations
  const paginatedDonations = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDonations.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDonations, currentPage]);

  const totalPages = Math.ceil(filteredDonations.length / ITEMS_PER_PAGE);

  // S-MISS-02: Calculate repeat supporters (backed multiple projects)
  const repeatSupporters = useMemo(() => {
    const supporterProjects = new Map<string, Set<string>>();

    allDonations.forEach(d => {
      if (!d.anonymous) {
        if (!supporterProjects.has(d.userId)) {
          supporterProjects.set(d.userId, new Set());
        }
        supporterProjects.get(d.userId)!.add(d.projectId);
      }
    });

    // Return users who backed more than one project
    return new Set(
      Array.from(supporterProjects.entries())
        .filter(([_, projects]) => projects.size > 1)
        .map(([userId]) => userId)
    );
  }, [allDonations]);

  // S-LOG-01: Calculate truly unique supporters across all projects
  const calculateTrueUniqueSupporters = useMemo(() => {
    const uniqueUserIds = new Set<string>();
    allDonations.forEach(d => {
      if (!d.anonymous) {
        uniqueUserIds.add(d.userId);
      }
    });
    return uniqueUserIds.size;
  }, [allDonations]);

  // Calculate top supporters - S-LOG-02: Show more
  const topSupporters = useMemo(() => {
    const supporterTotals = new Map<string, {
      userId: string;
      displayName: string;
      displayProfileImage: string | null;
      totalAmount: number;
      donationCount: number;
      projectCount: number;
      anonymous: boolean;
    }>();

    const supporterProjects = new Map<string, Set<string>>();

    allDonations.forEach(d => {
      const key = d.anonymous ? `anon-${d.id}` : d.userId;
      const existing = supporterTotals.get(key);

      // Track projects per supporter
      if (!d.anonymous) {
        if (!supporterProjects.has(d.userId)) {
          supporterProjects.set(d.userId, new Set());
        }
        supporterProjects.get(d.userId)!.add(d.projectId);
      }

      if (existing) {
        existing.totalAmount += d.amount;
        existing.donationCount += 1;
        existing.projectCount = d.anonymous ? 1 : (supporterProjects.get(d.userId)?.size || 1);
      } else {
        supporterTotals.set(key, {
          userId: d.userId,
          displayName: d.displayName,
          displayProfileImage: d.displayProfileImage || null,
          totalAmount: d.amount,
          donationCount: 1,
          projectCount: 1,
          anonymous: d.anonymous
        });
      }
    });

    // Update project counts
    supporterTotals.forEach((supporter) => {
      if (!supporter.anonymous && supporterProjects.has(supporter.userId)) {
        supporter.projectCount = supporterProjects.get(supporter.userId)!.size;
      }
    });

    return Array.from(supporterTotals.values())
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [allDonations]);

  // S-LOG-03: Stats calculated from filtered data for context-aware stats
  const stats = useMemo(() => {
    const donationsToUse = selectedProjectId === 'all' ? allDonations : filteredDonations;
    const totalAmount = donationsToUse.reduce((sum, d) => sum + d.amount, 0);
    const anonymousCount = donationsToUse.filter(d => d.anonymous).length;
    const avgDonation = donationsToUse.length > 0 ? totalAmount / donationsToUse.length : 0;

    // S-LOG-01: True unique supporters
    const uniqueUserIds = new Set<string>();
    donationsToUse.forEach(d => {
      if (!d.anonymous) {
        uniqueUserIds.add(d.userId);
      }
    });

    return {
      totalAmount,
      uniqueSupporters: uniqueUserIds.size,
      anonymousCount,
      avgDonation,
      totalDonations: donationsToUse.length
    };
  }, [allDonations, filteredDonations, selectedProjectId]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Export to CSV - Fixed null coalescing for anonymous supporters
  const handleExportCSV = () => {
    if (filteredDonations.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Name', 'Email', 'Amount', 'Project', 'Date', 'Anonymous'];
    const rows = filteredDonations.map(d => [
      d.anonymous ? 'Anonymous' : (d.displayName || 'Unknown'),
      d.anonymous ? 'Hidden' : (d.userId || 'N/A'),
      d.amount.toString(),
      d.projectTitle || 'Unknown Project',
      convertTimestamp(d.backedAt).toLocaleDateString('en-IN'),
      d.anonymous ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `supporters_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredDonations.length} supporters to CSV`);
  };

  // S-BUG-03 & S-MISS-01: Send real in-app thank you notification
  const handleSendThankYou = async () => {
    if (!selectedSupporter || !thankYouMessage.trim() || !user) {
      toast.error('Please enter a message');
      return;
    }

    setSendingMessage(true);

    try {
      // Create real in-app notification for the supporter
      await createNotification({
        userId: selectedSupporter.userId,
        type: 'project_update',
        title: `Thank you from ${user.displayName || 'a creator'}!`,
        message: thankYouMessage.trim(),
        projectId: selectedSupporter.projectId,
        projectTitle: (selectedSupporter as any).projectTitle || 'your supported project',
        relatedUserId: user.uid,
        relatedUserName: user.displayName || 'Creator',
        actionUrl: `/project/${selectedSupporter.projectId}`
      });

      toast.success(`Thank you message sent to ${selectedSupporter.displayName}!`);
      setShowThankYouModal(false);
      setSelectedSupporter(null);
      setThankYouMessage('');
    } catch (error) {
      console.error('Error sending thank you:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Navigate to supporter profile - S-BUG-01: Handle missing username
  const handleViewProfile = (donation: DonationData) => {
    if (donation.anonymous) {
      toast.error('This supporter is anonymous');
      return;
    }

    // Use userId as fallback if no username available
    const profilePath = donation.userId ? `/profile/${donation.userId}` : null;

    if (profilePath) {
      navigate(profilePath);
    } else {
      toast.error('Unable to view profile');
    }
  };

  // Get rank icon
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <Star className="w-5 h-5 text-gray-300" />;
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setDateRange('all');
    setAmountRange('all');
    setSelectedProjectId('all');
    setCurrentPage(1);
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
      {/* Dynamic Page Title */}
      <PageTitle title="Supporters" description="View and manage your project supporters" />

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
                <h1 className="text-2xl font-bold text-gray-900">Supporters</h1>
                <p className="text-sm text-gray-500">
                  {allDonations.length} total contributions • {calculateTrueUniqueSupporters} unique supporters
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchAllDonations}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Raised</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unique Supporters</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.uniqueSupporters}</p>
                {repeatSupporters.size > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    {repeatSupporters.size} repeat backer{repeatSupporters.size !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg. Donation</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.avgDonation)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Anonymous</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.anonymousCount}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Supporters Panel - S-LOG-02: Show more */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-6 h-6" />
                  <h2 className="text-lg font-bold">Top Supporters</h2>
                </div>
                {topSupporters.length > 5 && (
                  <button
                    onClick={() => setShowAllTopSupporters(!showAllTopSupporters)}
                    className="text-xs bg-white/20 px-2 py-1 rounded-full hover:bg-white/30 transition-colors flex items-center"
                  >
                    {showAllTopSupporters ? 'Show Less' : `+${topSupporters.length - 5} more`}
                    {showAllTopSupporters ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                  </button>
                )}
              </div>

              {topSupporters.length === 0 ? (
                <p className="text-orange-100 text-sm">No supporters yet</p>
              ) : (
                <div className="space-y-3">
                  {(showAllTopSupporters ? topSupporters : topSupporters.slice(0, 5)).map((supporter, index) => (
                    <div
                      key={supporter.userId + index}
                      className="flex items-center justify-between bg-white/10 rounded-lg p-3 backdrop-blur-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8">
                          {getRankIcon(index + 1)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">
                              {supporter.anonymous ? 'Anonymous' : supporter.displayName}
                            </p>
                            {/* S-MISS-02: Repeat supporter badge */}
                            {!supporter.anonymous && repeatSupporters.has(supporter.userId) && (
                              <span className="flex items-center bg-yellow-400 text-yellow-900 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                <Award className="w-3 h-3 mr-0.5" />
                                Repeat
                              </span>
                            )}
                          </div>
                          <p className="text-orange-200 text-xs">
                            {supporter.donationCount} {supporter.donationCount === 1 ? 'donation' : 'donations'}
                            {supporter.projectCount > 1 && ` • ${supporter.projectCount} projects`}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold">{formatCurrency(supporter.totalAmount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Projects Overview</h3>
              <div className="space-y-3">
                {projects.map(project => {
                  const projectDonations = allDonations.filter(d => d.projectId === project.id);
                  const projectTotal = projectDonations.reduce((sum, d) => sum + d.amount, 0);

                  return (
                    <div
                      key={project.id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedProjectId === project.id ? 'bg-orange-100 border border-orange-300' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      onClick={() => handleProjectChange(project.id)}
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm line-clamp-1">{project.title}</p>
                        <p className="text-xs text-gray-500">{projectDonations.length} supporters</p>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">{formatCurrency(projectTotal)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Supporters List */}
          <div className="lg:col-span-2">
            {/* Filters - S-MISS-03 & S-MISS-04 */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
              <div className="flex flex-col space-y-4">
                {/* Search and Project Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      placeholder="Search supporters by name..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={selectedProjectId}
                      onChange={(e) => handleProjectChange(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg py-2.5 pl-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[180px]"
                    >
                      <option value="all">All Projects</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.title}
                        </option>
                      ))}
                    </select>
                    <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                {/* Date and Amount Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* S-MISS-03: Date Range Filter */}
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <select
                      value={dateRange}
                      onChange={(e) => { setDateRange(e.target.value); setCurrentPage(1); }}
                      className="text-sm border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"
                    >
                      {DATE_RANGE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* S-MISS-04: Amount Range Filter */}
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <select
                      value={amountRange}
                      onChange={(e) => { setAmountRange(e.target.value); setCurrentPage(1); }}
                      className="text-sm border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"
                    >
                      {AMOUNT_RANGE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Reset Filters */}
                  {(dateRange !== 'all' || amountRange !== 'all' || searchQuery || selectedProjectId !== 'all') && (
                    <button
                      onClick={resetFilters}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Supporters Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  {filteredDonations.length} Supporter{filteredDonations.length !== 1 ? 's' : ''}
                  {filteredDonations.length !== allDonations.length && (
                    <span className="text-gray-500 font-normal"> (filtered)</span>
                  )}
                </h3>
                {/* S-OPT-01: Pagination info */}
                {totalPages > 1 && (
                  <span className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                )}
              </div>

              {filteredDonations.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No supporters found</p>
                  <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100">
                    {paginatedDonations.map((donation) => (
                      <div
                        key={donation.id}
                        className="px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Avatar */}
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center ${donation.anonymous ? 'bg-gray-100' : 'bg-gradient-to-br from-orange-400 to-red-500'
                                } cursor-pointer hover:opacity-80 transition-opacity`}
                              onClick={() => handleViewProfile(donation)}
                            >
                              {donation.displayProfileImage && !donation.displayProfileImage.includes('default') ? (
                                <img
                                  src={donation.displayProfileImage}
                                  alt={donation.displayName}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : donation.anonymous ? (
                                <Heart className="w-5 h-5 text-gray-400" />
                              ) : (
                                <span className="text-white font-bold text-lg">
                                  {donation.displayName.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>

                            {/* Info */}
                            <div>
                              <div className="flex items-center space-x-2">
                                <p
                                  className={`font-medium text-gray-900 ${!donation.anonymous ? 'hover:text-orange-600 cursor-pointer' : ''}`}
                                  onClick={() => !donation.anonymous && handleViewProfile(donation)}
                                >
                                  {donation.displayName}
                                </p>
                                {donation.anonymous && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                                    Anonymous
                                  </span>
                                )}
                                {/* S-MISS-02: Repeat supporter badge */}
                                {!donation.anonymous && repeatSupporters.has(donation.userId) && (
                                  <span className="flex items-center bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                    <Award className="w-3 h-3 mr-1" />
                                    Repeat
                                  </span>
                                )}
                                {!donation.anonymous && (
                                  <ExternalLink className="w-3 h-3 text-gray-400" />
                                )}
                              </div>
                              <div className="flex items-center space-x-3 mt-1">
                                <span className="text-xs text-gray-500 flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {formatDistanceToNow(convertTimestamp(donation.backedAt), { addSuffix: true })}
                                </span>
                                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                  {donation.projectTitle}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Amount & Actions */}
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-bold text-lg text-gray-900">{formatCurrency(donation.amount)}</p>
                            </div>

                            {!donation.anonymous && (
                              <button
                                onClick={() => {
                                  setSelectedSupporter(donation);
                                  setShowThankYouModal(true);
                                }}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors"
                              >
                                <MessageSquare className="w-4 h-4" />
                                <span>Thank</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* S-OPT-01: Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <div className="flex items-center space-x-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 text-sm font-medium rounded-lg ${currentPage === pageNum
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thank You Modal - S-BUG-03: Actually sends notification */}
      {showThankYouModal && selectedSupporter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Send Thank You</h2>
                <p className="text-sm text-gray-500">
                  To {selectedSupporter.displayName} for their {formatCurrency(selectedSupporter.amount)} contribution
                </p>
              </div>
              <button
                onClick={() => setShowThankYouModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <textarea
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
                placeholder="Thank you so much for supporting my project! Your contribution means the world to me..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                This message will be sent as an in-app notification to the supporter.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowThankYouModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSendThankYou}
                disabled={sendingMessage || !thankYouMessage.trim()}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingMessage ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{sendingMessage ? 'Sending...' : 'Send Thank You'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
