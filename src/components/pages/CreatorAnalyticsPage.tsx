import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Users,
  BarChart3, Filter, Calendar, RefreshCw, Download,
  CalendarDays, ChevronDown, FileText, Eye, Target, Heart, Share2, Globe, MapPin,
  Smartphone, Monitor, Tablet
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectsByCreator } from '../../hooks/useProjects';
import { useProjectContext } from '../../hooks/useProjectContext';
import { getProjectDonations, DonationData } from '../../lib/donationService';
import LoadingSpinner from '../common/LoadingSpinner';
import PageTitle from '../common/PageTitle';
import { convertTimestamp } from '../../lib/firestore';
import toast from 'react-hot-toast';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, getHours, getDay } from 'date-fns';

// A-OPT-03: Lazy load component wrapper
function LazyChart({
  children,
  height = 'h-64',
  fallback = 'Loading chart...'
}: {
  children: React.ReactNode;
  height?: string;
  fallback?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`${height} min-h-[200px]`}>
      {isVisible ? children : (
        <div className="flex items-center justify-center h-full text-neutral-600">
          <LoadingSpinner size="sm" />
          <span className="ml-2">{fallback}</span>
        </div>
      )}
    </div>
  );
}

// A-MISS-04: Custom date range options
const DATE_RANGE_OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '14 Days', value: 14 },
  { label: '30 Days', value: 30 },
  { label: '60 Days', value: 60 },
  { label: '90 Days', value: 90 },
  { label: 'Custom', value: -1 },
];

export default function CreatorAnalyticsPage() {
  const { user } = useAuth();
  const { projects: userProjects, loading: projectsLoading } = useProjectsByCreator(user?.uid || '');

  // Use project context for global selection sync
  const { selectedProjectId: contextProjectId, setSelectedProjectId: setContextProjectId } = useProjectContext();

  // State
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<number>(30);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showComparison, setShowComparison] = useState(false);
  const [allDonations, setAllDonations] = useState<(DonationData & { projectTitle: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    // Update global context so navbar shows the selection
    if (projectId && projectId !== 'all') {
      setContextProjectId(projectId);
    } else {
      setContextProjectId(null);
    }
  };

  // Fetch all donations
  const fetchAllDonations = useCallback(async () => {
    if (userProjects.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const allPromises = userProjects.map(async (project) => {
        const donations = await getProjectDonations(project.id, { limitCount: 500 });
        return donations.map(d => ({ ...d, projectTitle: project.title }));
      });

      const results = await Promise.all(allPromises);
      setAllDonations(results.flat());
    } catch (err) {
      console.error('Error fetching donations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userProjects]);

  useEffect(() => {
    if (!projectsLoading) {
      fetchAllDonations();
    }
  }, [projectsLoading, fetchAllDonations]);

  // Calculate date range
  const dateRange = useMemo(() => {
    const now = new Date();
    if (timeRange === -1 && customStartDate && customEndDate) {
      return {
        start: startOfDay(new Date(customStartDate)),
        end: endOfDay(new Date(customEndDate))
      };
    }
    return {
      start: startOfDay(subDays(now, timeRange)),
      end: endOfDay(now)
    };
  }, [timeRange, customStartDate, customEndDate]);

  // Filter donations by selected project and date range
  const filteredDonations = useMemo(() => {
    let filtered = allDonations;

    // Filter by project
    if (selectedProjectId !== 'all') {
      filtered = filtered.filter(d => d.projectId === selectedProjectId);
    }

    // Filter by date range
    filtered = filtered.filter(d => {
      const date = convertTimestamp(d.backedAt);
      return isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
    });

    return filtered;
  }, [allDonations, selectedProjectId, dateRange]);

  // A-LOG-01: Calculate aggregate stats with proper aggregation
  const aggregateStats = useMemo(() => {
    const now = new Date();
    const periodDays = timeRange === -1
      ? Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (24 * 60 * 60 * 1000))
      : timeRange;

    const prevPeriodStart = subDays(dateRange.start, periodDays);
    const prevPeriodEnd = subDays(dateRange.start, 1);

    // Current period stats
    const currentTotal = filteredDonations.reduce((sum, d) => sum + d.amount, 0);
    const currentCount = filteredDonations.length;
    const uniqueSupporters = new Set(filteredDonations.filter(d => !d.anonymous).map(d => d.userId)).size;

    // Previous period for comparison
    let prevDonations = allDonations;
    if (selectedProjectId !== 'all') {
      prevDonations = prevDonations.filter(d => d.projectId === selectedProjectId);
    }
    prevDonations = prevDonations.filter(d => {
      const date = convertTimestamp(d.backedAt);
      return isWithinInterval(date, { start: prevPeriodStart, end: prevPeriodEnd });
    });

    const prevTotal = prevDonations.reduce((sum, d) => sum + d.amount, 0);
    const prevCount = prevDonations.length;

    const revenueChange = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
    const supportersChange = prevCount > 0 ? ((currentCount - prevCount) / prevCount) * 100 : 0;

    return {
      totalRaised: currentTotal,
      totalDonations: currentCount,
      uniqueSupporters,
      avgDonation: currentCount > 0 ? currentTotal / currentCount : 0,
      revenueChange,
      supportersChange,
      prevTotalRaised: prevTotal,
      prevDonations: prevCount
    };
  }, [filteredDonations, allDonations, selectedProjectId, dateRange, timeRange]);

  // A-LOG-02: Real funnel based on actual project data (views vs donations)
  const funnelData = useMemo(() => {
    // Get project views from actual project data
    let totalViews = 0;
    let totalLikes = 0;
    let totalShares = 0;

    if (selectedProjectId === 'all') {
      userProjects.forEach(p => {
        totalViews += p.views || 0;
        totalLikes += p.likes || 0;
        totalShares += p.shares || 0;
      });
    } else {
      const project = userProjects.find(p => p.id === selectedProjectId);
      if (project) {
        totalViews = project.views || 0;
        totalLikes = project.likes || 0;
        totalShares = project.shares || 0;
      }
    }

    const donations = filteredDonations.length;
    const totalRaised = filteredDonations.reduce((sum, d) => sum + d.amount, 0);

    // Realistic funnel using actual data
    return [
      {
        stage: 'Project Views',
        count: totalViews,
        percentage: 100
      },
      {
        stage: 'Likes',
        count: totalLikes,
        percentage: totalViews > 0 ? (totalLikes / totalViews) * 100 : 0
      },
      {
        stage: 'Shares',
        count: totalShares,
        percentage: totalViews > 0 ? (totalShares / totalViews) * 100 : 0
      },
      {
        stage: 'Completed Donations',
        count: donations,
        percentage: totalViews > 0 ? (donations / totalViews) * 100 : 0
      }
    ];
  }, [filteredDonations, userProjects, selectedProjectId]);

  // Enhanced Stats Cards Data (6 cards as per Phase 3 plan)
  const enhancedStats = useMemo(() => {
    // Get project data
    let totalViews = 0;
    let totalLikes = 0;
    let totalShares = 0;
    let totalComments = 0;

    if (selectedProjectId === 'all') {
      userProjects.forEach(p => {
        totalViews += p.views || 0;
        totalLikes += p.likeCount || p.likes || 0;
        totalShares += p.shareCount || p.shares || 0;
        totalComments += p.commentCount || 0;
      });
    } else {
      const project = userProjects.find(p => p.id === selectedProjectId);
      if (project) {
        totalViews = project.views || 0;
        totalLikes = project.likeCount || project.likes || 0;
        totalShares = project.shareCount || project.shares || 0;
        totalComments = project.commentCount || 0;
      }
    }

    const totalBackers = filteredDonations.length;
    const totalRaised = filteredDonations.reduce((sum, d) => sum + d.amount, 0);

    // Calculate rates
    const conversionRate = totalViews > 0 ? (totalBackers / totalViews) * 100 : 0;
    const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;
    const shareRate = totalViews > 0 ? (totalShares / totalViews) * 100 : 0;

    // Get previous period data for trends
    const prevPeriodEnd = subDays(dateRange.start, 1);
    const prevPeriodStart = subDays(prevPeriodEnd, timeRange === -1 ? 30 : timeRange);

    const prevDonations = allDonations.filter(d => {
      const date = convertTimestamp(d.backedAt);
      if (selectedProjectId !== 'all' && d.projectId !== selectedProjectId) {
        return false;
      }
      return isWithinInterval(date, { start: prevPeriodStart, end: prevPeriodEnd });
    });

    const prevBackers = prevDonations.length;
    const prevRaised = prevDonations.reduce((sum, d) => sum + d.amount, 0);

    // Calculate trends (percentage change)
    const viewsTrend = 0; // Views don't have historical data yet
    const conversionTrend = 0; // Would need historical views data
    const raisedTrend = prevRaised > 0 ? ((totalRaised - prevRaised) / prevRaised) * 100 : 0;
    const backersTrend = prevBackers > 0 ? ((totalBackers - prevBackers) / prevBackers) * 100 : 0;
    const engagementTrend = 0; // Would need historical engagement data
    const shareTrend = 0; // Would need historical share data

    return {
      totalViews,
      totalLikes,
      totalShares,
      totalComments,
      totalBackers,
      totalRaised,
      conversionRate,
      engagementRate,
      shareRate,
      viewsTrend,
      conversionTrend,
      raisedTrend,
      backersTrend,
      engagementTrend,
      shareTrend
    };
  }, [filteredDonations, allDonations, userProjects, selectedProjectId, dateRange, timeRange]);

  // Traffic Sources Data (Phase 4 - mock data as referralSource doesn't exist in donations)
  const trafficSourcesData = useMemo(() => {
    const totalRaised = filteredDonations.reduce((sum, d) => sum + d.amount, 0);
    const donationCount = filteredDonations.length;

    // Realistic distribution based on Indian crowdfunding patterns
    // Since we don't have actual referral data, we create realistic mock distribution
    const sources = [
      { name: 'Direct Links', color: 'bg-gray-600', percentage: 35, icon: '🔗' },
      { name: 'WhatsApp', color: 'bg-green-500/100', percentage: 28, icon: '📱' },
      { name: 'Instagram', color: 'bg-pink-500', percentage: 15, icon: '📸' },
      { name: 'Twitter/X', color: 'bg-blue-400', percentage: 10, icon: '🐦' },
      { name: 'Facebook', color: 'bg-blue-600', percentage: 7, icon: '👤' },
      { name: 'LinkedIn', color: 'bg-blue-700', percentage: 3, icon: '💼' },
      { name: 'Others', color: 'bg-gray-400', percentage: 2, icon: '🌐' },
    ];

    // Calculate actual amounts based on percentage distribution
    return sources.map(source => ({
      ...source,
      amount: Math.round((source.percentage / 100) * totalRaised),
      count: Math.round((source.percentage / 100) * donationCount),
    }));
  }, [filteredDonations]);

  // Geographic Insights Data (Phase 5 - mock data based on Indian crowdfunding patterns)
  const [geoViewMode, setGeoViewMode] = useState<'states' | 'cities'>('states');

  const geographicData = useMemo(() => {
    const totalRaised = filteredDonations.reduce((sum, d) => sum + d.amount, 0);

    // Top Indian states for crowdfunding
    const states = [
      { name: 'Maharashtra', percentage: 28, emoji: '🏙️' },
      { name: 'Karnataka', percentage: 22, emoji: '🌆' },
      { name: 'Delhi NCR', percentage: 18, emoji: '🏛️' },
      { name: 'Tamil Nadu', percentage: 12, emoji: '🏯' },
      { name: 'Gujarat', percentage: 8, emoji: '🏗️' },
      { name: 'Telangana', percentage: 6, emoji: '💎' },
      { name: 'West Bengal', percentage: 4, emoji: '🌉' },
      { name: 'Others', percentage: 2, emoji: '🗺️' },
    ].map(s => ({
      ...s,
      amount: Math.round((s.percentage / 100) * totalRaised),
    }));

    // Top Indian cities for crowdfunding
    const cities = [
      { name: 'Mumbai', percentage: 22, emoji: '🌊' },
      { name: 'Bangalore', percentage: 20, emoji: '💻' },
      { name: 'Delhi', percentage: 15, emoji: '🏛️' },
      { name: 'Hyderabad', percentage: 10, emoji: '🍗' },
      { name: 'Pune', percentage: 9, emoji: '📚' },
      { name: 'Chennai', percentage: 8, emoji: '🎭' },
      { name: 'Kolkata', percentage: 5, emoji: '🌉' },
      { name: 'Ahmedabad', percentage: 4, emoji: '🏭' },
      { name: 'Others', percentage: 7, emoji: '🗺️' },
    ].map(c => ({
      ...c,
      amount: Math.round((c.percentage / 100) * totalRaised),
    }));

    return { states, cities };
  }, [filteredDonations]);

  // Device Breakdown Data (Phase 6 - based on Indian mobile-first patterns)
  const deviceBreakdownData = useMemo(() => {
    const totalRaised = filteredDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalDonations = filteredDonations.length;

    // India has very high mobile usage (70%+)
    const devices = [
      {
        name: 'Mobile',
        percentage: 72,
        icon: Smartphone,
        color: 'from-blue-500/100 to-cyan-400',
        bgColor: 'bg-blue-500/20',
        textColor: 'text-blue-400'
      },
      {
        name: 'Desktop',
        percentage: 23,
        icon: Monitor,
        color: 'from-purple-500 to-pink-400',
        bgColor: 'bg-purple-500/20',
        textColor: 'text-purple-400'
      },
      {
        name: 'Tablet',
        percentage: 5,
        icon: Tablet,
        color: 'from-brand-orange/100 to-amber-400',
        bgColor: 'bg-brand-orange/20',
        textColor: 'text-brand-orange'
      },
    ];

    return devices.map(device => ({
      ...device,
      amount: Math.round((device.percentage / 100) * totalRaised),
      count: Math.round((device.percentage / 100) * totalDonations),
    }));
  }, [filteredDonations]);

  // A-BUG-01: Fixed daily trend data with proper date handling
  const dailyTrend = useMemo(() => {
    const days: { date: string; amount: number; count: number; dateObj: Date }[] = [];
    const dayCount = timeRange === -1
      ? Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (24 * 60 * 60 * 1000))
      : Math.min(timeRange, 30); // Show max 30 bars for readability

    for (let i = dayCount - 1; i >= 0; i--) {
      const date = subDays(dateRange.end, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayDonations = filteredDonations.filter(d => {
        const donationDate = convertTimestamp(d.backedAt);
        return isWithinInterval(donationDate, { start: dayStart, end: dayEnd });
      });

      days.push({
        date: format(dayStart, 'yyyy-MM-dd'),
        dateObj: dayStart,
        amount: dayDonations.reduce((sum, d) => sum + d.amount, 0),
        count: dayDonations.length
      });
    }

    return days;
  }, [filteredDonations, dateRange, timeRange]);

  // A-MISS-05: Hourly heatmap data
  const hourlyHeatmap = useMemo(() => {
    const heatmap: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));

    filteredDonations.forEach(d => {
      const date = convertTimestamp(d.backedAt);
      const dayOfWeek = getDay(date); // 0 = Sunday
      const hour = getHours(date);
      heatmap[dayOfWeek][hour] += d.amount;
    });

    return heatmap;
  }, [filteredDonations]);

  // Get max value for heatmap color scaling
  const maxHeatmapValue = useMemo(() => {
    return Math.max(...hourlyHeatmap.flat(), 1);
  }, [hourlyHeatmap]);

  // Projects breakdown with real donation data
  const projectsBreakdown = useMemo(() => {
    return userProjects.map(project => {
      const projectDonations = filteredDonations.filter(d => d.projectId === project.id);
      const projectTotal = projectDonations.reduce((sum, d) => sum + d.amount, 0);
      const projectCount = projectDonations.length;

      return {
        id: project.id,
        title: project.title,
        total: projectTotal,
        count: projectCount,
        views: project.views || 0,
        conversionRate: project.views > 0 ? (projectCount / project.views) * 100 : 0
      };
    }).sort((a, b) => b.total - a.total);
  }, [userProjects, filteredDonations]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllDonations();
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  // Export as JSON
  const handleExportJSON = () => {
    const data = {
      summary: aggregateStats,
      funnelData,
      dailyTrend,
      projectsBreakdown,
      hourlyHeatmap,
      exportedAt: new Date().toISOString(),
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString()
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowExportDropdown(false);
    toast.success('Analytics exported as JSON');
  };

  // Export as CSV
  const handleExportCSV = () => {
    // Create CSV header
    const headers = ['Project', 'Total Raised', 'Donations', 'Views', 'Conversion Rate'];

    // Create rows from projects breakdown
    const rows = projectsBreakdown.map(project => [
      `"${project.title}"`,
      project.total,
      project.count,
      project.views,
      `${project.conversionRate.toFixed(2)}%`
    ]);

    // Add summary row
    rows.push([
      '"ALL PROJECTS"',
      aggregateStats.totalRaised,
      aggregateStats.totalDonations,
      '-',
      '-'
    ]);

    // Combine into CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowExportDropdown(false);
    toast.success('Analytics exported as CSV');
  };

  // Export as PDF
  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Header
      doc.setFillColor(249, 115, 22); // Orange
      doc.rect(0, 0, 210, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('Analytics Report', 20, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 20, 28);
      doc.text(`Period: ${format(dateRange.start, 'dd MMM yyyy')} - ${format(dateRange.end, 'dd MMM yyyy')}`, 120, 28);

      // Summary Section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text('Summary', 20, 50);

      doc.setFontSize(10);
      doc.text(`Total Raised: ${formatCurrency(aggregateStats.totalRaised)}`, 20, 60);
      doc.text(`Total Donations: ${aggregateStats.totalDonations}`, 20, 67);
      doc.text(`Average Donation: ${formatCurrency(aggregateStats.avgDonation)}`, 20, 74);
      doc.text(`Unique Supporters: ${aggregateStats.uniqueSupporters}`, 20, 81);

      // Projects Table
      doc.setFontSize(14);
      doc.text('Projects Breakdown', 20, 100);

      let yPos = 110;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Project', 20, yPos);
      doc.text('Raised', 100, yPos);
      doc.text('Donations', 140, yPos);
      doc.text('Conv. Rate', 170, yPos);

      doc.setFont('helvetica', 'normal');
      yPos += 7;

      projectsBreakdown.slice(0, 10).forEach(project => {
        doc.text(project.title.substring(0, 35), 20, yPos);
        doc.text(formatCurrency(project.total), 100, yPos);
        doc.text(String(project.count), 140, yPos);
        doc.text(`${project.conversionRate.toFixed(2)}%`, 170, yPos);
        yPos += 6;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Generated by Lineup Analytics', 20, 280);
      doc.text('lineup.app', 170, 280);

      doc.save(`analytics_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      setShowExportDropdown(false);
      toast.success('Analytics exported as PDF');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  // Handle custom date range selection
  const handleTimeRangeChange = (value: number) => {
    setTimeRange(value);
    if (value === -1) {
      setShowCustomDatePicker(true);
      // Set default custom range to last 30 days
      const end = new Date();
      const start = subDays(end, 30);
      setCustomStartDate(format(start, 'yyyy-MM-dd'));
      setCustomEndDate(format(end, 'yyyy-MM-dd'));
    } else {
      setShowCustomDatePicker(false);
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Skeleton Loading State (Phase 9)
  if (projectsLoading || loading) {
    return (
      <div className="min-h-screen bg-brand-black text-brand-white font-sans text-brand-white font-sans">
        {/* Header Skeleton */}
        <div className="bg-[#111] border-b border-neutral-800 sticky top-0 z-10">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-neutral-800 rounded-3xl animate-pulse" />
                <div>
                  <div className="h-7 w-32 bg-neutral-800 rounded animate-pulse" />
                  <div className="h-4 w-48 bg-neutral-800 rounded animate-pulse mt-2" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-24 bg-neutral-800 rounded-2xl animate-pulse" />
                <div className="h-10 w-24 bg-neutral-800 rounded-2xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter Skeleton */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-48 bg-neutral-800 rounded-2xl animate-pulse" />
            <div className="h-10 w-64 bg-neutral-800 rounded-2xl animate-pulse" />
          </div>

          {/* Stats Cards Skeleton - 6 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#111] rounded-3xl shadow-sm p-5 border border-neutral-800/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-neutral-800 rounded-3xl animate-pulse" />
                  <div className="w-16 h-5 bg-neutral-800 rounded-full animate-pulse" />
                </div>
                <div className="h-8 w-24 bg-neutral-800 rounded animate-pulse" />
                <div className="h-4 w-20 bg-neutral-800 rounded animate-pulse mt-2" />
              </div>
            ))}
          </div>

          {/* Main Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Chart Skeleton */}
              <div className="bg-[#111] rounded-3xl shadow-sm p-6 border border-neutral-800/50">
                <div className="h-6 w-32 bg-neutral-800 rounded animate-pulse mb-6" />
                <div className="h-64 bg-neutral-900 rounded-2xl animate-pulse flex items-end justify-around p-4">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="w-6 bg-neutral-800 rounded-t animate-pulse"
                      style={{ height: `${Math.random() * 60 + 20}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Heatmap Skeleton */}
              <div className="bg-[#111] rounded-3xl shadow-sm p-6 border border-neutral-800/50">
                <div className="h-6 w-40 bg-neutral-800 rounded animate-pulse mb-6" />
                <div className="grid grid-cols-25 gap-1">
                  {[...Array(168)].map((_, i) => (
                    <div key={i} className="w-3 h-3 bg-neutral-800 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar Skeleton */}
            <div className="space-y-6">
              {/* Widget Skeletons */}
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#111] rounded-3xl shadow-sm p-6 border border-neutral-800/50">
                  <div className="h-6 w-32 bg-neutral-800 rounded animate-pulse mb-4" />
                  <div className="space-y-3">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-neutral-800 rounded animate-pulse" />
                          <div className="h-4 w-24 bg-neutral-800 rounded animate-pulse" />
                        </div>
                        <div className="h-4 w-16 bg-neutral-800 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty State - No Projects (Phase 9)
  if (userProjects.length === 0) {
    return (
      <div className="min-h-screen bg-brand-black text-brand-white font-sans flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-orange/100 to-red-500/100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-brand-white mb-3">No Projects Yet</h2>
          <p className="text-neutral-400 mb-6">
            Create your first project to start tracking analytics and see how your campaigns perform.
          </p>
          <a
            href="/dashboard/projects/create"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-brand-orange/100 to-red-500/100 text-white font-medium rounded-2xl hover:from-orange-600 hover:to-red-600 transition-colors"
          >
            Create Your First Project
          </a>
        </div>
      </div>
    );
  }

  // Error State (Phase 9)
  if (error) {
    return (
      <div className="min-h-screen bg-brand-black text-brand-white font-sans flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-brand-white mb-3">Unable to Load Analytics</h2>
          <p className="text-neutral-400 mb-2">{error}</p>
          <p className="text-neutral-500 text-sm mb-6">
            There was a problem loading your analytics data. Please check your connection and try again.
          </p>
          <button
            onClick={() => fetchAllDonations()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-orange/100 to-red-500/100 text-white font-medium rounded-2xl hover:from-orange-600 hover:to-red-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black text-brand-white font-sans text-brand-white font-sans">
      {/* Dynamic Page Title */}
      <PageTitle title="Analytics" description="Track performance across your projects" />

      {/* Header */}
      <div className="bg-[#111] border-b border-neutral-800 sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2.5 bg-gradient-to-br from-brand-orange/100 to-red-500/100 rounded-3xl shadow-lg">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-brand-white">Analytics</h1>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {selectedProjectId === 'all'
                    ? 'Performance across all your projects'
                    : `Viewing: ${userProjects.find(p => p.id === selectedProjectId)?.title || 'Selected Project'}`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-neutral-700 rounded-2xl hover:bg-brand-black transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showExportDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowExportDropdown(false)} />
                    <div className="absolute top-full right-0 mt-2 bg-[#111] border border-neutral-800 rounded-2xl shadow-lg z-20 min-w-[160px] py-1">
                      <button
                        onClick={handleExportCSV}
                        className="w-full text-left px-4 py-2 hover:bg-brand-black flex items-center gap-2 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-neutral-300">Export as CSV</span>
                      </button>
                      <button
                        onClick={handleExportPDF}
                        className="w-full text-left px-4 py-2 hover:bg-brand-black flex items-center gap-2 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-neutral-300">Export as PDF</span>
                      </button>
                      <button
                        onClick={handleExportJSON}
                        className="w-full text-left px-4 py-2 hover:bg-brand-black flex items-center gap-2 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-neutral-300">Export as JSON</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-neutral-700 rounded-2xl hover:bg-brand-black transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            {/* Project Selector */}
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="appearance-none bg-[#111] border border-neutral-700 rounded-2xl py-2.5 pl-4 pr-10 text-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-acid min-w-[200px]"
              >
                <option value="all">All Projects</option>
                {userProjects.map(project => (
                  <option key={project.id} value={project.id}>{project.title}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-600 w-4 h-4 pointer-events-none" />
            </div>

            {/* A-MISS-04: Time Range with Custom Option */}
            <div className="flex items-center space-x-1 bg-[#111] border border-neutral-700 rounded-2xl p-1">
              {DATE_RANGE_OPTIONS.filter(o => o.value !== -1).map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleTimeRangeChange(option.value)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${timeRange === option.value
                    ? 'bg-gradient-to-r from-brand-orange/100 to-red-500/100 text-white'
                    : 'text-neutral-300 hover:bg-neutral-900'
                    }`}
                >
                  {option.label}
                </button>
              ))}
              <button
                onClick={() => handleTimeRangeChange(-1)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${timeRange === -1
                  ? 'bg-gradient-to-r from-brand-orange/100 to-red-500/100 text-white'
                  : 'text-neutral-300 hover:bg-neutral-900'
                  }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span>Custom</span>
              </button>
            </div>
          </div>

          {/* Comparison Toggle */}
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${showComparison
              ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/40'
              : 'bg-[#111] border border-neutral-700 text-neutral-400 hover:bg-brand-black'
              }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Compare Periods</span>
          </button>
        </div>

        {/* Custom Date Picker */}
        {showCustomDatePicker && timeRange === -1 && (
          <div className="bg-[#111] rounded-3xl shadow-sm p-4 mb-8 border border-neutral-800/50 flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-neutral-300">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="border border-neutral-700 rounded-2xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-acid"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-neutral-300">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="border border-neutral-700 rounded-2xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-acid"
              />
            </div>
          </div>
        )}

        {/* Enhanced Stats Cards - 6 Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {/* Total Views */}
          <div className="bg-[#111] rounded-3xl shadow-sm p-5 border border-neutral-800/50 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-blue-500/20 rounded-3xl">
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
              {enhancedStats.viewsTrend !== 0 && (
                <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${enhancedStats.viewsTrend >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-100 text-red-400'
                  }`}>
                  {enhancedStats.viewsTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(enhancedStats.viewsTrend).toFixed(1)}%
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-brand-white">{enhancedStats.totalViews.toLocaleString('en-IN')}</p>
            <p className="text-xs text-neutral-500 mt-1">Total Views</p>
          </div>

          {/* Conversion Rate */}
          <div className="bg-[#111] rounded-3xl shadow-sm p-5 border border-neutral-800/50 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-green-500/20 rounded-3xl">
                <Target className="w-5 h-5 text-green-400" />
              </div>
              {enhancedStats.conversionRate > 4 && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                  Above avg
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-brand-white">{enhancedStats.conversionRate.toFixed(2)}%</p>
            <p className="text-xs text-neutral-500 mt-1">Conversion Rate</p>
            <p className="text-xs text-neutral-600">Views → Backers</p>
          </div>

          {/* Total Raised */}
          <div className="bg-[#111] rounded-3xl shadow-sm p-5 border border-neutral-800/50 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-brand-orange/20 rounded-3xl">
                <BarChart3 className="w-5 h-5 text-brand-orange" />
              </div>
              <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${enhancedStats.raisedTrend >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-100 text-red-400'
                }`}>
                {enhancedStats.raisedTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(enhancedStats.raisedTrend).toFixed(1)}%
              </div>
            </div>
            <p className="text-2xl font-bold text-brand-white">{formatCurrency(enhancedStats.totalRaised)}</p>
            <p className="text-xs text-neutral-500 mt-1">Total Raised</p>
            {showComparison && (
              <p className="text-xs text-neutral-600">vs prev period</p>
            )}
          </div>

          {/* Total Backers */}
          <div className="bg-[#111] rounded-3xl shadow-sm p-5 border border-neutral-800/50 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-purple-500/20 rounded-3xl">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${enhancedStats.backersTrend >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-100 text-red-400'
                }`}>
                {enhancedStats.backersTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(enhancedStats.backersTrend).toFixed(1)}%
              </div>
            </div>
            <p className="text-2xl font-bold text-brand-white">{enhancedStats.totalBackers.toLocaleString('en-IN')}</p>
            <p className="text-xs text-neutral-500 mt-1">Total Backers</p>
            <p className="text-xs text-neutral-600">{aggregateStats.uniqueSupporters} unique</p>
          </div>

          {/* Engagement Rate */}
          <div className="bg-[#111] rounded-3xl shadow-sm p-5 border border-neutral-800/50 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-pink-100 rounded-3xl">
                <Heart className="w-5 h-5 text-pink-600" />
              </div>
              {enhancedStats.engagementRate > 10 && (
                <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">
                  High
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-brand-white">{enhancedStats.engagementRate.toFixed(1)}%</p>
            <p className="text-xs text-neutral-500 mt-1">Engagement Rate</p>
            <p className="text-xs text-neutral-600">{enhancedStats.totalLikes} likes + {enhancedStats.totalComments} comments</p>
          </div>

          {/* Share Rate */}
          <div className="bg-[#111] rounded-3xl shadow-sm p-5 border border-neutral-800/50 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-cyan-100 rounded-3xl">
                <Share2 className="w-5 h-5 text-cyan-600" />
              </div>
              {enhancedStats.shareRate > 5 && (
                <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">
                  Viral
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-brand-white">{enhancedStats.shareRate.toFixed(1)}%</p>
            <p className="text-xs text-neutral-500 mt-1">Share Rate</p>
            <p className="text-xs text-neutral-600">{enhancedStats.totalShares} shares</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left 2 Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* A-BUG-01: Fixed Funding Trend Chart */}
            <div className="bg-[#111] rounded-3xl shadow-sm p-6 border border-neutral-800/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-brand-white">Funding Trend</h3>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-gradient-to-r from-brand-orange/100 to-red-500/100 rounded" />
                    <span className="text-neutral-400">Amount</span>
                  </div>
                </div>
              </div>

              <LazyChart height="h-64" fallback="Loading trend chart...">
                {dailyTrend.length > 0 && dailyTrend.some(d => d.amount > 0) ? (
                  <div className="h-64 flex items-end justify-between space-x-1">
                    {dailyTrend.map((day) => {
                      const maxAmount = Math.max(...dailyTrend.map(d => d.amount), 1);
                      const height = (day.amount / maxAmount) * 100;

                      return (
                        <div key={day.date} className="flex-1 flex flex-col items-center group">
                          <div className="relative flex-1 w-full flex items-end">
                            <div
                              className={`w-full rounded-t transition-all duration-300 ${day.amount > 0
                                ? 'bg-gradient-to-t from-brand-orange/100 to-red-400 hover:from-orange-600 hover:to-red-500/100'
                                : 'bg-neutral-800'
                                }`}
                              style={{ height: `${Math.max(height, day.amount > 0 ? 8 : 2)}%` }}
                            />
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              {formatCurrency(day.amount)} • {day.count} donations
                            </div>
                          </div>
                          <span className="text-xs text-neutral-600 mt-2 transform -rotate-45 origin-left whitespace-nowrap">
                            {format(day.dateObj, 'd MMM')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-neutral-600">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No donation data for this period</p>
                    </div>
                  </div>
                )}
              </LazyChart>
            </div>

            {/* A-MISS-05: Hourly Heatmap */}
            <div className="bg-[#111] rounded-3xl shadow-sm p-6 border border-neutral-800/50">
              <h3 className="text-lg font-semibold text-brand-white mb-4">Donation Heatmap</h3>
              <p className="text-sm text-neutral-500 mb-4">When do your supporters donate? (by day/hour)</p>

              <LazyChart height="h-48" fallback="Loading heatmap...">
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    {/* Hours header */}
                    <div className="flex pl-12 mb-1">
                      {Array.from({ length: 24 }, (_, i) => (
                        <div key={i} className="flex-1 text-center text-xs text-neutral-600">
                          {i % 3 === 0 ? `${i}` : ''}
                        </div>
                      ))}
                    </div>

                    {/* Heatmap grid */}
                    {dayNames.map((day, dayIndex) => (
                      <div key={day} className="flex items-center">
                        <div className="w-12 text-xs text-neutral-500 font-medium">{day}</div>
                        <div className="flex-1 flex">
                          {hourlyHeatmap[dayIndex].map((value, hourIndex) => {
                            const intensity = value / maxHeatmapValue;
                            return (
                              <div
                                key={hourIndex}
                                className="flex-1 h-6 border border-white transition-colors group relative"
                                style={{
                                  backgroundColor: value > 0
                                    ? `rgba(249, 115, 22, ${0.2 + intensity * 0.8})`
                                    : '#f3f4f6'
                                }}
                                title={`${day} ${hourIndex}:00 - ${formatCurrency(value)}`}
                              >
                                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                  {day} {hourIndex}:00 - {formatCurrency(value)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Legend */}
                    <div className="flex items-center justify-end mt-4 space-x-2">
                      <span className="text-xs text-neutral-500">Less</span>
                      <div className="flex">
                        {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity) => (
                          <div
                            key={opacity}
                            className="w-4 h-4"
                            style={{ backgroundColor: `rgba(249, 115, 22, ${opacity})` }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-neutral-500">More</span>
                    </div>
                  </div>
                </div>
              </LazyChart>
            </div>

            {/* A-LOG-02: Real Conversion Funnel */}
            <div className="bg-[#111] rounded-3xl shadow-sm p-6 border border-neutral-800/50">
              <h3 className="text-lg font-semibold text-brand-white mb-6">Conversion Funnel</h3>

              <LazyChart height="h-auto" fallback="Loading funnel...">
                <div className="space-y-4">
                  {funnelData.map((stage, index) => {
                    const widthPercent = Math.max(stage.percentage, 5);
                    const dropOff = index > 0 ? funnelData[index - 1].percentage - stage.percentage : 0;

                    return (
                      <div key={stage.stage}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-neutral-300">{stage.stage}</span>
                            {index > 0 && dropOff > 0 && (
                              <span className="text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                                -{dropOff.toFixed(1)}% drop
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-neutral-400">{stage.count.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-8 relative overflow-hidden">
                          <div
                            className={`h-8 rounded-full transition-all duration-500 ${index === funnelData.length - 1
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                              : 'bg-gradient-to-r from-orange-400 to-brand-orange/100'
                              }`}
                            style={{ width: `${widthPercent}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-neutral-300">
                            {stage.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </LazyChart>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Projects Breakdown */}
            <div className="bg-gradient-to-br from-brand-orange/100 to-red-600 rounded-3xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Projects Breakdown</h3>
              <div className="space-y-3">
                {projectsBreakdown.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    className={`flex items-center justify-between bg-[#111]/10 rounded-2xl p-3 backdrop-blur-sm cursor-pointer hover:bg-[#111]/20 transition-colors ${selectedProjectId === project.id ? 'ring-2 ring-[#111]' : ''
                      }`}
                    onClick={() => handleProjectChange(project.id)}
                  >
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{project.title}</p>
                      <p className="text-xs text-orange-200">{project.count} donations</p>
                    </div>
                    <p className="font-bold">{formatCurrency(project.total)}</p>
                  </div>
                ))}

                {projectsBreakdown.length === 0 && (
                  <p className="text-orange-200 text-sm text-center py-4">No donations in this period</p>
                )}
              </div>
            </div>

            {/* Traffic Sources Widget (Phase 4) */}
            <div className="bg-[#111] rounded-3xl shadow-sm p-6 border border-neutral-800/50">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-brand-white">Traffic Sources</h3>
              </div>

              {filteredDonations.length > 0 ? (
                <div className="space-y-3">
                  {trafficSourcesData.map((source) => (
                    <div key={source.name} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{source.icon}</span>
                          <span className="text-sm font-medium text-neutral-300">{source.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-neutral-500">{source.percentage}%</span>
                          <span className="text-sm font-bold text-brand-white">{formatCurrency(source.amount)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${source.color}`}
                          style={{ width: `${source.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-neutral-500 text-sm">No traffic data available</p>
                  <p className="text-neutral-600 text-xs mt-1">Data will appear when donations come in</p>
                </div>
              )}

              <p className="text-xs text-neutral-600 mt-4 text-center">
                📊 Based on typical crowdfunding patterns
              </p>
            </div>

            {/* Geographic Insights Widget (Phase 5) */}
            <div className="bg-[#111] rounded-3xl shadow-sm p-6 border border-neutral-800/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-brand-white">Geographic Insights</h3>
                </div>
                {/* Toggle between States and Cities */}
                <div className="flex bg-neutral-900 rounded-2xl p-0.5">
                  <button
                    onClick={() => setGeoViewMode('states')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${geoViewMode === 'states'
                      ? 'bg-[#111] text-brand-white shadow-sm'
                      : 'text-neutral-400 hover:text-brand-white'
                      }`}
                  >
                    States
                  </button>
                  <button
                    onClick={() => setGeoViewMode('cities')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${geoViewMode === 'cities'
                      ? 'bg-[#111] text-brand-white shadow-sm'
                      : 'text-neutral-400 hover:text-brand-white'
                      }`}
                  >
                    Cities
                  </button>
                </div>
              </div>

              {filteredDonations.length > 0 ? (
                <div className="space-y-2.5">
                  {(geoViewMode === 'states' ? geographicData.states : geographicData.cities)
                    .slice(0, 6)
                    .map((item, index) => (
                      <div key={item.name} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-600 w-4">{index + 1}.</span>
                            <span className="text-sm">{item.emoji}</span>
                            <span className="text-sm font-medium text-neutral-300">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">{item.percentage}%</span>
                            <span className="text-sm font-bold text-brand-white">{formatCurrency(item.amount)}</span>
                          </div>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden ml-6">
                          <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                            style={{ width: `${item.percentage * 2}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-neutral-500 text-sm">No geographic data available</p>
                  <p className="text-neutral-600 text-xs mt-1">Data will appear when donations come in</p>
                </div>
              )}

              <p className="text-xs text-neutral-600 mt-4 text-center">
                🇮🇳 Based on typical Indian crowdfunding patterns
              </p>
            </div>

            {/* Device Breakdown Widget (Phase 6) */}
            <div className="bg-[#111] rounded-3xl shadow-sm p-6 border border-neutral-800/50">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-brand-white">Device Breakdown</h3>
              </div>

              {filteredDonations.length > 0 ? (
                <div className="space-y-4">
                  {/* Visual Donut Chart Representation */}
                  <div className="flex justify-center mb-4">
                    <div className="relative w-28 h-28">
                      {/* Donut chart using conic gradient */}
                      <div
                        className="w-full h-full rounded-full"
                        style={{
                          background: `conic-gradient(
                            #3b82f6 0% 72%,
                            #a855f7 72% 95%,
                            #f97316 95% 100%
                          )`
                        }}
                      />
                      {/* Inner circle for donut effect */}
                      <div className="absolute inset-3 bg-[#111] rounded-full flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-lg font-bold text-brand-white">72%</p>
                          <p className="text-xs text-neutral-500">Mobile</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Device List */}
                  <div className="space-y-3">
                    {deviceBreakdownData.map((device) => {
                      const IconComponent = device.icon;
                      return (
                        <div key={device.name} className="flex items-center justify-between p-3 bg-brand-black rounded-2xl hover:bg-neutral-900 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-2xl ${device.bgColor}`}>
                              <IconComponent className={`w-4 h-4 ${device.textColor}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-neutral-300">{device.name}</p>
                              <p className="text-xs text-neutral-500">{device.count} donations</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-brand-white">{device.percentage}%</p>
                            <p className="text-xs text-neutral-500">{formatCurrency(device.amount)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-neutral-500 text-sm">No device data available</p>
                  <p className="text-neutral-600 text-xs mt-1">Data will appear when donations come in</p>
                </div>
              )}

              <p className="text-xs text-neutral-600 mt-4 text-center">
                📱 India is mobile-first (72%+ traffic)
              </p>
            </div>

            {/* Conversion Stats */}
            <div className="bg-[#111] rounded-3xl shadow-sm p-6 border border-neutral-800/50">
              <h3 className="text-lg font-semibold text-brand-white mb-4">Conversion Stats</h3>
              <div className="space-y-4">
                {projectsBreakdown.slice(0, 3).map((project) => (
                  <div key={project.id} className="p-3 bg-brand-black rounded-2xl">
                    <p className="text-sm font-medium text-neutral-300 line-clamp-1 mb-2">{project.title}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">Views → Donations</span>
                      <span className="font-bold text-brand-orange">
                        {project.conversionRate.toFixed(2)}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2 mt-2">
                      <div
                        className="bg-gradient-to-r from-brand-orange/100 to-red-500/100 h-2 rounded-full"
                        style={{ width: `${Math.min(project.conversionRate * 10, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}

                {projectsBreakdown.length === 0 && (
                  <p className="text-neutral-500 text-sm text-center py-4">No data available</p>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-[#111] rounded-3xl shadow-sm p-6 border border-neutral-800/50">
              <h3 className="text-lg font-semibold text-brand-white mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-brand-black rounded-2xl">
                  <span className="text-sm text-neutral-400">Period</span>
                  <span className="text-sm font-medium text-brand-white">
                    {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-black rounded-2xl">
                  <span className="text-sm text-neutral-400">Total Projects</span>
                  <span className="text-sm font-medium text-brand-white">{userProjects.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-black rounded-2xl">
                  <span className="text-sm text-neutral-400">Avg Daily Donations</span>
                  <span className="text-sm font-medium text-brand-white">
                    {(aggregateStats.totalDonations / Math.max(dailyTrend.length, 1)).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-black rounded-2xl">
                  <span className="text-sm text-neutral-400">Avg Daily Revenue</span>
                  <span className="text-sm font-medium text-brand-white">
                    {formatCurrency(aggregateStats.totalRaised / Math.max(dailyTrend.length, 1))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
